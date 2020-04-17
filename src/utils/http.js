const Utils = require('./index');

module.exports = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,

  params(req) {
    let p = {};
    Object.assign(p, req.query); // try to get from url query string, e.g api/users?param1=x&param2=y
    Object.assign(p, req.body); // try to get from json
    return p;
  },
  /**
   * 
   * @param {Object} req 
   */
  headers(req) {
    return {
      authUser: req.authUser,
      lang_code: req.headers.lang_code,
      role_code: req.headers.role_code,
      userAgent: req.headers['user-agent'],
      authorization: req.headers.authorization,
      other: req.headers
    }
  },
  /**
   * Get base URL of request.
   * @param {Object} req 
   */
  getBaseUrl(req) {
    return `http://${req.headers.host}`
  },
  /**
   * Get all parameters of request
   * @param {Object} req 
   */
  getParamsFull: function (req) {
    let p = {};
    Object.assign(p, req.params); // try to get from url parameters, e.g api/users/:id
    Object.assign(p, req.query); // try to get from url query string, e.g api/users?param1=x&param2=y
    Object.assign(p, req.body); // try to get from json
    return p;
  },

  // req: request object of express
  getFullUrlFromRequest(req) {
    return req.protocol + '://' + req.get('host') + req.originalUrl;
  },

  // params from url get /api/users?sort=email,1
  // return {email: 1}
  parseSort(paramSort, defaultSort = {'insert.when': -1}) {
    let sort;
    if (paramSort) {
      let arr = paramSort.split(',');
      if (arr.length === 2) {
        let sortName = arr[0].trim();
        let sortValue = Number(arr[1]);
        if ((sortValue === 1 || sortValue === -1) && sortName.length > 0) {
          sort = {[sortName]: sortValue};
        }
      }
    }
    return sort || defaultSort;
  },

  /**
   * Get required data in request body JSON.
   * @param {Object} req 
   * @param {Array} required_param_names 
   */
  getRequiredParamsFromJson(req, required_param_names) {
    return this.checkRequiredParams(req.body, required_param_names);
  },

  getRequiredParamsFromJson2(req, required_param_names) {
    return this.checkRequiredParams2(req.body, required_param_names);
  },

  getRequiredParamsFromUrl(req, required_param_names) {
    return this.checkRequiredParams(req.query, required_param_names);
  },

  getRequiredParams(req, required_param_names) {
    const params = this.params(req);
    return this.checkRequiredParams(params, required_param_names);
  },

  getRequiredParams2(req, required_param_names) {
    const params = this.params(req);
    return this.checkRequiredParams2(params, required_param_names);
  },

  createErrorInvalidInput(msgOrKey, words) {
    return this.createError(this.BAD_REQUEST, msgOrKey, words);
  },

  createError(code, key, words) {
    let {msgKey, message} = Utils.getMsgObjectFromKey(key, words);
    return {code, msgKey, message};
  },
  
  // gọi từ api interface, thường dùng khi input validator failed
  // err được tạo từ api/controller, dùng hàm createErrorInvalidInput bên trên
  apiError(langCode, res, err) {
    // console.log('apiError langCode: ', langCode, ' -- err: ', err);
    if (err instanceof Error) {
      return this.internalServerError(res, err);
    }
    const httpCode = (err && err.code) ? err.code : this.BAD_REQUEST;
    return this.error(httpCode, res, err);
  },

  // các trường hợp sử dụng thường gặp
  // error(500, res, err)
  // error(500, [req, res], 'Message_Code')
  error(httpCode, res, err, opt_info = null) {
    _error(httpCode, res, err, opt_info);
  },

  badRequest(res, err, opt_info = null) {
    if (!err) err = "Bad_Request";
    return this.error(this.BAD_REQUEST, res, err, opt_info);
  },

  disableApi(res, msg) {
    msg = msg || "Disable_Api";
    return this.badRequest(res, msg);
  },

  forbidden(res, err, opt_info = null) {
    if (!err) err = "Forbidden";
    return this.error(this.FORBIDDEN, res, err, opt_info);
  },

  notFound(res, err, opt_info = null) {
    if (!err) err = "Not_Found";
    return this.error(this.NOT_FOUND, res, err, opt_info);
  },

  notImplement(res, msg = null) {
    msg = msg || "Not_Implement";
    return this.internalServerError(res, msg);
  },

  unauthorized(res, err, opt_info = null) {
    if (!err) err = "Unauthorized";
    return this.error(this.UNAUTHORIZED, res, err, opt_info);
  },

  unprocessable(res, err, opt_info = null) {
    if (!err) err = "unprocessable";
    return this.error(this.UNPROCESSABLE_ENTITY, res, err, opt_info);
  },

  internalServerError(res, err, opt_info = null) {
    if (!err) err = "Internal_Server_Error";
    return this.error(this.INTERNAL_SERVER_ERROR, res, err, opt_info);
  },

  sendResponse(res, status, content = null) {
    res.set('Access-Control-Allow-Origin', '*');
    res.status(status);
    res.json(content);
  },

  // success: function (res, data = null, httpCode = this.OK) {
  success(res, data = null, message = null, httpCode = this.OK) {
    message = message ? Utils.localizedText(message) : "Success";
    let ret = {message};
    if (data) {
      if (Utils.isString(data)) {
        ret.message = Utils.localizedText(data);
        return this.sendResponse(res, httpCode, ret)
      }

      if (Utils.isObject(data)) {
        if (Utils.isArray(data)) {
          ret.count = data.length;
        } else {
          if (Object.keys(data).length === 0) {
            data = undefined;
          } else if (data.msgKey) {
            ret.msgKey = data.msgKey;
            delete data.msgKey;
          } else if (data.message) {
            ret.message = data.message;
            delete data.message;
          }
        }
      }
      ret.data = data;
    }
    return this.sendResponse(res, httpCode, ret)
  },

  download(res, options) {
    res.download(options.path, options.filename);
  },

  ddd: function (input) {
    return Promise.resolve(input);
  },

  checkRequiredParams(input, requiredParams) {
    if (!requiredParams) return input;
    if (!Array.isArray(requiredParams)) return {error: `Required params must be array, but value is ${requiredParams}`};
    if (requiredParams.length === 0) return input;

    for (let i = 0; i < requiredParams.length; i++) {
      let keys = requiredParams[i].split('.');
      let obj = input[keys[0]];
      let path = keys[0];
      if (obj === undefined || obj === null) {
        return {error: 'Missing param ' + path};
      }
      if (keys.length <= 1) {
        continue;
      }
      for (let j = 1; j < keys.length; j++) {
        path = path + '.' + keys[j];
        obj = obj[keys[j]];
        if (obj === undefined || obj === null) {
          return {error: 'Missing param ' + path};
        }
      }
    }
    return input;
  },

  // Bình thường thì sẽ ko chấp nhận empty string
  // Nếu param nào empty mà có acceptEmpty = true thì sẽ chấp nhận param đấy
  // example of requiredParams:
  // [
  //   {
  //     name: 'staff_type',
  //     acceptValues: [1, 2, 3],
  //     dataType: 'array'
  //   },
  //   'name.familyName',
  //   'skype'
  // ]
  //
  // input should be this
  // {
  //   staff_type: 1,
  //   skype: "xxx",
  //   name : {
  //     familyName: "John"
  //   }
  // }
  checkRequiredParams2(input, requiredParams) {
    if (!requiredParams) return input;
    if (!Array.isArray(requiredParams)) return {error: `Required params must be array, but value is ${requiredParams}`};
    if (requiredParams.length === 0) return input;

    // dataType: must be result from typeof (E.g: 'string', 'number', 'boolean', 'array'...)
    // acceptEmpty: áp dụng cho cả string và array, để chấp nhận mảng rỗng và string rỗng
    function check(value, key, acceptValues, acceptEmpty, dataType, message) {
      let msg = (message && message.acceptEmpty) ? message.acceptEmpty : 'Param ' + key + ' is missing or empty';

      if (dataType) {
        let errMsg = key + ' must be ' + dataType + ', but value is ' + value;

        if (dataType === 'array') {
          if (!Array.isArray(value)) return errMsg;

          if (!acceptEmpty && value.length === 0) return msg;
        }

        if (dataType === 'number' && isNaN(value)) return errMsg;

        if (dataType === 'boolean' && !Utils.isBoolean(Utils.toBool(value))) return errMsg;

        if (['array', 'number', 'boolean'].indexOf(dataType) === -1 && dataType !== typeof value) return errMsg;

        if (dataType === 'object' && Object.keys(value).length === 0 && !acceptEmpty) return msg;
      }

      if (!value && dataType !== 'number' && dataType !== 'boolean') {
        if (acceptEmpty === true) {
          if (value === "" && (dataType === undefined || dataType === 'string')) return null;
        }
        return msg;
      }

      if (acceptValues && acceptValues.indexOf(value) === -1) {
        return (message && message.acceptValue) ? message.acceptValue : 'Value of ' + key + ' is invalid';
      }
      return null;
    }

    for (let p of requiredParams) {
      let obj, path;
      let fullPath = Utils.isString(p) ? p : p.name;
      let keys = fullPath.split('.');

      for (let j = 0; j < keys.length; j++) {
        let key = keys[j];
        if (j === 0) {
          obj = input[key];
          path = key;
        } else {
          obj = obj[key];
          path = path + '.' + key;
        }

        let msg;
        if (j === keys.length - 1) {
          // last node
          msg = check(obj, path, p.acceptValues, p.acceptEmpty, p.dataType, p.message);
          if (!msg) {
            if (p.dataType === 'number' && !Utils.isNumber(obj)) {
              // make sure dataType is exactly number
              Utils.setObjectPropertyWithPath(path, input, Number(obj));
            }
            if (p.dataType === 'boolean' && !Utils.isBoolean(obj)) {
              // make sure dataType is exactly boolean
              Utils.setObjectPropertyWithPath(path, input, Utils.toBool(obj));
            }
          }
        } else {
          // middle node
          msg = check(obj, path);
        }
        if (msg) {
          return {error: msg};
        }
      }
    }
    return input;
  },

  checkRequiredParamsIfAvailable(input, requiredParams) {
    if (!requiredParams) return input;
    if (!Array.isArray(requiredParams)) return {error: `Required params must be array, but value is ${requiredParams}`};
    if (requiredParams.length === 0) return input;

    let required = [];
    for (let p of requiredParams) {
      let fullPath = Utils.isString(p) ? p : p.name;
      let keys = fullPath.split('.');

      let obj = {...input}, path;
      for (let j = 0; j < keys.length; j++) {
        path = keys[j];
        obj = obj[path];
      }

      if (typeof obj === 'undefined') {
        continue;
      }
      required.push(p);
    }
    return this.checkRequiredParams2(input, required);
  }
};

// res could be one of these type
// - original response object
// - array of original request, response objects [req, res]
// err could be one of these type
// - instance of Error
// - string
// - key of localization string
function _error(httpCode, res, err, opt_info = null) {
  let data = {};
  if (Array.isArray(res)) {
    const req = res[0];
    let langCode = req.lang_code;
    res = res[1];
  }

  if (Utils.isString(err)) {
    let {msgKey, message} = Utils.getMsgObjectFromKey(err);
    data = {...data, msgKey, message};
  } else {
    if (Utils.isObject(err)) {
      let {msgKey, message, need_user_confirm} = err;
      data = {...data, msgKey, message, need_user_confirm};
    } else {
      data.message = Utils.getErrorString(err);
    }
  }

  if (opt_info) data.extra_info = opt_info;

  res.status(httpCode).send(data);
}
