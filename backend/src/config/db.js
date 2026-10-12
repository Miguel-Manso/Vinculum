const sql = require('mssql');
require('dotenv').config();
const os = require('os');

const server = process.env.DB_SERVER || `${os.hostname()}\\SQLEXPRESS`;
const config = {
  server,
  port:     parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_DATABASE || 'vinculum',
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options:  { encrypt: false, trustServerCertificate: true, enableArithAbort: true },
  pool:     { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

let pool = null;
async function getPool() {
  if (pool) return pool;
  pool = await sql.connect(config);
  console.log(`✅ Conectado: ${server}`);
  return pool;
}
module.exports = { getPool, sql };
