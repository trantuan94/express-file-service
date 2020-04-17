const Utils = require('../utils');
const {BASE_URL, HOST, PORT} = require('./env/http');
const baseUrl = BASE_URL ? Utils.formatUrl(BASE_URL) : `${HOST}:${PORT}`

module.exports = {
  baseUrl,
  backendHost: HOST,
  backendPort: PORT,
}
