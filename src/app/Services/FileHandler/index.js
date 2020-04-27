'use strict'

const _ = require('lodash');
const to = require('await-to-js').default;
const exec = require('child_process').exec;
const BaseSevice = require('../Base');
const FileUtil = require('../../../utils/files');
const config = require('../../../config');
const VideoFileHandler = require('./VideoFileHandler');
const AudioFileHandler = require('./AudioFileHandler');
const ImageFileHandler = require('./ImageFileHandler');
const OthersFileHandler = require('./OthersFileHandler');
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
    let fileHandler = this._getFileHandler(fileType, authUser);
    [err, object] = await to(fileHandler.handle({ filePath, filename: fileName, fileType }));
    if (err) {
      console.log('err', err);
      throw err;
    }

    if (object && object.filePath) {
      [err, rs] = await to(FileUtil.moveFile(object.filePath, installation));
      if (err) {
        throw err;
      }
      this.encodeFile(installation);
  
      return object;
    } else {
      throw new Error(`Not found file: ${filePath} to move  ${installation}`);
    }
  }

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
