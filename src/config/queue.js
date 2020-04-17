'use strict';
module.exports = {
  default: 'beequeue',
  beequeue: {
    driver: 'bee-queue',
    prefix: 'bq',
    stallInterval: 5000,
    nearTermWindow: 12000,
    delayedDebounce: 1000,
    redis: {
      host: '127.0.0.1',
      port: 6379,
      db: 0,
      options: {}
    },
    isWorker: true,
    getEvents: true,
    sendEvents: true,
    storeJobs: true,
    ensureScripts: true,
    activateDelayedJobs: false,
    removeOnSuccess: true,
    removeOnFailure: false,
    redisScanCount: 100
  }
};