// load file env
require('../../config/env');
// Application Config
const config = require('../../config');
const express = require('express');
const fs = require('fs');
const mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
// Connect to database
mongoose.Promise = global.Promise;
mongoose.connect(config.mongodb.dbConnectURI, config.mongodb.options);

mongoose.connection.on('error', function (e) {
  console.log('********************************************');
  console.log('*          MongoDB Process not running     *');
  console.log('********************************************\n');
  console.log(e);
  process.exit(1);
})

// Load models
let modelsPath = `${config.rootPath}/src/app/Models`;
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
    mongooseConnection: mongoose.connection
  })
}));

// Start server
let server = require('http').createServer(app);

server.listen(config.backendPort, () => {
  console.log('Express server listening on port %d', config.backendPort);
});
// init cronjob
require('../../app/Cronjob').start();
// Expose app
module.exports = app;
