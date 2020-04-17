'use strict';

const express = require('express');
const AUTH_TYPE = process.env.AUTH_TYPE || 'local';
const multer = require('multer');
const {licenseDir, releasesDir, temporaryDir, roles} = require('../config');

const ctrlAuth = require(AUTH_TYPE === 'local' ? '../app/Controllers/AuthController' : '../app/Controllers/AuthExternalController');
const ctrlProfile = require('../app/Controllers/ProfileController');
const ctrlAccount = require('../app/Controllers/AccountController');
const ctrlUser = require('../app/Controllers/UserController');

const ctrlSettings = require('../app/Controllers/SettingController');
const ctrlFirmware = require('../app/Controllers/FirmwareController');
const ctrlLicenses = require('../app/Controllers/LicenseController');
const ctrlArea = require('../app/Controllers/AreaController');
const ctrlCompany = require('../app/Controllers/CompanyController');
const ctrlOOHPosition = require('../app/Controllers/OOHPositionController');
// Load controllers assets, labels, players, groups, playlists
const ctrlFile = require('../app/Controllers/assets');
const ctrlAsset = require('../app/Controllers/AssetController');
const ctrlLabel = require('../app/Controllers/LabelController');
const ctrlDevice = require('../app/Controllers/PlayerController');
const ctrlPlayer = require('../app/Controllers/players');
const ctrlPi = require('../app/Controllers/PiController');
const ctrlGroup = require('../app/Controllers/GroupController');
const ctrlGroupConfirm = require('../app/Controllers/ConfirmController');
const ctrlPlaylist = require('../app/Controllers/playlists');
const ctrlPlist = require('../app/Controllers/PlaylistController');
// Controllers reports
const ctrlHistory = require('../app/Controllers/HistoryController');
const ctrlSendMail = require('../app/Controllers/sendmail');
const ctrlGuest = require('../app/Controllers/GuestController');
// const gcalAuthorize = require('../app/controllers/gcal-authorize');

// Middleware
const middleware = require('../app/Middleware');
const ExtendResponse = middleware.extendResponse;
// header validation
const header_validation = require('./header_validation');
// config upload folder
const upload = multer({dest: temporaryDir});
const uploadFirmware = multer({dest: releasesDir});
const uploadLicense = multer({dest: licenseDir});

/**
 * Application routes
 */
