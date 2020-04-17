'use strict'

angular.module('piFirmware.controllers', [])
  .controller('FirmwareCtrl',
    function ($rootScope, $scope, piUrls, $state, $modal, $window, piPopup, dataLoader, $filter, NgTableParams) {

      $scope.files = [];
      $scope.objects = [];
      $scope.statusMsg = null;
      $scope.selectedObject = null;

      var reloadData = () => {
        dataLoader.getFirmwares({pageSize: -1})
          .then(data => {
            $scope.files = data.files;
            $scope.objects = data.details || [];
            $scope.tableParams = new NgTableParams(
              {
                page: 1,
                count: 5
              },
              {
                counts: [5, 10, 25, 50],
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
            console.log('dataLoader.getFirmwares error: ', err);
          })
      }

      reloadData();

      $scope.$on('modal.shown', () => {
        console.log('Modal is shown!');
      });

      $scope.fn = {
        delete(obj) {
          piPopup.confirm(
            `--Bạn có muốn xóa tệp '${obj.file}'`,
            () => {
              dataLoader.deleteData(`${piUrls.firmware}/${obj.file}`)
                .then(data => {
                  let removeItem = $scope.objects.indexOf(item => item.file === obj.file);
                  $scope.objects.splice(removeItem, 1);
                  $scope.tableParams.reload();
                  
                  piPopup.status({
                    title: `Xóa tệp '${obj.file}'`,
                    msg: data.message
                  })
                })
                .catch(err => {
                  console.log('Delete file firmware error: ', err);
                  piPopup.status({
                    title: 'Xóa tệp không thành công',
                    msg: err.message
                  })
                })
            }
          )
        }
      };

      const HTTP_SUCCESS = 200;
      var initDataUpload = () => {
        $scope.msg = {
          title: 'Tải lên',
          msg: 'Xin vui lòng chờ',
          buttonText: 'Đang tải lên',
          disable: true
        }
      }

      $scope.upload = {
        url: piUrls.firmware.replace(piUrls.base, ''),
        onstart(files) {
          initDataUpload();
          $scope.modal = $modal.open({
            templateUrl: '/app/templates/upload-popup.html',
            scope: $scope,
            backdrop: 'static',
            keyboard: false
          });
        },

        onprogress(percentDone) {
          $scope.msg.title = "Trạng thái tải lên";
          $scope.msg.msg = percentDone + "% done";
        },

        ondone(files, data, status) {  // called when upload is done
          if (status === HTTP_SUCCESS) {
            $scope.msg = {
              title: "Trạng thái tải lên",
              msg: "Hoàn tất tải lên",
              buttonText: "Đóng",
              disable: false,
              success: true
            };
          } else {
            $scope.msg = {
              title: 'Lỗi tải lên',
              msg: data.message,
              buttonText: "Đóng",
              disable: false,
              success: false
            };
          }
        },

        onerror(files, type, msg) {
          if (!$scope.modal) $scope.upload.onstart();

          $scope.msg = {
            title: 'Lỗi tải lên',
            msg: `${type}: ${msg}`,
            buttonText: "OK",
            disable: false
          };
        },

        abort() {
          fileUploader.cancel();
        },

        modalOk() {
          $scope.modal.close();
          if ($scope.msg.success) {
            $scope.tableParams.reload();
            $state.reload();
          }
        }
      }

    });
