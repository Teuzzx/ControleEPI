export type Status = 'Ativo' | 'Inativo'

export interface Employee {
  id: number
  name: string
  cpf: string
  phone: string
  registration: string
  role: string
  team: string
  sector: string
  company: string
  admissionDate: string
  status: Status
  notes?: string
  avatar?: string
}

export interface Team {
  id: number
  name: string
  description: string
  color: string
  memberCount: number
}

export interface Role {
  id: number
  name: string
  sector: string
}

export interface Category {
  id: number
  name: string
  description: string
  icon: string
  color: string
  itemCount: number
}

export interface EpiVariant {
  id: string
  color: string
  size: string
  quantity: number
  minQuantity: number
}

export interface Epi {
  id: number
  name: string
  category: string
  subcategory: string
  manufacturer: string
  supplier: string
  description: string
  caNumber?: string
  batchNumber: string
  manufacturingDate: string
  totalQuantity: number
  minQuantity: number
  location: string
  status: 'Disponível' | 'Estoque Baixo' | 'Crítico'
  variants: EpiVariant[]
  notes?: string
}

export interface Movement {
  id: number
  type: 'Entrega' | 'Devolução' | 'Troca' | 'Entrada' | 'Baixa'
  employee: string
  epi: string
  quantity: number
  date: string
  operator: string
  notes?: string
}

export interface StockEntry {
  id: number
  epi: string
  manufacturer: string
  supplier: string
  batch: string
  date: string
  quantity: number
  color?: string
  size?: string
  notes?: string
}

// ── Mock Data ──────────────────────────────────────────────────────────

export const teams: Team[] = [
  { id: 1, name: 'Operações', description: 'Equipe de operações e campo', color: '#6366F1', memberCount: 24 },
  { id: 2, name: 'Manutenção', description: 'Equipe de manutenção elétrica e mecânica', color: '#22D3EE', memberCount: 18 },
  { id: 3, name: 'Logística', description: 'Movimentação e transporte de materiais', color: '#F59E0B', memberCount: 12 },
  { id: 4, name: 'Segurança', description: 'Segurança patrimonial e do trabalho', color: '#10B981', memberCount: 9 },
  { id: 5, name: 'Engenharia', description: 'Projetos e obras civis', color: '#F43F5E', memberCount: 7 },
]

export const roles: Role[] = [
  { id: 1, name: 'Operador de Máquinas', sector: 'Produção' },
  { id: 2, name: 'Eletricista', sector: 'Manutenção' },
  { id: 3, name: 'Mecânico Industrial', sector: 'Manutenção' },
  { id: 4, name: 'Motorista', sector: 'Logística' },
  { id: 5, name: 'Auxiliar de Almoxarifado', sector: 'Logística' },
  { id: 6, name: 'Técnico de Segurança', sector: 'SSO' },
  { id: 7, name: 'Engenheiro Civil', sector: 'Engenharia' },
  { id: 8, name: 'Supervisor de Campo', sector: 'Operações' },
]

