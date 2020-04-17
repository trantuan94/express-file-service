'use strict';

module.exports = (express, app) => {
  express.Router.group = function (...params) {
    let prefix;
    let middlewares = []
    let configure;

    if (arguments.length === 2) {
      if (typeof arguments[0] === 'object') {
        prefix = arguments[0].prefix || '';
        middlewares = arguments[0].middlewares || [];
        if (typeof middlewares === 'function') {
          middlewares = [middlewares]
        }
      } else if (typeof arguments[0] === 'string') {
        prefix = arguments[0];
      } else if (typeof arguments[0] === 'function') {
        middlewares = [arguments[0]];
      } else if (Array.isArray(arguments[0])) {
        middlewares = arguments[0];
      }
      configure = arguments[1];
    } else if (arguments.length === 1 && typeof arguments[0] === 'function') {
      prefix = '';
      middlewares = [];
      configure = arguments[0]
    }

    let router = express.Router();
    if (Array.isArray(middlewares) && middlewares.length > 0) {
      router.use(...middlewares);
    }
    if (prefix && prefix !== '' && prefix !== '/') {
      if (this._prefix && this._prefix !== '/' && this._prefix !== '') {
        app.use(this._prefix + prefix, router);
        router._prefix = this._prefix + prefix;
      } else {
        router._prefix = prefix;
        app.use(prefix, router);
      }
    } else {
      if (this._prefix && this._prefix !== '' && this._prefix !== '/') {
        app.use(this._prefix, router);
        router._prefix = this._prefix;
      } else {
        app.use(router);
        router._prefix = '';
      }
    }
    // Add all URL params from parent router to child router, when using function router.param().
    if(typeof this.params === 'object' && Object.keys(this.params).length) {
      router.params = this.params;
    }
    if(Array.isArray(this._params) && this._params.legnth) {
      router._params = this._params;
    }
    if (configure && typeof configure === 'function') {
      configure(router);
    }
    return router;
  }
}
