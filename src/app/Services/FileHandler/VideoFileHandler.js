'use strict'
const to = require('await-to-js').default;
const FFmpeg = require('fluent-ffmpeg');
const probe = require('node-ffprobe');
const FileUtil = require('../../../utils/files');
const Utils = require('../../../utils');
const config = require('../../../config');
const fs = require('fs');
const path = require('path');

class VideoFileHandler {
  thumbnailDir = null;
  assetDir = null;
  object = {type: 'video'};
  metadata = null;

  constructor(storageInfo) {
    let {thumbnailDir, assetDir} = storageInfo;
    this.thumbnailDir = thumbnailDir;
    this.assetDir = assetDir;
  }

  async handle({filePath, filename}) {
    let err, _metadata, result;
    this.object.filename = filename;
    this.object.filePath = filePath;
    [err, _metadata] = await to(this._getVideoMetadata(filePath));
    if (err) throw err;

    if (_metadata) {
      this.metadata = _metadata;
      this.object.duration = _metadata.format.duration;
      if (_metadata.streams) { // Handle stream video.
        [err, result] = await to(this._handleStreamVideo(filePath, filename));
        if (err) {
          throw err;
        } else {
          if (result) {
            console.log(this.object)
            this.object.filename = result.destName;
            this.object.filePath = result.destPath;
          }
          [err, _metadata] = await to(this._getVideoMetadata(filePath));
          if (err) {
            throw err;
          }
          if (_metadata) { // get duration and resolution of video.
            this.metadata = _metadata;
            let vdoInfo = _.find(_metadata.streams, {'codec_type': 'video'});
            this.object.duration = _metadata.format.duration;
            this.object.resolution = {
              width: vdoInfo.width,
              height: vdoInfo.height
            }
          }
        }
      } else { // get duration and resolutions of video.
        const vdoInfo = _.find(_metadata.streams, {'codec_type': 'video'});
        this.object.duration = _metadata.format.duration;
        this.object.resolution = {
          width: vdoInfo.width,
          height: vdoInfo.height,
        }
      }
      // Take screenshot for a video.
      [err, result] = await to(this._takeVideoScreenShot(filePath, filename));
      if (err) throw err;

      return this.object;
    } else {
      console.log('cannot read metadata video')
    }
  }

  async _getVideoMetadata(filePath) {
    return new Promise((resolve, reject) => {
      probe(filePath, (err, metadata) => {
        if (err) {
          console.log(`Getting info video file ${filename} error`, err)
          reject(err);
        } else {
          resolve(metadata);
        }
      })
    })
  }

  async _handleStreamVideo(filePath, filename) {
    let src = filePath;
    let ext = Utils.getFileExtension(filename);
    let vdoInfo = _.find(this.metadata.streams, {'codec_type': 'video'});
    let destName = path.basename(filename, ext) + '_c.mp4';
    let destPath = path.join(this.assetDir, destName);
    let formatName;
    if (this.metadata.format) {
      formatName = this.metadata.format.format_name;
    }

    if (vdoInfo && vdoInfo.codec_name !== 'h264' || formatName.indexOf('mp4') === -1
      || vdoInfo && vdoInfo.pix_fmt === 'yuv422p') {
      return new Promise((resolve, reject) => {
        new FFmpeg({source: filePath})
          .audioCodec('libfdk_aac')
          // .audioCodec('aac')
          .videoCodec('libx264')
          .size('?x1080')
          .toFormat('mp4')
          .outputOptions(['-profile:v high', '-level 4.0', '-pix_fmt yuv420p'])
          .on('error', (err, stdout, stderr) => {
            console.log('Conversion Err: ' + err);
            console.log("stderr: " + stderr);
            reject(err);
          })
          .on('end', () => {
            fs.unlink(src, (err) => {
              if (err) {
                console.log('Conversion Src Unlink Err: ' + err);
                reject(err);
              }
              // fileName = destName;
              // filePath = destPath;
              this.object.filename = destName;
              this.object.filePath = destPath;
            })
          }).saveToFile(destPath);
        resolve({destName, destPath});
      })
    } else {
      return;
    }
  }

  async _takeVideoScreenShot(filePath, fileName) {
    const random = Math.floor(Math.random() * 10000) + '_';
    const snaptime = this.object.duration >= 10 ? 8 : 2;
    let imageScreenShort = random + fileName + '.png';
    return new Promise((resolve, reject) => {
      new FFmpeg({source: filePath})
        .takeScreenshots({
          size: '64x64',
          count: 1,
          timemarks: [snaptime],
          filename: imageScreenShort
        }, this.thumbnailDir)
        .on('error', (err) => {
          console.log('FFmpeg takeScreenshots video file error:' + err.message);
          reject(err);
        })
        .on('end', (fileNames) => {
          let thumbnailPath = `${this.thumbnailDir}/${imageScreenShort}`;
          this.object.thumbnail = {
            image: thumbnailPath.replace(config.mediaDir, "media"),
            path: thumbnailPath
          }

          resolve(this.object);
        });
    })
  }
}

module.exports = VideoFileHandler
