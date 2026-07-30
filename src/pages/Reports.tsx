import { useState, useMemo } from 'react'
import { FileText, Download, ChevronDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { employees, epis, movements, categories } from '../data/mock'

const REPORT_TYPES = [
  { id: 'stock',         label: 'Estoque Atual',          icon: '📦', desc: 'Situação atual de todos os EPIs' },
  { id: 'entries',       label: 'Entradas Realizadas',    icon: '📥', desc: 'Histórico de entradas no período' },
  { id: 'movements',     label: 'Movimentações',          icon: '🔄', desc: 'Todas as movimentações do período' },
  { id: 'employee',      label: 'Histórico de Colaborador', icon: '👤', desc: 'EPIs por colaborador' },
  { id: 'product',       label: 'Histórico de Produto',   icon: '🏷️', desc: 'Movimentações por EPI' },
  { id: 'low_stock',     label: 'Estoque Crítico',        icon: '⚠️', desc: 'Produtos abaixo do mínimo' },
  { id: 'top_products',  label: 'Mais Distribuídos',     icon: '📊', desc: 'Produtos mais entregues' },
  { id: 'devolutions',   label: 'Devoluções',             icon: '↩️', desc: 'Histórico de devoluções' },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(10,12,20,0.96)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ fontSize: 11, color: '#5C6388', margin: '0 0 4px', fontFamily: 'var(--font-mono)' }}>{label}</p>
      {payload.map((e: any) => (
        <p key={e.name} style={{ fontSize: 13, fontWeight: 700, color: e.color, margin: 0 }}>
          {e.value} <span style={{ color: '#9BA3C4', fontWeight: 400, fontSize: 11 }}>unidades</span>
        </p>
      ))}
    </div>
  )
}

function generateCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('stock')
  const [period, setPeriod] = useState('month')
  const [generating, setGenerating] = useState(false)

  const lowStockItems = useMemo(() => epis.filter((e) => e.status === 'Estoque Baixo' || e.status === 'Crítico'), [])
  const totalDeliveries = useMemo(() => movements.filter((m) => m.type === 'Entrega').length, [])
  const totalStock = useMemo(() => epis.reduce((s, e) => s + e.totalQuantity, 0), [])

  const topProducts = useMemo(() =>
    [...epis]
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 7)
      .map((e) => ({ name: e.name.length > 18 ? e.name.slice(0, 16) + '...' : e.name, qty: e.totalQuantity })),
    []
  )

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      const now = new Date()
      const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-')
      const periodLabel = period === 'week' ? 'Semanal' : period === 'month' ? 'Mensal' : period === 'quarter' ? 'Trimestral' : 'Anual'

      switch (selectedReport) {
        case 'stock': {
          const headers = ['Produto', 'Categoria', 'Fabricante', 'Qtd Total', 'Qtd Mínima', 'Status', 'Localização']
          const rows = epis.map((e) => [e.name, e.category, e.manufacturer, String(e.totalQuantity), String(e.minQuantity), e.status, e.location])
          generateCSV(`estoque-atual-${dateStr}`, headers, rows)
          break
        }
        case 'low_stock': {
          const headers = ['Produto', 'Categoria', 'Qtd Atual', 'Qtd Mínima', 'Status', 'Localização']
          const rows = lowStockItems.map((e) => [e.name, e.category, String(e.totalQuantity), String(e.minQuantity), e.status, e.location])
          generateCSV(`estoque-critico-${dateStr}`, headers, rows)
          break
        }
        case 'movements': {
          const headers = ['#', 'Tipo', 'Colaborador', 'EPI', 'Qtd', 'Data', 'Operador', 'Obs']
          const rows = movements.map((m) => [String(m.id), m.type, m.employee, m.epi, String(m.quantity), m.date, m.operator, m.notes || ''])
          generateCSV(`movimentacoes-${dateStr}`, headers, rows)
          break
        }
        case 'employee': {
          const headers = ['Nome', 'Matrícula', 'CPF', 'Cargo', 'Equipe', 'Setor', 'Empresa', 'Admissão', 'Status']
          const rows = employees.map((e) => [e.name, e.registration, e.cpf, e.role, e.team, e.sector, e.company, e.admissionDate, e.status])
          generateCSV(`colaboradores-${dateStr}`, headers, rows)
          break
        }
        case 'top_products': {
          const headers = ['Produto', 'Quantidade']
          const rows = [...epis].sort((a, b) => b.totalQuantity - a.totalQuantity).map((e) => [e.name, String(e.totalQuantity)])
          generateCSV(`produtos-mais-distribuidos-${dateStr}`, headers, rows)
          break
        }
        case 'devolutions': {
          const devs = movements.filter((m) => m.type === 'Devolução')
          const headers = ['#', 'Colaborador', 'EPI', 'Qtd', 'Data', 'Obs']
          const rows = devs.map((m) => [String(m.id), m.employee, m.epi, String(m.quantity), m.date, m.notes || ''])
          generateCSV(`devolucoes-${dateStr}`, headers, rows)
          break
        }
        default: {
          const headers = ['Relatório', 'Período', 'Gerado em']
          const rows = [[`${REPORT_TYPES.find((r) => r.id === selectedReport)?.label}`, periodLabel, now.toLocaleString('pt-BR')]]
          generateCSV(`relatorio-${dateStr}`, headers, rows)
        }
      }
      setGenerating(false)
    }, 800)
  }

  const handleExportExcel = () => handleGenerate()
  const handleExportPDF = () => handleGenerate()

  const isEmpty = employees.length === 0 && epis.length === 0 && movements.length === 0

  return (
    <div style={{ padding: '24px 28px', animation: 'fade-up 0.5s ease both' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#E8EAF6', margin: '0 0 4px', letterSpacing: '-0.03em' }}>Relatórios</h2>
        <p style={{ fontSize: 13, color: '#3D4257', margin: 0 }}>Gere e exporte relatórios detalhados do sistema</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>

        {/* Left panel — filters */}
        <div style={{ background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 700, color: '#E8EAF6', margin: 0 }}>Configurar Relatório</h3>

          {/* Report type */}
          <div>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: '#3D4257', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Tipo de Relatório</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {REPORT_TYPES.map((rt) => (
                <button key={rt.id} onClick={() => setSelectedReport(rt.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, border: 'none',
                  background: selectedReport === rt.id ? 'rgba(99,102,241,0.14)' : 'transparent',
                  cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 0.15s',
                }}
                  onMouseEnter={(e) => { if (selectedReport !== rt.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={(e) => { if (selectedReport !== rt.id) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ fontSize: 16 }}>{rt.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: selectedReport === rt.id ? '#A5B4FC' : '#9BA3C4' }}>{rt.label}</div>
                    <div style={{ fontSize: 11, color: '#3D4257', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rt.desc}</div>
                  </div>
                  {selectedReport === rt.id && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366F1', flexShrink: 0 }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Period */}
          <div>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: '#3D4257', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Período</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { val: 'week', label: 'Semana' },
                { val: 'month', label: 'Mês' },
                { val: 'quarter', label: 'Trimestre' },
                { val: 'year', label: 'Ano' },
              ].map((p) => (
                <button key={p.val} onClick={() => setPeriod(p.val)} style={{
                  padding: '8px', borderRadius: 8, border: '1px solid',
                  borderColor: period === p.val ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)',
                  background: period === p.val ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.025)',
                  color: period === p.val ? '#A5B4FC' : '#5C6388',
                  fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
                }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Additional filters */}
          <div>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: '#3D4257', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Filtros Adicionais</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Equipe', 'Categoria', 'Produto'].map((f) => (
                <div key={f} style={{ position: 'relative' }}>
                  <select style={{ appearance: 'none', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '9px 28px 9px 12px', color: '#6B7280', fontSize: 12.5, fontFamily: 'var(--font-sans)', cursor: 'pointer', outline: 'none', width: '100%' }}>
                    <option>Todos — {f}</option>
                  </select>
                  <ChevronDown size={11} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', color: '#5C6388', pointerEvents: 'none' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Export buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <button onClick={handleGenerate} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px',
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)', border: 'none', borderRadius: 10,
              color: 'white', fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 600,
              cursor: 'pointer', transition: 'transform 0.15s',
              opacity: generating ? 0.8 : 1,
            }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
            >
              {generating ? (
                <><span style={{ animation: 'spin-slow 0.8s linear infinite', display: 'flex' }}>⟳</span> Gerando...</>
              ) : (
                <><FileText size={14} /> Gerar Relatório</>
              )}
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleExportExcel} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 9, color: '#4ADE80', fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                <Download size={13} /> CSV
              </button>
              <button onClick={handleExportPDF} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 9, color: '#F87171', fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                <Download size={13} /> CSV
              </button>
            </div>
          </div>
        </div>

        {/* Right panel — preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Total de Entregas', value: totalDeliveries.toString(), color: '#6366F1' },
              { label: 'Itens em Estoque', value: totalStock.toLocaleString('pt-BR'), color: '#22D3EE' },
              { label: 'Alertas Ativos', value: lowStockItems.length.toString(), color: '#F43F5E' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '16px 18px',
              }}>
                <div style={{ fontSize: 10.5, color: '#3D4257', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, fontWeight: 700 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color, letterSpacing: '-0.03em' }}>
                  {isEmpty ? '0' : value}
                </div>
              </div>
            ))}
          </div>

          {/* Chart preview */}
          <div style={{ background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '22px 24px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#E8EAF6', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              Distribuição por Quantidade em Estoque
            </h3>
            <p style={{ fontSize: 12, color: '#3D4257', margin: '0 0 18px' }}>Visualização prévia do relatório selecionado</p>
            {isEmpty ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#3D4257', fontSize: 13 }}>
                Nenhum produto cadastrado para exibir no gráfico.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topProducts} margin={{ top: 4, right: 4, bottom: 0, left: -10 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#3D4257', fontSize: 10, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#3D4257', fontSize: 10, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="qty" name="Qtd" radius={[5, 5, 0, 0]}>
                    {topProducts.map((_, i) => (
                      <Cell key={i} fill={`hsl(${230 + i * 20}, 80%, 65%)`} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Low stock table */}
          <div style={{ background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 700, color: '#E8EAF6', margin: 0 }}>
                Produtos com Alerta de Estoque
              </h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Qtd Atual</th>
                  <th>Qtd Mínima</th>
                  <th>Status</th>
                  <th>Localização</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#3D4257' }}>
                      Nenhum produto com alerta no momento.
                    </td>
                  </tr>
                ) : lowStockItems.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: '#C4C9E2' }}>{item.name}</td>
                    <td style={{ color: '#6B7280' }}>{item.category}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: item.status === 'Crítico' ? '#F87171' : '#FCD34D' }}>{item.totalQuantity}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#5C6388' }}>{item.minQuantity}</td>
                    <td><span className={`badge ${item.status === 'Crítico' ? 'badge-danger' : 'badge-warning'}`}>{item.status}</span></td>
                    <td style={{ color: '#5C6388', fontSize: 12 }}>{item.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
