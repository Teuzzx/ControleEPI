-- ============================================================
-- NORION - EPI Admin System
-- Database Schema for Supabase
-- ============================================================

-- 1. DEPARTMENTS (Departamentos)
-- Nome canônico: `departments` — é o que o app usa em TODAS as queries
-- (useSupabaseData.ts, Employees.tsx, Departments.tsx) e o que a RLS da
-- migration 0001 referencia. O antigo `teams`/`team_id` é reconciliado
-- pela migration 0012 em bancos já existentes.
create table departments (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  color TEXT NOT NULL DEFAULT '#6366F1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CATEGORIES (Categorias de EPI)
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '📦',
  color TEXT NOT NULL DEFAULT '#6366F1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EMPLOYEES (Colaboradores)
CREATE TABLE employees (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  phone TEXT DEFAULT '',
  registration TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT '',
  -- Coluna canônica: `department_id` (é o nome que o app lê e escreve).
  -- `team_id` foi o nome original e é reconciliado pela migration 0012.
  department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL,
  sector TEXT DEFAULT '',
  company TEXT DEFAULT 'Norion',
  admission_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  notes TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EPIS (Produtos / Itens de EPI)
CREATE TABLE epis (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  subcategory TEXT DEFAULT '',
  manufacturer TEXT DEFAULT '',
  supplier TEXT DEFAULT '',
  description TEXT DEFAULT '',
  ca_number TEXT DEFAULT '',
  batch_number TEXT DEFAULT '',
  manufacturing_date DATE,
  total_quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 0,
  location TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. EPI VARIANTS (Variações por cor/tamanho)
CREATE TABLE epi_variants (
  id BIGSERIAL PRIMARY KEY,
  epi_id BIGINT NOT NULL REFERENCES epis(id) ON DELETE CASCADE,
  color TEXT DEFAULT '',
  size TEXT DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MOVEMENTS (Movimentações)
CREATE TABLE movements (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('Entrega', 'Devolução', 'Troca', 'Entrada', 'Baixa')),
  employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  employee_name TEXT DEFAULT '',
  epi_id BIGINT REFERENCES epis(id) ON DELETE SET NULL,
  epi_name TEXT DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 0,
  operator TEXT DEFAULT 'Sistema Web',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. STOCK ENTRIES (Entradas de Estoque)
CREATE TABLE stock_entries (
  id BIGSERIAL PRIMARY KEY,
  epi_id BIGINT REFERENCES epis(id) ON DELETE SET NULL,
  epi_name TEXT DEFAULT '',
  manufacturer TEXT DEFAULT '',
  supplier TEXT DEFAULT '',
  batch TEXT DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 0,
  color TEXT DEFAULT '',
  size TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_employees_department_id ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_epis_category_id ON epis(category_id);
CREATE INDEX idx_epi_variants_epi_id ON epi_variants(epi_id);
CREATE INDEX idx_movements_type ON movements(type);
CREATE INDEX idx_movements_employee_id ON movements(employee_id);
CREATE INDEX idx_movements_epi_id ON movements(epi_id);
CREATE INDEX idx_movements_created_at ON movements(created_at);
CREATE INDEX idx_stock_entries_epi_id ON stock_entries(epi_id);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Departments
INSERT INTO departments (name, description, color) VALUES
  ('Operações', 'Equipe de operações e campo', '#6366F1'),
  ('Manutenção', 'Equipe de manutenção elétrica e mecânica', '#22D3EE'),
  ('Logística', 'Movimentação e transporte de materiais', '#F59E0B'),
  ('Segurança', 'Segurança patrimonial e do trabalho', '#10B981'),
  ('Engenharia', 'Projetos e obras civis', '#F43F5E');

-- Categories
INSERT INTO categories (name, description, icon, color) VALUES
  ('Proteção da Cabeça', 'Capacetes, bonés e protetores', '🪖', '#6366F1'),
  ('Proteção dos Pés', 'Botas, sapatos e calçados de segurança', '👢', '#F59E0B'),
  ('Proteção Visual', 'Óculos, viseiras e protetores faciais', '🥽', '#22D3EE'),
  ('Proteção Auditiva', 'Protetores auriculares e abafadores', '🎧', '#10B981'),
  ('Proteção Respiratória', 'Respiradores e máscaras filtrantes', '😷', '#F43F5E'),
  ('Proteção das Mãos', 'Luvas de segurança diversas', '🧤', '#8B5CF6'),
  ('Vestuário de Proteção', 'Camisas, calças, uniformes e jaquetas', '👕', '#EC4899'),
  ('Proteção contra Quedas', 'Cintos, talabartes e linhas de vida', '🔗', '#F97316');

-- Employees
INSERT INTO employees (name, cpf, phone, registration, role, department_id, sector, company, admission_date, status) VALUES
  ('Carlos Eduardo Mendes', '423.891.670-09', '(11) 98542-3317', 'MAT-00124', 'Operador de Máquinas', 1, 'Produção', 'Norion', '2021-03-15', 'Ativo'),
  ('Juliana Ferreira Costa', '518.234.790-51', '(11) 97611-8824', 'MAT-00127', 'Técnico de Segurança', 4, 'SSO', 'Norion', '2020-07-01', 'Ativo'),
  ('Rafael Souza Almeida', '742.035.180-72', '(21) 99827-4419', 'MAT-00131', 'Eletricista', 2, 'Manutenção', 'Norion', '2022-01-10', 'Ativo'),
  ('Fernanda Lima Oliveira', '635.127.490-88', '(11) 98234-5500', 'MAT-00135', 'Auxiliar de Almoxarifado', 3, 'Logística', 'Norion', '2023-04-18', 'Ativo'),
  ('Marcos Vinicius Rodrigues', '271.548.630-17', '(31) 99044-6732', 'MAT-00138', 'Mecânico Industrial', 2, 'Manutenção', 'Norion', '2019-11-22', 'Ativo'),
  ('Aline Carvalho Santos', '384.920.710-44', '(11) 97322-1189', 'MAT-00140', 'Supervisor de Campo', 1, 'Operações', 'Norion', '2018-05-30', 'Ativo'),
  ('Bruno Henrique Pereira', '196.073.850-26', '(41) 98867-3341', 'MAT-00142', 'Motorista', 3, 'Logística', 'Norion', '2021-08-14', 'Inativo'),
  ('Tatiane Moraes Nunes', '857.364.210-63', '(11) 96543-7720', 'MAT-00145', 'Engenheiro Civil', 5, 'Engenharia', 'Norion', '2022-09-05', 'Ativo'),
  ('Leandro Pinheiro Gomes', '491.762.530-98', '(85) 99123-4456', 'MAT-00148', 'Operador de Máquinas', 1, 'Produção', 'Norion', '2023-02-27', 'Ativo'),
  ('Priscila Barbosa Cunha', '324.081.960-35', '(11) 98710-6643', 'MAT-00151', 'Técnico de Segurança', 4, 'SSO', 'Norion', '2020-12-01', 'Ativo'),
  ('Diego Araujo Monteiro', '573.914.280-77', '(21) 97234-8891', 'MAT-00154', 'Eletricista', 2, 'Manutenção', 'Norion', '2021-06-20', 'Ativo'),
  ('Camila Rocha Freitas', '269.435.710-52', '(11) 99045-2278', 'MAT-00157', 'Auxiliar de Almoxarifado', 3, 'Logística', 'Norion', '2024-01-15', 'Ativo');

-- EPIs (products)
-- Note: Get category IDs dynamically after seed
DO $$
DECLARE
  cat_cabeca   BIGINT; cat_pes  BIGINT; cat_visual  BIGINT;
  cat_auditiva BIGINT; cat_resp BIGINT; cat_maos     BIGINT;
  cat_vest     BIGINT; cat_queda BIGINT;
  epi_id       BIGINT;
BEGIN
  SELECT id INTO cat_cabeca   FROM categories WHERE name = 'Proteção da Cabeça';
  SELECT id INTO cat_pes      FROM categories WHERE name = 'Proteção dos Pés';
  SELECT id INTO cat_visual   FROM categories WHERE name = 'Proteção Visual';
  SELECT id INTO cat_auditiva FROM categories WHERE name = 'Proteção Auditiva';
  SELECT id INTO cat_resp     FROM categories WHERE name = 'Proteção Respiratória';
  SELECT id INTO cat_maos     FROM categories WHERE name = 'Proteção das Mãos';
  SELECT id INTO cat_vest     FROM categories WHERE name = 'Vestuário de Proteção';
  SELECT id INTO cat_queda    FROM categories WHERE name = 'Proteção contra Quedas';

  -- Capacete de Segurança ABS
  INSERT INTO epis (name, category_id, subcategory, manufacturer, supplier, description, ca_number, batch_number, manufacturing_date, total_quantity, min_quantity, location)
  VALUES ('Capacete de Segurança ABS', cat_cabeca, 'Capacete', '3M', 'Safety Plus Ltda', 'Capacete de segurança em ABS, classe B, com carneira de nylon ajustável.', 'CA-34536', 'L2024-001', '2024-01-10', 245, 50, 'Prateleira A-01')
  RETURNING id INTO epi_id;
  INSERT INTO epi_variants (epi_id, color, size, quantity, min_quantity) VALUES (epi_id, 'Branco', 'Único', 120, 25), (epi_id, 'Amarelo', 'Único', 85, 20), (epi_id, 'Laranja', 'Único', 40, 10);

  -- Bota de Segurança Couro
  INSERT INTO epis (name, category_id, subcategory, manufacturer, supplier, description, ca_number, batch_number, manufacturing_date, total_quantity, min_quantity, location)
  VALUES ('Bota de Segurança Couro', cat_pes, 'Bota', 'Krusher', 'EPIs Sul S.A.', 'Bota de segurança em couro bovino, biqueira de aço, solado antiderrapante.', 'CA-28910', 'L2024-018', '2024-02-05', 388, 60, 'Prateleira B-03')
  RETURNING id INTO epi_id;
  INSERT INTO epi_variants (epi_id, color, size, quantity, min_quantity) VALUES
    (epi_id, 'Preto', '38', 45, 8), (epi_id, 'Preto', '40', 80, 12), (epi_id, 'Preto', '42', 95, 15),
    (epi_id, 'Preto', '44', 88, 12), (epi_id, 'Preto', '46', 80, 8);

  -- Camisa Operacional FR
  INSERT INTO epis (name, category_id, subcategory, manufacturer, supplier, description, batch_number, manufacturing_date, total_quantity, min_quantity, location)
  VALUES ('Camisa Operacional FR', cat_vest, 'Camisa', 'Tecbrasil', 'Uniformes Pro Ltda', 'Camisa flame resistant, tecido 100% algodão, manga longa, logomarca bordada.', 'L2024-022', '2024-01-20', 620, 100, 'Prateleira C-02')
  RETURNING id INTO epi_id;
  INSERT INTO epi_variants (epi_id, color, size, quantity, min_quantity) VALUES
    (epi_id, 'Azul Royal', 'P', 95, 20), (epi_id, 'Azul Royal', 'M', 140, 25), (epi_id, 'Azul Royal', 'G', 125, 25),
    (epi_id, 'Azul Royal', 'GG', 70, 15), (epi_id, 'Laranja', 'P', 55, 10), (epi_id, 'Laranja', 'M', 80, 12),
    (epi_id, 'Laranja', 'G', 55, 10);

  -- Óculos de Proteção Ampla Visão
  INSERT INTO epis (name, category_id, subcategory, manufacturer, supplier, description, ca_number, batch_number, manufacturing_date, total_quantity, min_quantity, location)
  VALUES ('Óculos de Proteção Ampla Visão', cat_visual, 'Óculos', 'Carbografite', 'Safety Plus Ltda', 'Óculos de segurança ampla visão, lente incolor, resistente a impactos.', 'CA-10364', 'L2024-005', '2023-11-15', 38, 50, 'Prateleira A-04')
  RETURNING id INTO epi_id;
  INSERT INTO epi_variants (epi_id, color, size, quantity, min_quantity) VALUES (epi_id, 'Transparente', 'Único', 38, 50);

  -- Luva de Vaqueta
  INSERT INTO epis (name, category_id, subcategory, manufacturer, supplier, description, ca_number, batch_number, manufacturing_date, total_quantity, min_quantity, location)
  VALUES ('Luva de Vaqueta', cat_maos, 'Luva', 'Danny', 'Safety Plus Ltda', 'Luva de couro vaqueta, punho médio, para trabalhos gerais.', 'CA-15821', 'L2024-031', '2024-03-01', 312, 60, 'Prateleira D-01')
  RETURNING id INTO epi_id;
  INSERT INTO epi_variants (epi_id, color, size, quantity, min_quantity) VALUES
    (epi_id, 'Natural', 'P', 72, 15), (epi_id, 'Natural', 'M', 120, 20), (epi_id, 'Natural', 'G', 80, 15), (epi_id, 'Natural', 'GG', 40, 10);

  -- Respirador PFF2 Sem Válvula
  INSERT INTO epis (name, category_id, subcategory, manufacturer, supplier, description, ca_number, batch_number, manufacturing_date, total_quantity, min_quantity, location)
  VALUES ('Respirador PFF2 Sem Válvula', cat_resp, 'Respirador', '3M', 'Safety Plus Ltda', 'Máscara respiratória PFF2, filtragem de 94%, sem válvula exalatória.', 'CA-4470', 'L2024-009', '2024-02-10', 12, 100, 'Prateleira A-02')
  RETURNING id INTO epi_id;
  INSERT INTO epi_variants (epi_id, color, size, quantity, min_quantity) VALUES (epi_id, 'Branco', 'Único', 12, 100);

  -- Calça Operacional
  INSERT INTO epis (name, category_id, subcategory, manufacturer, supplier, description, batch_number, manufacturing_date, total_quantity, min_quantity, location)
  VALUES ('Calça Operacional', cat_vest, 'Calça', 'Tecbrasil', 'Uniformes Pro Ltda', 'Calça operacional em brim reforçado, elástico na cintura, bolso utilitário.', 'L2024-025', '2024-01-25', 480, 80, 'Prateleira C-04')
  RETURNING id INTO epi_id;
  INSERT INTO epi_variants (epi_id, color, size, quantity, min_quantity) VALUES
    (epi_id, 'Azul Marinho', '36', 55, 10), (epi_id, 'Azul Marinho', '38', 90, 15), (epi_id, 'Azul Marinho', '40', 120, 18),
    (epi_id, 'Azul Marinho', '42', 110, 18), (epi_id, 'Azul Marinho', '44', 75, 12), (epi_id, 'Azul Marinho', '46', 30, 7);

  -- Protetor Auricular Espuma
  INSERT INTO epis (name, category_id, subcategory, manufacturer, supplier, description, ca_number, batch_number, manufacturing_date, total_quantity, min_quantity, location)
  VALUES ('Protetor Auricular Espuma', cat_auditiva, 'Protetor', '3M', 'Safety Plus Ltda', 'Protetor auricular de inserção em espuma expansível, NRRsf 23dB.', 'CA-5674', 'L2024-011', '2024-01-05', 1200, 200, 'Prateleira E-01')
  RETURNING id INTO epi_id;
  INSERT INTO epi_variants (epi_id, color, size, quantity, min_quantity) VALUES (epi_id, 'Laranja', 'Único', 1200, 200);
END $$;

-- Movements
INSERT INTO movements (type, employee_name, epi_name, quantity, operator, notes, created_at) VALUES
  ('Entrega', 'Carlos Eduardo Mendes', 'Capacete de Segurança ABS', 1, 'App Mobile', 'Entrega inicial', '2024-03-15 09:22'),
  ('Entrega', 'Rafael Souza Almeida', 'Bota de Segurança Couro', 1, 'App Mobile', NULL, '2024-03-15 10:05'),
  ('Devolução', 'Bruno Henrique Pereira', 'Camisa Operacional FR', 2, 'App Mobile', 'Desligamento', '2024-03-15 11:30'),
  ('Entrega', 'Leandro Pinheiro Gomes', 'Luva de Vaqueta', 2, 'App Mobile', NULL, '2024-03-15 14:00'),
  ('Troca', 'Aline Carvalho Santos', 'Calça Operacional', 1, 'App Mobile', 'Troca de tamanho G para GG', '2024-03-14 08:45'),
  ('Entrada', '—', 'Respirador PFF2 Sem Válvula', 500, 'Sistema Web', NULL, '2024-03-14 07:30'),
  ('Entrega', 'Priscila Barbosa Cunha', 'Óculos de Proteção Ampla Visão', 1, 'App Mobile', NULL, '2024-03-13 13:15'),
  ('Baixa', '—', 'Capacete de Segurança ABS', 3, 'Sistema Web', 'Itens danificados', '2024-03-13 16:00'),
  ('Entrega', 'Diego Araujo Monteiro', 'Protetor Auricular Espuma', 10, 'App Mobile', NULL, '2024-03-12 09:00'),
  ('Devolução', 'Marcos Vinicius Rodrigues', 'Luva de Vaqueta', 1, 'App Mobile', 'Luva rasgada, substituída', '2024-03-12 17:20');

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_epis_updated_at BEFORE UPDATE ON epis FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_epi_variants_updated_at BEFORE UPDATE ON epi_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
