const Utils = require('../utils');
const {UPLOAD_HOST, UPLOAD_PORT, UPLOAD_DIR_PATH, DOWNLOAD_FOlDER} = require('./env/upload');

let uploadHost = Utils.formatUrl(UPLOAD_HOST);
if (UPLOAD_PORT !== '80') uploadHost = `${uploadHost}:${UPLOAD_PORT}`;

module.exports = {
  uploadHost: uploadHost,
  uploadDir: UPLOAD_DIR_PATH,
  downloadDir: `${UPLOAD_DIR_PATH}/${DOWNLOAD_FOlDER}`,
  downloadFolder: DOWNLOAD_FOlDER
}
