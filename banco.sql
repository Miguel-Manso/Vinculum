-- ============================================================
-- Vinculum — Gestão de Fluxo de Processos
-- Script completo de criação do banco de dados
-- SQL Server
-- ============================================================

CREATE DATABASE vinculum;
GO
USE vinculum;
GO

-- ============================================================
-- USUÁRIOS
-- Tela: Login
-- ============================================================
CREATE TABLE Usuarios (
  id         INT IDENTITY(1,1) PRIMARY KEY,
  nome       NVARCHAR(100) NOT NULL,
  email      NVARCHAR(150) NOT NULL UNIQUE,
  senha_hash NVARCHAR(255) NOT NULL,
  perfil     NVARCHAR(20) NOT NULL DEFAULT 'usuario',
  criado_em  DATETIME DEFAULT GETDATE()
);

-- ============================================================
-- PROCESSOS
-- Tela: Processos (listagem e cadastro) + Tabela
-- Um processo é o fluxo principal (ex: "Onboarding")
-- ============================================================
CREATE TABLE Processos (
  id         INT IDENTITY(1,1) PRIMARY KEY,
  nome       NVARCHAR(150) NOT NULL,
  descricao  NVARCHAR(MAX),
  criado_por INT REFERENCES Usuarios(id),
  criado_em  DATETIME DEFAULT GETDATE()
);

-- ============================================================
-- ETAPAS
-- Tela: Fluxo do Processo (colunas do kanban)
-- Ex: "A Fazer", "Em Andamento", "Concluído"
-- ============================================================
CREATE TABLE Etapas (
  id          INT IDENTITY(1,1) PRIMARY KEY,
  nome        NVARCHAR(100) NOT NULL,
  ordem       INT NOT NULL,
  processo_id INT NOT NULL REFERENCES Processos(id) ON DELETE CASCADE,
  criado_em   DATETIME DEFAULT GETDATE()
);

-- ============================================================
-- TAREFAS
-- Tela: Fluxo do Processo (cards) + Tarefa (detalhe)
-- Cada tarefa pertence a uma etapa e pode ser movida
-- ============================================================
CREATE TABLE Tarefas (
  id                   INT IDENTITY(1,1) PRIMARY KEY,
  titulo               NVARCHAR(200) NOT NULL,
  descricao            NVARCHAR(MAX),
  etapa_id             INT NOT NULL REFERENCES Etapas(id),
  responsavel_id       INT REFERENCES Usuarios(id),
  prazo                DATE,
  campos_personalizados NVARCHAR(MAX),
  urgente              BIT NOT NULL DEFAULT 0,
  criado_em            DATETIME DEFAULT GETDATE()
);

-- ============================================================
-- CAMPOS PERSONALIZADOS DO PROCESSO
-- Define campos adicionais para as tarefas do processo
-- Ex: 'Número da Requisição', 'Produto', 'Valor R$'
-- ============================================================
CREATE TABLE CamposProcesso (
  id                   INT IDENTITY(1,1) PRIMARY KEY,
  processo_id          INT NOT NULL REFERENCES Processos(id) ON DELETE CASCADE,
  nome                 NVARCHAR(100) NOT NULL,
  tipo                 NVARCHAR(30) NOT NULL, -- 'texto', 'textarea', 'numero', 'moeda', 'data', 'select', 'checkbox'
  obrigatorio          BIT NOT NULL DEFAULT 0,
  etapa_obrigatoria_id INT NULL REFERENCES Etapas(id),
  opcoes               NVARCHAR(MAX) NULL,
  ordem                INT NOT NULL DEFAULT 1,
  criado_em            DATETIME DEFAULT GETDATE()
);

-- ============================================================
-- HISTÓRICO
-- Tela: Tarefa (histórico de movimentações)
-- Registra cada alteração ou movimentação de tarefa
-- ============================================================
CREATE TABLE Historico (
  id         INT IDENTITY(1,1) PRIMARY KEY,
  tarefa_id  INT NOT NULL REFERENCES Tarefas(id) ON DELETE CASCADE,
  usuario_id INT REFERENCES Usuarios(id),
  descricao  NVARCHAR(500) NOT NULL,
  criado_em  DATETIME DEFAULT GETDATE()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IX_Processos_criado_por ON Processos (criado_por);
CREATE INDEX IX_Etapas_processo_id   ON Etapas    (processo_id);
CREATE INDEX IX_Etapas_ordem         ON Etapas    (processo_id, ordem);
CREATE INDEX IX_Tarefas_etapa_id     ON Tarefas   (etapa_id);
CREATE INDEX IX_Tarefas_responsavel  ON Tarefas   (responsavel_id);
CREATE INDEX IX_Historico_tarefa_id  ON Historico (tarefa_id);

-- ============================================================
-- DADOS INICIAIS (para testar — senha: 123456)
-- ============================================================
INSERT INTO Usuarios (nome, email, senha_hash, perfil)
VALUES (
  'Admin',
  'admin@vinculum.com',
  '$2a$10$Qs9F3oWoqNZi2STQnxcv.uOzVXLu/qIYrWjeuenjFuW7W7U6HpPSe',
  'admin'
);
GO
