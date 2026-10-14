const { getPool, sql } = require('../config/db');

async function exportarCSV(req, res) {
  try {
    const pool = await getPool();
    const isAdmin = req.usuario?.perfil === 'admin' || req.usuario?.email === 'admin@vinculum.com';
    const usuarioId = req.usuario?.id;
    const { setor_id } = req.query;

    let query = `
      SELECT s.nome AS setor, p.nome AS processo, e.nome AS etapa, t.titulo AS tarefa,
             t.prazo, t.campos_personalizados, t.criado_em
      FROM Tarefas t
      JOIN Etapas e ON t.etapa_id = e.id
      JOIN Processos p ON e.processo_id = p.id
      LEFT JOIN Setores s ON p.setor_id = s.id
    `;

    const whereClauses = [];
    const request = pool.request();

    if (!isAdmin) {
      whereClauses.push(`p.setor_id IN (SELECT us.setor_id FROM UsuarioSetores us WHERE us.usuario_id = @usuario_id)`);
      request.input('usuario_id', sql.Int, usuarioId);
    }

    if (setor_id) {
      whereClauses.push(`p.setor_id = @setor_id`);
      request.input('setor_id', sql.Int, parseInt(setor_id, 10));
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += ` ORDER BY s.nome, p.nome, e.ordem`;

    const result = await request.query(query);

    const camposRes = await pool.request().query('SELECT id, nome FROM CamposProcesso');
    const mapaCampos = {};
    (camposRes.recordset || []).forEach(c => {
      mapaCampos[c.id] = c.nome;
    });

    const cabecalho = 'Setor,Processo,Etapa,Tarefa,Campos Personalizados,Prazo,Criado em\n';
    const csv = cabecalho + (result.recordset || []).map(l => {
      let customStr = '';
      if (l.campos_personalizados) {
        try {
          const parsed = JSON.parse(l.campos_personalizados);
          customStr = Object.entries(parsed)
            .map(([k, v]) => `${mapaCampos[k] || k}: ${v}`)
            .join(' | ');
        } catch {}
      }
      const setorNome = (l.setor || 'Geral').replace(/"/g, '""');
      const processoNome = (l.processo || '').replace(/"/g, '""');
      const etapaNome = (l.etapa || '').replace(/"/g, '""');
      const tarefaNome = (l.tarefa || '').replace(/"/g, '""');

      return `"${setorNome}","${processoNome}","${etapaNome}","${tarefaNome}","${customStr.replace(/"/g, '""')}","${l.prazo ?? ''}","${l.criado_em ?? ''}"`;
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="vinculum.csv"');
    res.send('\uFEFF' + csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { exportarCSV };
