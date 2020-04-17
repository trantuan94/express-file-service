// Nhiều lúc mongoskin bị lỗi hoặc ko đáp ứng được thì chuyển qua dùng mongodb native
const MongoClient = require('mongodb').MongoClient
// INIT DATABASE CONNECTION
const mongoose = require('mongoose')
const { dbConnectURI, options } = require('../../config').mongodb
const dbMongo = mongoose.connect(dbConnectURI, options)
// const TAG = 'DBUtils'

module.exports = {
  mongo: dbMongo,

  lookupWithUser (localField = null, foreignField = null, asField = 'user') {
    if (!localField) {
      localField = '$userId'
    }
    if (!foreignField) {
      foreignField = '$_id'
    }
    return {
      from: 'users',
      let: { userId: localField },
      pipeline: [{
        $match: {
          $expr: { $eq: [foreignField, '$$userId'] },
          $or: [{ delete: { $exists: false } }, { delete: null }]
        }
      }],
      as: asField
    }
  },

  lookupRolesForUser (localField = 'roles', asField = 'roles') {
    return {
      from: 'roles',
      localField: localField,
      foreignField: '_id',
      as: asField
    }
  },

  getNativeDb () {
    return new Promise((resolve, reject) => {
      MongoClient.connect(dbConnectURI, options, (err, db) => {
        if (err) return reject(err)
        resolve(db)
      })
    })
  },

  getNativeCollection (name) {
    return new Promise((resolve, reject) => {
      MongoClient.connect(dbConnectURI, options, (err, db) => {
        if (err) return reject(err)
        resolve(db.collection(name))
      })
    })
  }
}
