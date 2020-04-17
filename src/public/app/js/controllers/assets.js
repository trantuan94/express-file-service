'use strict'

angular.module('piAssets.controllers', [])
  .controller('AssetsCtrl', function ($scope, $state, piUrls, piConstants, $http, assetLoader) {

    // assetLoader.reload();
    // console.log(assetLoader);
    $scope.asset = assetLoader.asset;
    $scope.playlist = assetLoader.playlist;

    $scope.updatePlaylist = function (playlist, data, cb) {
      $http.post(piUrls.playlists + playlist, data)
        .success(function (data, status) {
          if (status === piConstants.HTTP_SUCCESS) {
            if (cb) cb();
          }
        })
        .error(function (data, status) {
          console.log(status);
        });
    }

    //drag and drop, sort for playlist files, needs claenup
    $scope.sortable = {};
    $scope.sortable.options = {

      accept: function (sourceItemHandleScope, destSortableScope, destItemScope) {
        let srcScope = sourceItemHandleScope.itemScope.sortableScope.$parent,
          dstScope = destSortableScope.$parent;

        //console.log("src: "+srcScope.sortListName+","+sourceItemHandleScope.modelValue.fileDetails.name)
        //console.log("dst: "+dstScope.sortListName)

        //atleast one list has to be playlist Assets
        if (srcScope.sortListName != "playlistAssets" && dstScope.sortListName != "playlistAssets") return false;

        if (srcScope == dstScope) return true;

        if (dstScope.sortListName == "playlistAssets" && dstScope.playlist.selectedPlaylist != null) {
          let assets = dstScope.playlist.selectedPlaylist.assets;
          for (var i = 0, len = assets.length; i < len; i++) {
            if (assets[i].filename == sourceItemHandleScope.modelValue.fileDetails.name) return false;
          }
        }
        return true;
      },

      itemMoved: function (event) {
        console.log("item moved");
        let srcScope = event.source.sortableScope.$parent,
          dstScope = event.dest.sortableScope.$parent;

        let srcIndex = event.source.index,
          destIndex = event.dest.index;

        if (dstScope.sortListName == "playlistAssets") {  //copy to source
          srcScope.asset.allAssets.assets.splice(srcIndex, 0, dstScope.asset.showAssets.assets[destIndex])
        } else {
          dstScope.asset.allAssets.assets.splice(destIndex, 1);   //already present do not duplicate
        }

        let playlist;
        if (srcScope.sortListName == "playlistAssets") {
          playlist = srcScope.playlist.selectedPlaylist;
          playlist.assets.splice(srcIndex, 1);
        } else {
          playlist = dstScope.playlist.selectedPlaylist;
          playlist.assets.splice(destIndex, 0, srcScope.asset.allAssets.assets[srcIndex].playlistDetails);
        }

        $scope.updatePlaylist(playlist.name, {assets: playlist.assets});
      },

      orderChanged: function (event) {
        //change the order in playlist if not null
        console.log("order changed");
        let srcScope = event.source.sortableScope.$parent;
        let srcIndex = event.source.index,
          destIndex = event.dest.index;
        //if (destIndex > srcIndex)
        //    destIndex--;
        let playlist = srcScope.playlist.selectedPlaylist;
        let tmp = playlist.assets.splice(srcIndex, 1)[0];
        playlist.assets.splice(destIndex, 0, tmp);

        $scope.updatePlaylist(playlist.name, {assets: playlist.assets});
      }
    }
  })

  .controller('AssetsEditCtrl', function ($scope, $rootScope, $state, $http, $modal, fileUploader, assetLoader, piUrls, piConstants, piPopup) {

    $scope.sortListName = "assets"
    $scope.label = assetLoader.label

    $scope.assetConfig = {
      assignState: false,
      assets: []
    }

    console.log('AssetsEditCtrl', $scope.asset);
    var assignAssets = function () {
      if ($state.current.data && $state.current.data.showAllAssets) {
        $scope.assetConfig.assignState = true
        $scope.assetConfig.assets = {...$scope.asset.allAssets}
      } else {
        $scope.assetConfig.assignState = false
        $scope.assetConfig.assets = {...$scope.asset.showAssets}
      }
    }
    assetLoader.registerObserverCallback(assignAssets, "assets");
    assignAssets();

    //Label filter for assets
    $scope.labelFilter = function (asset) {
      return (assetLoader.label.selectedLabel ?
          (asset.fileDetails.labels && asset.fileDetails.labels.indexOf(assetLoader.label.selectedLabel) >= 0) :
          true
      )
    }

    $scope.filters = {
      valueSearch: '',
      search: function (asset) {
        let text = $scope.filters.valueSearch;
        return text ? (asset.fileDetails.name.indexOf(text) >= 0) : true
      }
    }

    $scope.exportFile = {
      excel: function (playlist, calendar = null) {
        if (!playlist) return;

        let params = {export: true};
        if (calendar) {
          if (!calendar.start) {
            $scope.calendarPlay.errorMsg = 'Vui lòng nhập thời gian bắt đầu';
            return;
          }
          if (!calendar.end) {
            $scope.calendarPlay.errorMsg = 'Vui lòng nhập thời gian kết thúc';
            return;
          }
          if (moment(calendar.start) >= moment(calendar.end)) {
            $scope.calendarPlay.errorMsg = 'Thời gian bắt đầu phải bé hơn thời gian kết thúc';
            return;
          }
          let start = moment(calendar.start).format('HH:mm');
          let end = moment(calendar.end).format('HH:mm');
          params.calendar = {start, end};
        }

        $http
          .get(piUrls.playlists + playlist.name, {params})
          .success((data, status) => {
            if (status === piConstants.HTTP_SUCCESS) {
              data = data.data;
              let link = document.createElement("a");
              link.href = data.path;
              link.download = data.fileName;
              link.click();
            } else {
              console.log('Export failed:', status, '--', data)
            }
          })
          .error((data, status) => {
            console.log('Export error:', status, '--', data)
          });
      },
      setCalendar: function () {
        $scope.exportFile.reloadValue();
        $scope.modalExport = $modal.open({
          templateUrl: '/app/templates/export-popup.html',
          scope: $scope
        });
      },
      changeValue: function () {
        $scope.calendarPlay.errorMsg = null;
      },
      reloadValue: function () {
        $scope.calendarPlay = {
          start: null,
          end: null,
          isValid: false,
          errorMsg: null
        };
      },
    }

    $scope.fn = {};
    $scope.fn.editMode = false;

    $scope.fn.edit = function () {
      $scope.fn.editMode = !$scope.fn.editMode;
      if ($scope.fn.editMode) {
        $scope.names = [];
        $scope.asset.files.forEach(function (file) {
          let name, ext;
          if (file.lastIndexOf('.') == -1) {
            name = file;
            ext = ""
          } else {
            name = file.slice(0, file.lastIndexOf('.'));
            ext = file.slice(file.lastIndexOf('.'));
          }
          $scope.names.push({
            name: name,
            ext: ext
          })
        });
      } else {
        assetLoader.reload();
        $state.reload();
      }
    }

    $scope.fn.delete = function (index) {
      piPopup.confirm("File " + $scope.asset.files[index], function () {
        $http
          .delete(piUrls.files + $scope.asset.files[index])
          .success(function (data, status) {
            if (data.success) {
              delete $scope.asset.filesDetails[$scope.asset.files[index]];
              $scope.asset.files.splice(index, 1);
              $scope.names.splice(index, 1);
            }
          })
          .error(function (data, status) {
          });
      })
    }

    $scope.fn.rename = function (index) {
      let oldname = $scope.asset.files[index],
        newname = $scope.names[index].name + $scope.names[index].ext;
      if (!$scope.names[index].name || $scope.asset.files.indexOf(newname) >= 0) {
        $scope.names[index].name = "Tên tệp đã tồn tại hoặc trống";
        $scope.fieldStatus = "has-error";
      } else {
        $http
          .post(piUrls.files + oldname, {newname: newname})
          .success(function (data, status) {
            if (data.success) {
              $scope.asset.filesDetails[newname] = $scope.asset.filesDetails[$scope.asset.files[index]];
              delete $scope.asset.filesDetails[$scope.asset.files[index]];
              $scope.asset.files[index] = newname;
              $scope.fieldStatus = "has-success";
            }
          })
          .error(function (data, status) {
          });
      }
    }

    $scope.fn.showDetails = function (file) {
      $state.go("home.assets.assetDetails", {file: file})
    }

    //upload assets related
    var initDataUpload = function() {
      $scope.msg = {
        title: 'Tải lên',
        msg: 'Xin vui lòng chờ',
        buttonText: 'Đang tải lên',
        disable: true
      }
    }

    $scope.newLabel = {};

    $scope.upload = {
      onstart: function (files) {
        initDataUpload();
        $scope.modal = $modal.open({
          templateUrl: '/app/templates/upload-popup.html',
          scope: $scope,
          backdrop: 'static',
          keyboard: false
        });
      },
      onprogress: function (percentDone) {
        $scope.msg.title = "Trạng thái tải lên";
        $scope.msg.msg = percentDone + "% done";
      },
      ondone: function (files, data) {  // called when upload is done
        $scope.uploadedFiles = files;
        if (data.data) {
          data.data.forEach(function (item) {
            if ($scope.asset.files.indexOf(item.name) == -1)
              $scope.asset.files.push(item.name);
          });
        }
        if (data.success) {
          $scope.msg = {
            title: "Trạng thái tải lên",
            msg: "Hoàn tất tải lên",
            buttonText: "Tiếp tục",
            // buttonText: "Continue",
            disable: false,
            next: true
          };
        } else {
          $scope.msg = {
            title: 'Lỗi tải lên',
            msg: data.stat_message,
            buttonText: "Bỏ qua",
            disable: false,
            next: false
          };
        }
      },
      onerror: function (files, type, msg) {
        if (!$scope.modal) $scope.upload.onstart();

        $scope.msg = {
          title: 'Lỗi tải lên',
          msg: `${type}: ${msg}`,
          buttonText: "OK",
          disable: false,
          next: false
        };
      },
      abort: function () {
        fileUploader.cancel();
      },

      selectedLabels: [],
      labels: [],

      addLabel: function () {
        console.log('add new label in controller assets');
        if (!$scope.newLabel.name || !$scope.newLabel.name.length) return;
        $scope.newLabel.mode = piConstants.labelMode.asset;
        $http
          .post(piUrls.labels, $scope.newLabel)
          .success(function (data, status) {
            if (status === piConstants.HTTP_SUCCESS) {
              $scope.upload.selectedLabels.push(data.data.name)
              $scope.upload.labels.push(data.data)
              $scope.newLabel = {};
              $scope.msg.error = null;
            } else {
              $scope.msg.error = data.message;
            }
          })
          .error(function (data, status) {
            $scope.msg.error = data.message;
          });
      },

      modalOk: function () {
        if ($scope.msg.buttonText === "OK") {
          $scope.modal.close();
          assetLoader.reload();
          $state.reload();
          return;
        }

        if (!$scope.msg.next) {
          $scope.modal.close();
          return;
        }

        $scope.msg.next = false;
        $scope.msg.title = 'Đang xử lý...';
        $scope.msg.msg = 'Xin vui lòng chờ';
        let fileArray = $scope.uploadedFiles.map(function (file) {
          return ({name: file.name, size: file.size, type: file.type})
        })
        $http
          .post(piUrls.storeFileInfo, {files: fileArray, categories: $scope.upload.selectedLabels})
          .success(function (data, status) {
            if (data.success) {
              $scope.msg.title = 'Xếp hàng để xử lý';
              $scope.msg.msg = 'Nếu cần chuyển đổi định dạng, sẽ mất vài phút để xuất hiện trong danh sách nội dung';
            } else {
              $scope.msg.msg = 'Lỗi xử lý: ' + data.stat_message;
            }
            $scope.msg.buttonText = 'OK';
            $scope.msg.disable = false;

          })
          .error(function (data, status) {
            $scope.msg.msg = 'HTTP Post Error';
            $scope.msg.buttonText = 'OK';
            $scope.msg.disable = false;
          })
      }
    }

    //Add link releated for uploading links
    $scope.link = {
      types: [{name: 'Livestreaming or YouTube', ext: '.tv'},
        {name: 'Streaming', ext: '.stream'},
        {name: 'Audio Streaming', ext: '.radio'},
        {name: 'Liên kết web (hiển thị trong iframe)', ext: '.link'},
        {name: 'Trang web (hỗ trợ liên kết cross origin)', ext: '.weblink'},
        {name: 'Media RSS', ext: '.mrss'},
        {name: 'Tin nhắn', ext: '.txt'}
      ],
      obj: {
        name: null,
        type: '.tv',
        link: null,
        zoom: 1.0,
        duration: 10,
        hideTitle: 'title'    //actually show Rss text type

      },
      showPopup: function (type) {
        if (type) {
          $scope.link.obj.type = _.find($scope.link.types, function (obj) {
            return obj.ext.slice(1) == type
          }).ext;
        } else {
          $scope.link.obj.type = ".tv"
        }
        $scope.linkCategories = []
        $scope.modal = $modal.open({
          templateUrl: '/app/templates/link-popup.html',
          scope: $scope
        });
      },
      save: function () {
        $http
          .post(piUrls.links, {details: $scope.link.obj, categories: $scope.linkCategories})
          .success(function (data, status) {
            if (data.success) {
              //$scope.Filestatus = data.stat_message;
              $scope.modal.close();
              assetLoader.reload();
              $state.reload();
            }
          })
          .error(function (data, status) {
            $scope.errorMessage = data.stat_message;
          })
      }
    }

    const recorder = new MicRecorder({
      bitRate: 128
    });

    // Add new file record audio.
    $scope.audio = {
      showPopup: function () {
        $scope.objRecorder = {};
        $scope.modalRecord = $modal.open({
          templateUrl: '/app/templates/record-popup.html',
          scope: $scope
        });
      },
      startRecording: function () {
        $scope.objRecorder = {};
        recorder.start().then(() => {
          let recordButton = document.getElementById("recordButton");
          let stopButton = document.getElementById("stopButton");
          recordButton.disabled = true;
          stopButton.disabled = false;
        }).catch((e) => {
          console.error(e);
        });
      },
      stopRecording: function () {
        recorder.stop().getMp3().then(([buffer, blob]) => {
          // console.log(buffer, blob);
          const fileName = 'record.mp3'
          const file = new File(buffer, fileName, {
            type: blob.type,
            lastModified: Date.now()
          });

          $scope.objRecorder = {
            success: true
          }

          const url = URL.createObjectURL(file);
          const audio = new Audio(url);
          audio.controls = true;

          let recordList = document.getElementById("audio_result");
          recordList.innerHTML = '';
          recordList.appendChild(audio);

          let recordButton = document.getElementById("recordButton");
          let stopButton = document.getElementById("stopButton");
          recordButton.disabled = false;
          stopButton.disabled = true;

          let downloadButton = document.getElementById("downloadButton");
          downloadButton.href = url;
          downloadButton.download = fileName;

        }).catch((e) => {
          console.error(e);
        });
      }
    }

    // $scope.configureGCalendar= function() {
    //     $scope.gCalModal = $modal.open({
    //         templateUrl: '/app/templates/gcal-popup.html',
    //         scope: $scope
    //     });
    // }

    //dropdown selects for filter and assign selected files
    $scope.ngDropdown = {
      selectedAssets: [],
      label: {
        extraSettings: {
          displayProp: 'name', idProp: 'name', externalIdProp: 'name',
          //scrollableHeight: '200px', scrollable: true,
          showCheckAll: false, showUncheckAll: false
        },
        customTexts: {buttonDefaultText: "Gán nhãn"},
        Label: assetLoader.label,
        selectedLabels: [],
        events: {
          onItemSelect: function (label) {
            //add Labels to selected files
            if (!$scope.playlistState && $scope.ngDropdown.selectedAssets.length) {
              for (let i = 0, len = $scope.ngDropdown.selectedAssets.length; i < len; i++) {
                let asset = $scope.ngDropdown.selectedAssets[i];
                asset.fileDetails.labels = asset.fileDetails.labels || [];
                if (asset.fileDetails.labels.indexOf(label.name) == -1)
                  asset.fileDetails.labels.push(label.name);
                //delete asset.selected;

                $http.post(piUrls.files + asset.fileDetails.name, {dbdata: asset.fileDetails})
                  .success(function (data, status) {
                    if (data.success) {
                      asset.fileDetails = data.data;
                      $scope.asset.filesDetails[data.data.name] = data.data;
                      assetLoader.updateLabelsCount()
                    }
                  })
                  .error(function (data, status) {
                  });
              }
            }
          },
          onItemDeselect: function (label) {
            //delete label for the selected files
            if (!$scope.playlistState && $scope.ngDropdown.selectedAssets.length) {
              for (let i = 0, len = $scope.ngDropdown.selectedAssets.length; i < len; i++) {
                let asset = $scope.ngDropdown.selectedAssets[i],
                  index = asset.fileDetails.labels.indexOf(label.name);
                if (index != -1)
                  asset.fileDetails.labels.splice(index, 1);
                //delete asset.selected;

                $http.post(piUrls.files + asset.fileDetails.name, {dbdata: asset.fileDetails})
                  .success(function (data, status) {
                    if (data.success) {
                      asset.fileDetails = data.data;
                      $scope.asset.filesDetails[data.data.name] = data.data;
                      assetLoader.updateLabelsCount()
                    }
                  })
                  .error(function (data, status) {
                  });
              }
            }
          }
        }
      },
      playlist: {
        extraSettings: {
          displayProp: 'name', idProp: 'name', externalIdProp: 'name',
          closeOnSelect: true,
          showCheckAll: false, showUncheckAll: false
        },
        customTexts: {buttonDefaultText: ($state.current.name.indexOf("home.assets.playlists") == 0) ? "AssignTo Playlist" : "RemoveFrom Playlist"},
        PlaylistTab: assetLoader.playlist,
        selectedPlaylists: [],
        events: {
          //add to the playlist
          onItemSelect: function () {
            let playlist = $scope.asset.groupWiseAssets[$scope.playlist.selectedPlaylist.name].playlist;
            if (playlist) {
              let assetNames = playlist.assets.map(function (asset) {
                return asset.filename;
              });
              $scope.ngDropdown.selectedAssets.forEach(function (asset) {
                if (assetNames.indexOf(asset.playlistDetails.filename) == -1) {
                  playlist.assets.push(asset.playlistDetails);
                  $scope.asset.groupWiseAssets[$scope.playlist.selectedPlaylist.name].assets.push(asset);
                }
              })

              $http.post(piUrls.playlists + $scope.playlist.selectedPlaylist.name, {assets: playlist.assets})
                .success(function (data, status) {
                  if (status === piConstants.HTTP_SUCCESS) {
                    $scope.ngDropdown.clearCheckboxes();
                  }
                })
                .error(function (data, status) {
                  console.log(status);
                });
            }
          },
          onItemDeselect: function (index) {

          }
        }
      },
      checkbox: function (asset) {
        if (asset.selected)
          $scope.ngDropdown.selectedAssets.push(asset);
        else
          $scope.ngDropdown.selectedAssets.splice($scope.ngDropdown.selectedAssets.indexOf(asset), 1)
      },
      clearCheckboxes: function () {
        $scope.ngDropdown.selectedAssets.forEach(function (asset) {
          asset.selected = false;
        })
        $scope.ngDropdown.selectedAssets = [];
        $scope.ngDropdown.label.selectedLabels = [];
        $scope.ngDropdown.playlist.selectedPlaylists = [];
      }
    }

    $scope.scheduleValidity = function (asset) {
      $scope.forAsset = asset;
      var validityField = asset.fileDetails.validity || {enable: false};
      if (validityField.startdate)
        validityField.startdate =
          new Date(validityField.startdate)
      if (validityField.enddate)
        validityField.enddate =
          new Date(validityField.enddate)

      $scope.scheduleValidityModal = $modal.open({
        templateUrl: '/app/templates/schedule-validity.html',
        scope: $scope,
        keyboard: false
      });
    }

    $scope.saveValidity = function () {
      $http.post(piUrls.files + $scope.forAsset.fileDetails.name, {dbdata: $scope.forAsset.fileDetails})
        .then(function (response) {
          var data = response.data;
          if (data.success) {
            $scope.scheduleValidityModal.close()
          }
        }, function (response) {
        });
    }

    $scope.loadCategory = function () {
      $scope.labelMode = "assets"
      $scope.labelModal = $modal.open({
        templateUrl: '/app/partials/labels.html',
        controller: 'LabelsCtrl',
        scope: $scope
      })
    }

    $scope.$on("$destroy", function () {
      $scope.ngDropdown.clearCheckboxes();
    })
  })

  .controller('AssetViewCtrl', function ($scope, $rootScope, $window, $http, piUrls, $state, piPopup, assetLoader) {

    //merge the apis for the three
    $scope.fileType;
    $scope.selectedLabels = [];
    switch ($state.params.file.slice($state.params.file.lastIndexOf('.') + 1)) {
      // case 'gcal':
      //     $scope.fileType = 'gcal';
      //     $scope.calendarname = $state.params.file;
      //
      //     if($state.params.file != "new"){
      //         $http
      //             .get(piUrls.calendars+$state.params.file)
      //             .success(function(data, status) {
      //                 if (data.success) {
      //                     $scope.calendar = data.data;
      //                     $scope.filedetails = data.data;
      //                     if ($scope.filedetails.dbdata)
      //                         $scope.selectedLabels = $scope.filedetails.dbdata.labels;
      //                 }
      //             })
      //             .error(function(data, status) {
      //             });
      //     }
      //     break;
      case 'link':
      case 'weblink':
      case 'stream':
      case 'radio':
      case 'tv':
      case 'mrss':
      case 'txt':
        $scope.fileType = 'link';
        $http
          .get(piUrls.links + $state.params.file)
          .success(function (data, status) {
            if (data.success) {
              $scope.urlLink = data.data;
              $scope.urlLink.hideTitle = $scope.urlLink.hideTitle || 'title'
              $scope.filedetails = data.data;
              if ($scope.filedetails.dbdata)
                $scope.selectedLabels = $scope.filedetails.dbdata.labels;
            }
          })
          .error(function (data, status) {
            console.log(data, status);
          })
        break;

      default:
        $scope.fileType = 'other';
        $http.get(piUrls.files + $state.params.file)
          .success(function (data, status) {
            if (data.success) {
              $scope.filedetails = data.data;
              if ($scope.filedetails.dbdata)
                $scope.selectedLabels = $scope.filedetails.dbdata.labels;
            }
          })
          .error(function (data, status) {
          });
        break;
    }

    $scope.selectedCalendar = function (value) {
      $http
        .post(piUrls.calendars + $state.params.file, {email: value})
        .success(function (data, status) {
          if (data.success) {
            console.log(data);
          }
        })
        .error(function (data, status) {
        });
    }

    $scope.save = function () {
      if ($scope.filedetails && $scope.filedetails.dbdata) {
        $scope.filedetails.dbdata.labels = $scope.selectedLabels;
        $http.post(piUrls.files + $state.params.file, {dbdata: $scope.filedetails.dbdata})
          .success(function (data, status) {
            if (data.success) {
              $scope.asset.filesDetails[data.data.name].labels = data.data.labels;
              $window.history.back();
            }
          })
          .error(function (data, status) {
          });
      } else {
        $window.history.back();
      }
    }

    $scope.saveNewChanges = function () {
      $http
        .post(piUrls.links, {details: $scope.urlLink})
        .then(function (response) {
          var data = response.data;
          $scope.linkform.$setPristine();
        }, function (response) {
          console.log(response);
        })
    }


    $scope.delete = function (index) {
      piPopup.confirm("File " + $state.params.file, function () {
        $http
          .delete(piUrls.files + $state.params.file)
          .success(function (data, status) {
            if (data.success) {
              //delete $scope.asset.filesDetails[$state.params.file];
              //$scope.asset.files.splice($scope.asset.files.indexOf($state.params.file),1);
              assetLoader.reload()
              $window.history.back();
            }
          })
          .error(function (data, status) {
          });
      })
    }

  })


  .controller('AssetIndexCtrl', function ($scope, $modal, piConstants, piUrls, piPopup, dataLoader, $filter, NgTableParams) {

    $scope.objects = [];

    var reloadData = () => {
      dataLoader.getAssets({pageSize: -1})
        .then(data => {
          $scope.objects = data || [];
          $scope.tableParams = new NgTableParams(
            {
              page: 1,
              count: 10
            },
            {
              counts: [10, 25, 50, 100],
              total: 0,
              getData: (params => {
                let data = params.sorting() ? $filter('orderBy')($scope.objects, params.orderBy()) : $scope.objects;
                data = params.filter() ? $filter('filter')(data, params.filter()) : data;
                params.total(data.length);
                return data.slice((params.page() - 1) * params.count(), params.page() * params.count());
              })

            });
        })
        .catch(err => {
          console.log('dataLoader.getAssets error: ', err);
        })
    }

    reloadData();
  });
