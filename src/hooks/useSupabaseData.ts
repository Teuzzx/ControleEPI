import { useCallback, useEffect, useState } from 'react'
import { supabase, createCompanyClient } from '../lib/supabase'
import { useDataClient } from '../lib/clientContext'
import type {
  Employee, Department, Category, Epi, Movement, StockEntry,
} from '../data/mock'

export interface ChartData {
  stockByCategory: { name: string; value: number; fill: string }[]
  movementsOverTime: { month: string; entregas: number; devolucoes: number; entradas: number }[]
  stockTrend: { day: string; stock: number }[]
}

export interface Notification {
  id: number
  type: string
  title: string
  message: string
  sender_company_id: number | null
  read: boolean
  created_at: string
}

interface DbDepartment { id: number; name: string; description: string; color: string }
interface DbCategory { id: number; name: string; description: string; icon: string; color: string }
interface DbEmployee {
  id: number; name: string; cpf: string; phone: string; registration: string
  role: string; department_id: number | null; sector: string; company: string
  admission_date: string; status: 'Ativo' | 'Inativo'; notes: string; avatar: string
}
interface DbEpi {
  id: number; name: string; category_id: number | null; subcategory: string
  manufacturer: string; supplier: string; description: string; ca_number: string
  batch_number: string; manufacturing_date: string; total_quantity: number
  min_quantity: number; location: string; notes: string
}
interface DbVariant {
  id: number; epi_id: number; color: string; size: string
  quantity: number; min_quantity: number
}
interface DbMovement {
  id: number; type: Movement['type']; employee_name: string; epi_name: string
  quantity: number; operator: string; notes: string; company_name: string; created_at: string
}
interface DbStockEntry {
  id: number; epi_name: string; manufacturer: string; supplier: string
  batch: string; quantity: number; color: string; size: string; notes: string
  company_name: string; created_at: string
}

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function computeStatus(total: number, min: number): Epi['status'] {
  if (min <= 0) return 'Disponível'
  if (total >= min) return 'Disponível'
  if (total >= min * 0.3) return 'Estoque Baixo'
  return 'Crítico'
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toISOString().split('T')[0]
}

