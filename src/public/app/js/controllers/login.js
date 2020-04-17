'use strict'

angular.module('piAuth.controllers', [])

  .controller('LoginController', function ($rootScope, $location, AuthenticationService) {
    var vm = this;
    vm.login = login;

    initController();

    function initController() {
      // reset login status
      AuthenticationService.Logout();
      $rootScope.authUser = {};
    }

    function login() {
      vm.loading = true;
      AuthenticationService.Login(vm.email, vm.password, function (err, user) {
        if (!err) {
          $rootScope.authUser = user;
          let redirectPath = '/users';
          if (user.role === 'root') redirectPath = "/accounts";
          if (user.role === 'maker' || user.role === 'checker') redirectPath = "/groups/";
          if (user.role === 'streamer') redirectPath = "/streaming";
          $location.path(redirectPath);
        } else {
          vm.error = err;
          vm.loading = false;
        }
      });
    }
  });
