'use strict'

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
    console.log('call to list files');
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

  async handleFiles (cb, options) {
    let err, result;
    const { files, assetDir, authUser, companyId = null, customerId = null, categories = []} = options;
    let data = [];
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
    console.log('result', result);

    return this.response(cb, { code: HttpUtil.OK, message: 'Handle files successful.', data: result});
  }

  async createLinkFile (cb, options) {

  }
}

module.exports = new FileService()
