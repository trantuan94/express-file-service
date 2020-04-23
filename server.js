'use strict'
const env = require('dotenv').config().parsed;
require('./src/libs/core');
require('./src/services/gRpc').start()
