const { getPool, sql } = require('../config/db');

async function migrarSetores() {
  console.log('🔄 Iniciando migração de Setores e Permissões Organizacionais...');
  const pool = await getPool();

  try {
    // 1. Criar tabela Setores
    try {
      await pool.request().query(`
        CREATE TABLE IF NOT EXISTS Setores (
          id        SERIAL PRIMARY KEY,
          nome      VARCHAR(100) NOT NULL,
          descricao TEXT,
          cor       VARCHAR(20) DEFAULT '#2fd9f4',
          icone     VARCHAR(40) DEFAULT 'folder',
          criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Tabela "Setores" verificada/criada com sucesso.');
    } catch (errTable) {
      // Fallback para sintaxe T-SQL (SQL Server) caso não seja Postgres
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Setores' AND xtype='U')
        CREATE TABLE Setores (
          id        INT IDENTITY(1,1) PRIMARY KEY,
          nome      NVARCHAR(100) NOT NULL,
          descricao NVARCHAR(MAX),
          cor       NVARCHAR(20) DEFAULT '#2fd9f4',
          icone     NVARCHAR(40) DEFAULT 'folder',
          criado_em DATETIME DEFAULT GETDATE()
        )
      `);
      console.log('✅ Tabela "Setores" verificada/criada com sucesso (SQL Server).');
    }

    // 2. Criar tabela UsuarioSetores
    try {
      await pool.request().query(`
        CREATE TABLE IF NOT EXISTS UsuarioSetores (
          usuario_id INT NOT NULL REFERENCES Usuarios(id) ON DELETE CASCADE,
          setor_id   INT NOT NULL REFERENCES Setores(id) ON DELETE CASCADE,
          PRIMARY KEY (usuario_id, setor_id)
        )
      `);
      console.log('✅ Tabela "UsuarioSetores" verificada/criada com sucesso.');
    } catch (errRel) {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UsuarioSetores' AND xtype='U')
        CREATE TABLE UsuarioSetores (
          usuario_id INT NOT NULL REFERENCES Usuarios(id) ON DELETE CASCADE,
          setor_id   INT NOT NULL REFERENCES Setores(id) ON DELETE CASCADE,
          PRIMARY KEY (usuario_id, setor_id)
        )
      `);
      console.log('✅ Tabela "UsuarioSetores" verificada/criada com sucesso (SQL Server).');
    }

    // 3. Adicionar coluna setor_id em Processos se não existir
    try {
      await pool.request().query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'processos' AND column_name = 'setor_id'
          ) THEN
            ALTER TABLE Processos ADD COLUMN setor_id INT REFERENCES Setores(id) ON DELETE SET NULL;
          END IF;
        END $$;
      `);
      console.log('✅ Coluna "setor_id" verificada/adicionada em Processos (Postgres).');
    } catch (errCol) {
      // Fallback para SQL Server ou caso o adapter não suporte bloco DO $$
      try {
        await pool.request().query(`
          IF NOT EXISTS (
            SELECT * FROM sys.columns 
            WHERE object_id = OBJECT_ID('Processos') AND name = 'setor_id'
          )
          ALTER TABLE Processos ADD setor_id INT NULL REFERENCES Setores(id) ON DELETE SET NULL;
        `);
        console.log('✅ Coluna "setor_id" verificada/adicionada em Processos (SQL Server).');
      } catch (errColFallback) {
        // Tenta um ALTER TABLE simples se as verificações falharem
        try {
          await pool.request().query('ALTER TABLE Processos ADD COLUMN setor_id INT REFERENCES Setores(id) ON DELETE SET NULL');
          console.log('✅ Coluna "setor_id" adicionada em Processos.');
        } catch (alreadyExists) {
          console.log('ℹ️ Coluna "setor_id" já existe em Processos.');
        }
      }
    }

    // 4. Criar Setor padrão inicial "Geral / Administrativo" se não houver nenhum setor
    const setoresRes = await pool.request().query('SELECT id, nome FROM Setores');
    let setorPadraoId = null;

    if (setoresRes.recordset && setoresRes.recordset.length > 0) {
      setorPadraoId = setoresRes.recordset[0].id;
      console.log(`ℹ️ Setores já existentes detectados. Primeiro setor ID: ${setorPadraoId} ("${setoresRes.recordset[0].nome}")`);
    } else {
      console.log('🌱 Criando setor padrão inicial "Geral / Administrativo"...');
      const insSetor = await pool.request()
        .input('nome', sql.NVarChar, 'Geral / Administrativo')
        .input('descricao', sql.NVarChar, 'Setor corporativo principal do Vinculum')
        .input('cor', sql.NVarChar, '#2fd9f4')
        .input('icone', sql.NVarChar, 'folder')
        .query('INSERT INTO Setores (nome, descricao, cor, icone) OUTPUT INSERTED.id VALUES (@nome, @descricao, @cor, @icone)');

      setorPadraoId = insSetor.recordset[0]?.id;
      console.log(`✅ Setor padrão criado com ID ${setorPadraoId}.`);
    }

    // 5. Vincular processos sem setor_id ao setor padrão
    if (setorPadraoId) {
      const updProcessos = await pool.request()
        .input('setor_id', sql.Int, setorPadraoId)
        .query('UPDATE Processos SET setor_id = @setor_id WHERE setor_id IS NULL');
      
      console.log(`✅ Processos legados atualizados com setor_id = ${setorPadraoId} (afetados: ${updProcessos.rowsAffected?.[0] ?? 0}).`);

      // 6. Associar todos os usuários existentes ao setor padrão para não quebrar acessos
      const usuariosRes = await pool.request().query('SELECT id FROM Usuarios');
      const usuarios = usuariosRes.recordset || [];

      for (const u of usuarios) {
        try {
          await pool.request()
            .input('usuario_id', sql.Int, u.id)
            .input('setor_id', sql.Int, setorPadraoId)
            .query(`
              INSERT INTO UsuarioSetores (usuario_id, setor_id)
              SELECT @usuario_id, @setor_id
              WHERE NOT EXISTS (
                SELECT 1 FROM UsuarioSetores WHERE usuario_id = @usuario_id AND setor_id = @setor_id
              )
            `);
        } catch (linkErr) {
          // Ignora caso já esteja vinculado
        }
      }
      console.log(`✅ Vínculos de usuários ao setor padrão garantidos para ${usuarios.length} usuários.`);
    }

    console.log('🎉 Migração de Setores concluída com sucesso!');
    return true;
  } catch (err) {
    console.error('❌ Erro durante a migração de setores:', err);
    throw err;
  }
}

if (require.main === module) {
  migrarSetores()
    .then(() => {
      console.log('Migração finalizada.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Falha na migração:', err);
      process.exit(1);
    });
}

module.exports = { migrarSetores };
