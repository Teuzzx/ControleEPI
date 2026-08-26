import { useState, useMemo } from "react"
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  ChevronDown,
  Truck,
  ArrowLeftRight,
  Package,
} from "lucide-react"
import { useSupabaseData } from "../hooks/useSupabaseData"
import Modal from "../components/ui/Modal"
import type { Employee, Movement } from "../data/mock"

const TYPE_BADGE: Record<string, string> = {
  Entrega: "badge-success",
  Devolução: "badge-warning",
  Troca: "badge-info",
  Entrada: "badge-neutral",
  Baixa: "badge-danger",
  Distribuição: "badge-info",
}

function MovementTypeBadge({ type }: { type: string }) {
  return (
    <span
      className={`badge ${TYPE_BADGE[type] ?? "badge-neutral"}`}
      style={{ whiteSpace: "nowrap" }}
    >
      {type}
    </span>
  )
}

function Avatar({ name, size = 32 }: { name: string size?: number }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
  const colors = [
    "#6366F1",
    "#22D3EE",
    "#F59E0B",
    "#10B981",
    "#F43F5E",
    "#8B5CF6",
    "#EC4899",
  ]
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: `${color}28`,
        border: `1px solid ${color}40`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        fontSize: size * 0.36,
        fontWeight: 700,
        color,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}

type Mode = "list" | "view" | "add" | "edit"

