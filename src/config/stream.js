const Utils = require('../utils');

const {SERVER_JITSI, SERVER_JANUS} = process.env;
const serverJITSI = Utils.formatUrl(SERVER_JITSI);
const serverJANUS = Utils.formatUrl(SERVER_JANUS);

module.exports = {
  roomSnapshot: 'room_snapshot',
  roomJanus: 'room_janus',
  serverJITSI: serverJITSI,
  serverJANUS: serverJANUS,
}
