const async = require('async');
const fs = require('fs');
const fse = require('fs-extra');
const exec = require('child_process').exec;

const config = require('../../config');
const mediaAdminPath = `${config.mediaDir}/${config.mediaDefault.folderAdmin}`;
// const SettingPath = `${config.configDir}/setting.json`;
// const SettingExamplePath = `${config.configDir}/setting.json.example`;

module.exports = function () {
  let errors = 0;
  async.series([
    // function (cb) {
    //   fs.exists(SettingPath, function (exists) {
    //     if (!exists) {
    //       exec(`cp ${SettingExamplePath} ${SettingPath}`, (err, stdout, stderr) => {
    //         console.log('***     init settingConfig in server     ***');
    //         if (err) {
    //           console.error(err)
    //           console.log('*****************************************************************************');
    //           console.log('* config/setting.json directory absent, setting.json file cannot be created *');
    //           console.log('*****************************************************************************\n');
    //           process.exit(1);
    //         } else {
    //           cb()
    //         }
    //       })
    //     } else {
    //       cb()
    //     }
    //   })
    // },
    function (cb) {
      fs.exists(config.mediaDir, function (exists) {
        if (!exists) {
          fs.mkdir(config.mediaDir, '0777', function (err) {
            if (err) {
              console.log('*****************************************************');
              console.log('*     Unable to create media directory, exiting     *');
              console.log('*****************************************************\n');
              process.exit(1);
            } else {
              cb()
            }
          })
        } else {
          cb();
        }
      })
    },
    function (cb) {
      fs.exists(config.temporaryDir, function (exists) {
        if (!exists) {
          fs.mkdir(config.temporaryDir, '0777', function (err) {
            if (err) {
              console.log('**************************************************************************************');
              console.log('* media/_temporary directory absent, temporary storage data upload cannot be created *');
              console.log('**************************************************************************************\n');
              process.exit(1);
            }
            cb()
          })
        } else {
          cb();
        }
      })
    },
    function (cb) {
      fs.exists(config.snapshotDir, function (exists) {
        if (!exists) {
          fs.mkdir(config.snapshotDir, '0777', function (err) {
            if (err) {
              console.log('***************************************************************');
              console.log('* media/_snapshots directory absent, folder cannot be created *');
              console.log('***************************************************************\n');
              process.exit(1);
            }
            cb()
          })
        } else {
          cb();
        }
      })
    },
    function (cb) {
      fs.exists(config.logStoreDir, function (exists) {
        if (!exists) {
          fs.mkdir(config.logStoreDir, '0777', function (err) {
            if (err) {
              console.log('**********************************************************');
              console.log('* media/_logs directory absent, folder cannot be created *');
              console.log('**********************************************************\n');
              process.exit(1);
            }
            cb()
          })
        } else {
          cb();
        }
      })
    },
    function (cb) {
      fs.exists(config.dailyLogDir, function (exists) {
        if (!exists) {
          fs.mkdir(config.dailyLogDir, '0777', function (err) {
            if (err) {
              console.log('****************************************************************');
              console.log('* media/_logs/daily directory absent, folder cannot be created *');
              console.log('****************************************************************\n');
              process.exit(1);
            }
            cb()
          })
        } else {
          cb();
        }
      })
    },
    function (cb) {
      fs.exists(config.powerLogDir, function (exists) {
        if (!exists) {
          fs.mkdir(config.powerLogDir, '0777', function (err) {
            if (err) {
              console.log('****************************************************************');
              console.log('* media/_logs/power directory absent, folder cannot be created *');
              console.log('****************************************************************\n');
              process.exit(1);
            }
            cb()
          })
        } else {
          cb();
        }
      })
    },
    function (cb) {
      fs.exists(config.mediaDefault.path, function (exists) {
        if (!exists) {
          fs.mkdir(config.mediaDefault.path, '0777', function (err) {
            if (err) {
              console.log('****************************************************************************');
              console.log('* media/default directory absent, default folder company cannot be created *');
              console.log('****************************************************************************\n');
              process.exit(1);
            } else {
              const assetPath = `${config.mediaDefault.path}/${config.mediaDefault.assetFolder}`;
              const playlistPath = `${config.mediaDefault.path}/${config.mediaDefault.playlistFolder}`;
              const thumbnailPath = `${config.mediaDefault.path}/${config.mediaDefault.thumbnailFolder}`;
              fs.mkdir(assetPath, '0777', function (err) {
                if (err) {
                  console.log('********************************************************************');
                  console.log('* media/default/_assets directory absent, folder cannot be created *');
                  console.log('********************************************************************\n');
                  process.exit(1);
                }
              });
              fs.mkdir(playlistPath, '0777', function (err) {
                if (err) {
                  console.log('***********************************************************************');
                  console.log('* media/default/_playlists directory absent, folder cannot be created *');
                  console.log('***********************************************************************\n');
                  process.exit(1);
                } else {
                  const json = {
                    name: config.playlistDefault,
                    settings: {},
                    assets: [],
                    layout: "1",
                    schedule: {}
                  };
                  let fileName = `__${config.playlistDefault}.json`;
                  const directory = `${playlistPath}/${fileName}`;
                  fs.writeFile(directory, JSON.stringify(json, null, 4), function (err) {
                    if (err) {
                      console.log('***********************************************************************************');
                      console.log('* media/default/_playlists/TV_OFF file absent, playlist default cannot be created *');
                      console.log('***********************************************************************************\n');
                      process.exit(1);
                    }
                  });
                }
              });
              fs.mkdir(thumbnailPath, '0777', function (err) {
                if (err) {
                  console.log('************************************************************************');
                  console.log('* media/default/_thumbnails directory absent, folder cannot be created *');
                  console.log('************************************************************************\n');
                  process.exit(1);
                }
              });
            }
            cb()
          })
        } else {
          cb();
        }
      })
    },
    function (cb) {
      fs.exists(mediaAdminPath, function (exists) {
        if (!exists) {
          fse.copy(config.mediaDefault.path, mediaAdminPath, err => {
            if (err) {
              console.error(err)
              console.log('************************************************************************');
              console.log('* media/admin directory absent, default folder admin cannot be created *');
              console.log('************************************************************************\n');
              process.exit(1);
            }
            cb()
          })
        } else {
          cb();
        }
      })
    },
    function (cb) {
      fs.exists(config.uploadDir, function (exists) {
        if (!exists) {
          fs.mkdir(config.uploadDir, '0777', function (err) {
            if (err) {
              console.log('******************************************************');
              console.log('*     Unable to create upload directory, exiting     *');
              console.log('******************************************************\n');
              process.exit(1);
            } else {
              cb()
            }
          })
        } else {
          cb();
        }
      })
    },
    function (cb) {
      fs.exists(config.downloadDir, function (exists) {
        if (!exists) {
          fs.mkdir(config.downloadDir, '0777', function (err) {
            if (err) {
              console.log('******************************************************************************');
              console.log('*     Unable to create directory for storage export excel files, exiting     *');
              console.log('******************************************************************************\n');
              process.exit(1);
            } else {
              cb()
            }
          })
        } else {
          cb();
        }
      })
    },
    function (cb) {
      exec('ffprobe -version', function (err, stdout, stderr) {
        if (err) {
          console.log('****************************************************************');
          console.log('*  Please install ffmpeg, videos cannot be uploaded otherwise  *');
          console.log('****************************************************************\n');
          console.log(err)
          errors++;
        }
        cb();
      })
    },
    function (cb) {
      exec('convert -version', function (err, stdout, stderr) {
        if (err) {
          console.log('*********************************************************************');
          console.log('* Please install imagemagik, otherwise thumbnails cannot be created *');
          console.log('*********************************************************************\n');
          console.log(err)
          errors++;
        }
        cb();
      })
    }
  ], function (err) {
    console.log('********************************************');
    if (errors) {
      console.log('*  system check complete with ' + errors + ' errors     *');
    } else {
      console.log('*        system check passed               *');
    }
    console.log('********************************************');
  })
}