export const employees: Employee[] = [
  { id: 1, name: 'Carlos Eduardo Mendes', cpf: '423.891.670-09', phone: '(11) 98542-3317', registration: 'MAT-00124', role: 'Operador de Máquinas', team: 'Operações', sector: 'Produção', company: 'Infratech S.A.', admissionDate: '2021-03-15', status: 'Ativo' },
  { id: 2, name: 'Juliana Ferreira Costa', cpf: '518.234.790-51', phone: '(11) 97611-8824', registration: 'MAT-00127', role: 'Técnico de Segurança', team: 'Segurança', sector: 'SSO', company: 'Infratech S.A.', admissionDate: '2020-07-01', status: 'Ativo' },
  { id: 3, name: 'Rafael Souza Almeida', cpf: '742.035.180-72', phone: '(21) 99827-4419', registration: 'MAT-00131', role: 'Eletricista', team: 'Manutenção', sector: 'Manutenção', company: 'Infratech S.A.', admissionDate: '2022-01-10', status: 'Ativo' },
  { id: 4, name: 'Fernanda Lima Oliveira', cpf: '635.127.490-88', phone: '(11) 98234-5500', registration: 'MAT-00135', role: 'Auxiliar de Almoxarifado', team: 'Logística', sector: 'Logística', company: 'Infratech S.A.', admissionDate: '2023-04-18', status: 'Ativo' },
  { id: 5, name: 'Marcos Vinicius Rodrigues', cpf: '271.548.630-17', phone: '(31) 99044-6732', registration: 'MAT-00138', role: 'Mecânico Industrial', team: 'Manutenção', sector: 'Manutenção', company: 'Infratech S.A.', admissionDate: '2019-11-22', status: 'Ativo' },
  { id: 6, name: 'Aline Carvalho Santos', cpf: '384.920.710-44', phone: '(11) 97322-1189', registration: 'MAT-00140', role: 'Supervisor de Campo', team: 'Operações', sector: 'Operações', company: 'Infratech S.A.', admissionDate: '2018-05-30', status: 'Ativo' },
  { id: 7, name: 'Bruno Henrique Pereira', cpf: '196.073.850-26', phone: '(41) 98867-3341', registration: 'MAT-00142', role: 'Motorista', team: 'Logística', sector: 'Logística', company: 'Infratech S.A.', admissionDate: '2021-08-14', status: 'Inativo' },
  { id: 8, name: 'Tatiane Moraes Nunes', cpf: '857.364.210-63', phone: '(11) 96543-7720', registration: 'MAT-00145', role: 'Engenheiro Civil', team: 'Engenharia', sector: 'Engenharia', company: 'Infratech S.A.', admissionDate: '2022-09-05', status: 'Ativo' },
  { id: 9, name: 'Leandro Pinheiro Gomes', cpf: '491.762.530-98', phone: '(85) 99123-4456', registration: 'MAT-00148', role: 'Operador de Máquinas', team: 'Operações', sector: 'Produção', company: 'Infratech S.A.', admissionDate: '2023-02-27', status: 'Ativo' },
  { id: 10, name: 'Priscila Barbosa Cunha', cpf: '324.081.960-35', phone: '(11) 98710-6643', registration: 'MAT-00151', role: 'Técnico de Segurança', team: 'Segurança', sector: 'SSO', company: 'Infratech S.A.', admissionDate: '2020-12-01', status: 'Ativo' },
  { id: 11, name: 'Diego Araujo Monteiro', cpf: '573.914.280-77', phone: '(21) 97234-8891', registration: 'MAT-00154', role: 'Eletricista', team: 'Manutenção', sector: 'Manutenção', company: 'Infratech S.A.', admissionDate: '2021-06-20', status: 'Ativo' },
  { id: 12, name: 'Camila Rocha Freitas', cpf: '269.435.710-52', phone: '(11) 99045-2278', registration: 'MAT-00157', role: 'Auxiliar de Almoxarifado', team: 'Logística', sector: 'Logística', company: 'Infratech S.A.', admissionDate: '2024-01-15', status: 'Ativo' },
]

export const categories: Category[] = [
  { id: 1, name: 'Proteção da Cabeça', description: 'Capacetes, bonés e protetores', icon: '🪖', color: '#6366F1', itemCount: 5 },
  { id: 2, name: 'Proteção dos Pés', description: 'Botas, sapatos e calçados de segurança', icon: '👢', color: '#F59E0B', itemCount: 8 },
  { id: 3, name: 'Proteção Visual', description: 'Óculos, viseiras e protetores faciais', icon: '🥽', color: '#22D3EE', itemCount: 6 },
  { id: 4, name: 'Proteção Auditiva', description: 'Protetores auriculares e abafadores', icon: '🎧', color: '#10B981', itemCount: 4 },
  { id: 5, name: 'Proteção Respiratória', description: 'Respiradores e máscaras filtrantes', icon: '😷', color: '#F43F5E', itemCount: 7 },
  { id: 6, name: 'Proteção das Mãos', description: 'Luvas de segurança diversas', icon: '🧤', color: '#8B5CF6', itemCount: 9 },
  { id: 7, name: 'Vestuário de Proteção', description: 'Camisas, calças, uniformes e jaquetas', icon: '👕', color: '#EC4899', itemCount: 15 },
  { id: 8, name: 'Proteção contra Quedas', description: 'Cintos, talabartes e linhas de vida', icon: '🔗', color: '#F97316', itemCount: 5 },
]

