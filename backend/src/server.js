const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',      require('./routes/auth.routes'));
app.use('/api/usuarios',  require('./routes/usuario.routes'));
app.use('/api/processos', require('./routes/processo.routes'));
app.use('/api/etapas',    require('./routes/etapa.routes'));
app.use('/api/tarefas',   require('./routes/tarefa.routes'));
app.use('/api/historico', require('./routes/historico.routes'));
app.use('/api/campos',    require('./routes/campo.routes'));
app.use('/api/export',    require('./routes/export.routes'));
app.use('/api/chatbot',   require('./routes/chatbot.routes'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'Vinculum API' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Vinculum API rodando em http://localhost:${PORT}`));
