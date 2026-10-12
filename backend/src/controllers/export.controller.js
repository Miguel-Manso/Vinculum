const { getPool } = require('../config/db');

async function exportarCSV(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT p.nome AS processo, e.nome AS etapa, t.titulo AS tarefa,
             t.prazo, t.campos_personalizados, t.criado_em
      FROM Tarefas t
      JOIN Etapas e ON t.etapa_id = e.id
      JOIN Processos p ON e.processo_id = p.id
      ORDER BY p.nome, e.ordem
    `);

    const camposRes = await pool.request().query('SELECT id, nome FROM CamposProcesso');
    const mapaCampos = {};
    camposRes.recordset.forEach(c => {
      mapaCampos[c.id] = c.nome;
    });

    const cabecalho = 'Processo,Etapa,Tarefa,Campos Personalizados,Prazo,Criado em\n';
    const csv = cabecalho + result.recordset.map(l => {
      let customStr = '';
      if (l.campos_personalizados) {
        try {
          const parsed = JSON.parse(l.campos_personalizados);
          customStr = Object.entries(parsed)
            .map(([k, v]) => `${mapaCampos[k] || k}: ${v}`)
            .join(' | ');
        } catch {}
      }
      return `"${l.processo}","${l.etapa}","${l.tarefa}","${customStr.replace(/"/g, '""')}","${l.prazo ?? ''}","${l.criado_em ?? ''}"`;
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="vinculum.csv"');
    res.send('\uFEFF' + csv);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

module.exports = { exportarCSV };
