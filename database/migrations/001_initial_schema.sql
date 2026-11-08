CREATE TABLE usuarios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(160) NOT NULL,
  email VARCHAR(254) NOT NULL,
  senha VARCHAR(255) NOT NULL,
  cpf CHAR(11) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email),
  UNIQUE KEY uq_usuarios_cpf (cpf)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE clientes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(160) NOT NULL,
  cpf CHAR(11) NOT NULL,
  telefone VARCHAR(24) NOT NULL,
  email VARCHAR(254) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_clientes_cpf (cpf),
  KEY idx_clientes_nome (nome),
  KEY idx_clientes_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE motocicletas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cliente_id BIGINT UNSIGNED NOT NULL,
  marca VARCHAR(100) NOT NULL,
  modelo VARCHAR(120) NOT NULL,
  ano SMALLINT UNSIGNED NOT NULL,
  placa CHAR(7) NOT NULL,
  cor VARCHAR(60) NULL,
  cilindrada_cc INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_motocicletas_placa (placa),
  KEY idx_motocicletas_cliente (cliente_id),
  KEY idx_motocicletas_marca_modelo (marca, modelo),
  KEY idx_motocicletas_ano (ano),
  CONSTRAINT fk_motocicletas_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_motocicletas_ano CHECK (ano BETWEEN 1885 AND 2100),
  CONSTRAINT chk_motocicletas_cilindrada CHECK (cilindrada_cc > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE servicos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(160) NOT NULL,
  descricao TEXT NOT NULL,
  preco DECIMAL(12,2) NOT NULL,
  duracao_estimada SMALLINT UNSIGNED NOT NULL COMMENT 'Duração em minutos',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_servicos_nome (nome),
  KEY idx_servicos_ativo (ativo),
  CONSTRAINT chk_servicos_preco CHECK (preco > 0),
  CONSTRAINT chk_servicos_duracao CHECK (duracao_estimada > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE ordens_servico (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  motocicleta_id BIGINT UNSIGNED NOT NULL,
  descricao TEXT NOT NULL,
  status ENUM('ABERTA','EM_ANDAMENTO','AGUARDANDO_APROVACAO','CONCLUIDA','CANCELADA') NOT NULL DEFAULT 'ABERTA',
  valor_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  data_abertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_conclusao TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ordens_motocicleta (motocicleta_id),
  KEY idx_ordens_status_data (status, data_abertura),
  CONSTRAINT fk_ordens_motocicleta FOREIGN KEY (motocicleta_id) REFERENCES motocicletas (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_ordens_valor CHECK (valor_total >= 0),
  CONSTRAINT chk_ordens_conclusao CHECK ((status = 'CONCLUIDA' AND data_conclusao IS NOT NULL) OR (status <> 'CONCLUIDA' AND data_conclusao IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE ordem_servico_itens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ordem_servico_id BIGINT UNSIGNED NOT NULL,
  servico_id BIGINT UNSIGNED NOT NULL,
  quantidade SMALLINT UNSIGNED NOT NULL,
  preco_aplicado DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ordem_servico_item (ordem_servico_id, servico_id),
  KEY idx_itens_servico (servico_id),
  CONSTRAINT fk_itens_ordem FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_itens_servico FOREIGN KEY (servico_id) REFERENCES servicos (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_itens_quantidade CHECK (quantidade > 0),
  CONSTRAINT chk_itens_preco CHECK (preco_aplicado > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE ordem_servico_aprovacao (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ordem_servico_id BIGINT UNSIGNED NOT NULL,
  status_decisao ENUM('PENDENTE','APROVADA','REJEITADA') NOT NULL DEFAULT 'PENDENTE',
  data_solicitacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_decisao TIMESTAMP NULL DEFAULT NULL,
  funcionario_responsavel_id BIGINT UNSIGNED NULL,
  observacao VARCHAR(1000) NULL,
  PRIMARY KEY (id),
  KEY idx_aprovacao_ordem_status (ordem_servico_id, status_decisao, id),
  KEY idx_aprovacao_funcionario (funcionario_responsavel_id),
  CONSTRAINT fk_aprovacao_ordem FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_aprovacao_funcionario FOREIGN KEY (funcionario_responsavel_id) REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_aprovacao_decisao CHECK ((status_decisao = 'PENDENTE' AND data_decisao IS NULL) OR (status_decisao <> 'PENDENTE' AND data_decisao IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE ordem_servico_historico (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ordem_servico_id BIGINT UNSIGNED NOT NULL,
  status_anterior ENUM('ABERTA','EM_ANDAMENTO','AGUARDANDO_APROVACAO','CONCLUIDA','CANCELADA') NULL,
  status_novo ENUM('ABERTA','EM_ANDAMENTO','AGUARDANDO_APROVACAO','CONCLUIDA','CANCELADA') NOT NULL,
  data_alteracao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  funcionario_responsavel_id BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY idx_historico_ordem_data (ordem_servico_id, data_alteracao),
  KEY idx_historico_funcionario (funcionario_responsavel_id),
  CONSTRAINT fk_historico_ordem FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_historico_funcionario FOREIGN KEY (funcionario_responsavel_id) REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
