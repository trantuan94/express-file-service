'use strict'

const path = require('path');
const probe = require('node-ffprobe');
const FileUtil = require('../../../utils/files');
const config = require('../../../config');

class AudioFileHandler {
  thumbnailDir = null;
  assetDir = null;
  object = {type: 'audio'};

  constructor(storageInfo) {
    let {thumbnailDir, assetDir} = storageInfo;
    this.thumbnailDir = thumbnailDir;
    this.assetDir = assetDir;
  }

  async handle({filePath, filename, fileType}) {
    probe(filePath, (err, metadata) => {
      if (err) {
        console.log(`Getting info audio file ${filename} error`, err)
        throw err;
      } else {
        this.object.filename = filename;
        this.object.filePath = filePath;
        this.object.duration = metadata.format.duration;
        if (metadata.format.size) {
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
