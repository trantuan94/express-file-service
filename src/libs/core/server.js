// load file env
require('../../config/env');

const express = require('express');
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
// Application Config
const config = require('../../config');

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
// Connect to database
mongoose.Promise = global.Promise;
let db = mongoose.connect(config.mongodb.dbConnectURI, config.mongodb.options);

db.connection.on('error', function () {
  console.log(db);
  console.log('********************************************');
  console.log('*          MongoDB Process not running     *');
  console.log('********************************************\n');
  process.exit(1);
})

// check system
if (process.platform !== 'win32') {
  require('./system-check')();
}
// Load models
let modelsPath = path.join(config.rootPath, 'app/Models');
fs.readdirSync(modelsPath).forEach(file => {
  if (!file.includes('BaseSchema') && !file.includes('template')) {
    require(modelsPath + '/' + file);
  }
});

console.log('********************************************************************');
console.log('**************************    Load models    ***********************');
console.log('********************************************************************\n');

let app = express();

app.use(session({
  secret: 'work hard',
  resave: true,
  saveUninitialized: false,
  cookie: {},
  store: new MongoStore({
    mongooseConnection: db.connection
  })
}));

// Express settings
require('./modules/Express')(app);
// Start server
let server = require('http').createServer(app);

let io = require('919.socket.io').listen(server);
let options = {
  path: '/newsocket.io',
  serveClient: true,
  // below are engine.IO options
  pingInterval: 45000,
  pingTimeout: 45000,
  upgradeTimeout: 60000,
  maxHttpBufferSize: 10e7
};
let ioNew = require('socket.io')(server, options);

// init socket.io
require('../../app/Common/SocketIO/old').startSIO(io);
require('../../app/Common/SocketIO/new').startSIO(ioNew);
// init scheduler
require('../../app/Controllers/scheduler');

server.listen(config.backendPort, () => {
  console.log('Express server listening on port %d', config.backendPort);
});

server.on('connection', (socket) => {
  // 60 minutes timeout
  socket.setTimeout(3600000);
});

// init cronjob
require('../../app/Cronjob').start();

// Expose app
module.exports = app;

