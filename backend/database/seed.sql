-- Usuarios de prueba. Contraseña de todos: Galacticos2026
INSERT INTO users (nombre, email, password_hash, rol) VALUES
  ('Administrador',  'admin@galacticos.test',   '$2b$10$qDHwz0pSPvSx.W/OdzBj2u.jg00dWQHsfnL.3ooL2709GgEex98Ie', 'admin'),
  ('Carlos Técnico', 'carlos@galacticos.test',  '$2b$10$qDHwz0pSPvSx.W/OdzBj2u.jg00dWQHsfnL.3ooL2709GgEex98Ie', 'tecnico'),
  ('Ana Técnica',    'ana@galacticos.test',     '$2b$10$qDHwz0pSPvSx.W/OdzBj2u.jg00dWQHsfnL.3ooL2709GgEex98Ie', 'tecnico'),
  ('Cliente Demo',   'cliente@galacticos.test', '$2b$10$qDHwz0pSPvSx.W/OdzBj2u.jg00dWQHsfnL.3ooL2709GgEex98Ie', 'cliente');
