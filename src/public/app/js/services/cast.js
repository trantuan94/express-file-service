'use strict';

//cast related services

angular.module('pisignage.services')
  .factory('castApi', function ($timeout, $rootScope, $http, piUrls, $localStorage) {  // chrome cast receiver app start
    const HTTP_SUCCESS = 200;
    const DEVICE_STATE = {       //Constants of states for Chromecast device
      'IDLE': 0,
      'ACTIVE': 1,
      'WARNING': 2,
      'ERROR': 3,
    };
    
    const PLAYER_STATE = {      //Constants of states for CastPlayer
      'IDLE': 'IDLE',
      'LOADING': 'LOADING',
      'LOADED': 'LOADED',
      'PLAYING': 'PLAYING',
      'PAUSED': 'PAUSED',
      'STOPPED': 'STOPPED',
      'SEEKING': 'SEEKING',
      'ERROR': 'ERROR'
    };
    
    let messageTxt = {
        "type": "serverIp",
        "ipAddress": "http://pisignage.com",
        "port": 80,
        "chromecastIp": "0.0.0.0"
      };
    
    let nameSpace = "urn:x-cast:com.pisignage.instasign";
    
    let castStatus = {
        devicesAvailable: false,
        deviceState: DEVICE_STATE.IDLE
      };
    
    let serverIp, sessions= {}, serverConfig = {};
    
    if ($localStorage.currentUser) {
      $http.defaults.headers.common.Authorization = "Bearer " + $localStorage.currentUser.token;
      $http.get(piUrls.settings)
        .success((data, status) => {
          if (status === HTTP_SUCCESS) {
            serverConfig.settings = data.data;
            serverIp = data.data.serverIp;
          } else {
            console.log('In cast, getSettings failed', data, '-- status', status);
          }
        }).error((err, status) => {
        console.log('In cast, getSettings error', err, '-- status', status);
      })
    }
    
    function changeState() {
      $rootScope.$apply()
    }
    
    function stopped(session) {
      let present = false;
      sessions[session.statusText] = null;
      for (let key in sessions) {
        if (sessions[key] != null) {
          present = true;
          break;
        }
      }
      if (!present) {
        castStatus.deviceState = DEVICE_STATE.IDLE;
        changeState()
      }
    }
    
    function updateListener(session) {
      if (session.status == "stopped") {
        stopped(session)
      }
      sendServerIp(session);
    }
    
    /**
     * Requests that a receiver application session be created or joined. By default, the SessionRequest
     * passed to the API at initialization time is used; this may be overridden by passing a different
     * session request in opt_sessionRequest.
     */
    function launchApp() {
      console.log("launching app...");
      chrome.cast.requestSession(
        function (e) {
          console.log("session success: " + e.sessionId);
          castStatus.deviceState = DEVICE_STATE.ACTIVE;
          sessions[e.statusText] = e;
          sendServerIp(sessions[e.statusText]);
          sessions[e.statusText].addUpdateListener(function (isAlive) {
            updateListener(sessions[e.statusText])
          });
          changeState()
        },
        function (e) {
          if (e.code != "cancel") {
            console.log("launch error");
            castStatus.deviceState = DEVICE_STATE.ERROR;
            changeState()
          }
        }
      );
    }
    
    /**
     * Stops the running receiver application associated with the session.
     */
    function stopApp() {
      //let chrome cast extension handle stopping the cast
      launchApp()
      /*            session.stop(
                      function() {
                          console.log("Session stopped");
                          castStatus.deviceState = DEVICE_STATE.IDLE;
                          castPlayerState = PLAYER_STATE.IDLE;
                          changeState()
                      },
                      function(e){
                          console.log('cast initialize error',e);
                      }
                  )*/
    }
    
    function sendServerIp(session) {
      if (!session) return;
      
      session.sendMessage(nameSpace,
        {
          type: 'serverIp',
          ipAddress: "http://" + serverIp,
          port: window.location.port,
          chromecastIp: session.receiver.ipAddress,
          chromecastName: session.receiver.friendlyName
        },
        function () {
          console.log("Server IP message has been sent")
        }, function (err) {
          console.log("Server IP message sending error: " + err)
        }
      )
    }
    
    function sessionListener(e) {
      sessions[e.statusText] = e;
      console.log("Session listener callback")
      if (sessions[e.statusText]) {
        castStatus.deviceState = DEVICE_STATE.ACTIVE;
        sessions[e.statusText].addUpdateListener(function (isAlive) {
          updateListener(sessions[e.statusText])
        });
        sessions[e.statusText].addMessageListener('urn:x-cast:com.pisignage.instasign', function (s1, s2) {
          console.log("message received")
        })
        changeState()
      }
    }
    
    function receiverListener(devicePresent) {
      if (devicePresent === chrome.cast.ReceiverAvailability.AVAILABLE) {
        castStatus.devicesAvailable = true;
        console.log("devices present")
      } else {
        castStatus.devicesAvailable = false;
        console.log("receiver list empty");
      }
      changeState()
    }
    
    function castInit() {
      if (typeof chrome === "undefined") return; //for other browsers
      
      if (!chrome.cast || !chrome.cast.isAvailable) {
        $timeout(castInit, 1000)
        return;
      }
      
      let applicationID = '90DC4B3D';
      // auto join policy can be one of the following three
      let autoJoinPolicy = chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED;
      //let autoJoinPolicy = chrome.cast.AutoJoinPolicy.PAGE_SCOPED;
      //let autoJoinPolicy = chrome.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED;
      
      // request session
      let sessionRequest = new chrome.cast.SessionRequest(applicationID);
      let apiConfig = new chrome.cast.ApiConfig(sessionRequest, sessionListener, receiverListener, autoJoinPolicy);
      
      chrome.cast.initialize(apiConfig,
        function () {
          console.log('cast init success')
        }, function (e) {
          console.log('cast initialize error', e);
        }
      );
    }
    
    return {
      init: castInit,
      launchApp: launchApp,
      stopApp: stopApp,
      castStatus: castStatus,
      serverConfig: serverConfig
    };
  })
