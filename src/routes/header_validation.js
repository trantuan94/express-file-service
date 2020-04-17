const HttpUtil = require('../utils/http');
const API_PATH_HEADER = '/api/';

function setHeader(res) {
  //res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, origin, Accept, lang_code, Last-Modified');
  res.setHeader('Access-Control-Allow-Credentials', true);
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin
  // res.setHeader('Vary', "Origin");
  // res.setHeader('Access-Control-Expose-Headers', 'Content-Length');
}

module.exports = (req, res, next) => {
  if (!req.url.includes(API_PATH_HEADER) || req.url.length === 5) {
    return HttpUtil.badRequest(res, 'Just accept <host address>' + API_PATH_HEADER + '<module name>');
  }

  setHeader(res);
  if (req.method === 'OPTIONS') {
    return res.end();
  }
  // if (!req.headers['content-type'] || req.headers['content-type'] != 'application/json'){
  //     HttpUtil.badRequest(res, 'Missing header param Content-Type={application/json}');
  //     return;
  // }
  // if (!req.headers.lang_code) {
  //   HttpUtil.badRequest(res, 'Missing header param lang_code={vi}');
  //   return;
  // }
  res.pdf = (content) => {
    res.set({'Content-Type': 'application/pdf', 'Content-Length': content.length})
    res.send(content)
  }
  next();
};
