'use strict';

angular.module('piServerApp', [
    'ui.router',
    'ui.bootstrap',
    'ui.sortable',
    'angularCSS',
    'yaru22.angular-timeago',
    'angularjs-dropdown-multiselect',
    'piConfig',
    'piIndex.controllers',
    'piGroups.controllers',
    'piAssets.controllers',
    'piAssets.services',
    'piPlayers.services',
    'piAuth.service',
    'piSettings.controllers',
    'piPlaylists.controllers',
    'piAuth.controllers',
    'piProfile.controllers',
    'piAccounts.controllers',
    'piCompanies.controllers',
    'piFirmware.controllers',
    'piLocations.controllers',
    'piPlayers.controllers',
    'piLabels.controllers',
    'piHistories.controllers',
    'pisignage.directives',
    'pisignage.filters',
    'pisignage.services',
    'ngStorage',
    'ngTable',
    'rzSlider'
  ])

  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, piConstants) {

    let urlOtherWise = '/start';
    $urlRouterProvider.otherwise(urlOtherWise);

    $stateProvider

      .state("home", {
        abstract: true,
        url: "/",
        templateUrl: 'app/views/Main/menu.html',
        controller: 'IndexCtrl'
      })

      .state("start", {
        url: "/start",
        templateUrl: 'app/views/Main/start.html',
        controller: 'IndexCtrl',
        css: 'app/css/login.css',
      })

      .state("home.assets", {
        abstract: true,
        url: "assets/",
        views: {
          "main": {
            templateUrl: 'app/partials/assets-main.html',
            controller: 'AssetsCtrl'
          }
        }
      })

      .state("home.assets.main", {
        url: "main/:playlist",
        views: {
          "left": {
            templateUrl: '/app/partials/playlists.html',
            controller: 'PlaylistCtrl'
          },
          "details": {
            templateUrl: '/app/partials/playlist-details.html',
            controller: 'PlaylistViewCtrl'
          },
          "list": {
            templateUrl: '/app/partials/assets.html',
            controller: 'AssetsEditCtrl'
          }
        }
      })

      .state("home.assets.assetDetails", {
        url: "detail/:file",
        views: {
          "left": {
            templateUrl: '/app/partials/labels.html',
            controller: 'LabelsCtrl'
          },
          "list": {
            templateUrl: '/app/partials/asset-details.html',
            controller: 'AssetViewCtrl'
          }
        }
      })

      .state("home.playlists", {
        abstract: true,
        url: "playlists/",
        views: {
          "main": {
            templateUrl: 'app/partials/playlists-main.html',
            controller: 'AssetsCtrl'
          }
        }
      })

      .state("home.playlists.playlistAddAssets", {
        url: "add/:playlist",
        views: {
          "left": {
            templateUrl: '/app/partials/assets.html',
            controller: 'AssetsEditCtrl'
          },
          "right": {
            templateUrl: '/app/partials/playlist-add.html',
            controller: 'PlaylistAddCtrl'
          }
        },
        data: {
          showAllAssets: true
        }
      })

      .state("home.settings", {
        url: "settings",
        views: {
          "main": {
            templateUrl: '/app/views/Setting/index.html',
            controller: 'SettingsCtrl'
          }
        }
      })

      .state("home.changePw", {
        url: "changePw",
        views: {
          "main": {
            templateUrl: '/app/views/Profile/change_password.html',
            controller: 'ProfileCtrl'
          }
        }
      })

      .state("home.accounts", {
        url: "accounts",
        views: {
          "main": {
            templateUrl: 'app/views/Account/admin.html',
            controller: 'AccountsCtrl'
          }
        }
      })

      .state("home.users", {
        url: "users",
        views: {
          "main": {
            templateUrl: 'app/views/Account/user.html',
            controller: 'UserCtrl'
          }
        }
      })

      .state("home.companies", {
        url: "companies",
        views: {
          "main": {
            templateUrl: 'app/views/Company/index.html',
            controller: 'CompanyCtrl'
          }
        }
      })

      .state("home.firmware", {
        url: "firmware",
        views: {
          "main": {
            templateUrl: 'app/views/Firmware/index.html',
            controller: 'FirmwareCtrl'
          }
        }
      })

      .state("home.areas", {
        url: "areas",
        views: {
          "main": {
            templateUrl: 'app/views/Area/index.html',
            controller: 'AreaCtrl'
          }
        }
      })

      .state("home.oohs", {
        url: "oohs",
        views: {
          "main": {
            templateUrl: 'app/views/OOH/index.html',
            controller: 'OOHCtrl'
          }
        }
      })

      .state("home.labels", {
        url: "labels",
        views: {
          "main": {
            templateUrl: 'app/views/Label/index.html',
            controller: 'LabelIndexCtrl'
          }
        }
      })

      .state("home.players", {
        url: "players",
        views: {
          "main": {
            templateUrl: 'app/views/Player/index.html',
            controller: 'PlayerCtrl'
            // templateUrl: '/app/partials/players.html',
            // controller: 'ServerPlayerCtrl'
          }
        }
      })

      .state("home.devices", {
        url: "tracking-devices",
        views: {
          "main": {
            templateUrl: 'app/views/Player/tracking.html',
            controller: 'PlayerCtrl'
          }
        }
      })

      // .state("home.streaming", {
      //   url: "streaming",
      //   views: {
      //     "main": {
      //       templateUrl: 'app/views/Player/streaming.html',
      //       controller: 'StreamCtrl'
      //     }
      //   }
      // })

      .state("home.histories", {
        url: "histories",
        views: {
          "main": {
            templateUrl: 'app/views/History/index.html',
            controller: 'HistoryCtrl'
          }
        }
      })

      // .state("home.groups", {
      //   abstract: true,
      //   url: "groups",
      //   views: {
      //     "main": {
      //       templateUrl: 'app/partials/group-main.html',
      //       controller: 'ServerPlayerCtrl'
      //     }
      //   }
      // })
      //
      // .state("home.groups.players", {
      //   url: "/:group",
      //   views: {
      //     "left": {
      //       templateUrl: '/app/partials/groups.html',
      //       controller: 'GroupsCtrl'
      //     },
      //     "left2": {
      //       templateUrl: '/app/partials/group-deploys.html',
      //       controller: 'GroupsCtrl'
      //     },
      //     "details": {
      //       templateUrl: '/app/partials/group-details.html',
      //       controller: 'GroupDetailCtrl'
      //     },
      //     "list": {
      //       templateUrl: '/app/partials/players.html'
      //     }
      //   }
      // })

      .state("home.groups", {
        url: "groups",
        views: {
          "main": {
            templateUrl: 'app/views/Group/index.html',
            controller: 'GroupIndexCtrl'
          }
        }
      })

      .state("home.group", {
        abstract: true,
        url: "groups",
        views: {
          "main": {
            templateUrl: 'app/views/layouts/details/group.html',
            controller: 'ServerPlayerCtrl'
          }
        }
      })

      .state("home.group.details", {
        url: "/:group",
        views: {
          "details": {
            templateUrl: '/app/views/Group/details/index.html',
            controller: 'GroupDetailCtrl'
          },
          "list": {
            templateUrl: '/app/views/Group/components/players.html'
          }
        }
      })

      .state("home.confirms", {
        url: "confirms",
        views: {
          "main": {
            templateUrl: 'app/views/Group/approve.html',
            controller: 'GroupConfirmCtrl'
          }
        }
      })

      .state("home.confirm", {
        abstract: true,
        url: "confirms",
        views: {
          "main": {
            templateUrl: 'app/views/layouts/details/group.html',
            controller: 'ServerPlayerCtrl'
          }
        }
      })

      .state("home.confirm.details", {
        url: "/:group",
        views: {
          "details": {
            templateUrl: '/app/views/Group/details/approve.html',
            controller: 'GroupDetailCtrl'
          },
          "list": {
            templateUrl: '/app/views/Group/components/players.html'
          }
        }
      })

      .state("home.playlistNew", {
        url: "playlistNew",
        views: {
          "main": {
            templateUrl: 'app/views/Playlist/index.html',
            controller: 'PlaylistIndexCtrl'
          }
        }
      })

      .state("home.assetsNew", {
        url: "assetsNew",
        views: {
          "main": {
            templateUrl: 'app/views/Asset/index.html',
            controller: 'AssetIndexCtrl'
          }
        }
      })

      // .state("login", {
      //   url: "/login",
      //   templateUrl: 'app/views/Login/login.html',
      //   controller: 'LoginController',
      //   controllerAs: "vm",
      //   css: 'app/css/login.css',
      // })

      .state("login", {
        url: "/login",
        templateUrl: 'app/views/Login/login_v1.html',
        controller: 'LoginController',
        controllerAs: "vm",
        css: ['app/fonts/Linearicons-Free-v1.0.0/icon-font.min.css', 'app/css/login_v1/util.css', 'app/css/login_v1/main.css'],
      })

    $httpProvider.interceptors.push(function ($q, $rootScope, $location) {

      var onlineStatus = false;

      return {
        'response': function (response) {
          if (response.status === piConstants.HTTP_UNAUTHORIZED) return $location.path("login");

          if (!onlineStatus) {
            onlineStatus = true;
            $rootScope.$broadcast('onlineStatusChange', onlineStatus);
          }
          return response || $q.when(response);
        },

        'responseError': function (response) {
          if (response.status === piConstants.HTTP_UNAUTHORIZED) return $location.path("login");

          if (onlineStatus) {
            onlineStatus = false;
            $rootScope.$broadcast('onlineStatusChange', onlineStatus);
          }
          return $q.reject(response);
        }
      };
    });

  })

  .run(function ($window, $modal, piUrls, $http, $rootScope, castApi, $location, $localStorage) {
    // Keep user logged in after page refresh
    if ($localStorage.currentUser) {
      let currentUser = $localStorage.currentUser;
      if (currentUser.role === "agency") $location.path("login");
      $http.defaults.headers.common.Authorization = "Bearer " + currentUser.token;
      $rootScope.authUser = currentUser;
    }

    // redirect to login page if not logged in and trying to access a restricted page
    $rootScope.$on("$locationChangeStart", function (event, next, current) {
      let publicPages = ["/login"];
      let restrictPage = publicPages.indexOf($location.path()) > -1;
      if (restrictPage || !$localStorage.currentUser) {
        $location.path("login");
      }
    });

    let currentBrowser = $window.navigator.userAgent.toLowerCase();

    /**
     * extends string prototype object to get a string with a number of characters from a string.
     *
     * @type {Function|*}
     */

    String.prototype.trunc = String.prototype.trunc ||
      function (n) {

        // this will return a substring and
        // if its larger than 'n' then truncate and append '...' to the string and return it.
        // if its less than 'n' then return the 'string'
        return this.length > n ? this.substr(0, n - 1) + '...' : this.toString();
      };

    castApi.init();
  });