export const epis: Epi[] = [
  {
    id: 1,
    name: 'Capacete de Segurança ABS',
    category: 'Proteção da Cabeça',
    subcategory: 'Capacete',
    manufacturer: '3M',
    supplier: 'Safety Plus Ltda',
    description: 'Capacete de segurança em ABS, classe B, com carneira de nylon ajustável.',
    caNumber: 'CA-34536',
    batchNumber: 'L2024-001',
    manufacturingDate: '2024-01-10',
    totalQuantity: 245,
    minQuantity: 50,
    location: 'Prateleira A-01',
    status: 'Disponível',
    variants: [
      { id: 'v1', color: 'Branco', size: 'Único', quantity: 120, minQuantity: 25 },
      { id: 'v2', color: 'Amarelo', size: 'Único', quantity: 85, minQuantity: 20 },
      { id: 'v3', color: 'Laranja', size: 'Único', quantity: 40, minQuantity: 10 },
    ],
  },
  {
    id: 2,
    name: 'Bota de Segurança Couro',
    category: 'Proteção dos Pés',
    subcategory: 'Bota',
    manufacturer: 'Krusher',
    supplier: 'EPIs Sul S.A.',
    description: 'Bota de segurança em couro bovino, biqueira de aço, solado antiderrapante.',
    caNumber: 'CA-28910',
    batchNumber: 'L2024-018',
    manufacturingDate: '2024-02-05',
    totalQuantity: 388,
    minQuantity: 60,
    location: 'Prateleira B-03',
    status: 'Disponível',
    variants: [
      { id: 'v4', color: 'Preto', size: '38', quantity: 45, minQuantity: 8 },
      { id: 'v5', color: 'Preto', size: '40', quantity: 80, minQuantity: 12 },
      { id: 'v6', color: 'Preto', size: '42', quantity: 95, minQuantity: 15 },
      { id: 'v7', color: 'Preto', size: '44', quantity: 88, minQuantity: 12 },
      { id: 'v8', color: 'Preto', size: '46', quantity: 80, minQuantity: 8 },
    ],
  },
  {
    id: 3,
    name: 'Camisa Operacional FR',
    category: 'Vestuário de Proteção',
    subcategory: 'Camisa',
    manufacturer: 'Tecbrasil',
    supplier: 'Uniformes Pro Ltda',
    description: 'Camisa flame resistant, tecido 100% algodão, manga longa, logomarca bordada.',
    batchNumber: 'L2024-022',
    manufacturingDate: '2024-01-20',
    totalQuantity: 620,
    minQuantity: 100,
    location: 'Prateleira C-02',
    status: 'Disponível',
    variants: [
      { id: 'v9',  color: 'Azul Royal', size: 'P',  quantity: 95, minQuantity: 20 },
      { id: 'v10', color: 'Azul Royal', size: 'M',  quantity: 140, minQuantity: 25 },
      { id: 'v11', color: 'Azul Royal', size: 'G',  quantity: 125, minQuantity: 25 },
      { id: 'v12', color: 'Azul Royal', size: 'GG', quantity: 70, minQuantity: 15 },
      { id: 'v13', color: 'Laranja',    size: 'P',  quantity: 55, minQuantity: 10 },
      { id: 'v14', color: 'Laranja',    size: 'M',  quantity: 80, minQuantity: 12 },
      { id: 'v15', color: 'Laranja',    size: 'G',  quantity: 55, minQuantity: 10 },
    ],
  },
  {
    id: 4,
    name: 'Óculos de Proteção Ampla Visão',
    category: 'Proteção Visual',
    subcategory: 'Óculos',
    manufacturer: 'Carbografite',
    supplier: 'Safety Plus Ltda',
    description: 'Óculos de segurança ampla visão, lente incolor, resistente a impactos.',
    caNumber: 'CA-10364',
    batchNumber: 'L2024-005',
    manufacturingDate: '2023-11-15',
    totalQuantity: 38,
    minQuantity: 50,
    location: 'Prateleira A-04',
    status: 'Estoque Baixo',
    variants: [
      { id: 'v16', color: 'Transparente', size: 'Único', quantity: 38, minQuantity: 50 },
    ],
  },
  {
    id: 5,
    name: 'Luva de Vaqueta',
    category: 'Proteção das Mãos',
    subcategory: 'Luva',
    manufacturer: 'Danny',
    supplier: 'Safety Plus Ltda',
    description: 'Luva de couro vaqueta, punho médio, para trabalhos gerais.',
    caNumber: 'CA-15821',
    batchNumber: 'L2024-031',
    manufacturingDate: '2024-03-01',
    totalQuantity: 312,
    minQuantity: 60,
    location: 'Prateleira D-01',
    status: 'Disponível',
    variants: [
      { id: 'v17', color: 'Natural', size: 'P',  quantity: 72, minQuantity: 15 },
      { id: 'v18', color: 'Natural', size: 'M',  quantity: 120, minQuantity: 20 },
      { id: 'v19', color: 'Natural', size: 'G',  quantity: 80, minQuantity: 15 },
      { id: 'v20', color: 'Natural', size: 'GG', quantity: 40, minQuantity: 10 },
    ],
  },
  {
    id: 6,
    name: 'Respirador PFF2 Sem Válvula',
    category: 'Proteção Respiratória',
    subcategory: 'Respirador',
    manufacturer: '3M',
    supplier: 'Safety Plus Ltda',
    description: 'Máscara respiratória PFF2, filtragem de 94%, sem válvula exalatória.',
    caNumber: 'CA-4470',
    batchNumber: 'L2024-009',
    manufacturingDate: '2024-02-10',
    totalQuantity: 12,
    minQuantity: 100,
    location: 'Prateleira A-02',
    status: 'Crítico',
    variants: [
      { id: 'v21', color: 'Branco', size: 'Único', quantity: 12, minQuantity: 100 },
    ],
  },
  {
    id: 7,
    name: 'Calça Operacional',
    category: 'Vestuário de Proteção',
    subcategory: 'Calça',
    manufacturer: 'Tecbrasil',
    supplier: 'Uniformes Pro Ltda',
    description: 'Calça operacional em brim reforçado, elástico na cintura, bolso utilitário.',
    batchNumber: 'L2024-025',
    manufacturingDate: '2024-01-25',
    totalQuantity: 480,
    minQuantity: 80,
    location: 'Prateleira C-04',
    status: 'Disponível',
    variants: [
      { id: 'v22', color: 'Azul Marinho', size: '36', quantity: 55, minQuantity: 10 },
      { id: 'v23', color: 'Azul Marinho', size: '38', quantity: 90, minQuantity: 15 },
      { id: 'v24', color: 'Azul Marinho', size: '40', quantity: 120, minQuantity: 18 },
      { id: 'v25', color: 'Azul Marinho', size: '42', quantity: 110, minQuantity: 18 },
      { id: 'v26', color: 'Azul Marinho', size: '44', quantity: 75, minQuantity: 12 },
      { id: 'v27', color: 'Azul Marinho', size: '46', quantity: 30, minQuantity: 7 },
    ],
  },
  {
    id: 8,
    name: 'Protetor Auricular Espuma',
    category: 'Proteção Auditiva',
    subcategory: 'Protetor',
    manufacturer: '3M',
    supplier: 'Safety Plus Ltda',
    description: 'Protetor auricular de inserção em espuma expansível, NRRsf 23dB.',
    caNumber: 'CA-5674',
    batchNumber: 'L2024-011',
    manufacturingDate: '2024-01-05',
    totalQuantity: 1200,
    minQuantity: 200,
    location: 'Prateleira E-01',
    status: 'Disponível',
    variants: [
      { id: 'v28', color: 'Laranja', size: 'Único', quantity: 1200, minQuantity: 200 },
    ],
  },
]

