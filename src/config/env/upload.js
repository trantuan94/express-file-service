const {UPLOAD_HOST, UPLOAD_PORT, UPLOAD_DIR_PATH, DOWNLOAD_FOlDER} = process.env;

module.exports = {
  UPLOAD_HOST: UPLOAD_HOST || 'http://localhost',
  UPLOAD_PORT: UPLOAD_PORT || '8080',
  UPLOAD_DIR_PATH: UPLOAD_DIR_PATH || '/var/www/upload/',
  DOWNLOAD_FOlDER: DOWNLOAD_FOlDER || 'pisignage'
}
