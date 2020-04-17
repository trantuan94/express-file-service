'use strict';

angular.module('piAuth.service', []).factory('AuthenticationService', function ($http, $state, piUrls, piConstants, $rootScope, $localStorage) {
  var service = {};
  service.Login = Login;
  service.Logout = Logout;
  
  return service;
  
  function Login(username, password, callback) {
    let msg = "Tên đăng nhập hoặc mật khẩu không đúng";
    $http.post(piUrls.login, {username: username, password: password})
      .success(function (data, status) {
        if (status === 200) {
          data = data.data;
          if (data.user.role === "agency") {
            callback("Permission denied");
          } else {
            let currentUser = {token: data.token, ...data.user};
            $localStorage.currentUser = currentUser;
            // add jwt token to auth header for all request made by the $http service
            $http.defaults.headers.common.Authorization = "Bearer " + data.token;
            // execute call back with true to indicate successful login
            callback(null, currentUser);
          }
        } else {
          // execute callback with false to indicate fails login
          callback(msg);
        }
      })
      .error(function (data, status) {
        callback(msg);
      });
  }
  
  function Logout() {
    // remove user from local storage and clear http auth header
    delete $localStorage.currentUser;
    $http.defaults.headers.common.Authorization = "";
  }
});
