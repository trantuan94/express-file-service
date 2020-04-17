'use strict'

angular.module('piPlayers.controllers', [])
  .controller('PlayerCtrl', function ($scope, $state, $modal, $filter, $interval, $timeout,
                                      piUrls, piConstants, piPopup, TZNames, commands, socket,
                                      dataLoader, NgTableParams, piNgTable) {

    $scope.tzNames = TZNames;
    $scope.companies = {};
    $scope.groups = {};
    $scope.playlist = {};
    $scope.labels = {};
    $scope.currentVersion = {};
    $scope.titleExport = "Xuất file theo danh sách thiết bị";
    $scope.historiesFilter = {
      start: new Date(),
      end: new Date()
    }

    $scope.objects = {
      list_data: [],
      total: 0,
      skip: 0,
      limit: 0
    };

    $scope.filters = {
      init: true,
      currentPage: 0,
      pageSize: 25,
      sorts: [],
      filters: []
    };

    dataLoader.getCurrentFirmware()
      .then(data => {
        $scope.currentVersion = data
      })
      .catch(err => {
        console.log('dataLoader.getCurrentFirmware error:', err)
      })

    var loadOptionsByName = (nameVariable, fnFetch) => {
      dataLoader[fnFetch]({pageSize: -1})
        .then(data => $scope[nameVariable] = data)
        .catch(error => $scope[nameVariable] = {})
    }

    var reloadData = (params) => {
      $scope.filters = piNgTable.setConditions(params);

      return dataLoader.getDevices($scope.filters)
        .then(data => {
          let {filters, ...others} = data;
          $scope.objects = {...$scope.objects, ...others};
          params.total($scope.objects.total);
          let result = data.list_data.map(item => {
            let {isConnected, playlistOn, tvStatus} = item;
            item.status = {
              class: isConnected ? (playlistOn ? "text-lightgreen" : "text-lightyellow") : "text-danger",
              title: isConnected ? (playlistOn ? `online & playing, tv-on: ${tvStatus}` : `online & not playing, tv-on: ${tvStatus}`) : "offline"
            }
            item.classReport = isConnected ? "text-primary" : "text-danger"
            return item
          })
          return data.list_data;
        })
        .catch(err => {
          console.log('NgTableParams.getData players error:', err)
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

    loadOptionsByName('groups', 'getGroups')
    loadOptionsByName('companies', 'getCompanies')
    loadOptionsByName('playlist', 'getPlaylist')
    loadOptionsByName('labels', 'getLabels')

    $scope.labelFilter = (item) => {
      console.log('labelFilter', item)
    }

    $scope.updatePlayer = (playerId, params, cb) => {
      dataLoader.putData(`${piUrls.players}/${playerId}`, params)
        .then(data => {
          if (cb) cb(null, data)
        })
        .catch(err => {
          console.log('Update player failed:', err)
          if (cb) cb(err)
        })
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

    function getCssClass(groupId) {
      let rs = 'landscape';
      for (let i = 0, len = $scope.groups.length; i < len; i++) {
        if ($scope.groups[i]._id.toString() === groupId.toString()) {
          rs = $scope.groups[i].orientation;
          break;
        }
      }
      return rs;
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
      if (!player.isConnected) return piPopup.status({
        title: 'Thông báo',
        msg: 'Thiết bị đang offline. Không thể thực hiện lệnh lúc này'
      });

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

      dataLoader.postData(`${piUrls.piShell}/${$scope.msg.player._id}`, {cmd: $scope.msg.cmd})
        .then(data => {
          if (data.success) {
            data = data.data;
            $scope.msg.err = data.err;
            $scope.msg.stderr = data.stderr;
            $scope.msg.stdout = data.stdout;
          } else {
            console.log('execute cmd error', data.stat_message)
          }
        })
        .catch(err => {
          console.log(`execute cmd for '${$scope.msg.player.cpuSerialNumber}' error:`, err)
        })
    }

    $scope.getSnapshot = function () {
      // console.log('socket.session.sessionid',socket.session.sessionid)
      $scope.snapshot.buttonTxt = "Xin vui lòng chờ";
      dataLoader.postData(`${piUrls.snapshot}/${$scope.msg.player._id}`, {sid: socket.session.sessionid})
        .then(data => {
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
        .catch(err => {
          console.log(`getSnapshot error:`, err)
        })
    }

    $scope.executeEvents = (event, url, params = {}) => {
      dataLoader.postData(`${url}/${$scope.msg.player._id}`, params)
        .then(data => {
          // $scope.tableParams.reload();
          $scope.modalShell.dismiss()
        })
        .catch(err => {
          console.log(`'${$scope.msg.player.cpuSerialNumber}' ${event} error:`, err)
        })
    }

    $scope.changeTvState = function (flag) {
      $scope.displayMessage(
        "confirmmsg",
        "Yêu cầu của bạn đã được gửi, Vui lòng làm mới trang sau 10 giây",
        10000
      )
      $scope.executeEvents('changeTvState', piUrls.piTv, {status: flag})
    }

    $scope.eventReboot = function (player) {
      piPopup.confirm(
        "--Bạn có muốn khởi động lại thiết bị",
        () => {
          $scope.executeEvents('reboot', piUrls.piReboot)
        }
      )
    }

    $scope.eventSigusr = function (player) {
      piPopup.confirm(
        "--Bạn có muốn gửi command Sigusr2 đến thiết bị",
        () => {
          $scope.executeEvents('eventSigusr', piUrls.piSigusr)
        }
      )
    }

    $scope.setModeDisplay = (player) => {
      let {
        hdmi_drive, hdmi_mode, cvt_width, cvt_height,
        cvt_framerate, cvt_aspect, cvt_margins, cvt_interlace, cvt_rb
      } = $scope.newPlayer; 

      hdmi_drive = String(hdmi_drive).trim();
      hdmi_mode = String(hdmi_mode).trim();
      cvt_width = String(cvt_width).trim();
      cvt_height = String(cvt_height).trim();
      cvt_framerate = String(cvt_framerate).trim();
      cvt_aspect = String(cvt_aspect).trim();
      cvt_margins = String(cvt_margins).trim();
      cvt_interlace = String(cvt_interlace).trim();
      cvt_rb = String(cvt_rb).trim();

      if(!hdmi_drive) return setMsgUpdate('error', 'Vui lòng nhập Hdmi driver');
      else if( hdmi_drive.length > 10) return setMsgUpdate('error', 'Hdmi driver nhập không quá 10 ký tự');

      if(!hdmi_mode) return setMsgUpdate('error', 'Vui lòng nhập Hdmi mode');
      else if( hdmi_mode.length > 10) return setMsgUpdate('error', 'Hdmi mode nhập không quá 10 ký tự');

      if(!cvt_width) return setMsgUpdate('error', 'Vui lòng nhập CVT width')
      else if(isNaN(Number(cvt_width))) return setMsgUpdate('error', 'CVT width nhập không phải số')

      if(!cvt_height) return setMsgUpdate('error', 'Vui lòng nhập CVT height')
      else if(isNaN(Number(cvt_height))) return setMsgUpdate('error', 'CVT height nhập không phải số')

      if(!cvt_framerate) return setMsgUpdate('error', 'Vui lòng nhập CVT framerate')
      else if(isNaN(Number(cvt_framerate))) return setMsgUpdate('error', 'CVT framerate nhập không phải số')

      if(!cvt_aspect) return setMsgUpdate('error', 'Vui lòng nhập CVT aspect')
      else if(!['1', '2', '3', '4', '5', '6'].includes(cvt_aspect)) return setMsgUpdate('error', 'CVT aspect chỉ được nhập trong khoảng 1-6')

      if(!cvt_margins) return setMsgUpdate('error', 'Vui lòng nhập CVT margins')
      else if(!['0', '1'].includes(cvt_margins)) return setMsgUpdate('error', 'CVT margins chỉ được nhập 1 hoặc 0')

      if(!cvt_interlace) return setMsgUpdate('error', 'Vui lòng nhập CVT interlace')
      else if(!['0', '1'].includes(cvt_interlace)) return setMsgUpdate('error', 'CVT interlace chỉ được nhập 1 hoặc 0')

      if(!cvt_rb) return setMsgUpdate('error', 'Vui lòng nhập CVT rb')
      else if(!['0', '1'].includes(cvt_rb)) return setMsgUpdate('error', 'CVT rb chỉ được nhập 1 hoặc 0')

      let hdmi_cvt = [cvt_width, cvt_height, cvt_framerate, cvt_aspect, cvt_margins, cvt_interlace, cvt_rb].join(" ");

      let params = {hdmi_drive, hdmi_mode, hdmi_cvt};
      console.log('update mode', params)

      $scope.apiUpdateOfPlayer(params)
    }

    $scope.swUpdate = function (player) {
      if (!player.isConnected) {
        return piPopup.status({
          title: 'Thông báo',
          msg: 'Thiết bị đang offline. Không thể cập nhật firmware lúc này'
        });
      }

      $scope.msg = {
        player: player, curVer: player.version,
        newVer: $scope.currentVersion.version, beta: $scope.currentVersion.beta
      };

      $scope.swModal = $modal.open({
        templateUrl: '/app/views/layouts/confirms/swupdate.html',
        scope: $scope
      });
    }

    $scope.confirmUpdate = function (version) {
      dataLoader.postData(`${piUrls.swUpdate}/${$scope.msg.player._id}`, {version: version})
        .then(data => {
          $scope.tableParams.reload();
          $scope.swModal.close();
        })
        .catch(err => {
          console.log(`Update firmware for '${$scope.msg.player.cpuSerialNumber}' error:`, err)
        })
    }

    $scope.label = [];
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
      if (event.keyCode === 38) {
        $scope.msg.cmd = commands.previous();
      }
      if (event.keyCode === 40) {
        $scope.msg.cmd = commands.next();
      }
    }

    $scope.gotoPlaylist = function (plname) {
      $state.go("home.assets.main", {playlist: plname});
    }

    $scope.scanWifi = () => {
      if ($scope.loadingCanwifi === true) return;

      $scope.loadingCanwifi = true;
      let player = $scope.selectedPlayer;
      dataLoader.scanWifi(player._id)
        .then(data => {
          $scope.listWifi = data;
          $scope.loadingCanwifi = false;
        })
        .catch(err => {
          console.log('scanWifi err', err)
          $scope.loadingCanwifi = false;
        })
    }

    $scope.setWifi = () => {
      let player = $scope.selectedPlayer;
      let params = $scope.objWifi;
      dataLoader.postData(`${piUrls.piWifi}/${player._id}`, params)
        .then(data => {
          $scope.displayMessage('msgWifi', data.message)
        })
        .catch(err => {
          // console.log('setWifi err', err)
          $scope.displayMessage('msgWifi', err.message)
        })
    }

    $scope.displayMessage = (key, msg, timeout = 7000) => {
      $scope[key] = msg;
      $timeout(() => {
        $scope[key] = ""
      }, timeout)
    }

    $scope.selectWifi = () => {
      $scope.enableWifi = !!$scope.objWifi.ssid;
    }

    $scope.loadPlayerDetails = function (player) {
      if (!player._id) return;

      $scope.selectedPlayer = player;

      $scope.newPlayer = {
        company: player.company ? player.company._id : undefined,
        group: player.group ? player.group._id : undefined,
        location: player.location || '',
        packages: player.packages ? {...player.packages} : {},
        discount: player.discount || '0'
      };

      $scope.objWifi = {
        ssid: "",
        psk: ""
      }

      $scope.selectedPlayer.labels = $scope.selectedPlayer.labels || [];
      $scope.listWifi = [];
      $scope.enableWifi = false;

      $scope.settingsModal = $modal.open({
        templateUrl: '/app/views/Player/components/setting-popup.html',
        size: 'lg',
        scope: $scope
      });

      $scope.playerLabels = $scope.labels.filter(label => {
        return (label.mode && label.mode === piConstants.labelMode.player)
      });

      $scope.playerLabels.forEach((label) => {
        if ($scope.selectedPlayer.labels.indexOf(label.name) >= 0)
          $scope.ngDropdown.selectedLabels.push(label)
      })
    }

    var setTimeoutHiddenMessage;

    $scope.clearMsUpdate = () => $scope.updateMsg = null;
    
    var setMsgUpdate = (type, msg) => {
      $scope.updateMsg = {type, msg};
      if (setTimeoutHiddenMessage) {
        clearTimeout(setTimeoutHiddenMessage)
      }
      setTimeoutHiddenMessage = setTimeout(() => $scope.updateMsg = null, 7000);
    }

    $scope.assignGroup = function () {
      let player = $scope.selectedPlayer;
      let newGroup = $scope.groups.find(item => item._id.toString() === $scope.newPlayer.group);

      piPopup.confirm(
        `--Bạn có muôn thay đổi nhóm phát thành '${newGroup.name}'`,
        () => {
          $scope.updatePlayer(player._id, {group: newGroup._id}, (err, data) => {
            if (err) {
              return setMsgUpdate('error', "Không thể thay đổi!")
            }
            $scope.tableParams.reload();
            setMsgUpdate('success', data.message || 'Lưu thành công')
          });
        },
        () => {
          $scope.newPlayer.group = player.group ? player.group._id : undefined
        }
      )
    }

    $scope.apiUpdateOfPlayer = (params = {}) => {
      let player = $scope.selectedPlayer;

      $scope.updatePlayer(player._id, params, (err, data) => {
        if (err) {
          return setMsgUpdate('error', "Không thể thay đổi!")
        }
        $scope.tableParams.reload();
        $scope.selectedPlayer.location = location
        setMsgUpdate('success', data.message || 'Lưu thành công')
      })
    }

    $scope.updateLocation = function () {
      let location = $scope.newPlayer.location.trim();
      let player = $scope.selectedPlayer;
      if (player.location === location) return;

      $scope.updatePlayer(player._id, {location}, (err, data) => {
        if (err) {
          return setMsgUpdate('error', "Không thể thay đổi!")
        }
        $scope.tableParams.reload();
        $scope.selectedPlayer.location = location
        setMsgUpdate('success', data.message || 'Lưu thành công')
      })
    }

    $scope.updatePrice = function () {
      let price = $scope.newPlayer.packages.price.trim();
      let player = $scope.selectedPlayer;
      if (player.packages.price === price) return;

      if(!price) return setMsgUpdate('error', 'Vui lòng nhập giá tiền')
      else if(isNaN(Number(price))) return setMsgUpdate('error', 'Giá tiền nhập không phải số')

      $scope.updatePlayer(player._id, {packages: $scope.newPlayer.packages}, (err, data) => {
        if (err) {
          return setMsgUpdate('error', "Không thể thay đổi!")
        }
        $scope.tableParams.reload();
        $scope.selectedPlayer.location = location
        setMsgUpdate('success', data.message || 'Lưu thành công')
      })
    }

    $scope.updateDiscount = function () {
      let discount = $scope.newPlayer.discount.trim();
      let player = $scope.selectedPlayer;
      if (player.discount === discount) return;

      if(!discount) return setMsgUpdate('error', 'Vui lòng nhập chiết khấu')
      else if(isNaN(Number(discount))) return setMsgUpdate('error', 'Chiết khấu nhập không phải số')

      $scope.updatePlayer(player._id, {discount}, (err, data) => {
        if (err) {
          return setMsgUpdate('error', "Không thể thay đổi!")
        }
        $scope.tableParams.reload();
        $scope.selectedPlayer.location = location
        setMsgUpdate('success', data.message || 'Lưu thành công')
      })
    }

    $scope.assignCompany = function () {
      let newCompany = $scope.newPlayer.company;
      let player = $scope.selectedPlayer;
      if (player.company && newCompany && player.company._id.toString() === newCompany.toString()) return; // không có gì thay đổi.

      piPopup.confirm(
        "--Bạn có muốn thay đổi khách hàng cho thiết bị",
        () => {
          $scope.updatePlayer(player._id, {company: newCompany}, (err, data) => {
            if (err) {
              return setMsgUpdate('error', "Không thể thay đổi!")
            }
            $scope.tableParams.reload();
            setMsgUpdate('success', data.message || 'Lưu thành công')
          });
        },
        () => {
          $scope.newPlayer.company = player.company ? player.company._id : undefined
        }
      )
    }

    $scope.deregister = function () {
      piPopup.confirm(
        "--Bạn có muốn hủy đăng ký thiết bị không",
        () => {
          dataLoader.deleteData(`${piUrls.players}/${$scope.selectedPlayer._id}`)
            .then(data => {
              $scope.tableParams.reload();
              $scope.settingsModal.close();
              piPopup.status({
                title: "Xóa thiết bị thành công",
                msg: data.message
              })
            })
            .catch(err => {
              $scope.settingsModal.close();
              piPopup.status({
                title: "Xóa thiết bị thất bại",
                msg: err.message
              })
            })
        })
    }

    /*
     * view lịch sử bật tắt theo ngày
     * default ngày hôm nay
     */
    $scope.fnDetail = (row) => {
      $scope.titleModalLog = `Lịch sử bật/tắt của thiết bị: '${row.name || row.localName || row.cpuSerialNumber}'`;
      $scope.playerSelected = row

      $scope.popupLogs.onSearch();

      $scope.logModal = $modal.open({
        templateUrl: '/app/views/Player/components/logs-popup.html',
        size: 'lg',
        scope: $scope
      });
    }

    $scope.popupLogs = {
      closeModal () {
        $scope.historiesFilter = {
          start: new Date(),
          end: new Date()
        }
        $scope.logModal.close()
      },

      onValidate () {
        this.clearMessage()

        let {start: startDate, end: endDate} = $scope.historiesFilter || {};
        let errorMsg = '';

        if (!startDate) errorMsg = 'Vui lòng nhập thời gian bắt đầu';

        if (!endDate) errorMsg = 'Vui lòng nhập thời gian kết thúc';

        if (moment(startDate).isAfter(moment(endDate), 'day')) {
          errorMsg = 'Thời gian bắt đầu phải bé hơn bằng thời gian kết thúc';
        }

        if (moment(endDate).isAfter(moment(startDate).add(3, 'months'), 'day')) {
          errorMsg = 'Khoảng thời gian bắt đầu và kết thúc không quá 3 tháng';
        }

        if(errorMsg !== '') {
          $scope.popupLogs.setMessage('error', errorMsg)
          return;
        }

        return  {
          startDate : moment(startDate).format('YYYY-MM-DD'), 
          endDate : moment(endDate).format('YYYY-MM-DD')
        };
      },
      
      onSearch () {
        let params = this.onValidate();
        
        if(params)  $scope.popupLogs.fetchDataTable(params);
      },

      fetchDataTable (params={}) {
        let url = `${piUrls.powerLogs}/${$scope.playerSelected._id}`;

        dataLoader
          .fetchData(url, params)
          .then(data => {
            let histories = data

            $scope.tableParamsModal = new NgTableParams(
              {
                page: 1,
                count: 10
              },
              {
                counts: [5, 10, 25, 50],
                total: 0,
                getData: (params => {
                  let data = params.sorting() ? $filter('orderBy')(histories, params.orderBy()) : histories;
                  let {date, ...filter} = params.filter() || {};

                  if(date) data = data.filter(item => moment(item.date).isSame(moment(date), 'day'));

                  data = filter ? $filter('filter')(data, filter) : data;
                  params.total(data.length);
                  return data.slice((params.page() - 1) * params.count(), params.page() * params.count());
                })
              }
            );
          })
          .catch(err => {
            console.log('-- PlayerCtrl, fetch logs error:', err)
            $scope.popupLogs.setMessage('error', err)
          })
      },
  
      clearMessage () {
        $scope.popupLogs.logMsg = null;
      },

      setMessage (type, msg)  {
        $scope.popupLogs.logMsg = {type, msg};
        if (setTimeoutHiddenMessage) {
          clearTimeout(setTimeoutHiddenMessage)
        }
        // setTimeoutHiddenMessage = setTimeout($scope.popupLogs.clearMessage , 7000);
      },

      exportFile () {
        let params = this.onValidate();
        
        if(!params) return;
        
        params.export = 'true';
        let url = `${piUrls.powerLogs}/${$scope.playerSelected._id}`
        
        dataLoader
          .fetchData(url, params)
          .then(data => {
            let link = document.createElement("a");
            link.href = data.path;
            link.download = data.fileName;
            link.click();
          })
          .catch(err => {
            console.log('-- PlayerCtrl, export logs to excel error:', err)
          })
      }
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

    $scope.playerFetchTimer = $interval(initTable, 60000);

    $scope.$on("$destroy", function () {
      $interval.cancel($scope.playerFetchTimer)
    });

    $scope.exportFile = {
      index() {
        dataLoader
          .postData(`${piUrls.reports}/players`, {})
          .then(data => {
            data = data.data;
            let link = document.createElement("a");
            link.href = data.path;
            link.download = data.fileName;
            link.click();
          })
          .catch(err => {
            console.log('-- PlayerCtrl, export players to excel error:', err)
          })
      },

      excel: function (calendar = null) {
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
          let start = moment(calendar.start).format('YYYY-MM-DD');
          let end = moment(calendar.end).format('YYYY-MM-DD');
          params.calendar = {start, end};
        }

        return
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
          templateUrl: '/app/templates/export-popup-daterange.html',
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
  })

  // Controller for steaming
  .controller('StreamCtrl', function ($scope, $state, $modal, $window, $sce, $interval, $timeout,
                                      socket, piUrls, piPopup, dataLoader, NgTableParams, piNgTable) {

    $scope.objects = {
      list_data: [],
      total: 0,
      skip: 0,
      limit: 0
    };

    $scope.filters = {
      init: true,
      currentPage: 0,
      pageSize: 25,
      sorts: [],
      filters: []
    };

    var reloadData = (params) => {
      $scope.filters = piNgTable.setConditions(params);

      return dataLoader.getDevices($scope.filters)
        .then(data => {
          let {filters, ...others} = data;
          $scope.objects = {...$scope.objects, ...others};
          params.total($scope.objects.total);
          let result = data.list_data.map(item => {
            let {isConnected, playlistOn, tvStatus} = item;
            item.status = {
              class: isConnected ? (playlistOn ? "text-lightgreen" : "text-lightyellow") : "text-danger",
              title: isConnected ? (playlistOn ? `online & playing, tv-on: ${tvStatus}` : `online & not playing, tv-on: ${tvStatus}`) : "offline"
            }
            item.classReport = isConnected ? "text-primary" : "text-danger"
            return item
          })
          return data.list_data;
        })
        .catch(err => {
          console.log('NgTableParams.getData players error:', err)
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

    $scope.playerFetchTimer = $interval(initTable, 60000);

    $scope.$on("$destroy", () => {
      $interval.cancel($scope.playerFetchTimer)
    });

    $scope.currentTime = Date.now();
    $interval(() => {
      $scope.currentTime = Date.now();
    }, 1000)

    socket.on('streamer_stopped', (data) => {
      console.log('streamer_stopped', data);
      $scope.modalStream.dismiss();
    })

    const HTTP_SUCCESS = 200;
    $scope.streamPlayers = {};
    $scope.liveStream = {
      callApi: (player, params, cb) => {
        params.sid = socket.session.sessionid; // add socketID for Web
        dataLoader.fetchData(`${piUrls.streaming}/${player._id}`, params)
          .then(data => {
            console.log('callAPI liveStream:', data);
            if (cb) cb(null, data);
          })
          .catch(err => {
            console.log('callAPI liveStream error:', err);
            if (cb) cb(err);
          })
      },

      join: (player, mediaType = 'video') => {
        if ($scope.streamPlayers[player.cpuSerialNumber]) {
          return piPopup.status({
            title: 'Thông báo lỗi',
            msg: 'Thiêt bị đang streaming'
          })
        }

        let params = {action: 'join', mediaType};
        $scope.liveStream.callApi(player, params, (err, rs) => {
          if (err) return console.log('Join streaming error:', err);

          $scope.streamPlayers[player.cpuSerialNumber] = true;
          $scope.liveStream.openModal(player, rs.room);
        });
      },

      start: () => {
        // let params = {action: 'start'};
        // $scope.liveStream.callApi(player, params, (err, rs) => {
        //   if (err) return console.log('Start streaming error:', err);
        //   $scope.streamPlayers[player.cpuSerialNumber] = moment().format('YYYY-MM-DD HH:mm:ss');
        // });
        let object = $scope.dataStream;
        $scope.modalStream.dismiss();
        $window.open(object.src, '_blank')
      },

      stop: (player) => {
        let params = {action: 'stop'};
        $scope.liveStream.callApi(player, params, (err, rs) => {
          if (err) return console.log('Stop streaming error:', err);
          $scope.streamPlayers[player.cpuSerialNumber] = undefined; // remove player from streamPlayers
        });
      },

      openModal: (player, room) => {
        let playerName = player.name || player.localName || `Player ${player.cpuSerialNumber.slice(12)}`;
        $scope.dataStream = {src: $sce.trustAsResourceUrl(room), playerName: playerName, player};
        // $scope.dataStream = {src:room, playerName: playerName, player};

        $scope.modalStream = $modal.open({
          templateUrl: '/app/views/Player/components/streaming-popup.html',
          scope: $scope,
          backdrop: 'static',
          keyboard: false,
          windowClass: 'modal-stream'
        });

        $scope.modalStream.result.finally(() => {
          $scope.liveStream.stop(player);
          $scope.dataStream = undefined;
        })
      }
    }

    $scope.slider = {
      options: {
        floor: 0,
        ceil: 100,
        step: 1,
        showSelectionBar: true,
        onEnd: () => {
          $scope.changeVolume()
        }
      }
    }

    $scope.fnSetting = function (player) {
      $scope.selectedPlayer = {
        player: player,
        volume: player.volume,
        enable: false
      };
      $scope.modalSetting = $modal.open({
        templateUrl: '/app/views/Player/components/setting-volume-popup.html',
        scope: $scope
      });

      $scope.modalSetting.result.finally(() => {
        $scope.selectedPlayer = null;
      });

      $timeout(function () {
        $scope.$broadcast('rzSliderForceRender');
      });
    }

    $scope.changeVolume = function () {
      if ($scope.selectedPlayer.volume === undefined || $scope.selectedPlayer.volume == null) {
        $scope.selectedPlayer.error = 'Giá trị âm lượng không hợp lệ';
        $scope.selectedPlayer.enable = false;
        return;
      } else {
        $scope.selectedPlayer.error = undefined;
      }

      if ($scope.selectedPlayer.volume !== $scope.selectedPlayer.player.volume) {
        $scope.selectedPlayer.enable = true;
      } else {
        $scope.selectedPlayer.enable = false;
      }
    }

    $scope.setVolume = function () {
      $scope.updatePlayer($scope.selectedPlayer.player._id, {volume: $scope.selectedPlayer.volume}, (err, data) => {
        if (err) return console.log('set volume failed:', err);

        $scope.tableParams.reload();
        $scope.modalSetting.dismiss();
      })
    }
  });