export function useSupabaseData() {
  const client = useDataClient()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [epis, setEpis] = useState<Epi[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [entries, setEntries] = useState<StockEntry[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [chartData, setChartData] = useState<ChartData>({
    stockByCategory: [],
    movementsOverTime: [],
    stockTrend: [],
  })

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [depRes, catsRes, empsRes, episRes, varsRes, movsRes, entriesRes, notifRes] = await Promise.all([
      client.from('departments').select('*').order('id', { ascending: true }),
      client.from('categories').select('*').order('id', { ascending: true }),
      client.from('employees').select('*').order('id', { ascending: true }),
      client.from('epis').select('*').order('id', { ascending: true }),
      client.from('epi_variants').select('*').order('id', { ascending: true }),
      client.from('movements').select('*').order('id', { ascending: false }),
      client.from('stock_entries').select('*').order('id', { ascending: false }),
      client.from('notifications').select('*').order('id', { ascending: false }),
    ])

    const failed = [depRes, catsRes, empsRes, episRes, varsRes, movsRes, entriesRes, notifRes].find((r) => r.error)
    if (failed?.error) {
      setError(failed.error.message)
      setLoading(false)
      return
    }

    const dbDepartments = (depRes.data ?? []) as DbDepartment[]
    const dbCategories = (catsRes.data ?? []) as DbCategory[]
    const dbEmployees = (empsRes.data ?? []) as DbEmployee[]
    const dbEpis = (episRes.data ?? []) as DbEpi[]
    const dbVariants = (varsRes.data ?? []) as DbVariant[]
    const dbMovements = (movsRes.data ?? []) as DbMovement[]
    const dbEntries = (entriesRes.data ?? []) as DbStockEntry[]

    const departmentById = new Map(dbDepartments.map((t) => [t.id, t]))
    const categoryById = new Map(dbCategories.map((c) => [c.id, c]))
    const variantsByEpi = new Map<number, DbVariant[]>()
    for (const v of dbVariants) {
      const list = variantsByEpi.get(v.epi_id) ?? []
      list.push(v)
      variantsByEpi.set(v.epi_id, list)
    }

    const mappedDepartments: Department[] = dbDepartments.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      color: t.color,
      memberCount: dbEmployees.filter((e) => e.department_id === t.id).length,
    }))

    const mappedCategories: Category[] = dbCategories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      icon: c.icon,
      color: c.color,
      itemCount: dbEpis.filter((e) => e.category_id === c.id).length,
    }))

    const mappedEmployees: Employee[] = dbEmployees.map((e) => ({
      id: e.id,
      name: e.name,
      cpf: e.cpf,
      phone: e.phone,
      registration: e.registration,
      role: e.role,
      team: e.department_id != null ? (departmentById.get(e.department_id)?.name ?? '') : '',
      sector: e.sector,
      company: e.company,
      admissionDate: formatDate(e.admission_date),
      status: e.status,
      notes: e.notes || undefined,
      avatar: e.avatar || undefined,
    }))

    const mappedEpis: Epi[] = dbEpis.map((e) => {
      const variants = (variantsByEpi.get(e.id) ?? []).map((v) => ({
        id: String(v.id),
        color: v.color,
        size: v.size,
        quantity: v.quantity,
        minQuantity: v.min_quantity,
      }))
      return {
        id: e.id,
        name: e.name,
        category: e.category_id != null ? (categoryById.get(e.category_id)?.name ?? '') : '',
        subcategory: e.subcategory,
        manufacturer: e.manufacturer,
        supplier: e.supplier,
        description: e.description,
        caNumber: e.ca_number || undefined,
        batchNumber: e.batch_number,
        manufacturingDate: formatDate(e.manufacturing_date),
        totalQuantity: e.total_quantity,
        minQuantity: e.min_quantity,
        location: e.location,
        status: computeStatus(e.total_quantity, e.min_quantity),
        variants,
        notes: e.notes || undefined,
      }
    })

    const mappedMovements: Movement[] = dbMovements.map((m) => ({
      id: m.id,
      type: m.type,
      employee: m.employee_name,
      epi: m.epi_name,
      quantity: m.quantity,
      date: formatDateTime(m.created_at),
      operator: m.operator,
      company: m.company_name || undefined,
      notes: m.notes || undefined,
    }))

    const mappedEntries: StockEntry[] = dbEntries.map((e) => ({
      id: e.id,
      epi: e.epi_name,
      manufacturer: e.manufacturer,
      supplier: e.supplier,
      batch: e.batch,
      date: formatDateTime(e.created_at),
      quantity: e.quantity,
      color: e.color,
      size: e.size,
      notes: e.notes || undefined,
    }))

    const now = new Date()
    const stockByCategory = mappedCategories.map((c) => ({
      name: c.name,
      value: mappedEpis.filter((e) => e.category === c.name).reduce((s, e) => s + e.totalQuantity, 0),
      fill: c.color,
    }))

    const movementsOverTime = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return {
        month: MONTHS_SHORT[d.getMonth()],
        entregas: mappedMovements.filter((m) => m.type === 'Entrega' && m.date.startsWith(prefix)).length,
        devolucoes: mappedMovements.filter((m) => m.type === 'Devolução' && m.date.startsWith(prefix)).length,
        entradas: mappedMovements.filter((m) => m.type === 'Entrada' && m.date.startsWith(prefix)).length,
      }
    })

    const stockTrend = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => ({
      day,
      stock: mappedEpis.reduce((s, e) => s + e.totalQuantity, 0),
    }))

    setEmployees(mappedEmployees)
    setDepartments(mappedDepartments)
    setCategories(mappedCategories)
    setEpis(mappedEpis)
    setMovements(mappedMovements)
    setEntries(mappedEntries)
    setNotifications((notifRes.data ?? []) as Notification[])
    setChartData({ stockByCategory, movementsOverTime, stockTrend })
    setLoading(false)
  }, [client])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addEmployee = useCallback(async (data: {
    name: string; cpf?: string; phone?: string; registration?: string; role?: string
    department?: string; sector?: string; company?: string; status?: string
  }) => {
    const departmentId = departments.find((t) => t.name === data.department)?.id ?? null
    const { error } = await client.from('employees').insert({
      name: data.name,
      cpf: data.cpf || '',
      phone: data.phone || '',
      registration: data.registration || '',
      role: data.role || '',
      department_id: departmentId,
      sector: data.sector || '',
      company: data.company || 'Norion',
      status: data.status || 'Ativo',
    })
    if (error) throw new Error(error.message)
    await refresh()
  }, [refresh, client, departments])

  const deleteEmployee = useCallback(async (id: number) => {
    const { error } = await client.from('employees').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await refresh()
  }, [refresh, client])

  const updateEmployee = useCallback(async (id: number, data: {
    name: string; cpf?: string; phone?: string; registration?: string; role?: string
    department?: string; sector?: string; company?: string; status?: string
  }) => {
    const departmentId = departments.find((t) => t.name === data.department)?.id ?? null
    const { error } = await client.from('employees').update({
      name: data.name,
      cpf: data.cpf || '',
      phone: data.phone || '',
      registration: data.registration || '',
      role: data.role || '',
      department_id: departmentId,
      sector: data.sector || '',
      company: data.company || 'Norion',
      status: data.status || 'Ativo',
    }).eq('id', id)
    if (error) throw new Error(error.message)
    await refresh()
  }, [refresh, client, departments])

  const addDepartment = useCallback(async (data: { name: string; description?: string; color?: string }) => {
    const { error } = await client.from('departments').insert({
      name: data.name,
      description: data.description || '',
      color: data.color || '#6366F1',
    })
    if (error) throw new Error(error.message)
    await refresh()
  }, [refresh, client])

  const deleteDepartment = useCallback(async (id: number) => {
    const { error } = await client.from('departments').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await refresh()
  }, [refresh, client])

  const updateDepartment = useCallback(async (id: number, data: {
    name: string; description?: string; color?: string
  }) => {
    const { error } = await client.from('departments').update({
      name: data.name,
      description: data.description || '',
      color: data.color || '#6366F1',
    }).eq('id', id)
    if (error) throw new Error(error.message)
    await refresh()
  }, [refresh, client])

  const addCategory = useCallback(async (data: {
    name: string; description?: string; icon?: string; color?: string
  }) => {
    const { error } = await client.from('categories').insert({
      name: data.name,
      description: data.description || '',
      icon: data.icon || '📦',
      color: data.color || '#6366F1',
    })
    if (error) throw new Error(error.message)
    await refresh()
  }, [refresh, client])

  const updateCategory = useCallback(async (id: number, data: {
    name: string; description?: string; icon?: string; color?: string
  }) => {
    const { error } = await client.from('categories').update({
      name: data.name,
      description: data.description || '',
      icon: data.icon || '📦',
      color: data.color || '#6366F1',
    }).eq('id', id)
    if (error) throw new Error(error.message)
    await refresh()
  }, [refresh, client])

  const deleteCategory = useCallback(async (id: number) => {
    const { error } = await client.from('categories').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await refresh()
  }, [refresh, client])

  interface EpiVariantInput { color: string; size: string; quantity: number }

  const addEpi = useCallback(async (data: {
    name: string; category?: string; subcategory?: string; manufacturer?: string
    supplier?: string; description?: string; caNumber?: string; batchNumber?: string
    manufacturingDate?: string; totalQuantity: number; minQuantity?: number
    location?: string; variants?: EpiVariantInput[]; notes?: string
  }) => {
    if (!data.name.trim()) throw new Error('Informe o nome do EPI.')
    const categoryId = categories.find((c) => c.name === data.category)?.id ?? null
    const { data: row, error } = await client.from('epis').insert({
      name: data.name.trim(),
      category_id: categoryId,
      subcategory: data.subcategory || '',
      manufacturer: data.manufacturer || '',
      supplier: data.supplier || '',
      description: data.description || '',
      ca_number: data.caNumber || '',
      batch_number: data.batchNumber || '',
      manufacturing_date: data.manufacturingDate || null,
      total_quantity: data.totalQuantity || 0,
      min_quantity: data.minQuantity ?? 0,
      location: data.location || '',
      notes: data.notes || '',
    }).select('id').single()
    if (error) throw new Error(error.message)

    for (const v of data.variants ?? []) {
      if (v.quantity <= 0) continue
      const { error: vErr } = await client.from('epi_variants').insert({
        epi_id: row.id,
        color: v.color || '',
        size: v.size || '',
        quantity: v.quantity,
        min_quantity: 0,
      })
      if (vErr) throw new Error(vErr.message)
    }
    await refresh()
  }, [refresh, client, categories])

  const updateEpi = useCallback(async (id: number, data: {
    name: string; category?: string; subcategory?: string; manufacturer?: string
    supplier?: string; description?: string; caNumber?: string; batchNumber?: string
    manufacturingDate?: string; totalQuantity: number; minQuantity?: number
    location?: string; variants?: EpiVariantInput[]; notes?: string
  }) => {
    const categoryId = categories.find((c) => c.name === data.category)?.id ?? null
    const { error } = await client.from('epis').update({
      name: data.name,
      category_id: categoryId,
      subcategory: data.subcategory || '',
      manufacturer: data.manufacturer || '',
      supplier: data.supplier || '',
      description: data.description || '',
      ca_number: data.caNumber || '',
      batch_number: data.batchNumber || '',
      manufacturing_date: data.manufacturingDate || null,
      total_quantity: data.totalQuantity || 0,
      min_quantity: data.minQuantity ?? 0,
      location: data.location || '',
      notes: data.notes || '',
    }).eq('id', id)
    if (error) throw new Error(error.message)

    for (const v of data.variants ?? []) {
      if (v.quantity <= 0) continue
      const { data: existing } = await client
        .from('epi_variants')
        .select('id, quantity')
        .eq('epi_id', id)
        .eq('color', v.color || '')
        .eq('size', v.size || '')
        .maybeSingle()
      if (existing) {
        await client.from('epi_variants').update({ quantity: v.quantity }).eq('id', existing.id)
      } else {
        await client.from('epi_variants').insert({
          epi_id: id,
          color: v.color || '',
          size: v.size || '',
          quantity: v.quantity,
          min_quantity: 0,
        })
      }
    }
    await refresh()
  }, [refresh, client, categories])

  const deleteEpi = useCallback(async (id: number) => {
    await client.from('epi_variants').delete().eq('epi_id', id)
    const { error } = await client.from('epis').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await refresh()
  }, [refresh, client])

  interface EntryVariant { color: string; size: string; quantity: number }

  const addEntry = useCallback(async (data: {
    epi: string; manufacturer?: string; supplier?: string; batch?: string
    date?: string; variants: EntryVariant[]; notes?: string
  }) => {
    const total = data.variants.reduce((s, v) => s + v.quantity, 0)
    if (total <= 0) throw new Error('Informe ao menos uma quantidade.')

    const epiRow = await client
      .from('epis')
      .select('id, name, total_quantity')
      .eq('name', data.epi)
      .maybeSingle()

    for (const v of data.variants) {
      const { error } = await client.from('stock_entries').insert({
        epi_id: epiRow.data?.id ?? null,
        epi_name: data.epi,
        manufacturer: data.manufacturer || '',
        supplier: data.supplier || '',
        batch: data.batch || '',
        quantity: v.quantity,
        color: v.color || '',
        size: v.size || '',
        notes: data.notes || '',
      })
      if (error) throw new Error(error.message)
    }

    if (epiRow.data) {
      const { error: updErr } = await client
        .from('epis')
        .update({ total_quantity: (epiRow.data.total_quantity ?? 0) + total })
        .eq('id', epiRow.data.id)
      if (updErr) throw new Error(updErr.message)

      for (const v of data.variants) {
        const { data: existing } = await client
          .from('epi_variants')
          .select('id, quantity')
          .eq('epi_id', epiRow.data.id)
          .eq('color', v.color || '')
          .eq('size', v.size || '')
          .maybeSingle()

        if (existing) {
          await client
            .from('epi_variants')
            .update({ quantity: existing.quantity + v.quantity })
            .eq('id', existing.id)
        } else {
          await client.from('epi_variants').insert({
            epi_id: epiRow.data.id,
            color: v.color || '',
            size: v.size || '',
            quantity: v.quantity,
            min_quantity: 0,
          })
        }
      }

      await client.from('movements').insert({
        type: 'Entrada',
        employee_name: '—',
        epi_name: data.epi,
        quantity: total,
        operator: 'Sistema Web',
        notes: `Entrada de estoque: ${data.variants.map((v) => `${v.size || v.color || 'Único'} x${v.quantity}`).join(', ')}`,
      })
    }

    await refresh()
  }, [refresh, client])

  /** Matriz distribui estoque para uma filial: grava no banco dela + notificação + movimento na matriz. */
  const distributeToCompany = useCallback(async (params: {
    targetUrl: string
    targetKey: string
    targetName: string
    matrizName: string
    epi: string
    variants: EntryVariant[]
    note?: string
  }): Promise<void> => {
    const total = params.variants.reduce((s, v) => s + v.quantity, 0)
    if (total <= 0) throw new Error('Informe ao menos uma quantidade.')

    const target = createCompanyClient(params.targetUrl, params.targetKey)

    const epiRow = await target
      .from('epis')
      .select('id, name, total_quantity')
      .eq('name', params.epi)
      .maybeSingle()

    if (!epiRow.data) {
      const { error } = await target.from('epis').insert({
        name: params.epi,
        subcategory: '',
        manufacturer: '',
        supplier: '',
        description: '',
        ca_number: '',
        batch_number: '',
        total_quantity: total,
        min_quantity: 0,
        location: '',
      })
      if (error) throw new Error(`Não foi possível registrar o EPI na filial: ${error.message}`)
    } else {
      const { error: updErr } = await target
        .from('epis')
        .update({ total_quantity: (epiRow.data.total_quantity ?? 0) + total })
        .eq('id', epiRow.data.id)
      if (updErr) throw new Error(updErr.message)

      for (const v of params.variants) {
        const { data: existing } = await target
          .from('epi_variants')
          .select('id, quantity')
          .eq('epi_id', epiRow.data.id)
          .eq('color', v.color || '')
          .eq('size', v.size || '')
          .maybeSingle()

        if (existing) {
          await target
            .from('epi_variants')
            .update({ quantity: existing.quantity + v.quantity })
            .eq('id', existing.id)
        } else {
          await target.from('epi_variants').insert({
            epi_id: epiRow.data.id,
            color: v.color || '',
            size: v.size || '',
            quantity: v.quantity,
            min_quantity: 0,
          })
        }
      }
    }

    const detail = params.variants.map((v) => `${v.size || v.color || 'Único'} x${v.quantity}`).join(', ')
    const targetEpiId = epiRow.data?.id ?? null

    await target.from('stock_entries').insert({
      epi_id: targetEpiId,
      epi_name: params.epi,
      manufacturer: '',
      supplier: '',
      batch: '',
      quantity: total,
      color: '',
      size: '',
      notes: `Distribuição da ${params.matrizName}: ${detail}`,
      company_name: params.matrizName,
    })

    await target.from('notifications').insert({
      type: 'distribuicao',
      title: 'Distribuição da Matriz',
      message: `Chegaram ${total} unidade(s) de ${params.epi} (${detail}).`,
    })

    await target.from('movements').insert({
      type: 'Entrada',
      employee_name: '—',
      epi_name: params.epi,
      quantity: total,
      operator: 'Matriz',
      notes: `Distribuição da ${params.matrizName}`,
      company_name: params.matrizName,
    })

    const matrizEpi = await client.from('epis').select('id, total_quantity').eq('name', params.epi).maybeSingle()
    if (matrizEpi.data) {
      const { error: matrizErr } = await client
        .from('epis')
        .update({ total_quantity: Math.max(0, (matrizEpi.data.total_quantity ?? 0) - total) })
        .eq('id', matrizEpi.data.id)
      if (matrizErr) throw new Error(matrizErr.message)
    }

    const { error: movErr } = await client.from('movements').insert({
      type: 'Distribuição',
      employee_name: '—',
      epi_name: params.epi,
      quantity: total,
      operator: 'Sistema Web',
      notes: `Enviado para ${params.targetName}: ${detail}`,
      company_name: params.targetName,
    })
    if (movErr) throw new Error(movErr.message)

    await client.from('notifications').insert({
      type: 'distribuicao',
      title: 'Distribuição concluída',
      message: `${total} unidade(s) de ${params.epi} enviadas para ${params.targetName}.`,
    })

    await refresh()
  }, [refresh, client])

  const markNotificationRead = useCallback(async (id: number) => {
    await client.from('notifications').update({ read: true }).eq('id', id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [client])

  const markAllNotificationsRead = useCallback(async () => {
    await client.from('notifications').update({ read: true }).eq('read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [client])

  return {
    loading,
    error,
    refresh,
    employees,
    departments,
    categories,
    epis,
    movements,
    entries,
    notifications,
    chartData,
    addEmployee,
    deleteEmployee,
    updateEmployee,
    addDepartment,
    deleteDepartment,
    updateDepartment,
    addCategory,
    updateCategory,
    deleteCategory,
    addEntry,
    addEpi,
    updateEpi,
    deleteEpi,
    distributeToCompany,
    markNotificationRead,
    markAllNotificationsRead,
  }
}
