'use strict';
/**
 * @description Schema of Asset.
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const BaseSchema = require('./BaseSchema');
const mTAG = 'Asset';
const projection = {delete: 0, __v: 0};

const FIELDS = {
  name: {
    type: String,
    require: true,
    index: true
  },
  type: {type: String},
  duration: {type: String},
  size: {type: String},
  urlFile: {type: String},
  installation: {type: String, require: true},
  thumbnail: {
    image: {type: String},
    path: {type: String}
  },
  labels: [],
  playlists: [],
  resolution: {
    width: {type: String},
    height: {type: String}
  },
  validity: {
    enable: {type: Boolean},
    startDate: {type: String},
    endDate: {type: String}
  },
  company: {
    type: Schema.ObjectId,
    index: true
  },
  customer: {
    type: Schema.ObjectId,
    index: true,
    default: null
  },
  scope: {type: String, default: 'digital', index: true},
  // times
  insert: {
    when: {type: Date, default: Date.now},
    by: {type: Schema.ObjectId, ref: 'User'}
  },
  update: {
    when: {type: Date},
    by: {type: Schema.ObjectId, ref: 'User'}
  },
  delete: {
    when: {type: Date},
    by: {type: Schema.ObjectId, ref: 'User'}
  }
}

let tableSchema = BaseSchema(FIELDS, projection);

module.exports = mongoose.model(mTAG, tableSchema);
