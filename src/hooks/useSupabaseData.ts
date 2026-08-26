import { useCallback, useEffect, useMemo, useState } from "react"
import { createCompanyClient } from "../lib/supabase"
import { useDataClient } from "../lib/clientContext"
import type {
  Employee,
  Department,
  Category,
  Epi,
  Movement,
  StockEntry,
} from "../data/mock"

export interface ChartData {
  stockByCategory: { name: string value: number fill: string }[]
  movementsOverTime: {
    month: string
    entregas: number
    devolucoes: number
    entradas: number
  }[]
  stockTrend: { day: string stock: number }[]
}

export interface Notification {
  id: number
  type: string
  title: string
  message: string
  sender_company_id: number | null
  read: boolean
  created_at: string
  epi_id?: number | null
  ref_id?: string | null
}

interface DbDepartment {
  id: number
  name: string
  description: string
  color: string
}
interface DbCategory {
  id: number
  name: string
  description: string
  icon: string
  color: string
}
interface DbEmployee {
  id: number
  name: string
  cpf: string
  phone: string
  registration: string
  role: string
  department_id: number | null
  sector: string
  company: string
  admission_date: string
  status: "Ativo" | "Inativo"
  notes: string
  avatar: string
}
interface DbEpi {
  id: number
  name: string
  category_id: number | null
  subcategory: string
  manufacturer: string
  supplier: string
  description: string
  ca_number: string
  ca_expiry: string
  batch_number: string
  manufacturing_date: string
  total_quantity: number
  min_quantity: number
  location: string
  notes: string
}
interface DbVariant {
  id: number
  epi_id: number
  color: string
  size: string
  quantity: number
  min_quantity: number
}
interface DbMovement {
  id: number
  type: Movement["type"]
  employee_name: string
  epi_name: string
  quantity: number
  operator: string
  notes: string
  company_name: string
  created_at: string
  color?: string
  size?: string
  cart_id?: string | null
  photo_url?: string | null
  signature_url?: string | null
  offline_created?: boolean | null
}
interface DbStockEntry {
  id: number
  epi_name: string
  manufacturer: string
  supplier: string
  batch: string
  quantity: number
  color: string
  size: string
  notes: string
  company_name: string
  created_at: string
}

const MONTHS_SHORT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
]

let channelSeq = 0

