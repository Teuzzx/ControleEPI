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

export type Department = Team

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
  caExpiry?: string
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
  type: 'Entrega' | 'Devolução' | 'Troca' | 'Entrada' | 'Baixa' | 'Distribuição'
  employee: string
  epi: string
  quantity: number
  date: string
  operator: string
  company?: string
  notes?: string
  color?: string
  size?: string
  cartId?: string
  photoUrl?: string
  signatureUrl?: string
  /** Movimentação registrada no app mobile durante o período offline. */
  offlineCreated?: boolean
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
// All arrays start empty — data comes from Supabase when connected.

export const teams: Team[] = []
export const departments: Department[] = []
export const roles: Role[] = []
export const employees: Employee[] = []
export const categories: Category[] = []
export const epis: Epi[] = []
export const movements: Movement[] = []

export const chartData = {
  stockByCategory: [
    { name: 'Vestuário', value: 0, fill: '#EC4899' },
    { name: 'Pés', value: 0, fill: '#F59E0B' },
    { name: 'Mãos', value: 0, fill: '#8B5CF6' },
    { name: 'Auditiva', value: 0, fill: '#10B981' },
    { name: 'Cabeça', value: 0, fill: '#6366F1' },
    { name: 'Visual', value: 0, fill: '#22D3EE' },
    { name: 'Respiratória', value: 0, fill: '#F43F5E' },
  ],
  movementsOverTime: [
    { month: 'Out', entregas: 0, devolucoes: 0, entradas: 0 },
    { month: 'Nov', entregas: 0, devolucoes: 0, entradas: 0 },
    { month: 'Dez', entregas: 0, devolucoes: 0, entradas: 0 },
    { month: 'Jan', entregas: 0, devolucoes: 0, entradas: 0 },
    { month: 'Fev', entregas: 0, devolucoes: 0, entradas: 0 },
    { month: 'Mar', entregas: 0, devolucoes: 0, entradas: 0 },
  ],
  stockTrend: [
    { day: 'Seg', stock: 0 },
    { day: 'Ter', stock: 0 },
    { day: 'Qua', stock: 0 },
    { day: 'Qui', stock: 0 },
    { day: 'Sex', stock: 0 },
    { day: 'Sáb', stock: 0 },
    { day: 'Dom', stock: 0 },
  ],
}
