const {BASE_URL, HOST, PORT} = process.env;

module.exports = {
  BASE_URL: BASE_URL,
  HOST: HOST || "http://127.0.0.1",
  PORT: PORT || "3000"
}