export const movements: Movement[] = [
  { id: 1, type: 'Entrega', employee: 'Carlos Eduardo Mendes', epi: 'Capacete de Segurança ABS', quantity: 1, date: '2024-03-15 09:22', operator: 'App Mobile', notes: 'Entrega inicial' },
  { id: 2, type: 'Entrega', employee: 'Rafael Souza Almeida', epi: 'Bota de Segurança Couro', quantity: 1, date: '2024-03-15 10:05', operator: 'App Mobile' },
  { id: 3, type: 'Devolução', employee: 'Bruno Henrique Pereira', epi: 'Camisa Operacional FR', quantity: 2, date: '2024-03-15 11:30', operator: 'App Mobile', notes: 'Desligamento' },
  { id: 4, type: 'Entrega', employee: 'Leandro Pinheiro Gomes', epi: 'Luva de Vaqueta', quantity: 2, date: '2024-03-15 14:00', operator: 'App Mobile' },
  { id: 5, type: 'Troca', employee: 'Aline Carvalho Santos', epi: 'Calça Operacional', quantity: 1, date: '2024-03-14 08:45', operator: 'App Mobile', notes: 'Troca de tamanho G para GG' },
  { id: 6, type: 'Entrada', employee: '—', epi: 'Respirador PFF2', quantity: 500, date: '2024-03-14 07:30', operator: 'Sistema Web' },
  { id: 7, type: 'Entrega', employee: 'Priscila Barbosa Cunha', epi: 'Óculos de Proteção', quantity: 1, date: '2024-03-13 13:15', operator: 'App Mobile' },
  { id: 8, type: 'Baixa', employee: '—', epi: 'Capacete de Segurança ABS', quantity: 3, date: '2024-03-13 16:00', operator: 'Sistema Web', notes: 'Itens danificados' },
  { id: 9, type: 'Entrega', employee: 'Diego Araujo Monteiro', epi: 'Protetor Auricular Espuma', quantity: 10, date: '2024-03-12 09:00', operator: 'App Mobile' },
  { id: 10, type: 'Devolução', employee: 'Marcos Vinicius Rodrigues', epi: 'Luva de Vaqueta', quantity: 1, date: '2024-03-12 17:20', operator: 'App Mobile', notes: 'Luva rasgada, substituída' },
]

