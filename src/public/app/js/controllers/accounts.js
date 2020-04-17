'use strict'

angular.module('piAccounts.controllers', [])
  .controller('AccountsCtrl',
    function ($rootScope, $scope, $http, piUrls, $state, $modal, $window, piPopup, dataLoader, piNgTable) {

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

        return dataLoader.getAccounts($scope.filters)
          .then(data => {
            let {filters, ...others} = data;
            $scope.objects = {...$scope.objects, ...others};
            params.total($scope.objects.total);
            return data.list_data;
          })
          .catch(err => {
            console.log('dataLoader.getAccounts error:', err)
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

      $scope.newUser = {};
      $scope.statusMsg = null;
      $scope.selectedUser = null;

      $scope.$on('modal.shown', function () {
        console.log('Modal is shown!');
      });

      $scope.fn = {
        add() {
          $scope.selectedUser = null;
          $scope.newUser = {};
          $scope.modal = $modal
            .open({
              templateUrl: '/app/views/Account/components/admin-form.html',
              scope: $scope
            })
        },

        edit(user) {
          // console.log('Edit: ', user);
          $scope.selectedUser = user;
          $scope.newUser = Object.assign({}, user);
          $scope.modal = $modal
            .open({
              templateUrl: '/app/views/Account/components/admin-form.html',
              scope: $scope
            })
        },

        delete(user) {
          piPopup.confirm(
            `--Bạn có muốn xóa tài khoản '${user.email}'`,
            () => {
              // console.log('Delete: ', user);
              dataLoader.deleteData(`${piUrls.accounts}/${user._id}`, {}, (err, data) => {
                if (!err) {
                  $scope.tableParams.reload();

                  piPopup.status({
                    title: 'Xóa tài khoản người dùng',
                    msg: data.message
                  })
                } else {
                  // console.log('Delete user error: ', err, '-- status:', data);
                  piPopup.status({
                    title: 'Xóa tài khoản người dùng',
                    msg: err.message
                  })
                }
              });
            }
          )
        },

        save() {
          // console.log('Save: ', $scope.newUser)
          let params = $scope.newUser;
          dataLoader.postData(piUrls.accounts, params, (err, data) => {
            if (!err) {
              $scope.tableParams.reload();
              $scope.fn.abort();

              piPopup.status({
                title: 'Thêm mới tài khoản người dùng',
                msg: data.message
              })
            } else {
              // console.log('Save user error: ', err, '-- status:', data);
              $scope.statusMsg = err.message;
            }
          })
        },

        update() {
          // console.log('Update: ', $scope.newUser)
          let params = $scope.newUser;
          dataLoader.putData(`${piUrls.accounts}/${params._id}`, params, (err, data) => {
            if (!err) {
              $scope.tableParams.reload();
              $scope.fn.abort();

              piPopup.status({
                title: 'Sửa thông tin tài khoản người dùng',
                msg: data.message
              })
            } else {
              // console.log('Update user error: ', err, '-- status:', data);
              $scope.statusMsg = err.message;
            }
          })
        },

        abort() {
          $scope.newUser = {};
          $scope.statusMsg = null;
          $scope.selectedUser = null;
          $scope.modal.close();
        },

        changeEmail() {
          $scope.statusMsg = null;
        }
      };
    })
  // Controller manage accounts not admin
  .controller('UserCtrl',
    function ($rootScope, $scope, $http, piUrls, $state, $modal, $window, piPopup, dataLoader, piNgTable) {

      $scope.companies = [];
      dataLoader.getCompanies({pageSize: 50}).then(data => {
          $scope.companies = data.list_data.map(({_id, name, ...others}) => {
            return {_id, name}
          })
          return;
        })
        .catch(err => {
          console.log('dataLoader.getCompanies error:', err)
        });

      $scope.roles = [];
      $scope.roleOptions = {};
      dataLoader.getRoles().then(data => {
          $scope.roles = data;
          data.map(({value, label}) => {
            $scope.roleOptions[value] = label
          })
          return;
        })
        .catch(err => {
          console.log('dataLoader.getRoles error:', err)
        });

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

        return dataLoader.getUsers($scope.filters)
          .then(data => {
            let {filters, ...others} = data;
            $scope.objects = {...$scope.objects, ...others};
            params.total($scope.objects.total);
            return data.list_data;
          })
          .catch(err => {
            console.log('dataLoader.getUsers error:', err)
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

      $scope.newUser = {};
      $scope.statusMsg = null;
      $scope.selectedUser = null;

      $scope.$on('modal.shown', function () {
        console.log('Modal is shown!');
      });

      $scope.fn = {
        add() {
          $scope.selectedUser = null;
          $scope.newUser = {};
          $scope.modal = $modal
            .open({
              templateUrl: '/app/views/Account/components/user-form.html',
              scope: $scope
            })
        },

        edit(user) {
          // console.log('Edit: ', user);
          $scope.selectedUser = user;
          $scope.newUser = Object.assign({}, user);
          $scope.modal = $modal
            .open({
              templateUrl: '/app/views/Account/components/user-form.html',
              scope: $scope
            })
        },

        delete(user) {
          piPopup.confirm(
            `--Bạn có muốn xóa tài khoản '${user.email}'`,
            () => {
              // console.log('Delete: ', user);
              dataLoader.deleteData(`${piUrls.users}/${user._id}`, {}, (err, data) => {
                if (!err) {
                  $scope.tableParams.reload();

                  piPopup.status({
                    title: 'Xóa tài khoản người dùng',
                    msg: data.message
                  })
                } else {
                  // console.log('Delete user error: ', err, '-- status:', data);
                  piPopup.status({
                    title: 'Xóa tài khoản người dùng',
                    msg: err.message
                  })
                }
              });
            }
          )
        },

        save() {
          // console.log('Save: ', $scope.newUser)
          let params = $scope.newUser;
          dataLoader.postData(piUrls.users, params, (err, data) => {
            if (!err) {
              $scope.tableParams.reload();
              $scope.fn.abort();

              piPopup.status({
                title: 'Thêm mới tài khoản người dùng',
                msg: data.message
              })
            } else {
              // console.log('Save user error: ', err, '-- status:', data);
              $scope.statusMsg = err.message;
            }
          })
        },

        update() {
          // console.log('Update: ', $scope.newUser)
          let params = $scope.newUser;
          dataLoader.putData(`${piUrls.users}/${params._id}`, params, (err, data) => {
            if (!err) {
              $scope.tableParams.reload();
              $scope.fn.abort();

              piPopup.status({
                title: 'Sửa thông tin tài khoản người dùng',
                msg: data.message
              })
            } else {
              // console.log('Update user error: ', err, '-- status:', data);
              $scope.statusMsg = err.message;
            }
          })
        },

        abort() {
          $scope.newUser = {};
          $scope.statusMsg = null;
          $scope.selectedUser = null;
          $scope.modal.close();
        },

        changeEmail() {
          $scope.statusMsg = null;
        }
      };
    })
