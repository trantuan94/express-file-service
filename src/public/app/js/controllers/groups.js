'use strict';

angular.module('piGroups.controllers', [])

  .controller('GroupIndexCtrl', function ($scope, piUrls, $modal, $state, piPopup, dataLoader, piNgTable) {

    $scope.objects = {
      list_data: [],
      total: 0,
      skip: 0,
      limit: 0
    };

    $scope.filters = {
      currentPage: 0,
      pageSize: 10,
      "sorting[]": [],
      "filters[]": []
    };

    var reloadData = (params) => {
      $scope.filters = piNgTable.setConditions(params);

      return dataLoader.getGroups($scope.filters)
        .then(data => {
          let {filters, ...others} = data;
          $scope.objects = {...$scope.objects, ...others};
          params.total($scope.objects.total);
          return data.list_data;
        })
        .catch(err => {
          console.log('dataLoader.getGroups error:', err)
        })
    }

    var initTable = () => {
      $scope.tableParams = piNgTable.init(
        reloadData,
        piNgTable.default.option,
        piNgTable.default.counts
      )
    }

    initTable();

    $scope.newGroup = {};
    $scope.selectedObject = null;

    $scope.fn = {
      edit(obj) {
        $scope.selectedObject = obj;
        $scope.newObject = Object.assign({}, obj);
        $scope.modal = $modal.open(
          {
            templateUrl: '/app/views/Group/components/form.html',
            scope: $scope
          }
        )
      },

      delete(obj) {
        piPopup.confirm(
          `--Bạn có muốn xóa nhóm phát '${obj.name}'`,
          () => {
            dataLoader.deleteData(`${piUrls.groups}/${obj._id}`, {})
              .then(data => {
                $scope.tableParams.reload();

                piPopup.status({
                  title: 'Xóa nhóm phát',
                  msg: data.message
                })
              })
              .catch(err => {
                piPopup.status({
                  title: 'Xóa nhóm phát',
                  msg: err.message
                })
              })
          }
        )
      },

      save() {
        let params = $scope.newGroup;
        dataLoader.postData(piUrls.groups, params)
          .then(data => {
            $scope.tableParams.reload();
            $scope.newGroup = {};

            piPopup.status({
              title: 'Thêm mới nhóm phát',
              msg: data.message
            })
          })
          .catch(err => {
            piPopup.status(
              {
                title: 'Thêm mới nhóm phát',
                msg: err.message
              },
              () => {
                $scope.newGroup = {}
              }
            )
          })
      },

      update() {
        // rename group
        let params = $scope.newObject;
        dataLoader.putData(`${piUrls.groups}/rename/${params._id}`, {name: params.name})
          .then(data => {
            $scope.tableParams.reload();
            $scope.fn.abort();

            piPopup.status({
              title: 'Sửa thông tin nhóm phát',
              msg: data.message
            })
          })
          .catch(err => {
            $scope.statusMsg = err.message;
          })
      },

      toDetail(row) {
        $state.go("home.group.details", {group: row._id});
      },

      abort() {
        $scope.newObject = {};
        $scope.statusMsg = null;
        $scope.selectedObject = null;
        $scope.modal.close();
      },

      deployAll() {
        dataLoader.postData(`${piUrls.groups}/deploy`, {ids: ['all']})
          .then(data => {
            piPopup.status({
              title: 'Triển khai nhóm phát',
              msg: data.message
            })
          })
          .catch(err => {
            piPopup.status({
              title: 'Triển khai nhóm phát',
              msg: err.message
            })
          })
      },

      unDeployAll() {
        dataLoader.postData(`${piUrls.groups}/unDeploy`, {ids: ['all']})
          .then(data => {
            piPopup.status({
              title: 'Ngừng triển khai nhóm phát',
              msg: data.message
            })
          })
          .catch(err => {
            piPopup.status({
              title: 'Ngừng triển khai nhóm phát',
              msg: err.message
            })
          })
      },

      changeUnique() {
        $scope.statusMsg = null;
      }
    }
  })

  .controller('GroupDetailCtrl',
    function ($rootScope, $scope, $http, $timeout, $state, $modal, weeks, days, weeksObject, daysObject, moment,
              GroupFunctions, dataLoader, playerLoader, piPopup, piUrls, piConstants, $window) {

      if (!$state.params.group) return $state.go('home.groups');

      let selectedGroup = $scope.group.groups.filter(item => item._id.toString() === $state.params.group);

      const HTTP_SUCCESS = 200;

      //make sure state.params.group is set
      if ($scope.group.selectedGroup && (!$state.params.group || $scope.group.selectedGroup._id.toString() !== $state.params.group)) {
        // return playerLoader.selectGroup($scope.group.selectedGroup)    // bỏ không load dữ liệu cũ
      }

      $scope.sortable = {
        options: {
          orderChanged: function (event) {
            $scope.updateGroup();
            $scope.needToDeploy = true;
          }
        },
        playlistArray: []
      }

      $scope.weeklist = weeks; // get all week list and code
      $scope.dayslist = days;
      $scope.needToDeploy = false;

      $scope.group = playerLoader.group;
      var initSortArray = function (loader = true) {
        if ($state.params.group) {
          for (let i = 0, len = $scope.group.groups.length; i < len; i++) {
            if ($state.params.group == $scope.group.groups[i]._id) {
              $scope.group.selectedGroup = $scope.group.groups[i];
              $scope.sortable.playlistArray = $scope.group.selectedGroup.playlists
              break;
            }
          }
          if (loader) playerLoader.getPlayers();
        }
      }

      playerLoader.registerObserverCallback(initSortArray, "group-detail");
      initSortArray();

      $scope.modifyGroup = function (params, cb, cbFinally) {
        let groupId = $state.params.group || $scope.group.selectedGroup._id;
        let url = `${piUrls.groups}/${groupId}`;

        $http
          .put(url, params)
          .success((data, status) => {
            let err = true;
            if (status === HTTP_SUCCESS) {
              err = false
            }
            if (cb) cb(err, data)
          })
          .error((err, status) => {
            if (cb) cb(true, err)
          })
          .finally(() => {
            if (cbFinally) cbFinally();
          });
      }

      $scope.checkBoxOnGroup = function () {
        // console.log('checkbox:', event.target);
        $scope.modifyGroup($scope.group.selectedGroup, (err, json) => {
          if (err) {
            console.log('modifyGroup on checkBoxOnGroup failed:', json)
          } else {
            playerLoader.reload();
            // $scope.group.selectedGroup = json.data;
          }
        })
      }

      $scope.updateGroup = function (cb) {
        $scope.needToDeploy = true;
        GroupFunctions.listFiles($scope.group.selectedGroup, $scope.playlist.playlists, $scope.playlist.playlistNames, function (err, groupObj) {
          $scope.deployErrorMessage = err;
          $scope.group.selectedGroup = groupObj;

          let params = JSON.parse(JSON.stringify(groupObj));
          delete params.status; // không cập nhật lại trạng thái của nhóm phát.

          $scope.modifyGroup(
            params,
            (err, json) => {
              if (!err) {
                $scope.showDates()
              }
              if (cb) cb(err, json.message)
            },
            () => {
              initSortArray();
            }
          )
        })
      }

      $scope.add = function () {
        if ($scope.group.selectedGroup.playlists.length >= 30) {
          $timeout(function () {
            $scope.showMaxErr = false;
          }, 5000);
          $scope.showMaxErr = true;
          return;
        }
        //$scope.deployform.$setDirty(); //  inform user  of new changes
        $scope.group.selectedGroup.playlists.push({
          name: $scope.group.selectedGroup.playlists[0].name,
          settings: {durationEnable: false, timeEnable: false}
        });
        $scope.updateGroup();
      }

      $scope.delete = function (index) {
        //piPopup.confirm("Playlist from Group", function () {
        $scope.group.selectedGroup.playlists.splice(index, 1);
        //$scope.deployform.$setDirty(); //  inform user  of new changes
        $scope.updateGroup();
        //});
      }

      $scope.weekDaysText = {}
      $scope.monthDaysText = {}
      $scope.showDates = function () {
        for (let i = 1, len = $scope.group.selectedGroup.playlists.length; i < len; i++) {
          let playlist = $scope.group.selectedGroup.playlists[i]
          if (!playlist.settings || !playlist.settings.weekdays || playlist.settings.weekdays.length >= 7)
            $scope.weekDaysText[i] = ""
          else if (playlist.settings.weekdays.length > 0) {
            $scope.weekDaysText[i] = "ngày trong tuần: "
            playlist.settings.weekdays.forEach(function (day) {
              $scope.weekDaysText[i] = $scope.weekDaysText[i] +
                " " + $scope.ngDropdown.weekdays.list[day - 1].label.slice(0, 2)
            })
          } else {
            $scope.weekDaysText[i] = "Không đặt lịch"
          }
          if (!playlist.settings || !playlist.settings.monthdays || playlist.settings.monthdays.length >= 31)
            $scope.monthDaysText[i] = ""
          else if (playlist.settings.monthdays.length > 0) {
            $scope.monthDaysText[i] = "ngày trong tháng: "
            playlist.settings.monthdays.forEach(function (day) {
              $scope.monthDaysText[i] = $scope.monthDaysText[i] + day + ','
            })
          } else {
            $scope.monthDaysText[i] = "Không đặt lịch"
          }
        }
      }

      $scope.scheduleCalendar = function (playlist) {
        var getHoursMinutes = function (timeString) {
          let hhmmArray = timeString.split(':');
          if (hhmmArray.length === 2) {
            return ({h: parseInt(hhmmArray[0]), m: parseInt(hhmmArray[1])});
          } else if (hhmmArray.length === 1) {
            return ({h: 0, m: parseInt(hhmmArray[0])});
          } else if (hhmmArray.length > 2) {
            return ({h: parseInt(hhmmArray[hhmmArray.length - 2]), m: parseInt(hhmmArray[hhmmArray.length - 1])});
          }
        }

        $scope.forPlaylist = playlist;
        if (!$scope.forPlaylist.settings.weekdays && $scope.forPlaylist.settings.weekday && $scope.forPlaylist.settings.weekday != 0) {
          $scope.forPlaylist.settings.weekdays = [$scope.forPlaylist.settings.weekday]
        } else if (!$scope.forPlaylist.settings.weekdays) {
          $scope.forPlaylist.settings.weekdays = $scope.ngDropdown.weekdays.list.map(obj => obj.id)
        }

        $scope.ngDropdown.weekdays.selectedDays = $scope.ngDropdown.weekdays.list.filter(obj => {
          if ($scope.forPlaylist.settings.weekdays.indexOf(obj.id) >= 0) return true;
          return false;
        })

        if (!$scope.forPlaylist.settings.monthdays && $scope.forPlaylist.settings.monthday && $scope.forPlaylist.settings.monthday != 0) {
          $scope.forPlaylist.settings.monthdays = [$scope.forPlaylist.settings.monthday]
        } else if (!$scope.forPlaylist.settings.monthdays) {
          $scope.forPlaylist.settings.monthdays = $scope.ngDropdown.monthdays.list.map(obj => obj.id)
        }

        $scope.ngDropdown.monthdays.selectedDays = $scope.ngDropdown.monthdays.list.filter(function (obj) {
          if ($scope.forPlaylist.settings.monthdays.indexOf(obj.id) >= 0) return true;
          return false;
        })

        if ($scope.forPlaylist.settings) {
          if ($scope.forPlaylist.settings.startdate) {
            $scope.forPlaylist.settings.startdate = new Date($scope.forPlaylist.settings.startdate)
          }

          if ($scope.forPlaylist.settings.enddate) {
            $scope.forPlaylist.settings.enddate = new Date($scope.forPlaylist.settings.enddate)
          }

          // if ($scope.forPlaylist.settings.starttimeObj) {
          //     $scope.forPlaylist.settings.starttimeObj = new Date($scope.forPlaylist.settings.starttimeObj)
          // }
          // if ($scope.forPlaylist.settings.endtimeObj) {
          //     $scope.forPlaylist.settings.endtimeObj = new Date($scope.forPlaylist.settings.endtimeObj)
          // }

          if ($scope.forPlaylist.settings.starttime) {
            $scope.forPlaylist.settings.starttimeObj = new Date(0)
            let t = getHoursMinutes($scope.forPlaylist.settings.starttime)
            $scope.forPlaylist.settings.starttimeObj.setHours(t.h)
            $scope.forPlaylist.settings.starttimeObj.setMinutes(t.m)
          }

          if ($scope.forPlaylist.settings.endtime) {
            $scope.forPlaylist.settings.endtimeObj = new Date(0)
            let t = getHoursMinutes($scope.forPlaylist.settings.endtime)
            $scope.forPlaylist.settings.endtimeObj.setHours(t.h)
            $scope.forPlaylist.settings.endtimeObj.setMinutes(t.m)
          }
        }

        $scope.scheduleCalendarModal = $modal.open({
          templateUrl: '/app/templates/schedule-calendar.html',
          scope: $scope
        });

        $scope.scheduleCalendarModal.result.finally(function () {
          //for backward compatibility
          if (playlist.settings.weekdays && playlist.settings.weekdays.length < 7) {
            $scope.forPlaylist.settings.weekday = $scope.forPlaylist.settings.weekdays[0]
          } else {
            delete $scope.forPlaylist.settings.weekday
          }

          if (playlist.settings.monthdays && playlist.settings.monthdays.length < 31) {
            $scope.forPlaylist.settings.monthday = $scope.forPlaylist.settings.monthdays[0]
          } else {
            delete $scope.forPlaylist.settings.monthday
          }

          $scope.showDates()
          if ($scope.forPlaylist.settings) {
            // if ($scope.forPlaylist.settings.starttimeObj) {
            //     var time = $scope.forPlaylist.settings.starttimeObj.toTimeString().split(' ')[0].slice(0,5)
            //     $scope.forPlaylist.settings.starttime = time;
            // }
            // if ($scope.forPlaylist.settings.endtimeObj) {
            //     var time = $scope.forPlaylist.settings.endtimeObj.toTimeString().split(' ')[0].slice(0,5)
            //     $scope.forPlaylist.settings.endtime = time;
            // }
            let minutes, hours;
            if ($scope.forPlaylist.settings.starttimeObj) {
              hours = $scope.forPlaylist.settings.starttimeObj.getHours()
              $scope.forPlaylist.settings.starttime = (hours < 10) ? ("0" + hours) : ("" + hours);
              minutes = $scope.forPlaylist.settings.starttimeObj.getMinutes();
              $scope.forPlaylist.settings.starttime += (minutes < 10) ? (":0" + minutes) : ":" + minutes;
            }

            if ($scope.forPlaylist.settings.endtimeObj) {
              hours = $scope.forPlaylist.settings.endtimeObj.getHours()
              $scope.forPlaylist.settings.endtime = (hours < 10) ? ("0" + hours) : ("" + hours);
              minutes = $scope.forPlaylist.settings.endtimeObj.getMinutes();
              $scope.forPlaylist.settings.endtime += (minutes < 10) ? (":0" + minutes) : ":" + minutes;
            }
          }

          $scope.updateGroup();
          //formcontroller.$dirty? $scope.deployform.$setDirty(): ''; //  inform user  of new changes
        })
      }

      $scope.ngDropdown = {
        weekdays: {
          list: weeksObject,
          selectedDays: [],
          extraSettings: {
            smartButtonMaxItems: 7,
            smartButtonTextConverter: function (itemText, originalItem) {
              return itemText.slice(0, 2);
            },
            displayProp: 'label', idProp: 'id', externalIdProp: 'id',
            //scrollableHeight: '200px', scrollable: true,
            showCheckAll: true, showUncheckAll: true,
            buttonClasses: "btn btn-default group-multiselect"
          },
          customTexts: {buttonDefaultText: "Chọn ngày"},
          events: {
            onSelectAll: function () {
              $scope.forPlaylist.settings.weekdays = $scope.ngDropdown.weekdays.list.map(function (obj) {
                return obj.id
              })
            },
            onDeselectAll: function () {
              $scope.forPlaylist.settings.weekdays = []
            },
            onItemSelect: function (day) {
              if ($scope.forPlaylist.settings.weekdays.indexOf(day.id) == -1)
                $scope.forPlaylist.settings.weekdays.push(day.id)
            },
            onItemDeselect: function (day) {
              $scope.forPlaylist.settings.weekdays.splice(
                $scope.forPlaylist.settings.weekdays.indexOf(day.id), 1)
            }
          }
        },
        monthdays: {
          list: daysObject,
          selectedDays: [],
          extraSettings: {
            smartButtonMaxItems: 7,
            displayProp: 'label', idProp: 'id', externalIdProp: 'id',
            //scrollableHeight: '200px', scrollable: true,
            showCheckAll: true, showUncheckAll: true,
            buttonClasses: "btn btn-default group-multiselect"
          },
          customTexts: {buttonDefaultText: "Chọn ngày"},
          events: {
            onSelectAll: function () {
              $scope.forPlaylist.settings.monthdays = $scope.ngDropdown.monthdays.list.map(function (obj) {
                return obj.id
              })
            },
            onDeselectAll: function () {
              $scope.forPlaylist.settings.monthdays = []
            },
            onItemSelect: function (day) {
              if ($scope.forPlaylist.settings.monthdays.indexOf(day.id) == -1)
                $scope.forPlaylist.settings.monthdays.push(day.id)
            },
            onItemDeselect: function (day) {
              $scope.forPlaylist.settings.monthdays.splice(
                $scope.forPlaylist.settings.monthdays.indexOf(day.id), 1)
            }
          }
        }
      }

      $scope.saveSchedules = function (formcontroller) {
        $scope.scheduleCalendarModal.close();
      }

      $scope.displaySet = function () {
        $scope.resolutions = [
          {value: '720p', name: "HD(720p) 1280x720"},
          {value: '1080p', name: "Full HD(1080p) 1920x1080"},
          {value: 'PAL', name: 'PAL (RCA), 720x576'},
          {value: 'NTSC', name: 'NTSC (RCA), 720x480'}
        ];

        $scope.orientations = [
          {value: 'landscape', name: "Chế độ Landscape"},
          {value: 'portrait', name: "Chế độ Portrait Right (Phần cứng)"},
          {value: 'portrait270', name: "Chế độ Portrait Left (Phần cứng)"}
        ];

        $scope.group.selectedGroup.showClock = $scope.group.selectedGroup.showClock || {enable: false}
        $scope.group.selectedGroup.showClock.format = $scope.group.selectedGroup.showClock.format || "12";
        $scope.group.selectedGroup.showClock.position = $scope.group.selectedGroup.showClock.position || "bottom";

        $scope.group.selectedGroup.videoSize = $scope.group.selectedGroup.videoKeepAspect ? 1 : 2;
        $scope.group.selectedGroup.imageSize = $scope.group.selectedGroup.resizeAssets ? ($scope.group.selectedGroup.imageLetterboxed ? 1 : 2) : 0;


        $scope.scheduleCalendar = function (playlist) {
          $scope.forPlaylist = playlist;

          $scope.scheduleCalendarModal = $modal.open({
            templateUrl: '/app/templates/schedule-calendar.html',
            scope: $scope
          });
        }

        if ($scope.group.selectedGroup.sleep) {
          if ($scope.group.selectedGroup.sleep.ontimeUTC) {
            $scope.group.selectedGroup.sleep.ontimeUTC = new Date($scope.group.selectedGroup.sleep.ontimeUTC)
          }
          if ($scope.group.selectedGroup.sleep.offtimeUTC) {
            $scope.group.selectedGroup.sleep.offtimeUTC = new Date($scope.group.selectedGroup.sleep.offtimeUTC)
          }
        }

        if ($scope.group.selectedGroup.reboot && $scope.group.selectedGroup.reboot.timeUTC) {
          $scope.group.selectedGroup.reboot.timeUTC = new Date($scope.group.selectedGroup.reboot.timeUTC)
        }

        $scope.displayModal = $modal.open({
          templateUrl: '/app/templates/display-set.html',
          scope: $scope
        });
      }

      $scope.saveSettings = function () {
        $scope.displayModal.close();
        if ($scope.group.selectedGroup.sleep) {
          if ($scope.group.selectedGroup.sleep.ontimeUTC) {
            let time = moment($scope.group.selectedGroup.sleep.ontimeUTC).format('HH:mm');
            $scope.group.selectedGroup.sleep.ontime = time
          }
          if ($scope.group.selectedGroup.sleep.offtimeUTC) {
            let time = moment($scope.group.selectedGroup.sleep.offtimeUTC).format('HH:mm');
            $scope.group.selectedGroup.sleep.offtime = time
          }
        }

        if ($scope.group.selectedGroup.reboot && $scope.group.selectedGroup.reboot.timeUTC) {
          let time = moment($scope.group.selectedGroup.reboot.timeUTC).format('HH:mm');
          $scope.group.selectedGroup.reboot.time = time;
        }

        switch ($scope.group.selectedGroup.imageSize) {
          case 1:
            $scope.group.selectedGroup.imageLetterboxed = true;
            $scope.group.selectedGroup.resizeAssets = true;
            break;
          case 2:
            $scope.group.selectedGroup.imageLetterboxed = false;
            $scope.group.selectedGroup.resizeAssets = true;
            break;
          default:
            $scope.group.selectedGroup.resizeAssets = false;
        }

        switch ($scope.group.selectedGroup.videoSize) {
          // case 0:
          //     $scope.group.selectedGroup.videoKeepAspect = true;
          //     break;
          case 1:
            $scope.group.selectedGroup.videoKeepAspect = true;
            break;
          default:
            $scope.group.selectedGroup.videoKeepAspect = false;
        }

        $scope.updateGroup();
      }

      $scope.groupTicker = function () {
        $scope.group.selectedGroup.ticker = $scope.group.selectedGroup.ticker || {}
        let ticker = $scope.group.selectedGroup.ticker
        ticker.enable = ticker.enable || false
        ticker.behavior = ticker.behavior || 'slide'
        ticker.textSpeed = ticker.textSpeed || 3
        ticker.rss = ticker.rss || {enable: false, link: null, feedDelay: 10}
        $scope.tickerObj = $scope.group.selectedGroup.ticker;
        $scope.tickerModal = $modal.open({
          templateUrl: '/app/templates/ticker-popup.html',
          scope: $scope
        });
      }

      $scope.saveTickerSettings = function () {
        if ($scope.group.selectedGroup.ticker.style)
          $scope.group.selectedGroup.ticker.style = $scope.group.selectedGroup.ticker.style.replace(/\"/g, '');
        if ($scope.group.selectedGroup.ticker.messages)
          $scope.group.selectedGroup.ticker.messages = $scope.group.selectedGroup.ticker.messages.replace(/'/g, "`")
        $scope.tickerModal.close();
        $scope.updateGroup();
        $scope.needToDeploy = true;
      }

      $scope.emergencyMessage = function () {
        $scope.emsgModal = $modal.open({
          templateUrl: '/app/templates/emergencyMessagePopup.html',
          scope: $scope
        })
      }

      $scope.messageSave = function () {
        $scope.emsgModal.close();
        $scope.updateGroup();
        $scope.needToDeploy = true;
      }

      $scope.handleApprove = function (cb) {
        $scope.needToDeploy = true;
        GroupFunctions.listFiles($scope.group.selectedGroup, $scope.playlist.playlists, $scope.playlist.playlistNames, function (err, groupObj) {
          $scope.deployErrorMessage = err;
          $scope.group.selectedGroup = groupObj;
          let groupId = $state.params.group || $scope.group.selectedGroup._id;
          let url = `${piUrls.confirms}/${groupId}`;
          $http
            .put(url, $scope.group.selectedGroup)
            .success(function (data, status) {
              let err = true
              if (status === HTTP_SUCCESS) {
                err = false
              }
              if (cb) cb(err, data.message)
            })
            .error((err, status) => {
              if (cb) cb(true, err.message)
            });
        })
      }

      $rootScope.$on('approveDeploy', function (e, args) {
        $scope.approveDeploy();
      });

      $scope.approveDeploy = function () {
        for (let i = $scope.group.selectedGroup.playlists.length - 1; i >= 0; i--) {
          if (!$scope.group.selectedGroup.playlists[i].name || !$scope.group.selectedGroup.playlists[i].name.length) {
            $scope.group.selectedGroup.playlists.splice(i, 1);
          }
        }

        if (!$scope.group.selectedGroup.playlists.length) {
          return piPopup.status({
            msg: 'Không tồn tại danh sách phát',
            title: 'Triển khai thất bại'
          });
        }

        $scope.group.selectedGroup.orientation = $scope.group.selectedGroup.orientation || 'landscape';
        $scope.group.selectedGroup.resolution = $scope.group.selectedGroup.resolution || '720p';
        $scope.group.selectedGroup.deploy = true;

        $scope.handleApprove((err, msg) => {
          if (!err) {
            piPopup.status({
              msg: 'Đã triển khai! Yêu cầu đã được gửi đến tất cả các thiết bị.',
              title: 'Triển khai thành công'
            });
            $scope.needToDeploy = false;
            playerLoader.reload();
            $scope.group = playerLoader.group;
            $scope.player = playerLoader.player;
            $scope.group.selectedGroup = null;
            playerLoader.selectGroup($scope.group.selectedGroup);
          } else {
            piPopup.status({msg: msg, title: 'Triển khai thất bại'});
          }
        })
      }

      $scope.deploy = function () {
        for (let i = $scope.group.selectedGroup.playlists.length - 1; i >= 0; i--) {
          if (!$scope.group.selectedGroup.playlists[i].name || !$scope.group.selectedGroup.playlists[i].name.length) {
            $scope.group.selectedGroup.playlists.splice(i, 1);
          }
        }

        if (!$scope.group.selectedGroup.playlists.length) {
          return piPopup.status({
            msg: 'Không tồn tại danh sách phát',
            title: 'Triển khai thất bại'
          });
        }

        let groupId = $state.params.group || $scope.group.selectedGroup._id;
        dataLoader.postData(`${piUrls.groups}/deploy`, {ids: [groupId]})
          .then(data => {
            $scope.group.selectedGroup.status = piConstants.groupStatus.deployed;

            piPopup.status({
              title: 'Triển khai nhóm phát',
              msg: data.message
            })
          })
          .catch(err => {
            piPopup.status({
              title: 'Triển khai nhóm phát',
              msg: err.message
            })
          })
      }

      $scope.cancelDeploy = function () {
        let groupId = $state.params.group || $scope.group.selectedGroup._id;

        dataLoader.postData(`${piUrls.groups}/unDeploy`, {ids: [groupId]})
          .then(data => {
            $scope.group.selectedGroup.status = piConstants.groupStatus.pending;

            piPopup.status({
              title: 'Ngừng triển khai nhóm phát',
              msg: data.message
            })
          })
          .catch(err => {
            piPopup.status({
              title: 'Ngừng triển khai nhóm phát',
              msg: err.message
            })
          })
      }

      $scope.closeWindow = function () {
        $window.history.back();
      };

      $scope.showFileList = function () {
        $http.get(piUrls.files, {})
          .success(function (data, status) {
            if (data.success) {
              $scope.assetFiles = data.data.files;
              if (data.data.dbdata) {
                $scope.filesDetails = {};
                data.data.dbdata.forEach(function (dbdata) {
                  if ($scope.assetFiles.indexOf(dbdata.name) >= 0) {
                    $scope.filesDetails[dbdata.name] = dbdata;
                  }
                })
              }
            }
          })
          .error(function (data, status) {
          });

        $scope.imgFilter = ".png"
        $scope.fileDisplayModal = $modal.open({
          templateUrl: '/app/templates/listFilePopup.html',
          scope: $scope,
          keyboard: false
        });
      }

      $scope.saveAssetFile = function (filename) {
        $scope.group.selectedGroup.logo = filename;
        $scope.fileDisplayModal.close();
      }

      $scope.showAssetDetail = function (file) {
        let fileName = file.fileDetails.name;
        switch (fileName.slice(fileName.lastIndexOf('.') + 1)) {

          case 'link':
          case 'weblink':
          case 'stream':
          case 'radio':
          case 'tv':
          case 'mrss':
          case 'txt':
            $scope.fileType = 'link';
            $http
              .get(piUrls.links + fileName)
              .success(function (data, status) {
                if (data.success) {
                  $scope.urlLink = data.data;
                  $scope.urlLink.hideTitle = $scope.urlLink.hideTitle || 'title'
                  $scope.filedetails = data.data;
                }
              })
              .error(function (data, status) {
                console.log(data, status);
              })
            break;

          default:
            $scope.fileType = 'other';
            $http.get(piUrls.files + fileName)
              .success(function (data, status) {
                if (data.success) {
                  $scope.filedetails = data.data;
                }
              })
              .error(function (data, status) {
              });
            break;
        }

        $scope.fileDetailModal = $modal.open({
          templateUrl: '/app/templates/asset-detail-popup.html',
          scope: $scope
        });
      }

      $scope.exportSchedule = (group) => {
        dataLoader
          .fetchData(`${piUrls.reports}/groups/${group._id}`)
          .then(data => {
            let link = document.createElement("a");
            link.href = data.path;
            link.download = data.fileName;
            link.click();
          })
          .catch(err => {
            console.log('exportSchedule error:', err)
          })
      }
    })

  .controller('ServerPlayerCtrl', function ($scope, $http, $state, piUrls, piConstants, $interval, $modal, TZNames,
                                            playerLoader, assetLoader, commands, piPopup, socket) {

    const HTTP_SUCCESS = 200;
    playerLoader.reload();

    $scope.player = playerLoader.player;
    $scope.group = playerLoader.group;
    $scope.playlist = playerLoader.playlist;
    $scope.companies = playerLoader.companies;
    $scope.tzNames = TZNames;
    $scope.asset = assetLoader.asset;

    $scope.labelFilter = function (player) {
      return (assetLoader.label.selectedPlayerLabel ?
          (player.labels && player.labels.indexOf(assetLoader.label.selectedPlayerLabel) >= 0) : true
      )
    }

    $scope.filters = {
      valueSearch: '',

      search: function (player) {
        let text = $scope.filters.valueSearch;
        let check1 = player.name && player.name.indexOf(text) >= 0;
        let check2 = player.cpuSerialNumber.indexOf(text) >= 0;
        let check3 = player.myIpAddress.indexOf(text) >= 0;
        let check4 = player.company && player.company.name.indexOf(text) >= 0;
        let check5 = player.currentPlaylist && player.currentPlaylist.indexOf(text) >= 0;
        return text ? (check1 || check2 || check3 || check4 || check5) : true
      }
    }

    $scope.updatePlayer = function (playerId, params, cb) {
      $http
        .put(`${piUrls.players}/${playerId}`, params)
        .success(function (data, status) {
          if (status === HTTP_SUCCESS) {
            if (cb) cb(null, data)
            return;
          }
          if (cb) cb(data)
        })
        .error((err, status) => {
          console.log('Update player failed:', err)
        });
    }

    $scope.changeTZ = function (player) {
      $scope.updatePlayer(player._id, {TZ: player.TZ}, (err, data) => {
        if (err) {
          console.log('changeTZ failed:', err)
          return;
        }
        player = data.data;
      });
    }

    $scope.saveName = function (player) {
      $scope.updatePlayer(player._id, {name: player.name}, (err, data) => {
        if (err) {
          console.log('update playerName failed:', err)
          return;
        }
        player = data.data;
      });
    }

    $scope.setModeDisplay = function (player) {
      console.log('setModeDisplay')
    }

    $scope.snapshot = {
      image: "/app/img/snapshot.png",
      buttonTxt: "Take Snapshot"
    }

    socket.on('live_snapshot', (data) => {
      let {url, lastTaken} = data;
      $scope.snapshot.image = url + "?" + Date.now();
      $scope.snapshot.lastTaken = lastTaken;
    })

    $scope.shellCommand = function (player) {
      //if (player.statusClass == "text-danger") return console.log("Player is offline");
      let playerName = player.name || player.localName || `Player ${player.cpuSerialNumber.slice(12)}`;
      $scope.msg = {player: player, playerName: playerName, cmd: '', err: "Nhập lệnh shell..."};
      $scope.modalShell = $modal.open({
        templateUrl: '/app/templates/shell-popup.html',
        scope: $scope
      });
      $scope.getSnapshot();
    }

    $scope.execute = function () {
      $scope.msg.err = "Please wait..."
      $scope.msg.stderr = null;
      $scope.msg.stdout = null;
      commands.save($scope.msg.cmd); // save commands

      $http
        .post(`${piUrls.piShell}/${$scope.msg.player._id}`, {cmd: $scope.msg.cmd})
        .success(function (data, status) {
          $scope.msg.err = data.data.err;
          $scope.msg.stderr = data.data.stderr;
          $scope.msg.stdout = data.data.stdout;
        })
        .error(function (data, status) {
        });
    }

    function getCssClass(groupId) {
      let rs = 'landscape';
      for (let i = 0, len = $scope.group.groups.length; i < len; i++) {
        if ($scope.group.groups[i]._id == groupId) {
          rs = $scope.group.groups[i].orientation;
          break;
        }
      }
      return rs;
    }

    $scope.getSnapshot = function () {
      // console.log('socket.session.sessionid',socket.session.sessionid)
      $scope.snapshot.buttonTxt = "Xin vui lòng chờ";
      $http
        .post(`${piUrls.snapshot}/${$scope.msg.player._id}`, {sid: socket.session.sessionid})
        .success(function (data, status) {
          if (data.success) {
            $scope.snapshot.image = (data.data.url) + "?" + Date.now();
            $scope.snapshot.lastTaken = data.data.lastTaken;
            $scope.snapshot.buttonTxt = "Chụp màn hình";
            $scope.snapshot.cssClass = getCssClass(
              ($scope.msg.player.group && $scope.msg.player.group._id) ? $scope.msg.player.group._id : $scope.msg.player.selfGroupId
            );
          } else {
            $scope.snapshot.buttonTxt = data.stat_message;
          }
        })
        .error(function (data, status) {

        });
    }

    $scope.changeTvState = function (flag) {
      $scope.confirmmsg = "Yêu cầu của bạn đã được gửi, Vui lòng làm mới trang sau 10 giây"
      $http
        .post(`${piUrls.piTv}/${$scope.msg.player._id}`, {status: flag})
        .success(function (data, status) {
          $scope.modalShell.dismiss()
        })
        .error(function (data, status) {

        })
    }

    $scope.eventReboot = function (player) {
      piPopup.confirm(
        "--Bạn có muốn khởi động lại thiết bị",
        () => {
          $http
            .post(`${piUrls.piReboot}/${$scope.msg.player._id}`, {})
            .success(function (data, status) {
              $scope.modalShell.dismiss()
            })
            .error(function (data, status) {

            })
        }
      )
    }

    $scope.eventSigusr = function (player) {
      piPopup.confirm(
        "--Bạn có muốn gửi command Sigusr2 đến thiết bị",
        () => {
          $http
            .post(`${piUrls.piSigusr}/${$scope.msg.player._id}`, {})
            .success(function (data, status) {
              $scope.modalShell.dismiss()
            })
            .error(function (data, status) {

            })
        }
      )
    }

    $scope.swUpdate = function (player) {
      if (player.statusClass === "text-danger") {
        return piPopup.status({
          title: 'Cập nhật firmware lỗi',
          msg: 'Thiết bị đang offline. Không thể cập nhật firmware lúc này'
        });
      }

      $scope.msg = {
        player: player, curVer: player.version,
        newVer: $scope.player.currentVersion.version, beta: $scope.player.currentVersion.beta
      };

      $scope.swModal = $modal.open({
        // templateUrl: '/app/templates/swupdate-popup.html',
        templateUrl: '/app/views/layouts/confirms/swupdate.html',
        scope: $scope
      });
    }

    $scope.confirmUpdate = function (version) {
      $http
        .post(`${piUrls.swUpdate}/${$scope.msg.player._id}`, {version: version})
        .success(function (data, status) {
          $scope.swModal.close();
          if (status === HTTP_SUCCESS) playerLoader.getPlayers();
        })
        .error(function (data, status) {

        });
    }

    $scope.label = assetLoader.label
    $scope.loadCategory = function () {
      $scope.labelMode = piConstants.labelMode.player;
      $scope.labelModal = $modal.open({
        templateUrl: '/app/partials/labels.html',
        controller: 'LabelsCtrl',
        scope: $scope
      })
      $scope.labelModal.result.finally(function () {
        playerLoader.getPlayers()
      })
    }

    $scope.clearCategory = function () {
      $scope.label.selectedPlayerLabel = null;
      playerLoader.getPlayers();
    }

    $scope.getOldEntry = function (event) { // handle every key-press event to check and  save commands
      if (event.keyCode == 38) {
        $scope.msg.cmd = commands.previous();
      } else if (event.keyCode == 40) {
        $scope.msg.cmd = commands.next();
      }
    }

    $scope.gotoPlaylist = function (plname) {
      // let pl = assetLoader.playlist.playlists.find(function (item) {
      //   return (item.name == plname)
      // })
      // assetLoader.selectPlaylist(pl)
      $state.go("home.assets.main", {playlist: plname});
    }

    $scope.loadPlayerDetails = function (player) {
      if (!player._id) return;

      $scope.selectedPlayer = player;

      $scope.newPlayer = {
        company: player.company ? player.company._id : undefined,
        group: player.group ? player.group.name : undefined,
      };

      $scope.selectedPlayer.labels = $scope.selectedPlayer.labels || []

      $scope.settingsModal = $modal.open({
        templateUrl: '/app/templates/groupChangePopUp.html',
        scope: $scope
      });

      $scope.playerLabels = assetLoader.label.labels.filter(label => {
        return (label.mode && label.mode === piConstants.labelMode.player)
      });

      $scope.playerLabels.forEach((label) => {
        if ($scope.selectedPlayer.labels.indexOf(label.name) >= 0)
          $scope.ngDropdown.selectedLabels.push(label)
      })
    }

    $scope.assignGroup = function () {
      let player = $scope.selectedPlayer;
      let newGroup = $scope.newPlayer.group;

      let index = $scope.group.groupNames.indexOf(newGroup);
      if (index === -1) return piPopup.status({
        title: 'Lỗi dữ liệu đầu vào',
        msg: `Không tìm thấy nhóm phát '${newGroup}'`
      });

      piPopup.confirm(
        `--Bạn có muôn thay đổi nhóm phát thành '${newGroup}'`,
        () => {
          let group = $scope.group.groups[index];
          $scope.updatePlayer(player._id, {group: group._id}, (err, data) => {
            if (err) return console.log('assign group failed:', err);

            // player = data.data;
            // $scope.settingsModal.close()
            playerLoader.getPlayers();
          });
        },
        () => {
          $scope.newPlayer.group = player.group ? player.group.name : undefined
        }
      )
    }

    $scope.assignCompany = function () {
      let newCompany = $scope.newPlayer.company;
      let player = $scope.selectedPlayer;
      if (player.company && newCompany && player.company._id.toString() === newCompany.toString()) return; // không có gì thay đổi.

      piPopup.confirm(
        "--Bạn có muốn thay đổi khách hàng cho thiết bị",
        () => {
          $scope.updatePlayer(player._id, {company: newCompany}, (err, data) => {
            if (err) return console.log('assign company failed:', err);

            // player = data.data;
            // $scope.settingsModal.close()
            playerLoader.getPlayers();
          });
        },
        () => {
          $scope.newPlayer.company = player.company ? player.company._id : undefined
        }
      )
    }

    $scope.deregister = function () {
      piPopup.confirm("--Bạn có muốn hủy đăng ký thiết bị không", function () {
        $http
          .delete(`${piUrls.players}/${$scope.selectedPlayer._id}`)
          .success(function (data, status) {
            let obj = {
              title: 'Xóa thiết bị thất bại',
              msg: data.message
            }
            if (status === HTTP_SUCCESS) {
              playerLoader.getPlayers();
              obj.title = 'Xóa thiết bị thành công'
            }
            $scope.settingsModal.close();
            piPopup.status(obj)
          })
          .error(function (err, status) {
            console.log('Delete player failed:', err)
          });
      })
    }

    var saveLabels = function () {
      $scope.updatePlayer($scope.selectedPlayer._id, {labels: $scope.selectedPlayer.labels});
    }

    $scope.ngDropdown = {
      selectedLabels: [],
      extraSettings: {
        smartButtonMaxItems: 7,
        displayProp: 'name', idProp: 'name', externalIdProp: 'name',
        //scrollableHeight: '400px', scrollable: true,
        showCheckAll: false, showUncheckAll: false,
        enableSearch: true
      },
      customTexts: {buttonDefaultText: "Chọn danh mục"},
      events: {
        onItemSelect: function (label) {
          if (label) {
            $scope.selectedPlayer.labels.push(label.name)
            saveLabels()
          }
        },
        onItemDeselect: function (label) {
          if (label) {
            $scope.selectedPlayer.labels.splice($scope.selectedPlayer.labels.indexOf(label.name), 1)
            saveLabels()
          }
        }
      }
    }

    $scope.playerFetchTimer = $interval(playerLoader.getPlayers, 60000);

    $scope.$on("$destroy", function () {
      $interval.cancel($scope.playerFetchTimer)
    });
  })

  .controller('GroupConfirmCtrl',
    function ($scope, piUrls, $state, piPopup, dataLoader, piNgTable, GroupFunctions, $rootScope) {

      $scope.objects = {
        list_data: [],
        total: 0,
        skip: 0,
        limit: 0
      };

      $scope.filters = {
        currentPage: 0,
        pageSize: 10,
        "sorting[]": [],
        "filters[]": []
      };

      var reloadData = (params) => {
        $scope.filters = piNgTable.setConditions(params);

        return dataLoader.getGroupsForConfirm($scope.filters)
          .then(data => {
            let {filters, ...others} = data;
            $scope.objects = {...$scope.objects, ...others};
            params.total($scope.objects.total);
            return data.list_data;
          })
          .catch(err => {
            console.log('dataLoader.getGroups error:', err)
          })
      }

      var initTable = () => {
        $scope.tableParams = piNgTable.init(
          reloadData,
          piNgTable.default.option,
          piNgTable.default.counts
        )
      }

      initTable();

      var handelApprove = function (groups) {
        // global sync
        let errMessages = [];
        async.each(
          groups,
          (group, next) => {
            GroupFunctions.listFiles(group, $scope.playlistsObj, $scope.playlists, function (err, groupObj) {
              groupObj.deploy = true;
              let msg;
              dataLoader.putData(`${piUrls.confirms}/${group._id}`, groupObj)
                .then(data => {
                  msg = `Deploy done for '${group.name}'`;
                  errMessages.push(msg);
                  next()
                })
                .catch(err => {
                  msg = `*** Deploy failed for '${group.name}', reason: ${err.message}`
                  errMessages.push(msg);
                  next()
                });
            })
          },
          (response) => {
            let msg = errMessages.join("\n\n")
            piPopup.status(
              {msg: msg, title: 'Deploy '},
              () => $scope.tableParams.reload()
            )
          }
        )
      }

      $scope.fn = {

        toDetail(row) {
          $state.go("home.confirm.details", {group: row._id});
        },

        unDeployAll() {
          dataLoader.postData(`${piUrls.groups}/unDeploy`, {ids: ['all']})
            .then(data => {
              $scope.tableParams.reload()
              piPopup.status({
                title: 'Ngừng triển khai nhóm phát',
                msg: data.message
              })
            })
            .catch(err => {
              // $scope.tableParams.reload()
              piPopup.status({
                title: 'Ngừng triển khai nhóm phát',
                msg: err.message
              })
            })
        },

        approveAll: function () {
          dataLoader.getPlaylist({pageSize: -1})
            .then(data => {
              $scope.playlistsObj = data;
              $scope.playlists = $scope.playlistsObj.map(playlist => playlist.name);
              dataLoader.getGroupsForConfirm({pageSize: -1})
                .then(data => {
                  return handelApprove(data)
                })
                .catch(err => {
                  console.log('get list groups error:', err)
                })
            })
            .catch(err => {
              console.log('error in getting playlist details:', err)
            })
        },

        approve(group) {
          console.log('group', group)
          // playerLoader.selectGroup(group);
          $rootScope.$broadcast('approveDeploy', {message: "Approve Item"});
        },

        cancel(group) {
          dataLoader.postData(`${piUrls.groups}/unDeploy`, {ids: [group._id]})
            .then(data => {
              $scope.tableParams.reload();
              piPopup.status({
                title: 'Ngừng triển khai nhóm phát',
                msg: data.message
              })
            })
            .catch(err => {
              piPopup.status({
                title: 'Ngừng triển khai nhóm phát',
                msg: err.message
              })
            })
        }
      };
    });


