const {DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, DB_POOL_SIZE} = process.env;

module.exports = {
  DB_HOST: DB_HOST || "127.0.0.1",
  DB_PORT: DB_PORT || "27017",
  DB_USER: DB_USER || "root",
  DB_PASS: DB_PASS || "",
  DB_NAME: DB_NAME || "db_name",
  DB_POOL_SIZE: DB_POOL_SIZE || 10,
};
