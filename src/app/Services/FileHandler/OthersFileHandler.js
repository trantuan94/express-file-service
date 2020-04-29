'use strict'
const path = require('path');
const FileUtil = require('../../../utils/files');
const config = require('../../../config');

class OthersFileHandler {
  thumbnailDir = null;
  assetDir = null;
  object = { type: 'other'};

  constructor(storageInfo) {
    let { thumbnailDir, assetDir } = storageInfo;
    this.thumbnailDir = thumbnailDir;
    this.assetDir = assetDir;
  }

  async handle ({filePath, filename, fileType }) {
    this.object.filePath = filePath;
    this.object.filename = filename;
    this.object.type = fileType;

    return this.object;
  }
}
module.exports = OthersFileHandler
