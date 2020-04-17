'use strict'

angular.module('piLocations.controllers', [])
  .controller('AreaCtrl',
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

        return dataLoader.getAreas($scope.filters)
          .then(data => {
            let {filters, ...others} = data;
            $scope.objects = {...$scope.objects, ...others};
            params.total($scope.objects.total);
            return data.list_data;
          })
          .catch(err => {
            console.log('dataLoader.getAreas error:', err)
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
              templateUrl: '/app/views/Area/components/form.html',
              scope: $scope
            })
        },

        edit(obj) {
          $scope.selectedObject = obj;
          $scope.newObject = Object.assign({}, obj);
          $scope.modal = $modal
            .open({
              templateUrl: '/app/views/Area/components/form.html',
              scope: $scope
            })
        },

        delete(obj) {
          piPopup.confirm(
            `--Bạn có muốn xóa khu vực '${obj.name}'`,
            () => {
              let params = {hardDelete: true};
              dataLoader.deleteData(`${piUrls.areas}/${obj._id}`, params, (err, data) => {
                if (!err) {
                  $scope.tableParams.reload();

                  piPopup.status({
                    title: 'Xóa thông tin khu vực',
                    msg: data.message
                  })
                } else {
                  // console.log('Delete Area error: ', err, '-- status:', data);
                  piPopup.status({
                    title: 'Xóa thông tin khu vực',
                    msg: err.message
                  })
                }
              })
            }
          )
        },

        save() {
          let params = $scope.newObject;
          dataLoader.postData(piUrls.areas, params, (err, data) => {
            if (!err) {
              $scope.tableParams.reload();
              $scope.fn.abort();

              piPopup.status({
                title: 'Thêm mới khu vực',
                msg: data.message
              })
            } else {
              // console.log('Save Area error: ', err, '-- status:', data);
              $scope.statusMsg = err.message;
            }
          })
        },

        update() {
          let params = $scope.newObject;
          dataLoader.putData(`${piUrls.areas}/${params._id}`, params, (err, data) => {
            if (!err) {
              $scope.tableParams.reload();
              $scope.fn.abort();

              piPopup.status({
                title: 'Sửa thông tin khu vực',
                msg: data.message
              })
            } else {
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
    })

  .controller('OOHCtrl',
    function ($scope, piUrls, $modal, piConstants, piPopup, dataLoader, piNgTable) {

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

        return dataLoader.getOohs($scope.filters)
          .then(data => {
            let {filters, ...others} = data;
            $scope.objects = {...$scope.objects, ...others};
            params.total($scope.objects.total);
            return data.list_data;
          })
          .catch(err => {
            console.log('dataLoader.getOohs error:', err)
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

      $scope.areas = [];
      dataLoader.getAreas({pageSize: -1}).then(data => {
          $scope.areas = data.map(({_id, name, ...others}) => {
            return {_id, name}
          })
          return;
        })
        .catch(err => {
          console.log('dataLoader.getAreas error:', err)
        });


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
              templateUrl: '/app/views/OOH/components/form.html',
              scope: $scope
            })
        },

        edit(obj) {
          $scope.selectedObject = obj;
          $scope.newObject = Object.assign({}, obj);

          console.log(obj)
          $scope.modal = $modal
            .open({
              templateUrl: '/app/views/OOH/components/form.html',
              scope: $scope
            })
        },

        delete(obj) {
          piPopup.confirm(
            `--Bạn có muốn xóa ooh '${obj.address}'`,
            () => {
              let params = {hardDelete: true};
              dataLoader.deleteData(`${piUrls.oohs}/${obj._id}`, params, (err, data) => {
                if (!err) {
                  $scope.tableParams.reload();

                  piPopup.status({
                    title: 'Xóa thông tin ooh',
                    msg: data.message
                  })
                } else {
                  piPopup.status({
                    title: 'Xóa thông tin ooh',
                    msg: err.message
                  })
                }
              })
            }
          )
        },

        save() {
          let params = $scope.newObject;
          dataLoader.postData(piUrls.oohs, params, (err, data) => {
            if (!err) {
              $scope.tableParams.reload();
              $scope.fn.abort();

              piPopup.status({
                title: 'Thêm mới ooh',
                msg: data.message
              })
            } else {
              $scope.statusMsg = err.message;
            }
          })
        },

        update() {
          let params = $scope.newObject;
          let {discount} = params;
          let objDiscount = {default: discount.default};
          if (discount.value && discount.value !== "0" && discount.startDate && discount.endDate) {
             objDiscount = {
               ...objDiscount,
               value: discount.value,
               startDate: moment(discount.startDate).format(),
               endDate: moment(discount.endDate).format(),
             }
          }
          params.discount = objDiscount;
          dataLoader.putData(`${piUrls.oohs}/${params._id}`, params, (err, data) => {
            if (!err) {
              $scope.tableParams.reload();
              $scope.fn.abort();

              piPopup.status({
                title: 'Sửa thông tin ooh',
                msg: data.message
              })
            } else {
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
