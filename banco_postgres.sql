-- ============================================================
-- Vinculum — Gestão de Fluxo de Processos
-- Script para PostgreSQL (Neon.tech / Supabase)
-- ============================================================

-- USUÁRIOS
CREATE TABLE IF NOT EXISTS Usuarios (
  id         SERIAL PRIMARY KEY,
  nome       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  perfil     VARCHAR(20) NOT NULL DEFAULT 'usuario',
  criado_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SETORES (Departamentos / Workspaces)
CREATE TABLE IF NOT EXISTS Setores (
  id        SERIAL PRIMARY KEY,
  nome      VARCHAR(100) NOT NULL,
  descricao TEXT,
  cor       VARCHAR(20) DEFAULT '#2fd9f4',
  icone     VARCHAR(40) DEFAULT 'folder',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RELAÇÃO USUÁRIOS E SETORES (N:N)
CREATE TABLE IF NOT EXISTS UsuarioSetores (
  usuario_id INT NOT NULL REFERENCES Usuarios(id) ON DELETE CASCADE,
  setor_id   INT NOT NULL REFERENCES Setores(id) ON DELETE CASCADE,
  PRIMARY KEY (usuario_id, setor_id)
);

-- PROCESSOS
CREATE TABLE IF NOT EXISTS Processos (
  id         SERIAL PRIMARY KEY,
  nome       VARCHAR(150) NOT NULL,
  descricao  TEXT,
  setor_id   INT REFERENCES Setores(id) ON DELETE SET NULL,
  criado_por INT REFERENCES Usuarios(id),
  criado_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ETAPAS
CREATE TABLE IF NOT EXISTS Etapas (
  id          SERIAL PRIMARY KEY,
  nome        VARCHAR(100) NOT NULL,
  ordem       INT NOT NULL,
  processo_id INT NOT NULL REFERENCES Processos(id) ON DELETE CASCADE,
  criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TAREFAS
CREATE TABLE IF NOT EXISTS Tarefas (
  id                    SERIAL PRIMARY KEY,
  titulo                VARCHAR(200) NOT NULL,
  descricao             TEXT,
  etapa_id              INT NOT NULL REFERENCES Etapas(id) ON DELETE CASCADE,
  responsavel_id        INT REFERENCES Usuarios(id),
  prazo                 DATE,
  campos_personalizados TEXT,
  urgente               SMALLINT NOT NULL DEFAULT 0,
  criado_em             TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CAMPOS PERSONALIZADOS DO PROCESSO
CREATE TABLE IF NOT EXISTS CamposProcesso (
  id                   SERIAL PRIMARY KEY,
  processo_id          INT NOT NULL REFERENCES Processos(id) ON DELETE CASCADE,
  nome                 VARCHAR(100) NOT NULL,
  tipo                 VARCHAR(30) NOT NULL,
  obrigatorio          SMALLINT NOT NULL DEFAULT 0,
  etapa_obrigatoria_id INT NULL REFERENCES Etapas(id),
  opcoes               TEXT NULL,
  ordem                INT NOT NULL DEFAULT 1,
  criado_em            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HISTÓRICO
CREATE TABLE IF NOT EXISTS Historico (
  id         SERIAL PRIMARY KEY,
  tarefa_id  INT NOT NULL REFERENCES Tarefas(id) ON DELETE CASCADE,
  usuario_id INT REFERENCES Usuarios(id),
  descricao  VARCHAR(500) NOT NULL,
  criado_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS IX_Processos_setor_id   ON Processos (setor_id);
CREATE INDEX IF NOT EXISTS IX_Processos_criado_por ON Processos (criado_por);
CREATE INDEX IF NOT EXISTS IX_Etapas_processo_id   ON Etapas    (processo_id);
CREATE INDEX IF NOT EXISTS IX_Etapas_ordem         ON Etapas    (processo_id, ordem);
CREATE INDEX IF NOT EXISTS IX_Tarefas_etapa_id     ON Tarefas   (etapa_id);
CREATE INDEX IF NOT EXISTS IX_Tarefas_responsavel  ON Tarefas   (responsavel_id);
CREATE INDEX IF NOT EXISTS IX_Historico_tarefa_id  ON Historico (tarefa_id);

-- SETOR PADRÃO INICIAL
INSERT INTO Setores (nome, descricao, cor, icone)
SELECT 'Geral / Administrativo', 'Setor corporativo padrão do Vinculum', '#2fd9f4', 'folder'
WHERE NOT EXISTS (SELECT 1 FROM Setores);

-- USUÁRIO ADMINISTRADOR PADRÃO (admin@vinculum.com / senha: 123)
INSERT INTO Usuarios (nome, email, senha_hash, perfil)
VALUES (
  'Admin',
  'admin@vinculum.com',
  '$2a$10$Qs9F3oWoqNZi2STQnxcv.uOzVXLu/qIYrWjeuenjFuW7W7U6HpPSe',
  'admin'
) ON CONFLICT (email) DO NOTHING;
