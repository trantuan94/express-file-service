const path = require('path');

const rootPath = process.cwd();
const MEDIA_FOLDER = 'media';
const assetDir = path.join(rootPath, '/../', MEDIA_FOLDER);
const configDir = `${rootPath}/config`;
const dataDir = `${rootPath}/data`;
const viewDir = `${rootPath}/views`;
const logStoreDir = `${assetDir}/_logs`;
const temporaryDir = `${assetDir}/_temporary`;
const releasesDir = `${dataDir}/releases`;
const syncDir = `${dataDir}/sync_folders`;
const dailyLogDir = `${logStoreDir}/daily`;
const powerLogDir = `${logStoreDir}/power`;


const {FORMAT_DATE = 'YYYY-MM-DD'} = process.env;
const {baseUrl, backendHost, backendPort} = require('./http');
const calendarConfig = require('./calendar');
const DB_CONFIG = require('./database');
const fileConfig = require('./file');
const streamConfig = require('./stream');
const {uploadDir, uploadHost, downloadDir, downloadFolder} = require('./upload');
const downloadUrl = `${baseUrl}/downloads`;

// const pdfMakeFonts = require('../libs/pdfmake/fonts.json');
let settings = require('./setting.json');
const queue = require('./queue');

module.exports = {
  baseUrl: baseUrl,
  backendHost: backendHost,
  backendPort: backendPort,
  rootPath: rootPath,
  configDir: configDir,
  formatDate: FORMAT_DATE,
  // config for project
  dataDir: dataDir,
  downloadDir: downloadDir,
  downloadFolder: downloadFolder,
  downloadUrl: downloadUrl,
  releasesDir: releasesDir,
  syncDir: syncDir,
  uploadDir: uploadDir,
  uploadHost: uploadHost,
  temporaryDir: temporaryDir,
  viewDir: viewDir,
  // logs file
  logStoreDir: logStoreDir,
  dailyLogDir: dailyLogDir,
  powerLogDir: powerLogDir,
  logPlayFileName: 'play_history_',
  // config data assets
  mediaFolder: MEDIA_FOLDER,
  mediaDir: assetDir,
  mediaDefault: {
    folderName: 'default',
    folderAdmin: 'admin',
    path: `${assetDir}/default`,
    assetFolder: '_assets',
    playlistFolder: '_playlists',
    thumbnailFolder: '_thumbnails'
  },

  snapshotDir: `${assetDir}/_snapshots`,
  snapshotFolder: `_snapshots`,

  // config database
  mongodb: DB_CONFIG,
  session: {
    secret: 'piSignage'
  },
  ...settings,
  ...calendarConfig,
  ...fileConfig,
  ...streamConfig,
  // pdfMakeFonts: pdfMakeFonts,
  piMqImage: {
    file: 'piMqImage.tar.gz',
    name: 'piMqImage',
  },
  groupDefault: 'default',
  playlistDefault: 'TV_OFF',
  conversionValue: 1000,
  queues: queue,
};
