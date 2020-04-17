'use strict'
const path = require('path');
const FileUtil = require('../../../utils/files');
const config = require('../../../config');

class OthersFileHandler {
  storageFolder = null;
  thumbnailDir = null;
  assetDir = null;
  object = { type: 'other'};

  constructor (authUser) {
    this.storageFolder = FileUtil.getSyncFolder(authUser);
    this.thumbnailDir = path.join(config.mediaDir, this.storageFolder,
      config.mediaDefault.thumbnailFolder);
    this.assetDir = path.join(config.mediaDir, this.storageFolder,
      config.mediaDefault.assetFolder);
  }

  async handle ({filePath, filename, fileType }) {
    this.object.filePath = filePath;
    this.object.filename = filename;
    this.object.type = fileType;

    return this.object;
  }
}
module.exports = OthersFileHandler
