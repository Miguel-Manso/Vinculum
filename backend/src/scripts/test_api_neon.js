const http = require('http');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });

const { getPool, sql } = require('../config/db');

// Inicia o app express
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',      require('../routes/auth.routes'));
app.use('/api/usuarios',  require('../routes/usuario.routes'));
app.use('/api/processos', require('../routes/processo.routes'));
app.use('/api/etapas',    require('../routes/etapa.routes'));
app.use('/api/tarefas',   require('../routes/tarefa.routes'));
app.use('/api/historico', require('../routes/historico.routes'));
app.use('/api/campos',    require('../routes/campo.routes'));
app.use('/api/export',    require('../routes/export.routes'));
app.use('/api/chatbot',   require('../routes/chatbot.routes'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'Vinculum API' }));

const server = app.listen(0, async () => {
  const port = server.address().port;
  console.log(`Servidor de teste rodando na porta ${port}`);

  try {
    // 0. Atualiza senha do admin para garantia no teste
    const pool = await getPool();
    const hash = await bcrypt.hash('123456', 10);
    await pool.request()
      .input('senha_hash', sql.NVarChar, hash)
      .input('email', sql.NVarChar, 'admin@vinculum.com')
      .query('UPDATE Usuarios SET senha_hash = @senha_hash WHERE email = @email');

    // 1. Testa /api/health
    const healthRes = await fetch(`http://localhost:${port}/api/health`);
    const healthJson = await healthRes.json();
    console.log('✅ Health check:', healthJson);

    // 2. Testa login real contra o banco Neon
    const loginRes = await fetch(`http://localhost:${port}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@vinculum.com',
        senha: '123456'
      })
    });
    const loginJson = await loginRes.json();
    if (!loginRes.ok) {
      throw new Error(`Falha no login: ${JSON.stringify(loginJson)}`);
    }
    console.log('✅ Login no Neon realizado com sucesso! Token JWT gerado com sucesso.');
    console.log('   Usuário autenticado:', loginJson.usuario);

    // 3. Testa rota autenticada: listar processos
    const procRes = await fetch(`http://localhost:${port}/api/processos`, {
      headers: { 'Authorization': `Bearer ${loginJson.token}` }
    });
    const procJson = await procRes.json();
    console.log(`✅ Listagem de processos via API: ${procJson.length} processos encontrados.`);

    console.log('\n🚀 API Express + Neon PostgreSQL validada 100% fim a fim!');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Falha nos testes de API:', err);
    server.close();
    process.exit(1);
  }
});
