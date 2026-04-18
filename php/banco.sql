-- =============================================
-- BANCO DE DADOS: OUVIDORIA EEEP Dom Walfrido
-- Execute este script para criar as tabelas
-- =============================================

CREATE DATABASE IF NOT EXISTS ouvidoria_eeep
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ouvidoria_eeep;

-- Tabela de usuários (alunos e colaboradores)
CREATE TABLE IF NOT EXISTS usuarios (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nome        VARCHAR(150) NOT NULL,
    cpf         VARCHAR(14) UNIQUE NOT NULL,
    email       VARCHAR(150) UNIQUE NOT NULL,
    telefone    VARCHAR(20),
    senha       VARCHAR(255) NOT NULL,
    tipo        ENUM('aluno', 'colaborador', 'admin') DEFAULT 'aluno',
    criado_em   DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de manifestações
CREATE TABLE IF NOT EXISTS manifestacoes (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    protocolo     VARCHAR(20) UNIQUE NOT NULL,
    usuario_id    INT NULL,
    tipo          ENUM('Reclamação','Sugestão','Denúncia','Elogio') NOT NULL,
    assunto       VARCHAR(200) NOT NULL,
    descricao     TEXT NOT NULL,
    status        ENUM('Recebido','Em análise','Em andamento','Concluído','Arquivado') DEFAULT 'Recebido',
    anonimo       TINYINT(1) DEFAULT 0,
    criado_em     DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de respostas/histórico
CREATE TABLE IF NOT EXISTS respostas (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    manifestacao_id  INT NOT NULL,
    texto            TEXT NOT NULL,
    autor            VARCHAR(150) DEFAULT 'Equipe Ouvidoria',
    criado_em        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manifestacao_id) REFERENCES manifestacoes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ATENÇÃO: NÃO insira usuários de teste diretamente aqui com senha em texto plano.
-- Execute o arquivo php/setup_teste.php pelo navegador UMA VEZ após importar este SQL.
-- Ele criará os usuários de teste com o hash bcrypt correto gerado pelo próprio PHP.

