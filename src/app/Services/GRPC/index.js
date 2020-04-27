'use strict'

const to = require('await-to-js').default;
const DBUtil = require('../../../utils/Database');
const Utils = require('../../../utils');
const {APP_KEY} = require('../../../config/env/auth');
const statusCode = {
  UNIMPLEMENTED: 12,
  INVALID_ARGUMENT: 3
};

class BaseService {
  constructor(child) {
    this._methods = [];
    this.bindingMethods = this.bindingMethods.bind(this);
    this.bindingMethods(child);
  }

  async lists(call, callback) {
    let {options} = call.request;
    options = options ? JSON.parse(options) : {};
    const {page, perPage, filters = {}} = options;
    let [err, rs] = await to(Promise.all([
      this.model.lists(options),
      this.model.getCount(filters)
    ]));

    if (err) return callback(err);
    rs = DBUtil.paginationResult(page, perPage, rs[0], rs[1], filters);
    delete rs.filters;
    callback(null, rs);
  }

  async detail(call, callback) {
    const {params} = call.request;
    const [err, rs] = await to(this.model.getOne({_id: params}, true));
    if (err) return callback(err);

    callback(null, {msg: rs});
  }

  async filters(call, callback) {
    let {conditions} = call.request;
    conditions = conditions ? JSON.parse(conditions) : {};
    const [err, rs] = await to(this.model.findByCondition(conditions, true));
    if (err) return callback(err);

    callback(null, {msg: rs});
  }

  async update(call, callback) {
    let {options} = call.request;
    options = options ? JSON.parse(options) : {};
    const {condition, data, multi = false} = options;
    const [err, rs] = await to(this.model.update(condition, data, multi));
    if (err) return callback(err);

    callback(null, {msg: rs || ''});
  }

  /*
    *** handle request
   */
  async fetch(call, callback) {
    let {options, methodName} = call.request;
    if (!methodName || !options) {
      return this.error(callback, 'Service methodName is not provided');
    }
    options = options ? JSON.parse(options) : {};
    if (Utils.isObjectEmpty(options)) {
      return this.error(callback, 'Params conditions must be an empty object');
    }
    if (!this._methods.includes(methodName)) {
      return this.error(callback,
        `Service '${methodName}' is not defined`,
        statusCode.UNIMPLEMENTED
      );
    }
    let {secret} = options;
    if (!secret || !APP_KEY[secret]) {
      msg = HttpUtil.createError(HttpUtil.METHOD_NOT_ALLOWED, `System is not supported`);
      return this.response(callback, msg)
    }
    options.scope = APP_KEY[secret];
    delete options.secret;
    return await this[methodName](callback, options)
  }

  error(cb, message, code = statusCode.INVALID_ARGUMENT) {
    const err = {code, message};
    cb(err, null);
  }

  response(cb, {code = HttpUtil.OK, message = "Success", data = undefined, stringify = true}) {
    if (data && stringify) data = JSON.stringify(data);
    cb(null, {code, message, data})
  }

  bindingMethods(obj) {
    let methods = Object.getOwnPropertyNames(obj.prototype);
    methods = methods.filter(x => (x !== 'constructor' && x !== 'bindingMethods'));
    this._methods = methods;
    for (const method of methods) {
      this[method] = this[method].bind(this);
    }
  }
}

module.exports = BaseService
