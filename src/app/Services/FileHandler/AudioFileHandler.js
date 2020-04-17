'use strict'

const path = require('path');
const probe = require('node-ffprobe');
const FileUtil = require('../../../utils/files');
const config = require('../../../config');
class AudioFileHandler {
  storageFolder = null;
  thumbnailDir = null;
  assetDir = null;
  object = { type: 'audio'};

  constructor (authUser) {
    this.storageFolder = FileUtil.getSyncFolder(authUser);
    this.thumbnailDir = path.join(config.mediaDir, this.storageFolder,
      config.mediaDefault.thumbnailFolder);
    this.assetDir = path.join(config.mediaDir, this.storageFolder,
        config.mediaDefault.assetFolder);
  }

  async handle ({filePath, filename, fileType}) {
    probe(filePath, (err, metadata) => {
      if(err) {
        console.log(`Getting info audio file ${filename} error`, err)
        throw err;
      } else {
        this.object.filename = filename;
        this.object.filePath = filePath;
        this.object.duration = metadata.format.duration;
        if(metadata.format.size) {
          this.object.size = this.setFileSize(metadata)
        }

        return this.object;
      }
    })
  }

  setFileSize(metadata) {
    let size = parseInt(metadata.format.size / 1000);
    return `${size} KB`
  }
}
module.exports = AudioFileHandler
