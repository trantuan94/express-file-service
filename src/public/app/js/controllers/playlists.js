'use strict'

angular.module('piPlaylists.controllers', [])
  .controller('PlaylistCtrl', function ($scope, $http, $state, piUrls, assetLoader, piConstants, piPopup, fileReader) {

    const HTTP_SUCCESS = 200;
    $scope.fn = {};
    $scope.fn.editMode = false;
    $scope.fn.edit = function () {
      $scope.fn.editMode = !$scope.fn.editMode;
      assetLoader.selectPlaylist()
    }

    $scope.newPlaylist = {}

    $scope.fn.add = function () {
      if (!$scope.newPlaylist.name) return;

      $scope.newPlaylist.name = $scope.newPlaylist.name.replace(piConstants.groupNameRegEx, '');
      let newPlaylist = $scope.newPlaylist.name;

      for (let i = 0; i < $scope.playlist.playlists.length; i++) {
        if ($scope.playlist.playlists[i].name === newPlaylist) {
          $scope.newPlaylist = {};

          return piPopup.status({
            title: 'Thêm danh sách phát thất bại',
            msg: `Danh sách phát '${newPlaylist}' đã tồn tại`
          })
        }
      }

      $http
        .post(piUrls.playlists, {file: $scope.newPlaylist.name})
        .success((data, status) => {
          $scope.newPlaylist = {};
          if (status === HTTP_SUCCESS) {
            $scope.playlist.playlists.unshift(data.data);
            assetLoader.selectPlaylist(data.data);
            assetLoader.assemblePlaylistAssets();
          } else {
            return piPopup.status({title: 'Thêm danh sách phát thất bại', msg: data.message})
          }
        })
        .error((data, status) => {
          $scope.newPlaylist = {};
          return piPopup.status({title: 'Thêm danh sách phát thất bại', msg: data.message})
        });
    }

    $scope.fn.delete = function (index) {
      if ($scope.fn.editMode) {
        let playlistName = $scope.playlist.playlists[index].name;
        piPopup.confirm(
          `nội dung phát '${playlistName}'`,
          () => {
            $http
              .delete(piUrls.playlists + playlistName)
              .success((data, status) => {
                if (status === HTTP_SUCCESS) {
                  $scope.playlist.playlists.splice(index, 1);
                  assetLoader.assemblePlaylistAssets();
                } else {
                  piPopup.status({title: 'Xóa nội dung phát thất bại', msg: data.message})
                }
              })
              .error((err, status) => {
                console.log('Delete playlist error:', err)
                piPopup.status({title: 'Xóa nội dung phát thất bại', msg: err.message})
              });
          }
        )
      } else {
        $scope.fn.selected($scope.playlist.playlists[index])
      }
    }

    $scope.fn.rename = function (index) {
      $scope.playlist.playlists[index].renameEnable = false;

      let oldName = $scope.playlist.playlists[index].name;
      let newName = $scope.playlist.playlists[index].newname;

      if (!newName || (oldName === newName)) return;

      for (let i = 0; i < $scope.playlist.playlists.length; i++) {
        if ($scope.playlist.playlists[i].name === newName) {
          $scope.playlist.playlists[index].newname = "";

          return piPopup.status({
            title: 'Cập nhật tên nội dung phát thất bại',
            msg: `Nội dung phát '${newName}' đã tồn tại`
          });
        }
      }

      $scope.playlist.playlists[index].name = newName;
      $http
      // .post(piUrls.files + '__' + oldName + '.json', {newname: '__' + newName + '.json'})
        .put(piUrls.playlists + oldName, {newname: newName})
        .success((data, status) => {
          // if (!data.success) {
          $scope.playlist.playlists[index].newname = '';
          if (status !== HTTP_SUCCESS) {
            $scope.playlist.playlists[index].name = oldName;

            return piPopup.status({title: 'Cập nhật tên nội dung phát thất bại', msg: data.message});
          } else {
            assetLoader.assemblePlaylistAssets();
          }
        })
        .error((data, status) => {
          $scope.playlist.playlists[index].newname = '';
          $scope.playlist.playlists[index].name = oldName;

          return piPopup.status({title: 'Cập nhật tên nội dung phát thất bại', msg: data.message});
        });
    }

    $scope.fn.selected = function (playlist) {
      if (!$scope.fn.editMode) {
        $scope.playlist.selectedPlaylist = ($scope.playlist.selectedPlaylist === playlist) ? null : playlist;
        assetLoader.selectPlaylist($scope.playlist.selectedPlaylist);
      } else {
        playlist.renameEnable = true;
        playlist.newname = playlist.name;
      }
    }

    $scope.fn.getClass = function (playlist) {
      if ($scope.playlist.selectedPlaylist && $scope.playlist.selectedPlaylist.name == playlist.name) {
        return "bg-info"
      } else {
        return ""
      }
    }

    $scope.fn.uploadFile = {
      getInput: function () {
        let input = document.getElementById('uploadFileInput');
        input.addEventListener('change', $scope.fn.uploadFile.readFile)
        setTimeout(function () {
          input.click();
        }, 0);
      },
      readFile: function (e) {
        let files = e.target.files, file;
        if (!files || files.length === 0) return console.log('No files for readFile');
        // console.log('File:', files[0]);
        file = files[0];

        fileReader.excel(file, {}, (data) => {
          if (data.length === 0) return console.log(`File '${file.name}' is empty`);
          // return console.log('data', JSON.stringify(data[0]));
          data = data[0];
          $http
            .post(piUrls.uploadPlaylist, {data: data})
            .success((data, status) => {
              console.log('Upload playlist success:', data, ' -- status:', status)
              if (status === HTTP_SUCCESS) {
                assetLoader.getPlaylist();
              }
            })
            .error((data, status) => {
              console.log('Upload playlist error:', data, ' -- status:', status)
              return piPopup.status({
                title: 'Tải lên danh sách phát không thành công',
                msg: data.message
              })
            })
            .finally((data, status) => {
              document.getElementById('uploadFileInput').value = "";
            })
          ;
        })
      }
    }
  })

  .controller('PlaylistViewCtrl',
    function ($scope, $http, $rootScope, piUrls, $window, $state, $modal, assetLoader, layoutOtherZones, $timeout) {

      const HTTP_SUCCESS = 200;
      $scope.customTemplates = function (asset) {
        return asset.match(/^custom_layout.*html$/i)
      }

      //modal for layout
      function loadLayoutStructure() {
        let customLayoutsPresent = false;
        for (let i = 0, len = $scope.asset.files.length; i < len; i++) {
          if ($scope.customTemplates($scope.asset.files[i])) {
            customLayoutsPresent = true;
            break;
          }
        }

        $scope.layouts = {
          "1": {title: "Hiển thị 1 vùng", description: "Vùng chính:1280x720"},
          "2a": {
            title: "2 vùng với vùng chính bên phải",
            description: "Vùng chính:960x720, Vùng bên:320x720"
          },
          "2b": {
            title: "2 vùng với vùng chính bên trái",
            description: "Vùng chính:960x720, Vùng bên:320x720"
          },
          "2c": {
            title: "Hai vùng kích thước bằng nhau với khu vực video ở bên trái",
            //disabled:!$rootScope.serverConfig.newLayoutsEnable,
            description: "Vùng chính:640x720, Vùng bên:640x720"
          },
          "2d": {
            title: "Hai vùng kích thước bằng nhau với khu vực video ở bên phải",
            //disabled:!$rootScope.serverConfig.newLayoutsEnable,
            description: "Vùng chính:640x720, Vùng bên:640x720"
          },
          "3a": {
            title: "Ba vùng (full bottom) với vùng chính ở bên phải",
            description: "Vùng chính:960x540, Vùng bên:320x540, Vùng dưới:1280x180"
          },
          "3b": {
            title: "Ba vùng (full bottom) với vùng chính ở bên trái",
            description: "Vùng chính:960x540, Vùng bên:320x540, Vùng dưới:1280x180"
          },
          "3c": {
            title: "Ba vùng (full top) với vùng chính ở bên phải (bật trong cài đặt)",
            description: "Vùng chính:960x540, Vùng bên:320x540, Vùng banner:1280x180"
          },
          "3d": {
            title: "Ba vùng (full top) với vùng chính ở bên trái (bật trong cài đặt)",
            description: "Vùng chính:960x540, Vùng bên:320x540, Vùng banner:1280x180"
          },
          "4a": {
            title: "Ba vùng (full side) với vùng chính ở bên phải",
            description: "Vùng chính:960x540, Vùng bên:320x720, Vùng dưới:960x180"
          },
          "4b": {
            title: "Ba vùng (full side) với vùng chính ở bên trái",
            description: "Vùng chính:960x540, Vùng bên:320x720, Vùng dưới:960x180"
          },
          "4c": {
            title: "Ba vùng (full side) với vùng chính ở bên phải (bật trong cài đặt)",
            //disabled:!$rootScope.serverConfig.newLayoutsEnable,
            description: "Vùng chính:960x540, Vùng bên:320x720, Vùng banner:960x180"
          },
          "4d": {
            title: "Ba vùng (full side) với vùng chính ở bên trái (bật trong cài đặt)",
            //disabled:!$rootScope.serverConfig.newLayoutsEnable,
            description: "Vùng chính:960x540, Vùng bên:320x720, Vùng banner:960x180"
          },
          "2ap": {title: "Chế độ Portrait 1 vùng, hướng theo chiều kim đồng hồ", description: "Vùng chính:720x1280"},
          "2bp": {
            title: "Chế độ Portrait 2 vùng, hướng theo chiều kim đồng hồ",
            //disabled:!$rootScope.serverConfig.newLayoutsEnable,
            description: "Vùng trên:720x540,Vùng dưới:720x740"
          },
          "2ap270": {
            title: "Chế độ Portrait 1 vùng, hướng ngược chiều kim đồng hồ",
            description: "Vùng chính: 720x1280 "
          },
          "2bp270": {
            title: "Chế độ Portrait 2 vùng, hướng ngược chiều kim đồng hồ",
            description: "Vùng trên:720x540,vùng dưới:720x740"
          },
          // "custom": {
          //     title: "Bố cục tùy chỉnh trong chế độ Landscape Mode",
          //     disabled: !customLayoutsPresent,
          //     description: "Upload custom_layout.html under Assets Tab(otherwise this option is disabled), Use #main,#side, #bottom, #ticker html ID tags for content "
          // },
          // "customp": {
          //     title: "Bố cục tùy chỉnh trong chế độ Portrait, hướng theo chiều kim đồng hồ",
          //     disabled: !customLayoutsPresent,
          //     description: "Upload custom_layout.html under Assets Tab(otherwise this option is disabled), Use #main,#side, #bottom, #ticker html ID tags for content"
          // },
          // "customp270": {
          //     title: "Bố cục tùy chỉnh trong chế độ Portrait, hướng ngược chiều kim đồng hồ",
          //     disabled: !customLayoutsPresent,
          //     description: "Upload custom_layout.html under Assets Tab(otherwise this option is disabled), Use #main,#side, #bottom, #ticker html ID tags for content"
          // }

        }
      }

      loadLayoutStructure();

      $scope.layoutOtherZones = layoutOtherZones;

      $scope.openLayout = function () {
        let playlistObj = $scope.asset.groupWiseAssets[$scope.playlist.selectedPlaylist.name].playlist;
        loadLayoutStructure();
        playlistObj.videoWindow = playlistObj.videoWindow || {mainzoneOnly: false}
        playlistObj.zoneVideoWindow = playlistObj.zoneVideoWindow || {}
        $scope.videoWindow = playlistObj.videoWindow
        $scope.zoneVideoWindow = playlistObj.zoneVideoWindow
        $scope.modal = $modal.open({
          templateUrl: '/app/templates/layout-popup.html',
          scope: $scope
        });
      }

      $scope.selectTemplate = function (asset, layout) {
        if (!asset) return;

        let pl = $scope.asset.groupWiseAssets[$scope.playlist.selectedPlaylist.name].playlist;
        pl.templateName = asset
        pl.layout = layout
        $scope.saveLayout();
      }

      $scope.updatePlaylist = function (playlist, data, cb = null) {
        $http.post(piUrls.playlists + playlist, data)
          .success((data, status) => {
            if (status === HTTP_SUCCESS) {
              if (cb) cb()
            } else {
              console.log('update playlist failed:', data);
            }
          })
          .error((data, status) => {
            console.log('update playlist error:', data);
          })
          .finally(() => {
          });
      }

      $scope.saveLayout = function () {  // get new layout value
        let pl = $scope.asset.groupWiseAssets[$scope.playlist.selectedPlaylist.name].playlist;

        $scope.updatePlaylist(
          $scope.playlist.selectedPlaylist.name,
          {
            layout: pl.layout, videoWindow: pl.videoWindow, zoneVideoWindow: pl.zoneVideoWindow,
            templateName: pl.templateName,
          },
          () => {
            $scope.modal.close();
          }
        )
      }

      $scope.setVideoWindow = function (obj) { // SET/RESET video window options
        $scope.asset.groupWiseAssets[$scope.playlist.selectedPlaylist.name].playlist.videoWindow = obj;
        $scope.saveLayout();
      }

      $scope.setZoneVideoWindow = function (zone, obj) { // SET/RESET video window options
        $scope.asset.groupWiseAssets[$scope.playlist.selectedPlaylist.name].playlist.zoneVideoWindow[zone] = obj;
        $scope.saveLayout();
      }

      $scope.openTicker = function () {
        let settings = $scope.asset.groupWiseAssets[$scope.playlist.selectedPlaylist.name].playlist.settings
        settings.ticker.enable = settings.ticker.enable || false
        settings.ticker.behavior = settings.ticker.behavior || 'slide'
        settings.ticker.textSpeed = settings.ticker.textSpeed || 3
        settings.ticker.rss = settings.ticker.rss || {enable: false, link: null, feedDelay: 10}
        $scope.tickerObj = $scope.playlist.selectedPlaylist.settings.ticker;
        $scope.modal = $modal.open({
          templateUrl: '/app/templates/ticker-popup.html',
          scope: $scope
        });
      }

      $scope.openAd = function () {
        let settings = $scope.asset.groupWiseAssets[$scope.playlist.selectedPlaylist.name].playlist.settings
        settings.ads = settings.ads || {adPlaylist: false, adInterval: 60};
        settings.ads.adCount = settings.ads.adCount || 1;
        settings.audio = settings.audio || {enable: false, random: false, volume: 50};
        $scope.modal = $modal.open({
          templateUrl: '/app/templates/ad-popup.html',
          scope: $scope
        });
      }

      $scope.saveTickerSettings = function () {
        $scope.saveSettings();
      }

      $scope.saveSettings = function () {
        let pl = $scope.asset.groupWiseAssets[$scope.playlist.selectedPlaylist.name].playlist;

        if (pl.settings.ticker.rss && pl.settings.ticker.rss.enable && !pl.settings.ticker.rss.link) {
          $scope.tickerPopupErrMessage = "Vui lòng nhập địa chỉ liên kết RSS";
          $timeout(() => {
            $scope.tickerPopupErrMessage = ""
            return;
          }, 3000)
          return;
        }

        if (pl.settings.ticker.style) pl.settings.ticker.style = pl.settings.ticker.style.replace(/\"/g, '');

        if (pl.settings.ticker.messages)
          pl.settings.ticker.messages = pl.settings.ticker.messages.replace(/'/g, "`")

        $scope.updatePlaylist(
          $scope.playlist.selectedPlaylist.name,
          {settings: pl.settings},
          () => {
            $scope.modal.close();
          }
        )
      }

      $scope.closeWindow = function () {
        assetLoader.selectPlaylist();
      };

    })


  .controller('PlaylistAddCtrl', function ($scope, $http, piUrls, $state, $modal, assetLoader, piConstants, layoutOtherZones) {

    const HTTP_SUCCESS = 200;
    $scope.sortListName = "playlistAssets"
    $scope.layoutOtherZones = layoutOtherZones;

    console.log($scope.playlist)
    var initSetData = function () {
      if ($state.params.playlist) {
        for (let i = 0, len = $scope.playlist.playlists.length; i < len; i++) {
          if ($state.params.playlist == $scope.playlist.playlists[i]._id) {
            $scope.playlist.selectedPlaylist = $scope.playlist.playlists[i];
            break;
          }
        }
      }
    }

    // assetLoader.registerObserverCallback(initSetData, "playlist_assets");
    // initSetData();
    // console.log($scope.playlist)

    console.log($scope.asset.showAssets);

    var enableCustomZones = function (templateName) {
      $http.get("/media/" + templateName, {})
        .success((data, status) => {
          if (data) {
            $scope.customZonesPresent = {}
            layoutOtherZones["custom"].forEach((zone) => {
              $scope.customZonesPresent[zone] = (data.indexOf(zone) != -1)
            })
          }
        })
        .error((data, status) => {
        });
    }

    if ($scope.asset.groupWiseAssets[$scope.playlist.selectedPlaylist.name].playlist.templateName &&
      ($scope.asset.groupWiseAssets[$scope.playlist.selectedPlaylist.name].playlist.layout.indexOf("custom") == 0) &&
      ($scope.asset.files.indexOf($scope.asset.groupWiseAssets[$scope.playlist.selectedPlaylist.name].playlist.templateName) >= 0)) {
      enableCustomZones($scope.asset.groupWiseAssets[$scope.playlist.selectedPlaylist.name].playlist.templateName)
    }

    if (!$scope.asset.showAssets) $state.go("home.assets.main");

    $scope.updatePlaylist = function (playlist, data, cb) {
      $http.post(piUrls.playlists + playlist, data)
        .success((data, status) => {
          if (status === HTTP_SUCCESS) {
            if (cb) cb();
          }
        })
        .error((data, status) => {
          console.log(status);
        });
    }

    $scope.removeAsset = function (index) {
      let playlist = $scope.asset.groupWiseAssets[$scope.playlist.selectedPlaylist.name].playlist;
      if (playlist) {
        assetLoader.removeAssetFromPlaylist($scope.playlist.selectedPlaylist.name, index);
        $scope.updatePlaylist($scope.playlist.selectedPlaylist.name, {assets: playlist.assets});
      }
    }

    $scope.makeCopy = function (mediaObj, position) {
      let playlist = $scope.asset.groupWiseAssets[$scope.playlist.selectedPlaylist.name].playlist;
      if (playlist) {
        playlist.assets.splice(position, 0, angular.copy(playlist.assets[position]))
        $scope.asset.groupWiseAssets[$scope.playlist.selectedPlaylist.name].assets.splice(position, 0,
          angular.copy($scope.asset.groupWiseAssets[$scope.playlist.selectedPlaylist.name].assets[position]))

        $scope.updatePlaylist(playlist.name, {assets: playlist.assets});
      }
    }

    // modal for link files
    $scope.linkFile = function (item, zone) {
      //rawdata.fileD = $scope.filesDetails; //files from database
      //rawdata.fileA = $scope.playlistItems; // file from playlist
      $scope.selectedAsset = item;
      $scope.selectedZone = zone;
      if (item[zone] && item[zone].indexOf("__") == 0)
        $scope.tabIndex = 1;
      else
        $scope.tabIndex = 0;

      $http
        .get(piUrls.playlists, {})
        .success((data, status) => {
          if (status === HTTP_SUCCESS) {
            let playlists = data.data;
            if (playlists.length) playlists = playlists.map((entry) => {
              return {displayName: entry.name, plName: '__' + entry.name + '.json'};
            });
            $scope.playlistsList = playlists
          }
        })
        .error((data, status) => {
        });

      $scope.filteredAssets = $scope.asset.allAssets.assets.filter((fileObj) => {
        let file = fileObj.fileDetails.name
        return !(file.match(piConstants.audioRegex) ||
          file.match(piConstants.liveStreamRegex) || file.match(piConstants.CORSLink));
      })


      $scope.modal = $modal.open({
        templateUrl: '/app/templates/linkfile-popup.html',
        scope: $scope
      });
    }

    $scope.changeTab = function (index) {
      $scope.tabIndex = index;
    }

    $scope.linkFileSave = function (file) {
      $scope.selectedAsset[$scope.selectedZone] = file;
      $scope.saveData();
      //$scope.modal.close();
    }

    $scope.removeLinkFile = function (file, zone) {
      file.playlistDetails[zone] = null;
      $scope.saveData();
    }

    $scope.saveData = function (cb) {
      $scope.asset.groupWiseAssets[$scope.playlist.selectedPlaylist.name].playlist.assets.forEach((item) => {
        //if ($scope.asset.groupWiseAssets[$scope.playlist.selectedPlaylist.name].playlist.layout == "1")
        //    item.fullscreen = true;
        if (layoutOtherZones[$scope.asset.groupWiseAssets[$scope.playlist.selectedPlaylist.name].playlist.layout].length == 0)
          item.fullscreen = true;
        if (item.duration < 2)
          item.duration = 2; //force duration to 2 sec minimum
      });

      let playlist = $scope.asset.groupWiseAssets[$scope.playlist.selectedPlaylist.name].playlist;
      $scope.updatePlaylist($scope.playlist.selectedPlaylist.name, {assets: playlist.assets}, cb);

      let assetFiles = [];
      let layout = playlist.layout;

      $scope.asset.groupWiseAssets[$scope.playlist.selectedPlaylist.name].playlist.assets.forEach((item) => {
        assetFiles.push(item.filename)
        layoutOtherZones[layout].forEach((zone) => {
          if (item[zone] && assetFiles.indexOf(item[zone]) == -1)
            assetFiles.push(item[zone]);
        })
        // if (item.side && assetFiles.indexOf(item.side) == -1)
        //     assetFiles.push(item.side);
        // if (item.bottom && assetFiles.indexOf(item.bottom) == -1)
        //     assetFiles.push(item.bottom);
      })

      $http.post(piUrls.fileMapPlaylist, {playlist: $scope.playlist.selectedPlaylist.name, assets: assetFiles})
        .success((data, status) => {
          //console.log(data);
        })
        .error((data, status) => {
          console.log(status);
        });
    }

    $scope.done = function () {
      $scope.saveData(() => {
        $state.go("home.assets.main", {playlist: $scope.playlist.selectedPlaylist.name}, {reload: true})
      })
    }
  })


  .controller('PlaylistIndexCtrl', function ($scope, piUrls, $modal, $state, piPopup, dataLoader, piNgTable, fileReader) {

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

      return dataLoader
        .fetchData(piUrls.plist, $scope.filters)
        .then(data => {
          let {filters, ...others} = data;
          $scope.objects = {...$scope.objects, ...others};
          params.total($scope.objects.total);
          return data.list_data;
        })
        .catch(err => {
          console.log('get playlist error:', err)
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

    $scope.newPlaylist = {};
    $scope.selectedObject = null;

    $scope.fn = {
      edit(obj) {
        $scope.selectedObject = obj;
        $scope.newObject = Object.assign({}, obj);
        $scope.modal = $modal.open(
          {
            templateUrl: '/app/views/Playlist/components/form.html',
            scope: $scope
          }
        )
      },

      delete(obj) {
        piPopup.confirm(
          `--Bạn có muốn xóa danh sách phát '${obj.name}'`,
          () => {
            dataLoader.deleteData(`${piUrls.plist}/${obj._id}`, {})
              .then(data => {
                $scope.tableParams.reload();

                piPopup.status({
                  title: 'Xóa danh sách phát',
                  msg: data.message
                })
              })
              .catch(err => {
                piPopup.status({
                  title: 'Xóa danh sách phát',
                  msg: err.message
                })
              })
          }
        )
      },

      save() {
        let params = $scope.newPlaylist;
        dataLoader.postData(piUrls.plist, params)
          .then(data => {
            $scope.tableParams.reload();
            $scope.newPlaylist = {};

            piPopup.status({
              title: 'Thêm mới danh sách phát',
              msg: data.message
            })
          })
          .catch(err => {
            piPopup.status(
              {
                title: 'Thêm mới danh sách phát',
                msg: err.message
              },
              () => {
                $scope.newPlaylist = {}
              }
            )
          })
      },

      update() {
        // rename playlist
        let params = $scope.newObject;
        dataLoader.putData(`${piUrls.plist}/rename/${params._id}`, {name: params.name})
          .then(data => {
            $scope.tableParams.reload();
            $scope.fn.abort();

            piPopup.status({
              title: 'Sửa thông tin danh sách phát',
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

      selectFile() {
        let input = document.getElementById('uploadFileInput');
        input.addEventListener('change', $scope.fn.uploadFile)
        setTimeout(function () {
          input.click();
        }, 0);
      },

      uploadFile(e) {
        let files = e.target.files, file;
        if (!files || files.length === 0) return console.log('No files for readFile');
        file = files[0];

        fileReader.excel(file, {}, (data) => {
          if (data.length === 0) return console.log(`File '${file.name}' is empty`);

          data = data[0];
          dataLoader.postData(piUrls.uploadPlaylist, {data})
            .then(data => {
              console.log('Upload playlist success:', data);
              document.getElementById('uploadFileInput').value = "";
              $scope.tableParams.reload();
            })
            .catch(err => {
              document.getElementById('uploadFileInput').value = "";
              console.log('Upload playlist error:', err)
              piPopup.status({
                title: 'Tải lên danh sách phát không thành công',
                msg: err.message
              })
            })
        })
      },

      changeUnique() {
        $scope.statusMsg = null;
      }
    }
  });
