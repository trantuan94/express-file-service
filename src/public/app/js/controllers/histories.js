'use strict'

angular.module('piHistories.controllers', [])
  .controller('HistoryCtrl',
    function ($scope, piUrls, $modal, piPopup, dataLoader, piNgTable, $filter, NgTableParams) {

      $scope.titleExport = "Xuất file theo lịch sử phát sóng";
      $scope.isHistory = true;
      $scope.contentNames = [];
      $scope.objects = {
        list_data: [],
        total: 0,
        skip: 0,
        limit: 0
      };

      $scope.filters = {
        init: true,
        currentPage: 0,
        pageSize: 10,
        "sorting[]": [],
        "filters[]": []
      };

      var reloadData = (params) => {
        $scope.filters = piNgTable.setConditions(params);

        return dataLoader.getHistories($scope.filters)
          .then(data => {
            let {filters, ...others} = data;
            $scope.objects = {...$scope.objects, ...others};
            params.total($scope.objects.total);
            $scope.contentNames = data.list_data;
            return data.list_data;
          })
          .catch(err => {
            console.log('-- HistoryCtrl, getHistories error:', err)
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

      $scope.players = {
        lists: [],
        objects: {}
      };

      dataLoader
        .getDevices({pageSize: -1})
        .then(data => {
          $scope.players.lists = data;
          data.map(item => {
            let {_id, name, localName, cpuSerialNumber, myIpAddress, company} = item;
            $scope.players.objects[cpuSerialNumber] = {_id, name, localName, cpuSerialNumber, myIpAddress, company}
          })
        })
        .catch(err => {
          console.log('-- HistoryCtrl, getPlayers error:', err)
        })

      $scope.fn = {
        detail(row) {
          let players = row.players;
          players = players.map(({cpuSerialNumber, times}) => {
            let row = {
              cpuSerialNumber, times,
              ...$scope.players.objects[cpuSerialNumber] || {}
            }

            row.name = row.name || row.localName || '';
            row.companyName = row.company ? row.company.name : '';
            
            return row;
          });

          $scope.titleModal = `Chi tiết lịch sử phát '${row.filename}'`;

          $scope.tableParamsModal = new NgTableParams(
            {
              page: 1,
              count: 5
            },
            {
              counts: [5, 10, 25, 50],
              total: 0,
              getData: (params => {
                let data = params.sorting() ? $filter('orderBy')(players, params.orderBy()) : players;
                data = params.filter() ? $filter('filter')(data, params.filter()) : data;
                params.total(data.length);
                return data.slice((params.page() - 1) * params.count(), params.page() * params.count());
              })
            }
          );

          $scope.detailModal = $modal.open({
            templateUrl: '/app/views/History/components/detail-popup.html',
            size: 'lg',
            scope: $scope
          });
        }
      }

      $scope.exportFile = {
        excel() {
          let params = {};
          if (!$scope.exportParams.start) {
            $scope.exportParams.errorMsg = 'Vui lòng nhập thời gian bắt đầu';
            return;
          }
          if (!$scope.exportParams.end) {
            $scope.exportParams.errorMsg = 'Vui lòng nhập thời gian kết thúc';
            return;
          }
          if (moment($scope.exportParams.start) >= moment($scope.exportParams.end)) {
            $scope.exportParams.errorMsg = 'Thời gian bắt đầu phải bé hơn thời gian kết thúc';
            return;
          }
          let startDate = moment($scope.exportParams.start).format('YYYY-MM-DD');
          let endDate = moment($scope.exportParams.end).format('YYYY-MM-DD');

          params = {startDate, endDate};
          if($scope.exportParams.filename) params.filenames = [$scope.exportParams.filename.filename]
          
          console.log('params', params)

          dataLoader
            .postData(`${piUrls.reports}/histories`, params)
            .then(data => {
              data = data.data;
              let link = document.createElement("a");
              link.href = data.path;
              link.download = data.fileName;
              link.click();
              $scope.exportFile.closeModal();
            })
            .catch(err => {
              console.log('-- HistoryCtrl, export histories to excel error:', err)
              $scope.exportFile.closeModal();
            })
        },
        setConditions() {
          dataLoader.getHistories({pageSize: -1})
            .then(data => $scope.contentNames = data)
            .catch(err => console.log('-- HistoryCtrl, setConditions getHistories error:', err))

          $scope.exportFile.reloadValue();
          $scope.modalExport = $modal.open({
            templateUrl: '/app/views/layouts/exports/date-range-popup.html',
            scope: $scope
          });
        },
        changeValue() {
          $scope.exportParams.errorMsg = null;
        },
        reloadValue() {
          $scope.exportParams = {
            start: null,
            end: null,
            isValid: false,
            errorMsg: null,
            filename: null
          };
        },
        closeModal() {
          $scope.exportFile.reloadValue();
          $scope.modalExport.close();
        },
      }
    });
