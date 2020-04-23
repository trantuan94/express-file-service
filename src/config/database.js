'use strict'

const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS } = require('./env/database')
const dbConnectURI = `mongodb://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}`

module.exports = {
  dbConnectURI: dbConnectURI,
  options: {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
    // db: {
    //   safe: true
    // }
  }
}
