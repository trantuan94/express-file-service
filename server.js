'use strict'
const env = require('dotenv').config().parsed;
require('./src/services/gRpc').start()
