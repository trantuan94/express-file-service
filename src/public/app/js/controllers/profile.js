'use strict'

angular.module('piProfile.controllers', [])
  .controller('ProfileCtrl', function ($scope, piUrls, piPopup, $localStorage, $location, $window, dataLoader) {

    $scope.object = {};
    $scope.statusMsg = null;

    $scope.fn = {
      changePw() {
        dataLoader.postData(piUrls.changePassword, $scope.object)
          .then(data => {
            $scope.fn.abort();

            piPopup.status(
              {
                title: 'Cập nhật mật khẩu người dùng',
                msg: data.message
              },
              () => {
                delete $localStorage.currentUser;
                $location.path("login");
              }
            )
          })
          .catch(err => {
            // $scope.statusMsg = err.message;
            piPopup.status(
              {
                title: 'Cập nhật mật khẩu người dùng',
                msg: err.message
              }
            )
          })
      },

      back() {
        $window.history.back()
      },

      abort() {
        $scope.object = {};
        $scope.statusMsg = null;
      },

      changeNewPw() {
        $scope.statusMsg = null;
      }
    };
  });
