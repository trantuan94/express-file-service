const fs = require('fs');
const fse = require('fs-extra');
const mv = require('mv');
const path = require('path');
const to = require('await-to-js').default;
const Utils = require('./index');

module.exports = {

  checkExists(location) {
    return fs.existsSync(location);
  },

  checkFileExist(file, directory, fileName) {
    file = path.join(directory, file);
    return new Promise((resolve, reject) => {
      fs.exists(file, (exists) => {
        if (exists) return reject(`Têp '${fileName}' đã tồn tại`);

        return resolve(true);
      });
    })
  },

  writeFile(file, directory, json) {
    file = path.join(directory, file);
    return new Promise((resolve, reject) => {
      fs.writeFile(file, JSON.stringify(json, null, 4), 'utf8', function (err) {
        if (err) return reject(err);

        return resolve(json);
      });
    })
  },

  removeFile(path, fileName) {
    return new Promise((resolve, reject) => {
      fs.exists(path, (exists) => {
        if (!exists) {
          return reject(`unable to find/delete ${fileName}`)
        }
        // console.log('File exists. Deleting now ...');
        fs.unlink(path, (err) => {
          if (err) return reject(`delete ${fileName} failed: ${err.message}`);
          return resolve();
        });
      });
    })
  },

  renameFile(oldPath, newPath) {
    return new Promise((resolve, reject) => {
      fs.rename(oldPath, newPath, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  },

  moveFile(oldPath, newPath, overwrite = false) {
    return new Promise((resolve, reject) => {
      mv(oldPath, newPath, {mkdirp: true, clobber: overwrite}, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  },

  mkdirFolder(path, cb) {
    return new Promise((resolve, reject) => {
      fs.mkdir(path, (err) => {
        if (err) {
          console.log(`mkdir '${path}' failed:`, err)
          return reject(err)
        }
        resolve()
      })
    })
  },

  readFolder(path, filter = null) {
    return new Promise((resolve, reject) => {
      fs.readdir(path, (err, files) => {
        if (err) return reject(err)
        if (filter) files = filter(files);
        resolve(files)
      })
    })
  },

  async copyFolderFile(path, newPath) {
    let [err, rs] = await to(fse.copy(path, newPath));
    if (err) throw Error(Utils.isString(err) ? err : err.message);
    console.log(`copyFolderFile success: ${path} to ${newPath}`);
    return true;
  },

  async removeFolder(path) {
    let [err, rs] = await to(fse.remove(path));
    if (err) throw Error(Utils.isString(err) ? err : err.message);
    console.log(`removeFolder ${path} successfully`);
    return true;
  },

  getInfoFile(dirPath, file) {
    return new Promise((resolve, reject) => {
      fs.stat(path.join(dirPath, file), (err, stats) => {
        if (err) return reject(err);

        return resolve({file: file, lastModifiedTime: stats.mtime, createdAt: stats.birthtime, size: stats.size})
      })
    })
  },

  async getDetailFile(dirPath, files) {
    if (Utils.isString(files)) return await this.getInfoFile(dirPath, files);

    return await Promise.all(files.map(file => this.getInfoFile(dirPath, file)))
  },

  getSyncFolder(object) {
    object = Utils.cloneObject(object);
    if (!object.company) return 'admin';
    if (Utils.isString(object.company)) return object.company;
    return object.company._id.toString()
  },

  getCompanyByAuth(authUser) {
    return authUser.company ? authUser.company.toString() : undefined;
  }
}
