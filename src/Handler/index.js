const async = require('async');
const _ = require('lodash');
const to = require('await-to-js').default;
const exec = require('child_process').exec;
const FFmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const probe = require('node-ffprobe');
const ImageMagick = require('gm').subClass({imageMagick: true});
const BaseSevice = require('./Base');
const FileUtil = require('../../utils/files');
const Utils = require('../../utils');
const config = require('../../config');
const thumbnailSize = 64;
const {conversionValue} = config;

class Service extends BaseSevice {
  constructor() {
    super(Service)
  }

  encodeFile(assetPath) {
    exec(`${config.executePath.encode} ${assetPath}`, (err, stdout, stderr) => {
      if (err) console.log('execute encode assets error:', err);
      // console.log('stdout', stdout)
      // console.log('stderr', stderr)
    })
  }

  async handleFile(file, authUser) {
    let {fileName, filePath, fileType, installation} = file;
    let err, object, rs;
    // let errorMessages = [];

    // const storageFolder = FileUtil.getSyncFolder(authUser);
    // const assetDir = path.join(config.mediaDir, storageFolder,
    //   config.mediaDefault.assetFolder);
    // const thumbnailDir = path.join(config.mediaDir, storageFolder,
    //   config.mediaDefault.thumbnailFolder);

    // let src = path.join(assetDir, fileName);
    let fileHandler = this._getFileHandler(fileType, authUser);
    [err, object] = await to(fileHandler.handle({ filePath, filename: fileName, fileType }));
    if (err) {
      console.log('err', err);
      throw err;
    }
    console.log('handler object ', object);
    if (object && object.filePath) {
      [err, rs] = await to(FileUtil.moveFile(object.filePath, installation));
      if (err) {
        throw err;
      }
      this.encodeFile(installation)
      console.log('handle file object', object);
      return object;
    } else {
      throw new Error(`Not found file: ${filePath} to move  ${installation}`);
    }



    //   ext = path.extname(fileName),
    //   destName = path.basename(fileName, ext) + '_c.mp4',
    //   destPath = path.join(assetDir, destName),
    //   mediaSize = `${parseInt(fileSize)} KB`,
    //   type,
    //   duration,
    //   resolution,
    //   thumbnail,
    //   random = Math.floor(Math.random() * 10000) + '_';
    // switch (fileType) {
    //   case 'image':
    //     this.handleImageFile(installation, fileName, thumbnailDir, () => {})  
    //     break;
    //   case 'video':
    //     this.handleVideoFile(installation, fileName, thumbnailDir, () => {})
    //     break;
    //   case 'audio':
    //     this.handleAudioFile(installation, fileName, () => {})
    //     break;
    //   default:
    //     break;
    // }
  }

  // handleImageFile(filePath, filename, thumbnailDir, cb) {
  //   let object = {type: "image"};
  //   let errors = [];
  //   async.series([
  //     // create thumbnail
  //     (task_cb) => {
  //       let thumbnailName = this.setThumbnailName(filename);
  //       let thumbnailPath = `${thumbnailDir}/${thumbnailName}`;
  //       ImageMagick(filePath)
  //         .autoOrient()
  //         .resize(thumbnailSize)
  //         .write(thumbnailPath, (err) => {
  //           if (err) {
  //             console.log(`ImageMagick write '${filename}' error:`, err);
  //             errors.push(err.message)
  //           } else {
  //             object.thumbnail = {
  //               image: thumbnailPath.replace(config.mediaDir, "media"),
  //               path: thumbnailPath
  //             }
  //           }
  //           task_cb();
  //         })
  //     },
  //     // resize image
  //     (task_cb) => {
  //       ImageMagick(filePath)
  //         .autoOrient()
  //         .resize(1920, 1920, '>')
  //         .write(filePath, (err, op) => {
  //           if (err) {
  //             console.log(`ImageMagick resize ${filePath} error:`, err);
  //             errors.push(err.message)
  //           }
  //           task_cb();
  //         })
  //     },
  //     // get file size
  //     (task_cb) => {
  //       ImageMagick(filePath).filesize((err, value) => {
  //         if (err) {
  //           errors.push(err.message);
  //         } else {
  //           object.size = value;
  //         }
  //         task_cb();
  //       })
  //     },
  //     // get file resolution
  //     (task_cb) => {
  //       ImageMagick(filePath).size((err, value) => {
  //         if (err) {
  //           errors.push(err.message);
  //         } else {
  //           object.resolution = value;
  //         }
  //         task_cb();
  //       })
  //     }
  //   ], () => {
  //     if (errors.length) {
  //       cb(errors)
  //     } else {
  //       cb(null, object)
  //     }
  //   })
  // }

  // handleVideoFile(filePath, filename, thumbnailDir, cb) {
  //   let object = {type: "video"};
  //   let errors = [];
  //   const assetDir = path.join(config.mediaDir, storageFolder,
  //     config.mediaDefault.assetFolder);
  //   let destName = path.basename(filename, ext) + '_c.mp4';
  //   let destPath = path.join(assetDir, destName);
  //   async.series([
  //     (task_cb) => {
  //       probe(filePath, (err, metadata) => {
  //         if (err) {
  //           console.log(`Getting info video file ${filename} error`, err)
  //           errors.push(err.message)
  //         } else {
  //           let src = filePath;
  //           if (metadata && metadata.streams) {
  //             let vdoInfo = _.find(metadata.streams, {'codec_type': 'video'});
  //             let formatName;
  //             if (metadata.format) {
  //               formatName = metadata.format.format_name;
  //             }