function computeStatus(total: number, min: number): Epi["status"] {
  if (min <= 0) return "Disponível"
  if (total >= min) return "Disponível"
  if (total >= min * 0.3) return "Estoque Baixo"
  return "Crítico"
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toISOString().split("T")[0]
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

    const [
      depRes,
      catsRes,
      empsRes,
      episRes,
      varsRes,
      movsRes,
      entriesRes,
      notifRes,
    ] = await Promise.all([
      client.from("departments").select("*").order("id", { ascending: true }),
      client.from("categories").select("*").order("id", { ascending: true }),
      client.from("employees").select("*").order("id", { ascending: true }),
      client.from("epis").select("*").order("id", { ascending: true }),
      client.from("epi_variants").select("*").order("id", { ascending: true }),
      client.from("movements").select("*").order("id", { ascending: false }),
      client
        .from("stock_entries")
        .select("*")
        .order("id", { ascending: false }),
      client
        .from("notifications")
        .select("*")
        .order("id", { ascending: false }),
    ])

    const failed = [
      depRes,
      catsRes,
      empsRes,
      episRes,
      varsRes,
      movsRes,
      entriesRes,
      notifRes,
    ].find((r) => r.error)
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
      team:
        e.department_id != null
          ? (departmentById.get(e.department_id)?.name ?? "")
          : "",
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
      const variantSum = variants.reduce((s, v) => s + v.quantity, 0)
      return {
        id: e.id,
        name: e.name,
        category:
          e.category_id != null
            ? (categoryById.get(e.category_id)?.name ?? "")
            : "",
        subcategory: e.subcategory,
        manufacturer: e.manufacturer,
        supplier: e.supplier,
        description: e.description,
        caNumber: e.ca_number || undefined,
        caExpiry: e.ca_expiry || undefined,
        batchNumber: e.batch_number,
        manufacturingDate: formatDate(e.manufacturing_date),
        totalQuantity: variants.length > 0 ? variantSum : e.total_quantity,
        minQuantity: e.min_quantity,
        location: e.location,
        status: computeStatus(
          variants.length > 0 ? variantSum : e.total_quantity,
          e.min_quantity,
        ),
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
      color: m.color || undefined,
      size: m.size || undefined,
      cartId: m.cart_id || undefined,
      photoUrl: m.photo_url || undefined,
      signatureUrl: m.signature_url || undefined,
      offlineCreated: m.offline_created === true,
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
      value: mappedEpis
        .filter((e) => e.category === c.name)
        .reduce((s, e) => s + e.totalQuantity, 0),
      fill: c.color,
    }))

    const movementsOverTime = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      return {
        month: MONTHS_SHORT[d.getMonth()],
        entregas: mappedMovements.filter(
          (m) => m.type === "Entrega" && m.date.startsWith(prefix),
        ).length,
        devolucoes: mappedMovements.filter(
          (m) => m.type === "Devolução" && m.date.startsWith(prefix),
        ).length,
        entradas: mappedMovements.filter(
          (m) => m.type === "Entrada" && m.date.startsWith(prefix),
        ).length,
      }
    })

    const stockTrend = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(
      (day) => ({
        day,
        stock: mappedEpis.reduce((s, e) => s + e.totalQuantity, 0),
      }),
    )

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

  // Nome único por instância de client: evita o erro "cannot add postgres_changes
  // callbacks ... after subscribe()" quando o client troca no login (o removeChannel
  // é assíncrono e o .channel() com o mesmo nome devolveria o canal antigo inscrito).
  const realtimeChannelName = useMemo(
    () => `realtime-data-${++channelSeq}`,
    [client],
  )

  // Realtime: atualiza os dados quando qualquer tabela mudar no banco.
  useEffect(() => {
    try {
      const channel = client
        .channel(realtimeChannelName)
        .on("postgres_changes", { event: "*", schema: "public" }, () => {
          refresh()
        })
        .subscribe()
      return () => {
        client.removeChannel(channel)
      }
    } catch {
      // realtime falhou: o app continua funcionando (dados carregam no refresh).
    }
  }, [client, refresh, realtimeChannelName])

  const addEmployee = useCallback(
    async (data: {
      name: string
      cpf?: string
      phone?: string
      registration?: string
      role?: string
      department?: string
      sector?: string
      company?: string
      status?: string
    }) => {
      const registration = (data.registration || "").trim()
      const cpf = (data.cpf || "").trim()

      if (!registration) throw new Error("Informe a matrícula do colaborador.")
      if (!cpf) throw new Error("Informe o CPF do colaborador.")

      const { data: dupReg } = await client
        .from("employees")
        .select("id")
        .eq("registration", registration)
        .maybeSingle()
      if (dupReg)
        throw new Error(
          `Já existe um colaborador com a matrícula "${registration}".`,
        )

      const { data: dupCpf } = await client
        .from("employees")
        .select("id")
        .eq("cpf", cpf)
        .maybeSingle()
      if (dupCpf)
        throw new Error(`Já existe um colaborador com o CPF "${cpf}".`)

      const departmentId =
        departments.find((t) => t.name === data.department)?.id ?? null
      const { error } = await client.from("employees").insert({
        name: data.name,
        cpf,
        phone: data.phone || "",
        registration,
        role: data.role || "",
        department_id: departmentId,
        sector: data.sector || "",
        company: data.company || "Norion",
        status: data.status || "Ativo",
      })
      if (error) throw new Error(error.message)
      await refresh()
    },
    [refresh, client, departments],
  )

  const deleteEmployee = useCallback(
    async (id: number) => {
      const { error } = await client.from("employees").delete().eq("id", id)
      if (error) throw new Error(error.message)
      await refresh()
    },
    [refresh, client],
  )

  const updateEmployee = useCallback(
    async (
      id: number,
      data: {
        name: string
        cpf?: string
        phone?: string
        registration?: string
        role?: string
        department?: string
        sector?: string
        company?: string
        status?: string
      },
    ) => {
      const registration = (data.registration || "").trim()
      const cpf = (data.cpf || "").trim()

      if (!registration) throw new Error("Informe a matrícula do colaborador.")
      if (!cpf) throw new Error("Informe o CPF do colaborador.")

      const { data: dupReg } = await client
        .from("employees")
        .select("id")
        .eq("registration", registration)
        .neq("id", id)
        .maybeSingle()
      if (dupReg)
        throw new Error(
          `Já existe outro colaborador com a matrícula "${registration}".`,
        )

      const { data: dupCpf } = await client
        .from("employees")
        .select("id")
        .eq("cpf", cpf)
        .neq("id", id)
        .maybeSingle()
      if (dupCpf)
        throw new Error(`Já existe outro colaborador com o CPF "${cpf}".`)

      const departmentId =
        departments.find((t) => t.name === data.department)?.id ?? null
      const { error } = await client
        .from("employees")
        .update({
          name: data.name,
          cpf,
          phone: data.phone || "",
          registration,
          role: data.role || "",
          department_id: departmentId,
          sector: data.sector || "",
          company: data.company || "Norion",
          status: data.status || "Ativo",
        })
        .eq("id", id)
      if (error) throw new Error(error.message)
      await refresh()
    },
    [refresh, client, departments],
  )

  const addDepartment = useCallback(
    async (data: { name: string description?: string color?: string }) => {
      const { error } = await client.from("departments").insert({
        name: data.name,
        description: data.description || "",
        color: data.color || "#6366F1",
      })
      if (error) throw new Error(error.message)
      await refresh()
    },
    [refresh, client],
  )

  const deleteDepartment = useCallback(
    async (id: number) => {
      const { error } = await client.from("departments").delete().eq("id", id)
      if (error) throw new Error(error.message)
      await refresh()
    },
    [refresh, client],
  )

  const updateDepartment = useCallback(
    async (
      id: number,
      data: {
        name: string
        description?: string
        color?: string
      },
    ) => {
      const { error } = await client
        .from("departments")
        .update({
          name: data.name,
          description: data.description || "",
          color: data.color || "#6366F1",
        })
        .eq("id", id)
      if (error) throw new Error(error.message)
      await refresh()
    },
    [refresh, client],
  )

  const addCategory = useCallback(
    async (data: {
      name: string
      description?: string
      icon?: string
      color?: string
    }) => {
      const { error } = await client.from("categories").insert({
        name: data.name,
        description: data.description || "",
        icon: data.icon || "📦",
        color: data.color || "#6366F1",
      })
      if (error) throw new Error(error.message)
      await refresh()
    },
    [refresh, client],
  )

  const updateCategory = useCallback(
    async (
      id: number,
      data: {
        name: string
        description?: string
        icon?: string
        color?: string
      },
    ) => {
      const { error } = await client
        .from("categories")
        .update({
          name: data.name,
          description: data.description || "",
          icon: data.icon || "📦",
          color: data.color || "#6366F1",
        })
        .eq("id", id)
      if (error) throw new Error(error.message)
      await refresh()
    },
    [refresh, client],
  )

  const deleteCategory = useCallback(
    async (id: number) => {
      const { error } = await client.from("categories").delete().eq("id", id)
      if (error) throw new Error(error.message)
      await refresh()
    },
    [refresh, client],
  )

  interface EpiVariantInput {
    color: string
    size: string
    quantity: number
  }

  const addEpi = useCallback(
    async (data: {
      name: string
      category?: string
      subcategory?: string
      manufacturer?: string
      supplier?: string
      description?: string
      caNumber?: string
      caExpiry?: string
      batchNumber?: string
      manufacturingDate?: string
      totalQuantity: number
      minQuantity?: number
      location?: string
      variants?: EpiVariantInput[]
      notes?: string
    }) => {
      if (!data.name.trim()) throw new Error("Informe o nome do EPI.")

      const { data: existing } = await client
        .from("epis")
        .select("id")
        .ilike("name", data.name.trim())
        .maybeSingle()
      if (existing)
        throw new Error(
          `Já existe um EPI cadastrado com o nome "${data.name.trim()}".`,
        )

      const categoryId =
        categories.find((c) => c.name === data.category)?.id ?? null
      const cleanVariants = (data.variants ?? []).filter((v) => v.quantity > 0)
      const total = cleanVariants.reduce((s, v) => s + v.quantity, 0)

      const { data: row, error } = await client
        .from("epis")
        .insert({
          name: data.name.trim(),
          category_id: categoryId,
          subcategory: data.subcategory || "",
          manufacturer: data.manufacturer || "",
          supplier: data.supplier || "",
          description: data.description || "",
          ca_number: data.caNumber || "",
          ca_expiry: data.caExpiry || null,
          batch_number: data.batchNumber || "",
          manufacturing_date: data.manufacturingDate || null,
          total_quantity: total > 0 ? total : data.totalQuantity || 0,
          min_quantity: data.minQuantity ?? 0,
          location: data.location || "",
          notes: data.notes || "",
        })
        .select("id")
        .single()
      if (error) {
        if (error.code === "23505")
          throw new Error(
            `Já existe um EPI cadastrado com o nome "${data.name.trim()}".`,
          )
        throw new Error(error.message)
      }

      if (cleanVariants.length > 0) {
        const { error: vErr } = await client.from("epi_variants").insert(
          cleanVariants.map((v) => ({
            epi_id: row.id,
            color: v.color || "",
            size: v.size || "",
            quantity: v.quantity,
            min_quantity: 0,
          })),
        )
        if (vErr) throw new Error(vErr.message)
      }
      await refresh()
    },
    [refresh, client, categories],
  )

  const updateEpi = useCallback(
    async (
      id: number,
      data: {
        name: string
        category?: string
        subcategory?: string
        manufacturer?: string
        supplier?: string
        description?: string
        caNumber?: string
        caExpiry?: string
        batchNumber?: string
        manufacturingDate?: string
        totalQuantity: number
        minQuantity?: number
        location?: string
        variants?: EpiVariantInput[]
        notes?: string
      },
    ) => {
      const { data: existing } = await client
        .from("epis")
        .select("id")
        .ilike("name", data.name.trim())
        .neq("id", id)
        .maybeSingle()
      if (existing)
        throw new Error(
          `Já existe um EPI cadastrado com o nome "${data.name.trim()}".`,
        )

      const categoryId =
        categories.find((c) => c.name === data.category)?.id ?? null
      const cleanVariants = (data.variants ?? []).filter((v) => v.quantity > 0)
      const total = cleanVariants.reduce((s, v) => s + v.quantity, 0)

      const { error } = await client
        .from("epis")
        .update({
          name: data.name,
          category_id: categoryId,
          subcategory: data.subcategory || "",
          manufacturer: data.manufacturer || "",
          supplier: data.supplier || "",
          description: data.description || "",
          ca_number: data.caNumber || "",
          ca_expiry: data.caExpiry || null,
          batch_number: data.batchNumber || "",
          manufacturing_date: data.manufacturingDate || null,
          total_quantity: total > 0 ? total : data.totalQuantity || 0,
          min_quantity: data.minQuantity ?? 0,
          location: data.location || "",
          notes: data.notes || "",
        })
        .eq("id", id)
      if (error) throw new Error(error.message)

      if (cleanVariants.length > 0) {
        const { data: existingVariants } = await client
          .from("epi_variants")
          .select("id, color, size, quantity")
          .eq("epi_id", id)

        const existingMap = new Map(
          (existingVariants ?? []).map((v) => [
            `${v.color || ""}|${v.size || ""}`,
            v,
          ]),
        )

        const submittedKeys = new Set(
          cleanVariants.map((v) => `${v.color || ""}|${v.size || ""}`),
        )
        const toDelete = (existingVariants ?? []).filter(
          (v) => !submittedKeys.has(`${v.color || ""}|${v.size || ""}`),
        )

        const toUpdate = cleanVariants.filter((v) => {
          const found = existingMap.get(`${v.color || ""}|${v.size || ""}`)
          return found && found.quantity !== v.quantity
        })
        const toInsert = cleanVariants.filter(
          (v) => !existingMap.has(`${v.color || ""}|${v.size || ""}`),
        )

        const results = await Promise.all([
          ...toUpdate.map(async (v) => {
            const found = existingMap.get(`${v.color || ""}|${v.size || ""}`)
            return client
              .from("epi_variants")
              .update({ quantity: v.quantity })
              .eq("id", found!.id)
          }),
          toInsert.length > 0 ? client.from("epi_variants").insert(
                toInsert.map((v) => ({
                  epi_id: id,
                  color: v.color || "",
                  size: v.size || "",
                  quantity: v.quantity,
                  min_quantity: 0,
                })),
              ) : Promise.resolve({ error: null }),
          toDelete.length > 0
            ? client
                .from("epi_variants")
                .delete()
                .in(
                  "id",
                  toDelete.map((v) => v.id),
                )
            : Promise.resolve({ error: null }),
        ])
        const failed = results.find((r) => r.error)
        if (failed?.error) throw new Error(failed.error.message)
      } else {
        await client.from("epi_variants").delete().eq("epi_id", id)
      }
      await refresh()
    },
    [refresh, client, categories],
  )

  const deleteEpi = useCallback(
    async (id: number) => {
      await client.from("epi_variants").delete().eq("epi_id", id)
      const { error } = await client.from("epis").delete().eq("id", id)
      if (error) throw new Error(error.message)
      await refresh()
    },
    [refresh, client],
  )

  interface EntryVariant {
    color: string
    size: string
    quantity: number
  }

  const addEntry = useCallback(
    async (data: {
      epi: string
      manufacturer?: string
      supplier?: string
      batch?: string
      date?: string
      variants: EntryVariant[]
      notes?: string
    }) => {
      const total = data.variants.reduce((s, v) => s + v.quantity, 0)
      if (total <= 0) throw new Error("Informe ao menos uma quantidade.")

      const epiName = data.epi.trim()

      const epiQuery = await client
        .from("epis")
        .select("id, name, total_quantity")
        .eq("name", epiName)
        .maybeSingle()

      let epiRow: { id: number name: string total_quantity: number } | null =
        epiQuery.data ?? null

      if (!epiRow) {
        const { data: created, error: createErr } = await client
          .from("epis")
          .insert({
            name: epiName,
            category_id: null,
            subcategory: "",
            manufacturer: data.manufacturer || "",
            supplier: data.supplier || "",
            description: "",
            ca_number: "",
            batch_number: data.batch || "",
            total_quantity: 0,
            min_quantity: 0,
            location: "",
          })
          .select("id")
          .single()
        if (createErr) {
          if (createErr.code === "23505") {
            const retry = await client
              .from("epis")
              .select("id, name, total_quantity")
              .eq("name", epiName)
              .maybeSingle()
            if (retry.data) {
              epiRow = retry.data
            } else {
              throw new Error(
                `Não foi possível cadastrar o EPI "${epiName}": ${createErr.message}`,
              )
            }
          } else {
            throw new Error(
              `Não foi possível cadastrar o EPI "${epiName}": ${createErr.message}`,
            )
          }
        } else {
          epiRow = { id: created.id, name: epiName, total_quantity: 0 }
        }
      }

      const epiId = epiRow.id

      const { error: entryErr } = await client.from("stock_entries").insert(
        data.variants.map((v) => ({
          epi_id: epiId,
          epi_name: epiName,
          manufacturer: data.manufacturer || "",
          supplier: data.supplier || "",
          batch: data.batch || "",
          quantity: v.quantity,
          color: v.color || "",
          size: v.size || "",
          notes: data.notes || "",
        })),
      )
      if (entryErr) throw new Error(entryErr.message)

      const { error: updErr } = await client
        .from("epis")
        .update({ total_quantity: (epiRow.total_quantity ?? 0) + total })
        .eq("id", epiId)
      if (updErr) throw new Error(updErr.message)

      const { data: existingVariants } = await client
        .from("epi_variants")
        .select("id, color, size, quantity")
        .eq("epi_id", epiId)

      const existingMap = new Map(
        (existingVariants ?? []).map((v) => [
          `${v.color || ""}|${v.size || ""}`,
          v,
        ]),
      )

      const toUpdate = data.variants
        .filter((v) => existingMap.has(`${v.color || ""}|${v.size || ""}`))
        .map((v) => {
          const found = existingMap.get(`${v.color || ""}|${v.size || ""}`)
          return client
            .from("epi_variants")
            .update({ quantity: found!.quantity + v.quantity })
            .eq("id", found!.id)
        })
      const toInsert = data.variants
        .filter((v) => !existingMap.has(`${v.color || ""}|${v.size || ""}`))
        .map((v) => ({
          epi_id: epiId,
          color: v.color || "",
          size: v.size || "",
          quantity: v.quantity,
          min_quantity: 0,
        }))

      const results = await Promise.all([
        ...toUpdate,
        toInsert.length > 0
          ? client.from("epi_variants").insert(toInsert)
          : Promise.resolve({ error: null }),
      ])
      const failed = results.find((r) => r.error)
      if (failed?.error) throw new Error(failed.error.message)

      const { error: movErr } = await client.from("movements").insert({
        type: "Entrada",
        employee_name: "—",
        epi_name: epiName,
        quantity: total,
        operator: "Sistema Web",
        notes: `Entrada de estoque: ${data.variants.map((v) => `${v.size || v.color || "Único"} x${v.quantity}`).join(", ")}`,
      })
      if (movErr) throw new Error(movErr.message)

      await refresh()
    },
    [refresh, client],
  )

  /** Matriz distribui estoque para uma filial: grava no banco dela + notificação + movimento na matriz. */
  const distributeToCompany = useCallback(
    async (params: {
      targetUrl: string
      targetKey: string
      targetName: string
      matrizName: string
      epi: string
      variants: EntryVariant[]
      note?: string
    }): Promise<void> => {
      const total = params.variants.reduce((s, v) => s + v.quantity, 0)
      if (total <= 0) throw new Error("Informe ao menos uma quantidade.")

      const target = createCompanyClient(params.targetUrl, params.targetKey)
      const detail = params.variants
        .map((v) => `${v.size || v.color || "Único"} x${v.quantity}`)
        .join(", ")

      // ── 1) Pré-validação: estoque da matriz por variação ──
      const matrizEpi = await client
        .from("epis")
        .select("id, total_quantity")
        .eq("name", params.epi)
        .maybeSingle()
      if (!matrizEpi.data)
        throw new Error(
          `EPI "${params.epi}" não encontrado no estoque da matriz.`,
        )

      const { data: matrizVariants } = await client
        .from("epi_variants")
        .select("id, color, size, quantity")
        .eq("epi_id", matrizEpi.data.id)

      const mvList = matrizVariants ?? []
      if (mvList.length === 0) {
        if ((matrizEpi.data.total_quantity ?? 0) < total) {
          throw new Error(
            `Estoque insuficiente na matriz (disponível: ${matrizEpi.data.total_quantity}).`,
          )
        }
      } else {
        for (const v of params.variants) {
          const mv = mvList.find(
            (x) => (x.color ?? "") === v.color && (x.size ?? "") === v.size,
          )
          if (!mv)
            throw new Error(
              `Variação ${v.size || v.color || "Único"} de "${params.epi}" não existe no estoque da matriz.`,
            )
          if (mv.quantity < v.quantity) {
            throw new Error(
              `Estoque insuficiente da variação ${v.size || v.color || "Único"} (disponível: ${mv.quantity}).`,
            )
          }
        }
      }

      // ── 2) Execução com log de compensação (rollback em caso de falha) ──
      const undos: Array<() => Promise<void>> = []
      const track = async <T,>(
        undo: () => Promise<void>,
        run: () => Promise<T>,
      ): Promise<T> => {
        const result = await run()
        undos.push(undo)
        return result
      }

      try {
        // ── Filial: EPI ──
        const targetEpi = await target
          .from("epis")
          .select("id, total_quantity")
          .eq("name", params.epi)
          .maybeSingle()
        let targetEpiId: number | null = targetEpi.data?.id ?? null

        if (!targetEpi.data) {
          const inserted = await track(
            async () => {
              if (targetEpiId != null)
                await target.from("epis").delete().eq("id", targetEpiId)
            },
            async () => {
              const { data, error } = await target
                .from("epis")
                .insert({
                  name: params.epi,
                  subcategory: "",
                  manufacturer: "",
                  supplier: "",
                  description: "",
                  ca_number: "",
                  batch_number: "",
                  total_quantity: total,
                  min_quantity: 0,
                  location: "",
                })
                .select("id")
                .single()
              if (error)
                throw new Error(
                  `Não foi possível registrar o EPI na filial: ${error.message}`,
                )
              return data.id
            },
          )
          targetEpiId = inserted
        } else {
          const oldTotal = targetEpi.data.total_quantity ?? 0
          await track(
            async () => {
              await target
                .from("epis")
                .update({ total_quantity: oldTotal })
                .eq("id", targetEpiId!)
            },
            async () => {
              const { error } = await target
                .from("epis")
                .update({ total_quantity: oldTotal + total })
                .eq("id", targetEpiId!)
              if (error) throw new Error(error.message)
            },
          )
        }

        // ── Filial: variantes ──
        const { data: targetVariants } = await target
          .from("epi_variants")
          .select("id, color, size, quantity")
          .eq("epi_id", targetEpiId)

        const targetMap = new Map(
          (targetVariants ?? []).map((v) => [
            `${v.color || ""}|${v.size || ""}`,
            v,
          ]),
        )

        const toUpdate = params.variants
          .filter((v) => targetMap.has(`${v.color || ""}|${v.size || ""}`))
          .map((v) => {
            const found = targetMap.get(`${v.color || ""}|${v.size || ""}`)
            const oldQty = found!.quantity
            return track(
              async () => {
                await target
                  .from("epi_variants")
                  .update({ quantity: oldQty })
                  .eq("id", found!.id)
              },
              async () => {
                const { error } = await target
                  .from("epi_variants")
                  .update({ quantity: oldQty + v.quantity })
                  .eq("id", found!.id)
                if (error) throw new Error(error.message)
              },
            )
          })
        const toInsert = params.variants
          .filter((v) => !targetMap.has(`${v.color || ""}|${v.size || ""}`))
          .map((v) => ({
            epi_id: targetEpiId,
            color: v.color || "",
            size: v.size || "",
            quantity: v.quantity,
            min_quantity: 0,
          }))

        if (toInsert.length > 0) {
          const { data: insertedRows, error: insErr } = await target
            .from("epi_variants")
            .insert(toInsert)
            .select("id")
          if (insErr) throw new Error(insErr.message)
          undos.push(async () => {
            const ids = (insertedRows ?? []).map((r) => r.id)
            if (ids.length > 0)
              await target.from("epi_variants").delete().in("id", ids)
          })
        }
        await Promise.all(toUpdate)

        // ── Filial: entrada, notificação e movimento ──
        const { error: seErr } = await target.from("stock_entries").insert({
          epi_id: targetEpiId,
          epi_name: params.epi,
          manufacturer: "",
          supplier: "",
          batch: "",
          quantity: total,
          color: "",
          size: "",
          notes: `Distribuição da ${params.matrizName}: ${detail}${
            params.note ? ` — ${params.note}` : ""
          }`,
          company_name: params.matrizName,
        })
        if (seErr) throw new Error(seErr.message)

        const { data: notifRow, error: notifErr } = await target
          .from("notifications")
          .insert({
            type: "distribuicao",
            title: "Distribuição da Matriz",
            message: `Chegaram ${total} unidade(s) de ${params.epi} (${detail}).`,
          })
          .select("id")
          .single()
        if (notifErr) throw new Error(notifErr.message)

        const { data: targetMov, error: tmovErr } = await target
          .from("movements")
          .insert({
            type: "Entrada",
            employee_name: "—",
            epi_name: params.epi,
            quantity: total,
            operator: "Matriz",
            notes: `Distribuição da ${params.matrizName}${
              params.note ? ` — ${params.note}` : ""
            }`,
            company_name: params.matrizName,
          })
          .select("id")
          .single()
        if (tmovErr) throw new Error(tmovErr.message)

        undos.push(async () => {
          await target.from("notifications").delete().eq("id", notifRow.id)
          await target.from("movements").delete().eq("id", targetMov.id)
        })

        // ── Matriz: baixa no estoque e nas variantes ──
        const oldMatrizTotal = matrizEpi.data.total_quantity ?? 0
        const oldMvQuantities = new Map(
          mvList.map((mv) => [mv.id, mv.quantity]),
        )
        await track(
          async () => {
            await client
              .from("epis")
              .update({ total_quantity: oldMatrizTotal })
              .eq("id", matrizEpi.data!.id)
          },
          async () => {
            const { error } = await client
              .from("epis")
              .update({ total_quantity: Math.max(0, oldMatrizTotal - total) })
              .eq("id", matrizEpi.data!.id)
            if (error) throw new Error(error.message)
          },
        )

        const matrizUndoUpdates = mvList.map((mv) =>
          track(
            async () => {
              await client
                .from("epi_variants")
                .update({ quantity: oldMvQuantities.get(mv.id)! })
                .eq("id", mv.id)
            },
            async () => {
              const targetQty =
                params.variants.find(
                  (v) =>
                    (v.color || "") === (mv.color ?? "") &&
                    (v.size || "") === (mv.size ?? ""),
                )?.quantity ?? 0
              if (targetQty > 0) {
                const { error } = await client
                  .from("epi_variants")
                  .update({ quantity: Math.max(0, mv.quantity - targetQty) })
                  .eq("id", mv.id)
                if (error) throw new Error(error.message)
              }
            },
          ),
        )
        await Promise.all(matrizUndoUpdates)

        // ── Matriz: movimento e notificação ──
        const { data: movRow, error: movErr } = await client
          .from("movements")
          .insert({
            type: "Distribuição",
            employee_name: "—",
            epi_name: params.epi,
            quantity: total,
            operator: "Sistema Web",
            notes: `Enviado para ${params.targetName}: ${detail}${
              params.note ? ` — ${params.note}` : ""
            }`,
            company_name: params.targetName,
          })
          .select("id")
          .single()
        if (movErr) throw new Error(movErr.message)

        const { data: matrizNotif, error: mnErr } = await client
          .from("notifications")
          .insert({
            type: "distribuicao",
            title: "Distribuição concluída",
            message: `${total} unidade(s) de ${params.epi} enviadas para ${params.targetName}.`,
          })
          .select("id")
          .single()
        if (mnErr) throw new Error(mnErr.message)

        undos.push(async () => {
          await client.from("movements").delete().eq("id", movRow.id)
          await client.from("notifications").delete().eq("id", matrizNotif.id)
        })

        await refresh()
      } catch (err) {
        for (const undo of undos.reverse()) {
          try {
            await undo()
          } catch {
            /* melhor esforço */
          }
        }
        throw err instanceof Error ? err : new Error(String(err))
      }
    },
    [refresh, client],
  )

  const markNotificationRead = useCallback(
    async (id: number) => {
      await client.from("notifications").update({ read: true }).eq("id", id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      )
    },
    [client],
  )

  const markAllNotificationsRead = useCallback(async () => {
    await client.from("notifications").update({ read: true }).eq("read", false)
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