module.exports = (app) => {
  app.use(header_validation);
  app.use(ExtendResponse);
  require('./extends')(express, app); // using extends.js
  // require('express-group-router')(app); // using express-group-router v1.0.1
  let router = express.Router();

  // TODO Routes not require authenticate
  router.group((router) => {
    // Routes authentication
    router.post('/api/register', ctrlAuth.register)
    router.post('/api/login', ctrlAuth.login)
    

    // API for guest getAuthToken, getGroups, getSchedules
    router.group('/api/guest', (router) => {
      router.get('/getAuthToken', ctrlGuest.getAuthToken);
      router.get('/getGroups', ctrlGuest.getGroupsForCustomer);
      router.get('/getSchedules', ctrlGuest.getScheduleForCustomer);
      router.get('/getSchedule/:playerid', ctrlPlayer.getScheduleForAgency)
    })

    // Routes test
    router.group('/api/test', (router) => {
      router.get('/getPlayLogs', ctrlPlayer.getPlayLogs)
      router.post('/storePlayLogs', ctrlPlayer.testStoreLogs)
    })
  })

  // TODO Required authentication
  router.group({prefix: '/api', middlewares: [middleware.auth]}, (router) => {

    // TODO Routes all roles
    // Routes password
    router.post('/changePassword', ctrlAuth.changePassword);
    router.post('/reset-password', ctrlAuth.resetPassword);
    // Routes profile
    router.get('/profile', ctrlProfile.load);
    // Routes settings
    router.get('/settings', ctrlSettings.getSettings);

    // Routes companies
    router.get('/companies', ctrlCompany.index)
    router.param('companyId', ctrlCompany.load)
    router.get('/companies/:companyId', ctrlCompany.detail)

    // Route areas
    router.get('/areas', ctrlArea.index);
    router.param('areaId', ctrlArea.load);
    router.get('/areas/:areaId', ctrlArea.detail);

    // Routes ooh-positions
    router.get('/ooh-positions', ctrlOOHPosition.index);
    router.param('oohPositionId', ctrlOOHPosition.load);
    router.get('/ooh-positions/:oohPositionId', ctrlOOHPosition.detail);

    // Routes labels
    router.get('/labels', ctrlLabel.index);
    router.post('/labels', ctrlLabel.store);
    router.param('label', ctrlLabel.load);
    router.get('/labels/:label', ctrlLabel.detail);
    router.post('/labels/:label', ctrlLabel.update);
    router.delete('/labels/:label', ctrlLabel.destroy);
    router.post('/labels/deleteMulti', ctrlLabel.deleteMulti);

    // Routes plist
    router.get('/plist', ctrlPlist.index);
    router.post('/plist', ctrlPlist.store);
    router.param('pl_id', ctrlPlist.load);
    router.put('/plist/rename/:pl_id', ctrlPlist.rename)
    router.get('/plist/:pl_id', ctrlPlist.detail);
    router.post('/plist/:pl_id', ctrlPlist.update);
    router.delete('/plist/:pl_id', ctrlPlist.destroy);
    router.post('/plist/deleteMulti', ctrlPlist.deleteMulti);

    // Routes groups
    router.get('/groups', ctrlGroup.index)
    router.post('/groups', ctrlGroup.store)
    router.post('/groups/deploy', ctrlGroup.deploy)
    router.post('/groups/unDeploy', ctrlGroup.unDeploy)
    router.param('groupId', ctrlGroup.load)
    router.put('/groups/rename/:groupId', ctrlGroup.rename)
    router.get('/groups/:groupId', ctrlGroup.detail)
    router.put('/groups/:groupId', ctrlGroup.update)
    router.delete('/groups/:groupId', ctrlGroup.destroy)
    router.get('/reports/groups/:groupId', ctrlGroup.getBroadcastSchedule)

    // Routes group-confirms
    router.get('/confirm-groups', ctrlGroupConfirm.index)
    router.param('group', ctrlGroupConfirm.load)
    router.put('/confirm-groups/:group', ctrlGroupConfirm.update)

    // Routes devices
    router.get('/devices', ctrlDevice.index)
    router.param('deviceId', ctrlDevice.load)
    router.get('/devices/power-logs/:deviceId', ctrlDevice.getPowerLogs)

    // Routes pi-communications
    router.param('pid', ctrlPi.load)
    router.get('/piWifi/:pid', ctrlPi.scanWifi)
    router.post('/piWifi/:pid', ctrlPi.setWifi)
    router.post('/piHdmi/:pid', ctrlPi.cmdSetHdmiConfig)

    // Routes assets
    router.get('/assets', ctrlAsset.index);

    // Routes histories - tổng hợp số lần phát theo nội dung
    router.get('/histories', ctrlHistory.index);

    // Routes reports
    router.post('/reports/players', ctrlDevice.reportTracking);
    router.post('/reports/histories', ctrlHistory.reportLogs);

    // Routes assets
    router.get('/files', ctrlFile.index);
    router.get('/files/:file', ctrlFile.getFileDetails);
    // api add assets: create file + store into DB
    router.post('/files', upload.fields([{name: 'assets', maxCount: 10}]), ctrlFile.createFiles); // add file in media folder
    // router.post('/files', upload.fields([{name: 'assets', maxCount: 10}]), ctrlAsset.store);
    router.post('/storeFileInfo', ctrlFile.updateFileDetails); // store info asset into DB

    router.post('/file-map-playlist', ctrlFile.updatePlaylist);
    router.post('/files/:file', ctrlFile.updateAsset);
    router.delete('/files/:file', ctrlFile.deleteFile);

    // router.get('/calendars/:file', ctrlFile.getCalendar);
    // router.post('/calendars/:file', ctrlFile.updateCalendar);
    router.delete('/calendars/:file', ctrlFile.deleteFile);

    router.post('/links', ctrlAsset.createLinkFile);
    router.get('/links/:file', ctrlFile.getLinkFileDetails);

    // Routes playlists
    router.get('/playlists', ctrlPlaylist.index);
    router.get('/playlists/:file', ctrlPlaylist.detail);
    router.get('/playlists/:file', ctrlPlaylist.detail);
    router.post('/playlists', ctrlPlaylist.store);
    router.post('/playlists/:file', ctrlPlaylist.update);
    router.put('/playlists/:file', ctrlPlaylist.rename);
    router.delete('/playlists/:file', ctrlPlaylist.destroy);
    router.post('/uploadPlaylist', ctrlPlaylist.uploadPlaylist);

    // Routes players
    router.get('/players', ctrlPlayer.index)
    router.get('/players/:playerid', ctrlPlayer.detail)
    router.post('/players', ctrlPlayer.store)
    router.put('/players/:playerid', ctrlPlayer.update)
    router.delete('/players/:playerid', ctrlPlayer.destroy)
    router.param('playerid', ctrlPlayer.load)

    // Routes pi-communication
    router.post('/piShell/:playerid', ctrlPlayer.shell)
    router.post('/snapshot/:playerid', ctrlPlayer.takeSnapshot)
    router.post('/swUpdate/:playerid', ctrlPlayer.swUpdate)
    router.post('/piTv/:playerid', ctrlPlayer.tvPower)
    router.post('/piReboot/:playerid', ctrlPlayer.cmdReboot)
    router.post('/piSigusr/:playerid', ctrlPlayer.cmdSigusr)

    // api get lịch chiếu demo cho agency asia page
    router.get('/getScheduleForAgency/:playerid', ctrlPlayer.getScheduleForAgency)

    // Route send mail report of history of selected players.
    router.post('/sendmail/report', ctrlSendMail.sendReport)
    // live-stream
    router.get('/streaming/:playerid', ctrlPlayer.liveStream)

    // TODO Routes role = roles.root
    router.group({middlewares: [middleware.role(roles.root)]}, (router) => {
      // Routes accounts admin
      router.get('/accounts', ctrlAccount.index)
      router.post('/accounts', ctrlAccount.store)
      router.param('accountId', ctrlAccount.load)
      router.get('/accounts/:accountId', ctrlAccount.detail)
      router.put('/accounts/:accountId', ctrlAccount.update)
      router.delete('/accounts/:accountId', ctrlAccount.destroy)
      router.post('/accounts/deleteMulti', ctrlAccount.deleteMulti);
    });

    // TODO Routes role = roles.admin
    router.group({middlewares: [middleware.role(roles.admin)]}, (router) => {
      // Routes firmwares
      router.get('/firmware', ctrlFirmware.index);
      router.get('/firmware/current', ctrlFirmware.getVersionFirmware);
      router.post('/firmware', uploadFirmware.single('assets'), ctrlFirmware.store);
      // router.get('/firmware/:file', ctrlFirmware.detail)
      // router.put('/firmware/:file', ctrlFirmware.update)
      router.delete('/firmware/:file', ctrlFirmware.destroy);

      // Routes licenses
      router.get('/licenses', ctrlLicenses.index);
      router.post('/licenses', uploadLicense.fields([{name: 'assets', maxCount: 10}]), ctrlLicenses.upload);
      router.delete('/licenses/:filename', ctrlLicenses.destroy);

      // Routes settings
      router.post('/settings', ctrlSettings.update);

      // Routes users
      router.get('/users', ctrlUser.index)
      router.get('/users/getRoles', ctrlUser.getRoles)
      router.post('/users', ctrlUser.store)
      router.param('userId', ctrlUser.load)
      router.get('/users/:userId', ctrlUser.detail)
      router.put('/users/:userId', ctrlUser.update)
      router.delete('/users/:userId', ctrlUser.destroy)
      router.post('/users/deleteMulti', ctrlUser.deleteMulti);

      // Route areas
      router.post('/areas', ctrlArea.store);
      router.put('/areas/:areaId', ctrlArea.update);
      router.delete('/areas/:areaId', ctrlArea.destroy);
      router.post('/areas/deleteMulti', ctrlArea.deleteMulti);

      // Routes companies
      router.post('/companies', ctrlCompany.store)
      router.put('/companies/:companyId', ctrlCompany.update)
      router.delete('/companies/:companyId', ctrlCompany.destroy)
      router.post('/companies/deleteMulti', ctrlCompany.deleteMulti);

      // Routes ooh-positions
      router.post('/ooh-positions', ctrlOOHPosition.store);
      router.put('/ooh-positions/:oohPositionId', ctrlOOHPosition.update);
      router.delete('/ooh-positions/:oohPositionId', ctrlOOHPosition.destroy);
      router.post('/ooh-positions/deleteMulti', ctrlOOHPosition.deleteMulti);
    });
  })
};
