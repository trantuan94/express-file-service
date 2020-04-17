'use strict';

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const errorHandler = require('errorhandler');
const express = require('express');
const fs = require('fs');
const favicon = require('serve-favicon');
// const logger = require('morgan');
const methodOverride = require('method-override');
const passport = require('passport');
const path = require('path');
const serveIndex = require('serve-index');
const config = require('../../../config');

module.exports = function (app) {

  if (process.env.NODE_ENV === 'dev') {
    // Disable caching of scripts for easier testing
    app.use(function noCache(req, res, next) {
      if (req.url.indexOf('/scripts/') === 0) {
        res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.header('Pragma', 'no-cache');
        res.header('Expires', 0);
      }
      next();
    });
    app.use(errorHandler());
    app.locals.pretty = true;
    app.locals.compileDebug = true;
  } else {
    app.use(favicon(path.join(config.rootPath, 'public/app/img', 'favicon.ico')));
  }

  // error handler
  // define as the last app.use callback
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.send(err.message);
  });

  app.use('/downloads', express.static(config.downloadDir));
  app.use('/licenses', express.static(config.licenseDir));
  app.use('/libs', express.static(path.join(config.rootPath, 'node_modules')));
  app.use('/media', express.static(config.mediaDir));
  app.use('/releases', express.static(config.releasesDir));
  // app.use('/sync_folders',serveIndex(config.syncDir));
  app.use('/sync_folders', function (req, res, next) {
      fs.stat(path.join(config.syncDir, req.path), function (err, stat) {
        if (!err && stat.isDirectory()) {
          res.setHeader('Last-Modified', (new Date()).toUTCString());
        }
        next();
      })
    },
    serveIndex(config.syncDir)
  );
  app.use('/sync_folders', express.static(config.syncDir));

  if (config.language === 'ja') {
    app.use(express.static(path.join(config.rootPath, 'public-jp')));
  } else {
    app.use(express.static(path.join(config.rootPath, 'public')));
  }

  app.set('view engine', 'jade');
  app.locals.basedir = config.viewDir;
  app.set('views', config.viewDir);

  require('../../../services/passport');
  app.use(passport.initialize());
  //app.use(logger('dev'));
  app.use(bodyParser.json({limit: '5mb'}));
  app.use(bodyParser.urlencoded({extended: true}));
  // app.use(bodyParser.urlencoded({extended: true, limit: '5mb'}));
  app.use(methodOverride());
  app.use(cookieParser());

  // Load routes
  require('../../../routes')(app);

  app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
      res.status(401);
      res.json({"message": err.name + ": " + err.message});
    }
  });

  // custom error handler
  app.use(function (err, req, res, next) {
    if (err.message.indexOf('not found') >= 0) return next();

    //ignore range error as well
    if (err.message.indexOf('Range Not Satisfiable') >= 0) return res.send();

    console.error(err.stack)
    res.status(500).render('500')
  })

  app.use(function (req, res, next) {
    //res.redirect('/');
    res.status(404).render('404', {url: req.originalUrl})
  })
};
