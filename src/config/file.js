// config data assets
'use strict';

const path = require('path');
const rootPath = process.cwd();
const {PATH_EXEC_ENCODE_FILE, PATH_EXEC_DECODE_FILE} = process.env;
console.log('rootpath', rootPath);
console.log('PATH_EXEC_ENCODE_FILE', PATH_EXEC_ENCODE_FILE, PATH_EXEC_DECODE_FILE);
module.exports = {
  // encryption
  executePath: {
    encode: path.join(rootPath, PATH_EXEC_ENCODE_FILE),
    decode: path.join(rootPath, PATH_EXEC_DECODE_FILE)
  },

  excelFileRegex: /(.xls|.xlsx|.xlsm|.xlsb|.ods|.csv|.xla|.xlam|.xlt|.xltm|.xltx|.xlw|.xlr)$/i,
  wordFileRegex: /(.doc|.docx|.docm|.dot|.dotm)$/i,
  pptFileRegex: /(.pot|.potm|.potx|.ppa|.ppam|.pps|.ppsm|.ppsx|.ppt|.pptm|.pptx|.odp|.sldx|.sldm)$/i,

  filenameRegex: /[&\/\\#,+()$~%'":*?<>{}]/g,
  groupNameRegEx: /[&\/\\#,+()$~%'":*?<>{}\^]/g,
  videoRegex: /(mp4|mov|m4v|avi|webm|wmv|flv|mkv|mpg|mpeg|3gp)$/i,
  audioRegex: /(mp3|m4a|mp4a|aac)$/i,
  imageRegex: /(jpg|jpeg|png|gif|bmp)$/i,
  htmlRegex: /(.htm|.html)$/,
  noticeRegex: /\.html$/,
  zipfileRegex: /(.zip|.gz|.bz2)$/i,
  repofileRegex: /\.repo$/i,
  liveStreamRegex: /\.tv$/i,
  omxStreamRegex: /\.stream$/i,
  pdffileRegex: /\.pdf$/i,
  txtFileRegex: /\.txt$/i,
  linkUrlRegex: /\.link$/i,
  CORSLink: /\.weblink$/i,
  mediaRss: /\.mrss$/i,
  radioFileRegex: /\.radio$/i,
  brandRegex: /^(brand_intro|brand_intro_portrait)\./i,
  nestedPlaylist: /^__/i,
  gcalRegex: /\.gcal$/i,
  systemAssets: ["_system_notice.html"]
}
