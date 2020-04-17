'use strict';

angular.module('piIndex.controllers', [])

  .controller('IndexCtrl', function ($rootScope, $scope, $state, castApi, $location) {

    let currentUser = $rootScope.authUser;
    let redirectPath = 'login';
    if (currentUser) {
      if ($location.$$path === '/start') {
        redirectPath = '/users';
        if (currentUser.role === 'root') redirectPath = "/accounts";
        if (currentUser.role === 'maker' || currentUser.role === 'checker') redirectPath = "/groups/";
        if (currentUser.role === 'streamer') redirectPath = "/streaming";
        $location.path(redirectPath);
      }
    } else {
      $location.path(redirectPath);
    }

    $scope.getClass = function (state) {
      if ($state.current.name.indexOf(state) == 0) {
        return "active"
      } else {
        return ""
      }
    }

    $scope.castStatus = castApi.castStatus;
    $rootScope.serverConfig = castApi.serverConfig.settings;

    $scope.launchCastApp = function () {
      if ($scope.castStatus.deviceState == "0")
        castApi.launchApp()
      else
        castApi.stopApp()
    }

  });
