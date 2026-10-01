DROP TABLE IF EXISTS job_logs, refresh_tokens, tickets, users CASCADE;

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol           VARCHAR(10)  NOT NULL DEFAULT 'cliente'
                CHECK (rol IN ('admin', 'tecnico', 'cliente')),
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE tickets (
  id          SERIAL PRIMARY KEY,
  titulo      VARCHAR(150) NOT NULL,
  descripcion TEXT NOT NULL,
  prioridad   VARCHAR(5)  NOT NULL CHECK (prioridad IN ('alta', 'media', 'baja')),
  estado      VARCHAR(10) NOT NULL DEFAULT 'pendiente'
              CHECK (estado IN ('pendiente', 'progreso', 'resuelto')),
  cliente_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tecnico_id  INT REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  revoked    BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE job_logs (
  id         SERIAL PRIMARY KEY,
  job_id     VARCHAR(100) NOT NULL,
  cola       VARCHAR(30)  NOT NULL,
  ticket_id  INT, -- sin FK a propósito: la bitácora se conserva aunque se borre el ticket
  estado     VARCHAR(20)  NOT NULL,
  intentos   INT NOT NULL DEFAULT 0,
  detalle    TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_cliente ON tickets(cliente_id);
CREATE INDEX idx_tickets_tecnico ON tickets(tecnico_id);
CREATE INDEX idx_job_logs_ticket ON job_logs(ticket_id);
