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

-- PROCESSOS
CREATE TABLE IF NOT EXISTS Processos (
  id         SERIAL PRIMARY KEY,
  nome       VARCHAR(150) NOT NULL,
  descricao  TEXT,
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
  etapa_id              INT NOT NULL REFERENCES Etapas(id),
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
CREATE INDEX IF NOT EXISTS IX_Processos_criado_por ON Processos (criado_por);
CREATE INDEX IF NOT EXISTS IX_Etapas_processo_id   ON Etapas    (processo_id);
CREATE INDEX IF NOT EXISTS IX_Etapas_ordem         ON Etapas    (processo_id, ordem);
CREATE INDEX IF NOT EXISTS IX_Tarefas_etapa_id     ON Tarefas   (etapa_id);
CREATE INDEX IF NOT EXISTS IX_Tarefas_responsavel  ON Tarefas   (responsavel_id);
CREATE INDEX IF NOT EXISTS IX_Historico_tarefa_id  ON Historico (tarefa_id);

-- USUÁRIO ADMINISTRADOR PADRÃO (admin@vinculum.com / senha: 123)
INSERT INTO Usuarios (nome, email, senha_hash, perfil)
VALUES (
  'Admin',
  'admin@vinculum.com',
  '$2a$10$Qs9F3oWoqNZi2STQnxcv.uOzVXLu/qIYrWjeuenjFuW7W7U6HpPSe',
  'admin'
) ON CONFLICT (email) DO NOTHING;
