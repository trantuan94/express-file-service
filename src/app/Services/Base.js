'use strict'

class BaseService {
  constructor(child) {
    this.bindingMethods = this.bindingMethods.bind(this)
    this.bindingMethods(child)
  }

  bindingMethods(obj) {
    let methods = Object.getOwnPropertyNames(obj.prototype);
    methods = methods.filter(x => (x !== 'constructor' && x !== 'bindingMethods'));

    for (let method of methods) {
      this[method] = this[method].bind(this)
    }
  }
}

module.exports = BaseService