  //             if (
  //               (vdoInfo && vdoInfo.codec_name !== 'h264') ||
  //               (formatName.indexOf('mp4') === -1) ||
  //               (vdoInfo && vdoInfo.pix_fmt === 'yuv422p')
  //             ) {
  //               new FFmpeg({source: filePath})
  //                 .audioCodec('libfdk_aac')
  //                 // .audioCodec('aac')
  //                 .videoCodec('libx264')
  //                 .size('?x1080')
  //                 .toFormat('mp4')
  //                 .outputOptions([
  //                   '-profile:v high',
  //                   '-level 4.0',
  //                   '-pix_fmt yuv420p'
  //                 ])
  //                 .on('error', (err, stdout, stderr) => {
  //                   console.log('Conversion Err: ' + err);
  //                   console.log("stdout: " + stdout);
  //                   console.log("stderr: " + stderr);
  //                   errors.push(err.message);
  //                 })
  //                 .on('end', () => {
  //                   fs.unlink(src, (err) => {
  //                     if (err) {
  //                       console.log('Conversion Src Unlink Err: ' + err);
  //                       errors.push(err.message);
  //                     }
  //                     fileName = destName;
  //                     filePath = destPath;
  //                   })
  //                 })
  //                 .saveToFile(destPath);
  //             }
  //           }
  //         }
  //         task_cb();
  //       });
  //     },
  //     (task_cb) => {
  //       probe(filePath, (err, metadata) => {
  //         if (err) {
  //           errors.push(err.message)
  //         } else {
  //           object.duration = metadata.format.duration;
  //           if (metadata.format.size) {
  //             object.size = this.setFileSize(metadata)
  //           }
  //           let vdoInfo = _.find(metadata.streams, {'codec_type': 'video'});
  //           if (vdoInfo) {
  //             object.resolution = {
  //               width: vdoInfo.width,
  //               height: vdoInfo.height
  //             }
  //           }
  //         }
  //         task_cb();
  //       });
  //     },
  //     (task_cb) => {
  //       let snaptime = object.duration >= 10 ? 8 : 2;
  //       let imageScreenShort = random + fileName + '.png';
  //       new FFmpeg({source: filePath})
  //         .takeScreenshots({
  //           size: '64x64',
  //           count: 1,
  //           timemarks: [snaptime],
  //           filename: imageScreenShort
  //         }, thumbnailDir)
  //         .on('error', (err) => {
  //           console.log('FFmpeg takeScreenshots video file error:' + err.message);
  //           errors.push(err.message);
  //           task_cb()
  //         })
  //         .on('end', (fileNames) => {
  //           let thumbnailPath = `${thumbnailDir}/${imageScreenShort}`;
  //           object.thumbnail = {
  //             image: thumbnailPath.replace(config.mediaDir, "media"),
  //             path: thumbnailPath
  //           }
  //           task_cb()
  //         });
  //     }
  //   ], () => {
  //       if (errors.length) {
  //         cb(errors)
  //       } else {
  //         cb(null, object)
  //       }
  //   })
  // }

  // handleAudioFile(filePath, filename, cb) {
  //   let object = {type: "audio"};
  //   let errors = [];
  //   probe(filePath, (err, metadata) => {
  //     if (err) {
  //       console.log(`Getting info audio file ${filename} error`, err)
  //       errors.push(err.message);
  //       cb(errors)
  //     } else {
  //       object.duration = metadata.format.duration;
  //       if (metadata.format.size) {
  //         object.size = this.setFileSize(metadata)
  //       }
  //       cb(null, object)
  //     }
  //   })
  // }


  getFileType(filename) {
    if (filename.match(config.imageRegex)) {
      return 'image';
    } else if(filename.match(config.videoRegex)) {
      return 'video';
    } else if(filename.match(config.audioRegex)) {
      return 'audio';
    } else if (filename.match(config.htmlRegex)) {
      return 'html';
    } else if (filename.match(config.txtFileRegex)) {
      return 'text';
    } else if (filename.match(config.pdffileRegex)) {
      return 'pdf';
    } else if (filename.match(config.radioFileRegex)) {
      return 'radio';
    } else if (filename.match(config.zipfileRegex)) {
      return 'zip';
    } else if (filename.match(config.liveStreamRegex) || filename.match(config.omxStreamRegex)
      || filename.match(config.mediaRss) || filename.match(config.CORSLink)
      || filename.match(config.linkUrlRegex)) {
      return 'link'
    } else if (filename.match(config.excelFileRegex)) {
      return 'excel'
    } else if (filename.match(config.wordFileRegex)) {
      return 'words';
    } else if (filename.match(config.pptFileRegex)) {
      return 'powerpoint';
    } else {
      return 'other';
    }
  }

  async removeErrorFile(fileObj) {
    let filename = this.getFileName(fileObj);
    return await FileUtil.removeFile(fileObj.path, filename);
  }

  getFileName(fileObj) {
    let filename = fileObj.originalname.replace(config.filenameRegex, '');
    //unzip won't work with spcaces in file name
    if ((filename).match(config.zipfileRegex)) filename = filename.replace(/ /g, '');
    // change brand video name
    if (filename.match(config.brandRegex)) filename = filename.toLowerCase();
    return filename;
  }

  setThumbnailName(filename) {
    let random = Math.floor(Math.random() * 10000);
    return `${random}_${filename}`
  }

  setFileSize(metadata) {
    let size = parseInt(metadata.format.size / 1000);
    return `${size} KB`
  }

  _getFileHandler (fileType, authUser) {
    switch (fileType) {
      case 'video':
        return new VideoFileHandler(authUser);
      case 'audio':
        return new AudioFileHandler(authUser);
      case 'radio':
        return new AudioFileHandler(authUser);
      case 'image':
        return new ImageFileHandler(authUser);
      default:
        return new OthersFileHandler(authUser);
    }
  }
}
module.exports = new Service()
