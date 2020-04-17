'use strict'
const fs = require('fs');
const to = require('await-to-js').default;
const path = require('path');
const FileUtil = require('../../../utils/files');
const config = require('../../../config');
const thumbnailSize = 64;
const {conversionValue} = config;
const ImageMagick = require('gm').subClass({imageMagick: true});

class ImageFileHandler {
  storageFolder = null;
  thumbnailDir = null;
  assetDir = null;
  object = { type: 'image'};

  constructor(authUser) {
    this.storageFolder = FileUtil.getSyncFolder(authUser);
    this.thumbnailDir = path.join(config.mediaDir, this.storageFolder,
      config.mediaDefault.thumbnailFolder);
    this.assetDir = path.join(config.mediaDir, this.storageFolder,
        config.mediaDefault.assetFolder);
  }

  async handle({ filePath, filename }) {
    let err, result;
    this.object.filename = filename;
    this.object.filePath = filePath;

    [err, result] = await to(this._createThumbnail(filePath, filename));
    if(err) throw err;

    [err, result] = await to(this._resize(filePath));
    if(err) throw err;

    [err, result] = await to(this._getFileSize(filePath));
    if(err) throw err;

    [err, result] = await to(this._getResolution(filePath));
    if(err) throw err;

    return this.object;
  }
  
  async _createThumbnail(filePath, filename) {
    let thumbnailName = this._setThumbnailName(filename);
    let thumbnailPath = path.join(this.thumbnailDir, thumbnailName);

    return new Promise((resolve, reject) => {
      ImageMagick(filePath)
        .autoOrient()
        .resize(thumbnailSize)
        .write(thumbnailPath, (err) => {
          if(err) {
            console.log(`ImageMagick write '${filename}' error:`, err);
            reject(err);
          } else {
            this.object.thumbnail = {
              image: thumbnailPath.replace(config.mediaDir, "media"),
              path: thumbnailPath
            }

            resolve({ 
              image: thumbnailPath.replace(config.mediaDir, "media"),
              path: thumbnailPath
            });
          }
        });
    })
  }

  async _resize(filePath) {
    return new Promise((resolve, reject) => {
      ImageMagick(filePath)
      .autoOrient()
      .resize(1920, 1920, '>')
      .write(filePath, (err, op) => {
        if(err) {
          console.log(`ImageMagick resize ${filePath} error:`, err);
         reject(err);
        }

        resolve(filePath);
      });
    })
  }

  async _getFileSize(filePath) {
    let stats = fs.statSync(filePath);
    let fileSizeInBytes = stats["size"];
    let size = Math.floor(fileSizeInBytes / conversionValue).toFixed(2) + ' KB';
    this.object.size = size;

    return size;
    // ImageMagick(filePath).filesize((err, value) => {
    //   if(err) throw err;
    //   this.object.size = value;

    //   return value;
    // });
  }

  async _getResolution(filePath) {
    return new Promise((resolve, reject) => {
      ImageMagick(filePath).size((err, value) => {
        if(err) {
          console.log('cannot get resolution of file', filePath, err);
          reject(err);
        }
        this.object.resolution = value;
  
        resolve(value);
      });
    })
  }

  _setThumbnailName(filename) {
    let random = Math.floor(Math.random() * 10000);
    return `${random}_${filename}`
  }
}
module.exports = ImageFileHandler
