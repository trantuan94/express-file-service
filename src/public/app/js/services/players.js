'use strict';

angular.module('piPlayers.services', [])
  .factory('playerLoader', function ($http, piUrls, piConstants, $state, dataLoader) {
    
    let observerCallbacks = {};
    var notifyObservers = function () {
      angular.forEach(observerCallbacks, function (callback) {
        callback();
      });
    };

    var getCompanies = function (cb) {
      dataLoader.getCompanies({pageSize: -1}, (err, data) => {
        if (!err) {
          let companies = [];
          if (data.length) companies = data.map(item => {
            let {_id, name} = item;
            return {_id, name};
          });
          playerLoader.companies.list = companies;
        } else {
          console.log('playerLoader, get companies error:', err, '-- status:', data)
        }
        if (cb) cb();
      })
    }

    var getGroups = function (cb) {
      dataLoader.getGroups({pageSize: -1}, (err, data) => {
        if (!err) {
          playerLoader.group.groups = data;
          playerLoader.group.groupNames = playerLoader.group.groups.map(group => group.name);
        } else {
          console.log('playerLoader, get groups error:', err, '-- status:', data)
        }
        if (cb) cb()
      })
    }

    var getLabels = function (cb) {
      dataLoader.getLabels({mode: piConstants.labelMode.player, pageSize: -1}, (err, data) => {
        if (!err) {
          playerLoader.label.labels = data;
        } else {
          console.log('playerLoader, get labels error:', err, '-- status:', data)
        }
        if (cb) cb();
      })
    }

    var resetNumberOnOffline = function () {
      playerLoader.player.numberOnline = 0;
      playerLoader.player.numberOffline = 0;
    }

    var getPlayers = function (cb) {
      if (typeof cb !== 'function') cb = angular.noop;

      let params = {};
      if (playerLoader.group.selectedGroup) params['group'] = playerLoader.group.selectedGroup._id;

      if (playerLoader.label.selectedPlayerLabel) params['label'] = playerLoader.label.selectedPlayerLabel;

      Object.keys(playerLoader.label.labelsCount).forEach((item) => {
        if (item.mode && item.mode === piConstants.labelMode.player) playerLoader.label.labelsCount[item] = 0;
      });

      dataLoader.getPlayers(params, (err, data) => {
        if (!err) {
          resetNumberOnOffline();
          playerLoader.player.players = data.objects;
          playerLoader.player.currentVersion = data.currentVersion;
          playerLoader.player.players.forEach((player) => {
            if (!player.isConnected) {
              player.statusClass = "text-danger";
              playerLoader.player.numberOffline += 1;
            } else {
              playerLoader.player.numberOnline += 1;
              if (!player.playlistOn) {
                player.statusClass = "text-lightyellow"
              } else {
                player.statusClass = "text-lightgreen"
              }
            }

            if (player.uptime) {
              player.uptime = parseInt(player.uptime)
              if (player.uptime > 48 * 3600) {
                player.uptimeFormatted = (player.uptime / (24 * 3600)).toFixed(1) + " days";
              } else if (player.uptime > 3 * 3600) {
                player.uptimeFormatted = (player.uptime / (3600)).toFixed(1) + " hours";
              } else if (player.uptime > 300) {
                player.uptimeFormatted = parseInt(player.uptime / (60)) + " minutes";
              } else {
                player.uptimeFormatted = player.uptime + " seconds";
              }
            } else {
              player.uptimeFormatted = "";
            }

            if (!player.lastReported) player.lastReported = 0; //never reported

            player.labels.forEach((item) => {
              playerLoader.label.labelsCount[item] = (playerLoader.label.labelsCount[item] || 0) + 1;
            })
          });
        } else {
          console.log('playerLoader, get players error:', err, '-- status:', data);
        }
        if (cb) cb()
      })
    }

    var getPlaylist = function (cb) {
      dataLoader.getPlaylist(null, (err, data) => {
        if (!err) {
          playerLoader.playlist.playlists = data;
          playerLoader.playlist.playlistNames = playerLoader.playlist.playlists.map(function (playlist) {
            return playlist.name;
          });

          playerLoader.playlist.normalPlaylistNames = playerLoader.playlist.playlistNames.filter(function (name, itemIndex) {
            return (!((playerLoader.playlist.playlists[itemIndex].settings.ads && playerLoader.playlist.playlists[itemIndex].settings.ads.adPlaylist) ||
              (playerLoader.playlist.playlists[itemIndex].settings.domination && playerLoader.playlist.playlists[itemIndex].settings.domination.enable) ||
              (playerLoader.playlist.playlists[itemIndex].settings.event && playerLoader.playlist.playlists[itemIndex].settings.event.enable) ||
              (playerLoader.playlist.playlists[itemIndex].settings.audio && playerLoader.playlist.playlists[itemIndex].settings.audio.enable)
            ))
          });
        } else {
          console.log('playerLoader, get playlists error:', err, '-- status:', data)
        }
        if (cb) cb()
      })
    }

    var loadAllModels = function () {
      async.series(
        [
          function (next) {
            getGroups(next)
          },
          function (next) {
            getPlayers(next);
          },
          function (next) {
            getPlaylist(next)
          },
          function (next) {
            getCompanies(next)
          },
          function (next) {
            getLabels(next)
          }
        ],
        function (err) {
          notifyObservers();
        }
      )
    }

    let playerLoader = {
      companies: {
        list: []
      },

      label: {
        labels: [],
        selectedPlayerLabel: null,
        labelsCount: {}
      },

      player: {
        players: [],
        numberOnline: 0,
        numberOffline: 0,
        currentVersion: null
      },

      group: {
        groups: [],
        groupNames: [],
        selectedGroup: null
      },

      playlist: {
        playlists: [],
        playlistNames: []
      },

      getCompany: getCompanies,

      getGroups: getGroups,

      getLabels: getLabels,

      getPlayers: getPlayers,

      getPlaylist: getPlaylist,

      reload: loadAllModels,

      selectGroup: function (group) {
        playerLoader.group.selectedGroup = group;
        $state.go("home.groups.players", {group: group ? group._id : null})
        if (!group) getPlayers();
        //notifyObservers();
      },

      selectPlayerLabel: function (label) {
        playerLoader.label.selectedPlayerLabel = label;
        //notifyObservers();
      },

      registerObserverCallback: function (callback, key) {
        observerCallbacks[key] = callback;
      }
    }

    return playerLoader;
  })

  .factory('groupLoader', function ($http, $state, piUrls, piConstants, dataLoader) {

    var getCompanies = function (cb) {
      dataLoader
        .getCompanies({pageSize: -1})
        .then(data => {
          playerLoader.companies.list = data.map(({_id, name, ...others}) => {_id, name});
        })
        .catch(err => {
          console.log('playerLoader, getCompanies error:', err)
        })
    }

    var getGroups = function (cb) {
      dataLoader.getGroups({pageSize: -1}, (err, data) => {
        if (!err) {
          playerLoader.group.groups = data;
          playerLoader.group.groupNames = playerLoader.group.groups.map(group => group.name);
        } else {
          console.log('playerLoader, get groups error:', err, '-- status:', data)
        }
        if (cb) cb()
      })
    }

    var getLabels = function (cb) {
      dataLoader.getLabels({mode: piConstants.labelMode.player, pageSize: -1}, (err, data) => {
        if (!err) {
          playerLoader.label.labels = data;
        } else {
          console.log('playerLoader, get labels error:', err, '-- status:', data)
        }
        if (cb) cb();
      })
    }

    var resetNumberOnOffline = function () {
      playerLoader.player.numberOnline = 0;
      playerLoader.player.numberOffline = 0;
    }

    var getPlayers = function (cb) {
      if (typeof cb !== 'function') cb = angular.noop;

      let params = {};
      if (playerLoader.group.selectedGroup) params['group'] = playerLoader.group.selectedGroup._id;

      if (playerLoader.label.selectedPlayerLabel) params['label'] = playerLoader.label.selectedPlayerLabel;

      Object.keys(playerLoader.label.labelsCount).forEach((item) => {
        if (item.mode && item.mode === piConstants.labelMode.player) playerLoader.label.labelsCount[item] = 0;
      });

      dataLoader.getPlayers(params, (err, data) => {
        if (!err) {
          resetNumberOnOffline();
          playerLoader.player.players = data.objects;
          playerLoader.player.currentVersion = data.currentVersion;
          playerLoader.player.players.forEach((player) => {
            if (!player.isConnected) {
              player.statusClass = "text-danger";
              playerLoader.player.numberOffline += 1;
            } else {
              playerLoader.player.numberOnline += 1;
              if (!player.playlistOn) {
                player.statusClass = "text-lightyellow"
              } else {
                player.statusClass = "text-lightgreen"
              }
            }

            if (player.uptime) {
              player.uptime = parseInt(player.uptime)
              if (player.uptime > 48 * 3600) {
                player.uptimeFormatted = (player.uptime / (24 * 3600)).toFixed(1) + " days";
              } else if (player.uptime > 3 * 3600) {
                player.uptimeFormatted = (player.uptime / (3600)).toFixed(1) + " hours";
              } else if (player.uptime > 300) {
                player.uptimeFormatted = parseInt(player.uptime / (60)) + " minutes";
              } else {
                player.uptimeFormatted = player.uptime + " seconds";
              }
            } else {
              player.uptimeFormatted = "";
            }

            if (!player.lastReported) player.lastReported = 0; //never reported

            player.labels.forEach((item) => {
              playerLoader.label.labelsCount[item] = (playerLoader.label.labelsCount[item] || 0) + 1;
            })
          });
        } else {
          console.log('playerLoader, get players error:', err, '-- status:', data);
        }
        if (cb) cb()
      })
    }

    var getPlaylist = function (cb) {
      dataLoader.getPlaylist(null, (err, data) => {
        if (!err) {
          playerLoader.playlist.playlists = data;
          playerLoader.playlist.playlistNames = playerLoader.playlist.playlists.map(function (playlist) {
            return playlist.name;
          });

          playerLoader.playlist.normalPlaylistNames = playerLoader.playlist.playlistNames.filter(function (name, itemIndex) {
            return (!((playerLoader.playlist.playlists[itemIndex].settings.ads && playerLoader.playlist.playlists[itemIndex].settings.ads.adPlaylist) ||
              (playerLoader.playlist.playlists[itemIndex].settings.domination && playerLoader.playlist.playlists[itemIndex].settings.domination.enable) ||
              (playerLoader.playlist.playlists[itemIndex].settings.event && playerLoader.playlist.playlists[itemIndex].settings.event.enable) ||
              (playerLoader.playlist.playlists[itemIndex].settings.audio && playerLoader.playlist.playlists[itemIndex].settings.audio.enable)
            ))
          });
        } else {
          console.log('playerLoader, get playlists error:', err, '-- status:', data)
        }
        if (cb) cb()
      })
    }

    var loadAllModels = function () {
      async.series(
        [
          function (next) {
            getGroups(next)
          },
          function (next) {
            getPlayers(next);
          },
          function (next) {
            getPlaylist(next)
          },
          function (next) {
            getCompanies(next)
          },
          function (next) {
            getLabels(next)
          }
        ],
        function (err) {
          notifyObservers();
        }
      )
    }

    let playerLoader = {
      companies: {
        list: []
      },

      label: {
        labels: [],
        selectedPlayerLabel: null,
        labelsCount: {}
      },

      player: {
        players: [],
        numberOnline: 0,
        numberOffline: 0,
        currentVersion: null
      },

      group: {
        groups: [],
        groupNames: [],
        selectedGroup: null
      },

      playlist: {
        playlists: [],
        playlistNames: []
      },

      getCompany: getCompanies,

      getGroups: getGroups,

      getLabels: getLabels,

      getPlayers: getPlayers,

      getPlaylist: getPlaylist,

      reload: loadAllModels,

      selectGroup: function (group) {
        playerLoader.group.selectedGroup = group;
        $state.go("home.groups.players", {group: group ? group._id : null})
        if (!group) getPlayers();
        //notifyObservers();
      },

      selectPlayerLabel: function (label) {
        playerLoader.label.selectedPlayerLabel = label;
        //notifyObservers();
      },

      registerObserverCallback: function (callback, key) {
        observerCallbacks[key] = callback;
      }
    }

    return playerLoader;
  });
