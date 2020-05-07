const rootPath = process.cwd()
const {GRPC_HOST = '127.0.0.1', GRPC_PORT = '50052'} = process.env

module.exports = {
  rootPath: rootPath,
  gRpcHost: GRPC_HOST,
  gRpcPort: GRPC_PORT,
  gRpcServerUri: `${GRPC_HOST}:${GRPC_PORT}`
}
