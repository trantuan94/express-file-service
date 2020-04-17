const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const {SECRET_KEY} = require('../config/env/auth');

module.exports = {
  
  randomValueHex(len = 16) {
    return crypto.randomBytes(len)
      .toString('hex') // convert to hexadecimal format
      .slice(0, len); // return required number of characters
  },

  randomValueBase64(len) {
    return crypto.randomBytes(Math.ceil(len * 3 / 4))
      .toString('base64') // convert to base64 format
      .slice(0, len) // return required number of characters
      .replace(/\+/g, '0') // replace '+' with '0'
      .replace(/\//g, '0'); // replace '/' with '0'
  },
  
  hash(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  },
  
  setPassword(password) {
    password = password.toString();
    let salt = this.randomValueHex();
    let hash = this.hash(password, salt);
    return {salt, hash};
  },
  
  validPassword(user, password) {
    let hash = this.hash(password, user.salt)
    return user.hash === hash;
  },
  
  generateJwt(user) {
    let expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    
    return jwt.sign({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      company: user.company,
      exp: parseInt(expiry.getTime() / 1000),
    }, SECRET_KEY); // DO NOT KEEP YOUR SECRET IN THE CODE!
  },

  verify(token, cb) {
    jwt.verify(token, SECRET_KEY, (err, payload) => {
      if (err) return cb(err);
      return cb(null, payload)
    })
  }
};
