'use strict'

angular.module('piSettings.controllers', [])
  .controller('SettingsCtrl', function ($scope, $rootScope, piUrls, dataLoader) {

    $scope.settings = {};
    // getSettings
    dataLoader.fetchData(piUrls.settings)
      .then(data => {
        $scope.settings = data;
      })
      .catch(err => {
        console.log('dataLoader.getSettings error', err);
      });

    $scope.saveSettings = () => {
      dataLoader.postData(piUrls.settings, $scope.settings)
        .then(data => {
          $rootScope.serverConfig = data.data; // update serverConfig in cast
          $scope.settings = data.data;
        })
        .catch(err => {
          console.log('Update settings error', err)
        });
    }
  })

  .controller('LicensesCtrl', function ($scope, $rootScope, piUrls, $state, $modal, dataLoader) {

    const HTTP_SUCCESS = 200;
    $scope.savedFiles = []; // license files
    $scope.statusMsg = null;

    dataLoader.fetchData(piUrls.licenses)
      .then(data => {
        if (data.success) {
          $scope.savedFiles = data.data;
        } else {
          $scope.statusMsg = data.stat_message;
        }
      })
      .catch(err => {
        console.log('dataLoader.getLicense error', err);
      });

    $scope.upload = {
      onstart(files) {
        console.log('start upload');
      },
      ondone(files, data) {
        $scope.statusMsg = "Hoàn thành tải lên";
        $state.reload();
      },
      onerror(files, type, msg) {
        $scope.statusMsg = 'Lỗi tải lên,' + type + ': ' + msg;
      }
    };

    // delete license
    $scope.deleteEntry = (filename) => {
      $scope.deleteText = ' license file ' + filename;
      $scope.modal = $modal.open({
        animation: true,
        scope: $scope,
        templateUrl: '/app/templates/confirm-popup.html'
      })
      $scope.ok = () => {
        dataLoader.deleteData(`${piUrls.licenses}/${filename}`)
          .then(data => {
            if (data.success) {
              $scope.modal.dismiss(); // close modal if successful
              $scope.savedFiles = data.data;
            } else {
              $scope.statusMsg = data.stat_message;
            }
          })
          .catch(err => {
            console.log('dataLoader.deleteLicenses error', err);
          })
      }
      $scope.cancel = () => {
        $scope.modal.dismiss();
      }
    }
  });
