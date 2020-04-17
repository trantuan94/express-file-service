const query = require('./query')
const pagination = require('./pagination')

module.exports = {
  ...query, ...pagination
}
