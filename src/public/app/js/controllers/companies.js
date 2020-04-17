'use strict'

angular.module('piCompanies.controllers', [])
  .controller('CompanyCtrl',
    function ($scope, piUrls, $modal, piPopup, dataLoader, piNgTable) {

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

        return dataLoader.getCompanies($scope.filters)
          .then(data => {
            let {filters, ...others} = data;
            $scope.objects = {...$scope.objects, ...others};
            params.total($scope.objects.total);
            return data.list_data;
          })
          .catch(err => {
            console.log('dataLoader.getCompanies error:', err)
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

      $scope.$on('modal.shown', function () {
        console.log('Modal is shown!');
      });

      $scope.newObject = {};
      $scope.statusMsg = null;
      $scope.selectedObject = null;

      $scope.fn = {
        add() {
          $scope.selectedObject = null;
          $scope.newObject = {};
          $scope.modal = $modal
            .open({
              templateUrl: '/app/views/Company/components/form.html',
              scope: $scope
            })
        },

        edit(obj) {
          // console.log('Edit: ', obj);
          $scope.selectedObject = obj;
          $scope.newObject = Object.assign({}, obj);
          $scope.modal = $modal
            .open({
              templateUrl: '/app/views/Company/components/form.html',
              scope: $scope
            })
        },

        delete(obj) {
          piPopup.confirm(
            `--Bạn có muốn xóa khách hàng '${obj.name}'`,
            () => {
              // console.log('Delete: ', obj);
              let params = {hardDelete: true};
              dataLoader.deleteData(`${piUrls.companies}/${obj._id}`, params, (err, data) => {
                if (!err) {
                  $scope.tableParams.reload();

                  piPopup.status({
                    title: 'Xóa thông tin khách hàng',
                    msg: data.message
                  })
                } else {
                  // console.log('Delete company error: ', err, '-- status:', data);
                  piPopup.status({
                    title: 'Xóa thông tin khách hàng',
                    msg: err.message
                  })
                }
              })
            }
          )
        },

        save() {
          let params = $scope.newObject;
          dataLoader.postData(piUrls.companies, params, (err, data) => {
            if (!err) {
              $scope.tableParams.reload();
              $scope.fn.abort();

              piPopup.status({
                title: 'Thêm mới khách hàng',
                msg: data.message
              })
            } else {
              // console.log('Save company error: ', err, '-- status:', data);
              $scope.statusMsg = err.message;
            }
          })
        },

        update() {
          // console.log('Update: ', $scope.newObject)
          let params = $scope.newObject;
          dataLoader.putData(`${piUrls.companies}/${params._id}`, params, (err, data) => {
            if (!err) {
              $scope.tableParams.reload();
              $scope.fn.abort();

              piPopup.status({
                title: 'Sửa thông tin khách hàng',
                msg: data.message
              })
            } else {
              // console.log('Update company error: ', err, '-- status:', data);
              $scope.statusMsg = err.message;
            }
          })
        },

        abort() {
          $scope.newObject = {};
          $scope.statusMsg = null;
          $scope.selectedObject = null;
          $scope.modal.close();
        },

        changeUnique() {
          $scope.statusMsg = null;
        }
      };
    });
