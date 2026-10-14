const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Carrega .env.local da raiz se existir
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERRO: DATABASE_URL não definida.');
  process.exit(1);
}

async function setup() {
  console.log('Conectando ao Neon PostgreSQL...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso!');

    const sqlPath = path.resolve(__dirname, '../../../banco_postgres.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executando banco_postgres.sql...');
    await client.query(sql);
    console.log('✅ Tabelas e dados iniciais criados com sucesso no Neon!');

    // Verifica tabelas criadas
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('Tabelas encontradas:');
    res.rows.forEach(r => console.log(' - ' + r.table_name));

    const users = await client.query('SELECT id, nome, email, perfil FROM Usuarios;');
    console.log('Usuários cadastrados:', users.rows);

  } catch (err) {
    console.error('❌ Erro ao configurar banco no Neon:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setup();