export default function Employees() {
  const {
    employees,
    departments,
    movements,
    loading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  } = useSupabaseData()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "Ativo" | "Inativo">(
    "all",
  )
  const [teamFilter, setTeamFilter] = useState("all")
  const [mode, setMode] = useState<Mode>("list")
  const [selected, setSelected] = useState<Employee | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const PER_PAGE = 8

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.registration.toLowerCase().includes(q) ||
      e.cpf.includes(q)
    const matchStatus = statusFilter === "all" || e.status === statusFilter
    const matchTeam = teamFilter === "all" || e.team === teamFilter
    return matchSearch && matchStatus && matchTeam
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const selectedHistory = useMemo<Movement[]>(
    () =>
      selected ? movements.filter((m) => m.employee === selected.name) : [],
    [selected, movements],
  )

  const historyStats = useMemo(
    () => ({
      entregas: selectedHistory.filter((m) => m.type === "Entrega").length,
      devolucoes: selectedHistory.filter((m) => m.type === "Devolução").length,
      itens: selectedHistory.reduce((s, m) => s + m.quantity, 0),
    }),
    [selectedHistory],
  )

  const openView = (emp: Employee) => {
    setSelected(emp)
    setMode("view")
  }
  const openEdit = (emp: Employee) => {
    setSelected(emp)
    setForm({
      name: emp.name,
      cpf: emp.cpf,
      phone: emp.phone,
      registration: emp.registration,
      role: emp.role,
      team: emp.team,
      sector: emp.sector,
      company: emp.company,
      status: emp.status,
    })
    setMode("edit")
  }
  const closeModal = () => {
    setMode("list")
    setSelected(null)
    setForm({})
  }
  const deleteEmployeeAction = async (emp: Employee) => {
    if (
      !window.confirm(
        `Excluir o colaborador "${emp.name}"? Essa ação não pode ser desfeita.`,
      )
    )
      return
    try {
      await deleteEmployee(emp.id)
    } catch (err) {
      alert(`Erro ao excluir: ${(err as Error).message}`)
    }
    closeModal()
  }

  return (
    <div style={{ padding: "24px 28px", animation: "fade-up 0.5s ease both" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 20,
              fontWeight: 700,
              color: "#E8EAF6",
              margin: "0 0 4px",
              letterSpacing: "-0.03em",
            }}
          >
            Colaboradores
          </h2>
          <p style={{ fontSize: 13, color: "#3D4257", margin: 0 }}>
            {loading
              ? "Carregando..."
              : `${employees.filter((e) => e.status === "Ativo").length} ativos de ${employees.length} cadastrados`}
          </p>
        </div>
        <button
          onClick={() => setMode("add")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "linear-gradient(135deg, #6366F1, #4F46E5)",
            color: "white",
            border: "none",
            borderRadius: 10,
            padding: "10px 18px",
            cursor: "pointer",
            fontFamily: "var(--font-display)",
            fontSize: 13.5,
            fontWeight: 600,
            boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)"
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.4)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = ""
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.3)"
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
          Novo Colaborador
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          background: "rgba(13,15,24,0.9)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          padding: "14px 16px",
          marginBottom: 16,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: "1", minWidth: 200 }}>
          <Search
            size={13}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#3D4257",
            }}
          />
          <input
            className="input-field"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Buscar por nome, matrícula ou CPF..."
            style={{ paddingLeft: 34, paddingTop: 9, paddingBottom: 9 }}
          />
        </div>

        {/* Status filter */}
        <div style={{ position: "relative" }}>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any)
              setPage(1)
            }}
            style={{
              appearance: "none",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 9,
              padding: "9px 32px 9px 14px",
              color: "#9BA3C4",
              fontSize: 13,
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
              outline: "none",
              minWidth: 120,
            }}
          >
            <option value="all">Todos</option>
            <option value="Ativo">Ativos</option>
            <option value="Inativo">Inativos</option>
          </select>
          <ChevronDown
            size={12}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#5C6388",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Department filter */}
        <div style={{ position: "relative" }}>
          <select
            value={teamFilter}
            onChange={(e) => {
              setTeamFilter(e.target.value)
              setPage(1)
            }}
            style={{
              appearance: "none",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 9,
              padding: "9px 32px 9px 14px",
              color: "#9BA3C4",
              fontSize: 13,
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
              outline: "none",
              minWidth: 160,
            }}
          >
            <option value="all">Todos os Departamentos</option>
            {departments.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#5C6388",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: "rgba(13,15,24,0.9)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Matrícula</th>
                <th>Cargo / Equipe</th>
                <th>Setor</th>
                <th>Admissão</th>
                <th>Status</th>
                <th style={{ textAlign: "right", paddingRight: 20 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "48px",
                      color: "#3D4257",
                    }}
                  >
                    Nenhum colaborador encontrado.
                  </td>
                </tr>
              ) : (
                paged.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => openView(emp)}
                    style={{ cursor: "pointer" }}
                    title="Clique para ver o histórico do colaborador"
                  >
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <Avatar name={emp.name} />
                        <div>
                          <div
                            style={{
                              fontSize: 13.5,
                              fontWeight: 600,
                              color: "#C4C9E2",
                            }}
                          >
                            {emp.name}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#3D4257" }}>
                            {emp.cpf}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: "#818CF8",
                      }}
                    >
                      {emp.registration}
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: "#9BA3C4" }}>
                        {emp.role}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#3D4257" }}>
                        {emp.team}
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: "#6B7280" }}>
                      {emp.sector}
                    </td>
                    <td
                      style={{
                        fontSize: 12.5,
                        fontFamily: "var(--font-mono)",
                        color: "#5C6388",
                      }}
                    >
                      {new Date(emp.admissionDate).toLocaleDateString("pt-BR")}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          emp.status === "Ativo"
                            ? "badge-success"
                            : "badge-neutral"
                        }`}
                      >
                        <div
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: "currentColor",
                          }}
                        />
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 4,
                        }}
                      >
                        {[
                          {
                            icon: <Eye size={13} />,
                            action: () => openView(emp),
                            color: "#6366F1",
                            title: "Visualizar",
                          },
                          {
                            icon: <Edit2 size={13} />,
                            action: () => openEdit(emp),
                            color: "#22D3EE",
                            title: "Editar",
                          },
                          {
                            icon: <Trash2 size={13} />,
                            action: () => deleteEmployeeAction(emp),
                            color: "#F43F5E",
                            title: "Excluir",
                          },
                        ].map(({ icon, action, color, title }) => (
                          <button
                            key={title}
                            onClick={(e) => {
                              e.stopPropagation()
                              action()
                            }}
                            title={title}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 7,
                              background: `${color}12`,
                              border: `1px solid ${color}25`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              color,
                              transition: "background 0.15s, transform 0.1s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = `${color}22`
                              e.currentTarget.style.transform = "scale(1.1)"
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = `${color}12`
                              e.currentTarget.style.transform = ""
                            }}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "#3D4257",
              fontFamily: "var(--font-mono)",
            }}
          >
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background:
                    n === page ? "rgba(99,102,241,0.2)" : "transparent",
                  border:
                    n === page
                      ? "1px solid rgba(99,102,241,0.4)"
                      : "1px solid transparent",
                  color: n === page ? "#A5B4FC" : "#5C6388",
                  fontSize: 12.5,
                  fontWeight: n === page ? 700 : 400,
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  transition: "all 0.15s",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail / History Modal */}
      {mode === "view" && selected && (
        <Modal onClose={closeModal}>
          <div
            className="modal-content glass-strong"
            style={{
              width: "100%",
              maxWidth: 720,
              borderRadius: 20,
              padding: "28px",
              maxHeight: "92vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar name={selected.name} size={44} />
                <div>
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 17,
                      fontWeight: 700,
                      color: "#E8EAF6",
                      margin: "0 0 3px",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {selected.name}
                  </h3>
                  <p style={{ fontSize: 12.5, color: "#5C6388", margin: 0 }}>
                    {selected.role} • {selected.team}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#5C6388",
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Info grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              {[
                { label: "Matrícula", value: selected.registration },
                { label: "CPF", value: selected.cpf },
                { label: "Telefone", value: selected.phone },
                { label: "Cargo", value: selected.role },
                { label: "Equipe", value: selected.team },
                { label: "Setor", value: selected.sector },
                { label: "Empresa", value: selected.company },
                {
                  label: "Admissão",
                  value: new Date(selected.admissionDate).toLocaleDateString(
                    "pt-BR",
                  ),
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 10,
                    padding: "10px 13px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "#3D4257",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 3,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{ fontSize: 13, color: "#C4C9E2", fontWeight: 500 }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 12,
                background: "rgba(255,255,255,0.03)",
                borderRadius: 10,
                padding: "10px 13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#3D4257",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Status
              </div>
              <span
                className={`badge ${
                  selected.status === "Ativo"
                    ? "badge-success"
                    : "badge-neutral"
                }`}
              >
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "currentColor",
                  }}
                />
                {selected.status}
              </span>
            </div>

            {/* History stats */}
            <div style={{ marginTop: 18 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <h4
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#E8EAF6",
                    margin: 0,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Histórico de Movimentações
                </h4>
                <span
                  style={{
                    flex: 1,
                    height: 1,
                    background: "rgba(255,255,255,0.06)",
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    color: "#3D4257",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {selectedHistory.length} registro
                  {selectedHistory.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                {[
                  {
                    label: "Entregas",
                    value: historyStats.entregas,
                    icon: <Truck size={13} />,
                    color: "#4ADE80",
                  },
                  {
                    label: "Devoluções",
                    value: historyStats.devolucoes,
                    icon: <ArrowLeftRight size={13} />,
                    color: "#FCD34D",
                  },
                  {
                    label: "Itens recebidos",
                    value: historyStats.itens,
                    icon: <Package size={13} />,
                    color: "#22D3EE",
                  },
                ].map(({ label, value, icon, color }) => (
                  <div
                    key={label}
                    style={{
                      background: `${color}0d`,
                      border: `1px solid ${color}22`,
                      borderRadius: 10,
                      padding: "10px 12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color,
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: 4,
                      }}
                    >
                      {icon} {label}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 18,
                        fontWeight: 700,
                        color,
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* History table */}
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{ overflowX: "auto", maxHeight: 260, overflowY: "auto" }}
              >
                {selectedHistory.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "36px 16px",
                      color: "#3D4257",
                      fontSize: 13,
                    }}
                  >
                    Nenhuma movimentação registrada para este colaborador.
                  </div>
                ) : (
                  <table className="data-table" style={{ minWidth: 620 }}>
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Tipo</th>
                        <th>EPI</th>
                        <th>Qtd</th>
                        <th>Operador</th>
                        <th>Obs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedHistory.map((m) => (
                        <tr key={m.id}>
                          <td
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 11.5,
                              color: "#5C6388",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {m.date}
                          </td>
                          <td>
                            <MovementTypeBadge type={m.type} />
                          </td>
                          <td
                            style={{
                              fontSize: 12.5,
                              color: "#C4C9E2",
                              fontWeight: 600,
                            }}
                          >
                            {m.epi}
                          </td>
                          <td
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 12.5,
                              fontWeight: 700,
                              color:
                                m.type === "Devolução" ? "#FCD34D" : "#4ADE80",
                            }}
                          >
                            {m.type === "Devolução" || m.type === "Baixa"
                              ? "-"
                              : "+"}
                            {m.quantity}
                          </td>
                          <td style={{ fontSize: 12, color: "#6B7280" }}>
                            {m.operator}
                          </td>
                          <td
                            style={{
                              fontSize: 11.5,
                              color: "#5C6388",
                              maxWidth: 180,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {m.notes || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                onClick={closeModal}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#9BA3C4",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Fechar
              </button>
              <button
                onClick={() => openEdit(selected)}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #6366F1, #4F46E5)",
                  border: "none",
                  color: "white",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Editar Colaborador
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit Modal */}
      {(mode === "add" || (mode === "edit" && selected)) && (
        <Modal onClose={closeModal}>
          <div
            className="modal-content glass-strong"
            style={{
              width: "100%",
              maxWidth: 560,
              borderRadius: 20,
              padding: "32px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#E8EAF6",
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                {mode === "edit" ? "Editar Colaborador" : "Novo Colaborador"}
              </h3>
              <button
                onClick={closeModal}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#5C6388",
                }}
              >
                <X size={15} />
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
              {[
                { label: "Nome Completo", key: "name", colSpan: 2 },
                { label: "CPF", key: "cpf" },
                { label: "Telefone", key: "phone" },
                { label: "Matrícula", key: "registration" },
                { label: "Cargo", key: "role" },
                { label: "Setor", key: "sector" },
                { label: "Empresa", key: "company" },
              ].map(({ label, key, colSpan }) => (
                <div
                  key={key}
                  style={{ gridColumn: colSpan ? "span 2" : undefined }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#5C6388",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 6,
                    }}
                  >
                    {label}
                  </label>
                  <input
                    className="input-field"
                    placeholder={label}
                    value={(form as any)[key] || ""}
                    onChange={(e) =>
                      setForm((prev: any) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
              <div
                style={{
                  gridColumn: "span 2",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#5C6388",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 6,
                    }}
                  >
                    Departamento
                  </label>
                  <select
                    className="input-field"
                    style={{ appearance: "none" }}
                    value={(form as any).team || ""}
                    onChange={(e) =>
                      setForm((prev: any) => ({
                        ...prev,
                        team: e.target.value,
                      }))
                    }
                  >
                    <option value="">Selecione...</option>
                    {departments.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#5C6388",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 6,
                    }}
                  >
                    Status
                  </label>
                  <select
                    className="input-field"
                    style={{ appearance: "none" }}
                    value={(form as any).status || "Ativo"}
                    onChange={(e) =>
                      setForm((prev: any) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                onClick={closeModal}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#9BA3C4",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const f = form as any
                  if (!f.name?.trim()) {
                    alert("Informe o nome do colaborador.")
                    return
                  }
                  if (!f.registration?.trim()) {
                    alert("Informe a matrícula do colaborador.")
                    return
                  }
                  if (!f.cpf?.trim()) {
                    alert("Informe o CPF do colaborador.")
                    return
                  }
                  try {
                    const data = {
                      name: f.name,
                      cpf: f.cpf || "",
                      phone: f.phone || "",
                      registration: f.registration || "",
                      role: f.role || "",
                      department: f.team || "",
                      sector: f.sector || "",
                      company: f.company || "Norion",
                      status: f.status || "Ativo",
                    }
                    if (mode === "edit" && selected) {
                      await updateEmployee(selected.id, data)
                    } else {
                      await addEmployee(data)
                    }
                  } catch (err) {
                    alert(`Erro ao salvar: ${(err as Error).message}`)
                    return
                  }
                  setForm({})
                  closeModal()
                }}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #6366F1, #4F46E5)",
                  border: "none",
                  color: "white",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {mode === "edit" ? "Salvar Alterações" : "Salvar Colaborador"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
