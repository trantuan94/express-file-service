'use strict'

const BaseService = require('.');
const to = require('await-to-js').default;
const HttpUtil = require('../../../utils/http');
const Utils = require('../../../utils');
const FileHandler = require('../FileHandler');

const {APP_KEY} = require('../../../config/env/auth');
const {roles} = require('../../../config');

class FileService extends BaseService {
  constructor() {
    super(FileService)
  }

  async lists(call, callback) {
    return super.lists(call, callback)
  }

  async detail(call, callback) {
    return super.detail(call, callback)
  }

  async filters(call, callback) {
    return super.filters(call, callback)
  }

  async update(call, callback) {
    return super.update(call, callback)
  }

  async fetch(call, callback) {
    return super.fetch(call, callback);
  }

  async handleFile (options) {
    const { file, authUser} = options;
    let [err, object] = await to(FileHandler.handleFile(file, authUser));
    if (err) {
      console.log('err', err);
      throw err;
    }
    return object;
  }
}

module.exports = new FileService()
