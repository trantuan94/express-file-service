'use strict'

const {rootPath} = require('../config');
const srcPath = `${rootPath}/src`;
const protoOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
}

module.exports = function (grpc, protoLoader, gRpcServer, subject) {
  const path = `${srcPath}/services/gRpc/proto/${subject}.proto`
  const subjectProto = protoLoader.loadSync(path, protoOptions)
  const descriptor = grpc.loadPackageDefinition(subjectProto)
  const serviceName = `${subject}Service`
  const Service = require(`${srcPath}/app/Services/GRPC/${subject.toLowerCase()}`)

  gRpcServer.addService(descriptor[serviceName].service, {
    list: Service.lists,
    detail: Service.detail,
    filter: Service.filters,
    update: Service.update,
    fetch: Service.fetch
  })
}
