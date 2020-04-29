'use strict'

const fs = require('fs');
const BaseService = require('.');
const to = require('await-to-js').default;
const HttpUtil = require('../../../utils/http');
const Utils = require('../../../utils');
const FileHandler = require('../FileHandler');
const AssetModel = require('../../Models/Asset');

const {APP_KEY} = require('../../../config/env/auth');
const {roles} = require('../../../config');

class FileService extends BaseService {
  constructor() {
    super(FileService);
    this.model = AssetModel;
  }

  async lists(call, callback) {
    return super.lists(call, callback);
  }

  async detail(call, callback) {
    return super.detail(call, callback)
  }

  async update (callback, options) {
    let { _id, params } = options;
    params = params || {}
    let err, result;
    [err, result] = await to(this.model.getOne({ _id }));
    if (err) {
      return this.response(callback, { code: HttpUtil.INTERNAL_SERVER_ERROR, message: err.message});
    }
    if (!result) {
      return this.response(callback, { code: HttpUtil.NOT_FOUND, message: 'Not found file'});
    }
    [err, result] = await to(this.model.updateItem(_id, params));
    if (err) {
      return this.response(callback, { code: HttpUtil.INTERNAL_SERVER_ERROR, message: err.message});
    }

    return this.response(callback, { data: result });
  }

  async destroy (cb, options) {
    console.log('destroy file');
    let { _id, softDatete } = options;
    let err, result;
    [err, result] = await to(this.model.getOne({ _id }, false));
    if (err) {
      return this.response(cb, { code: HttpUtil.INTERNAL_SERVER_ERROR, message: err.message});
    }
    console.log('result', result);
    if (!result) {
      return this.response(cb, { code: HttpUtil.NOT_FOUND, message: 'Not found file'});
    }
    let fileInstallation = result.installation;

    if (softDatete) {
      [err, result] = await to(this.model.softDelete({_id: _id}));
    } else {
      [err, result] = await to(this.model.delete(_id));
    }
    if (err) {
      console.log(err);
      return this.response(cb, { code: HttpUtil.INTERNAL_SERVER_ERROR, message: err.message});
    }
    fs.unlink(fileInstallation, (err) => {
      if (err) {
        return this.response(cb, { code: HttpUtil.INTERNAL_SERVER_ERROR, message: err.message});
      }
    });
    return this.response(cb, { data: result })
  }

  async filters(call, callback) {
    return super.filters(call, callback)
  }

  async fetch(call, callback) {
    return super.fetch(call, callback);
  }

  async store (cb, options) {
    let err, result;
    const { files, assetDir, authUser, scope, companyId = null, customerId = null, categories = []} = options;
    let data = [];
    console.log('scope', scope);
    let actions = [];
    let filenames = [];
    files.map(file => {
      filenames.push(file.fileName);
      let fileType = FileHandler.getFileType(file.originalname);
      file.fileType = fileType;
      data.push({
        name: file.fileName,
        type: fileType,
        size: `${file.fileSize || 0} KB`,
        installation: file.installation,
        urlFile: file.installation.replace(assetDir, 'media'),
        label: categories || [],
        company: companyId,
        customer: customerId,
        scope: scope,
        insert: {
          by: authUser._id
        }
      });
      actions.push(FileHandler.handleFile(file, authUser));
    });
    let duplicatedCond = {
      name: {$in: filenames},
      company: companyId ? companyId : { $exists: false }
    };
    
    [err, result] = await to(this.model.findByCondition(duplicatedCond));
    if (err) return this.response(cb, {code: HttpUtil.INTERNAL_SERVER_ERROR, message: err.message});

    if (result.length) {
      let message = Utils.localizedText('Exists.file', result.map(item => item.name).join(', '));
      [err, result] = await to(Promise.all(files.map(file => FileUtil.removeFile(file.installation, file.name))));
      if (err) {
        console.log('err', err);
        return this.response(cb, { code: HttpUtil.INTERNAL_SERVER_ERROR, message: err.message});
      }
      if (result.length) {
        return this.response(cb, { code: HttpUtil.UNPROCESSABLE_ENTITY, message})
      }
    }
    actions.push(this.model.insertMany(data));
    [err, result] = await to(Promise.all(actions));
    if (err) {
      console.log('err', err);
      return this.response(cb, {code: HttpUtil.INTERNAL_SERVER_ERROR, message: err.message});
    }
    console.log('handle file success.')

    return this.response(cb, { data: result});
  }

  async createLinkFile (cb, options) {

  }
}

module.exports = new FileService()
