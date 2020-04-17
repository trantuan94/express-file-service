const HttpUtil = require('./http');
const Utils = require('./index');
const {roles} = require('../config');

module.exports = {

  isAdmin(authUser) {
    return this.checkUserHasRole(authUser, roles.admin);
  },

  isRoot(authUser) {
    return authUser.email === roles.root || this.checkUserHasRole(authUser, roles.root);
  },

  isValidRole(role, array = []) {
    if (array.length === 0) array = Object.values(roles);
    return array.indexOf(role) > -1;
  },

  checkRole(req, res, next, requireRole) {
    let user = req.authUser;
    if (!user) {
      return HttpUtil.unauthorized(res, 'Unauthorized');
    }
    if (!this.checkUserExceptRoles(user, requireRole)) {
      return HttpUtil.forbidden(res, 'Permission_Denied');
    }
    next();
  },

  checkUserHasRole(user, role) {
    if (!user || !user.role || !role) return false;

    if (role === 'DEFAULT') return true;

    return user.role === role;
  },

  checkUserExceptRoles(user, roles) {
    if (!user || !user.role || !roles) return false;

    if (roles === 'DEFAULT') return true;

    if (!Utils.isArray(roles)) roles = [roles];

    if (!roles.length) return true;

    return roles.indexOf(user.role) > -1;
  },
};
