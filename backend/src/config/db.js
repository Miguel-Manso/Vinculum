const sql = require('mssql');
require('dotenv').config();
const os = require('os');
const { Pool: PgPool } = require('pg');

let pool = null;

// ============================================================
// Wrapper de Compatibilidade para PostgreSQL (Neon / Supabase)
// ============================================================
class PostgresRequest {
  constructor(pgPool) {
    this.pgPool = pgPool;
    this.params = {};
  }

  input(name, type, value) {
    this.params[name] = value;
    return this;
  }

  async query(queryString) {
    let sqlText = queryString;
    let returningClause = '';

    // Converte OUTPUT INSERTED.coluna para RETURNING coluna (padrão PostgreSQL)
    const outputMatch = sqlText.match(/OUTPUT\s+INSERTED\.(\*|[a-zA-Z0-9_]+)/i);
    if (outputMatch) {
      returningClause = ` RETURNING ${outputMatch[1]}`;
      sqlText = sqlText.replace(/OUTPUT\s+INSERTED\.(\*|[a-zA-Z0-9_]+)/i, '');
    }

    // Converte GETDATE() para NOW()
    sqlText = sqlText.replace(/GETDATE\(\)/gi, 'NOW()');

    // Mapeia parâmetros @nome para $1, $2, ...
    const paramNames = [];
    const values = [];

    sqlText = sqlText.replace(/@([a-zA-Z0-9_]+)/g, (match, paramName) => {
      let index = paramNames.indexOf(paramName);
      if (index === -1) {
        paramNames.push(paramName);
        values.push(this.params[paramName] !== undefined ? this.params[paramName] : null);
        index = paramNames.length - 1;
      }
      return `$${index + 1}`;
    });

    if (returningClause && !/RETURNING/i.test(sqlText)) {
      sqlText = `${sqlText.trim()}${returningClause}`;
    }

    const res = await this.pgPool.query(sqlText, values);
    return {
      recordset: res.rows,
      recordsets: [res.rows],
      rowsAffected: [res.rowCount],
      rows: res.rows
    };
  }
}

class PostgresPoolAdapter {
  constructor(pgPool) {
    this.pgPool = pgPool;
  }

  request() {
    return new PostgresRequest(this.pgPool);
  }
}

async function getPool() {
  if (pool) return pool;

  // Se houver DATABASE_URL definida, conecta via PostgreSQL
  if (process.env.DATABASE_URL) {
    const isSsl = process.env.DATABASE_URL.includes('sslmode=') || process.env.NODE_ENV === 'production';
    const pgPool = new PgPool({
      connectionString: process.env.DATABASE_URL,
      ssl: isSsl ? { rejectUnauthorized: false } : false
    });
    await pgPool.query('SELECT 1');
    console.log('✅ Conectado ao PostgreSQL (Neon / Nuvem)');
    pool = new PostgresPoolAdapter(pgPool);
    return pool;
  }

  // Fallback padrão: SQL Server (mssql local)
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

  pool = await sql.connect(config);
  console.log(`✅ Conectado ao SQL Server: ${server}`);
  return pool;
}

module.exports = { getPool, sql };