export const chartData = {
  stockByCategory: [
    { name: 'Vestuário', value: 1100, fill: '#EC4899' },
    { name: 'Pés', value: 388, fill: '#F59E0B' },
    { name: 'Mãos', value: 312, fill: '#8B5CF6' },
    { name: 'Auditiva', value: 1200, fill: '#10B981' },
    { name: 'Cabeça', value: 245, fill: '#6366F1' },
    { name: 'Visual', value: 38, fill: '#22D3EE' },
    { name: 'Respiratória', value: 12, fill: '#F43F5E' },
  ],
  movementsOverTime: [
    { month: 'Out', entregas: 42, devolucoes: 8, entradas: 200 },
    { month: 'Nov', entregas: 58, devolucoes: 12, entradas: 150 },
    { month: 'Dez', entregas: 35, devolucoes: 5, entradas: 80 },
    { month: 'Jan', entregas: 67, devolucoes: 14, entradas: 320 },
    { month: 'Fev', entregas: 73, devolucoes: 18, entradas: 250 },
    { month: 'Mar', entregas: 88, devolucoes: 22, entradas: 500 },
  ],
  stockTrend: [
    { day: '10/03', stock: 3850 },
    { day: '11/03', stock: 3820 },
    { day: '12/03', stock: 3795 },
    { day: '13/03', stock: 3788 },
    { day: '14/03', stock: 3810 },
    { day: '15/03', stock: 3795 },
    { day: '16/03', stock: 3760 },
  ],
}
