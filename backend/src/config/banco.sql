-- Vinculum: script de criação do banco
-- Execute no SSMS

CREATE DATABASE vinculum;
GO
USE vinculum;
GO

CREATE TABLE Usuarios (
  id INT IDENTITY(1,1) PRIMARY KEY,
  nome NVARCHAR(100) NOT NULL,
  email NVARCHAR(150) NOT NULL UNIQUE,
  senha_hash NVARCHAR(255) NOT NULL,
  criado_em DATETIME DEFAULT GETDATE()
);

CREATE TABLE Processos (
  id INT IDENTITY(1,1) PRIMARY KEY,
  nome NVARCHAR(150) NOT NULL,
  descricao NVARCHAR(MAX),
  criado_por INT REFERENCES Usuarios(id),
  criado_em DATETIME DEFAULT GETDATE()
);

CREATE TABLE Etapas (
  id INT IDENTITY(1,1) PRIMARY KEY,
  nome NVARCHAR(100) NOT NULL,
  ordem INT NOT NULL,
  processo_id INT NOT NULL REFERENCES Processos(id) ON DELETE CASCADE,
  criado_em DATETIME DEFAULT GETDATE()
);

CREATE TABLE Tarefas (
  id INT IDENTITY(1,1) PRIMARY KEY,
  titulo NVARCHAR(200) NOT NULL,
  descricao NVARCHAR(MAX),
  etapa_id INT NOT NULL REFERENCES Etapas(id),
  responsavel_id INT REFERENCES Usuarios(id),
  prazo DATE,
  criado_em DATETIME DEFAULT GETDATE()
);

CREATE TABLE Historico (
  id INT IDENTITY(1,1) PRIMARY KEY,
  tarefa_id INT NOT NULL REFERENCES Tarefas(id) ON DELETE CASCADE,
  usuario_id INT REFERENCES Usuarios(id),
  descricao NVARCHAR(500) NOT NULL,
  criado_em DATETIME DEFAULT GETDATE()
);
