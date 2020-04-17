'use strict';

angular.module('piLabels.controllers', [])
  .controller('LabelsCtrl', function ($scope, $state, $http, $location, piUrls, piConstants, piPopup, assetLoader) {

    $scope.label = assetLoader.label;

    if ($state.current.data && $state.current.data.labelMode) $scope.labelMode = $state.current.data.labelMode;

    $scope.modeFilter = function (label) {
      if ($scope.labelMode === piConstants.labelMode.player) return (label.mode && label.mode === piConstants.labelMode.player);

      return (!label.mode || label.mode !== piConstants.labelMode.player);
    }

    $scope.newLabel = {};
    $scope.fn = {
      editMode: false,

      edit: function () {
        $scope.fn.editMode = !$scope.fn.editMode;
        assetLoader.selectLabel();
      },

      add: function () {
        if (!$scope.newLabel.name) return;

        $scope.newLabel.mode = piConstants.labelMode.asset;
        if ($scope.labelMode === piConstants.labelMode.player) {
          $scope.newLabel.mode = $scope.labelMode;
        }

        for (let i = 0; i < $scope.label.labels.length; i++) {
          if ($scope.label.labels[i].name === $scope.newLabel.name && $scope.label.labels[i].mode === $scope.newLabel.mode) {
            return piPopup.status({title: 'Có lỗi xảy ra', msg: `Nhãn '${$scope.newLabel.name}' đã tồn tại`})
          }
        }

        $http
          .post(piUrls.labels, $scope.newLabel)
          .success(function (data, status) {
            $scope.newLabel = {}
            if (status === piConstants.HTTP_SUCCESS) {
              $scope.label.labels.unshift(data.data);
            } else {
              return piPopup.status({
                title: 'Thêm mới nhãn không thành công',
                msg: data.message,
              })
            }
          })
          .error(function (data, status) {
            return piPopup.status({
              title: 'Thêm mới nhãn không thành công',
              msg: data.message,
            })
          });
      },

      delete: function (label) {
        if ($scope.fn.editMode) {
          piPopup.confirm("Label " + label.name, function () {

            $http
              .delete(piUrls.labels + label._id)
              .success(function (data, status) {
                if (status === piConstants.HTTP_SUCCESS) {
                  $scope.label.labels.splice($scope.label.labels.indexOf(label), 1);
                } else {
                  return piPopup.status({
                    title: 'Xóa nhãn không thành công',
                    msg: data.message,
                  })
                }
              })
              .error(function (data, status) {
                return piPopup.status({
                  title: 'Xóa nhãn không thành công',
                  msg: data.message,
                })
              });
          })
        } else {
          $scope.fn.selected(label.name)
          if ($scope.labelModal) $scope.labelModal.close();
        }
      },

      getClass: function (label) {
        if ($scope.label.selectedLabel === label || $scope.label.selectedPlayerLabel === label) {
          return "bg-info"
        } else {
          return ""
        }
      },

      selected: function (label) {
        if (!$scope.fn.editMode) {
          if ($scope.labelMode === piConstants.labelMode.player) {
            assetLoader.selectPlayerLabel(($scope.label.selectedPlayerLabel === label) ? null : label);
          } else {
            assetLoader.selectLabel(($scope.label.selectedLabel === label) ? null : label);
          }
        }
        if ($scope.labelModal) $scope.labelModal.close();
      }
    };

  })

  .controller('LabelIndexCtrl', function ($scope, $modal, piConstants, piUrls, piPopup, dataLoader, piNgTable) {

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

      return dataLoader.getLabels($scope.filters)
        .then(data => {
          let {filters, ...others} = data;
          $scope.objects = {...$scope.objects, ...others};
          params.total($scope.objects.total);
          return data.list_data;
        })
        .catch(err => {
          console.log('dataLoader.getLabels error:', err)
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
    $scope.options = {};
    $scope.modes = piConstants.labelOptions;
    $scope.modes.map(item => {
      if (item.value) $scope.options[item.value] = item.label
    });

    $scope.fn = {
      add() {
        $scope.selectedObject = null;
        $scope.newObject = {};
        $scope.modal = $modal
          .open({
            templateUrl: '/app/views/Label/components/form.html',
            scope: $scope
          })
      },

      edit(obj) {
        // console.log('Edit: ', obj);
        $scope.selectedObject = obj;
        $scope.newObject = Object.assign({}, obj);
        $scope.modal = $modal
          .open({
            templateUrl: '/app/views/Label/components/form.html',
            scope: $scope
          })
      },

      delete(obj) {
        piPopup.confirm(
          `--Bạn có muốn xóa tags '${obj.name}'`,
          () => {
            // console.log('Delete: ', obj);
            let params = {hardDelete: true};
            dataLoader.deleteData(`${piUrls.labels}/${obj._id}`, params, (err, data) => {
              if (!err) {
                $scope.tableParams.reload();

                piPopup.status({
                  title: 'Xóa tag',
                  msg: data.message
                })
              } else {
                piPopup.status({
                  title: 'Xóa tag',
                  msg: err.message
                })
              }
            })
          }
        )
      },

      save() {
        let params = $scope.newObject;
        dataLoader.postData(piUrls.labels, params, (err, data) => {
          if (!err) {
            $scope.tableParams.reload();
            $scope.fn.abort();

            piPopup.status({
              title: 'Thêm tag',
              msg: data.message
            })
          } else {
            $scope.statusMsg = err.message;
          }
        })
      },

      update() {
        // console.log('Update: ', $scope.newObject)
        let params = $scope.newObject;
        dataLoader.postData(`${piUrls.labels}/${params._id}`, params, (err, data) => {
          if (!err) {
            $scope.tableParams.reload();
            $scope.fn.abort();

            piPopup.status({
              title: 'Sửa tag',
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
