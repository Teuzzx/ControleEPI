import { useState, useEffect } from 'react'
import {
  Users, Package, Tag, TrendingUp, TrendingDown, AlertTriangle,
  ArrowUpRight, Activity, CheckCircle2, Clock, ShieldAlert,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid,
} from 'recharts'
import { useSupabaseData } from '../hooks/useSupabaseData'
import type { Page } from '../components/layout/Sidebar'

function parseLocalDate(iso?: string): Date | null {
  if (!iso) return null
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso)
    ? new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)))
    : new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

function caDaysLeft(expiry?: string): number | null {
  const d = parseLocalDate(expiry)
  if (!d) return null
  return Math.ceil((d.getTime() - Date.now()) / 86400000)
}

function caExpiryBR(expiry?: string): string {
  const d = parseLocalDate(expiry)
  return d ? d.toLocaleDateString('pt-BR') : '—'
}

function MetricCard({
  icon, label, value, trend, trendLabel, color, delay = 0,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  color: string
  delay?: number
}) {
  const [displayed, setDisplayed] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setDisplayed(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div
      className="metric-card"
      style={{
        background: 'rgba(13,15,24,0.9)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: '22px 24px',
        display: 'flex', flexDirection: 'column', gap: 14,
        animation: `fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both`,
        animationDelay: `${delay}ms`,
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color,
        }}>
          {icon}
        </div>
        {trend && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontWeight: 600,
            color: trend === 'up' ? '#4ADE80' : trend === 'down' ? '#F87171' : '#9BA3C4',
          }}>
            {trend === 'up' && <TrendingUp size={13} />}
            {trend === 'down' && <TrendingDown size={13} />}
            {trendLabel}
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#3D4257', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
          {label}
        </div>
        <div
          className={displayed ? 'animate-count-up' : ''}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28, fontWeight: 700,
            color: '#E8EAF6', letterSpacing: '-0.03em', lineHeight: 1,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(10,12,20,0.96)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <p style={{ fontSize: 11, color: '#5C6388', margin: '0 0 6px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ fontSize: 12.5, fontWeight: 600, color: entry.color, margin: '2px 0' }}>
          {entry.name}: <span style={{ color: '#E8EAF6' }}>{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

function useRealtimeClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])
  return now
}

export default function Overview({ onNavigate }: { onNavigate?: (page: Page) => void }) {
  const { employees, epis, categories, movements, chartData, loading } = useSupabaseData()
  const now = useRealtimeClock()
  const lowStock = epis.filter((e) => e.status === 'Estoque Baixo' || e.status === 'Crítico')
  const activeEmployees = employees.filter((e) => e.status === 'Ativo')
  const totalStock = epis.reduce((s, e) => s + e.totalQuantity, 0)
  const caAlerts = epis.filter((e) => {
    const days = caDaysLeft(e.caExpiry)
    return days !== null && days <= 60
  })

  const todayMovements = movements.filter((m) => {
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    return m.date.startsWith(today)
  }).length

  const thisMonthDeliveries = movements.filter((m) => {
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return m.type === 'Entrega' && m.date.startsWith(ym)
  }).length

  const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24, animation: 'fade-up 0.5s ease both' }}>

      {/* Status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: loading ? 'rgba(245,158,11,0.06)' : 'rgba(34,211,238,0.06)',
        border: loading ? '1px solid rgba(245,158,11,0.15)' : '1px solid rgba(34,211,238,0.15)',
        borderRadius: 10, padding: '9px 16px',
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: loading ? '#F59E0B' : '#22D3EE', boxShadow: '0 0 8px rgba(34,211,238,0.6)', flexShrink: 0, animation: 'pulse-glow 2s ease-in-out infinite' }} />
        <span style={{ fontSize: 12.5, color: loading ? '#FCD34D' : '#67E8F9', fontWeight: 500 }}>
          {loading ? 'Sincronizando com o banco de dados...' : 'Sistema sincronizado'}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#3D4257', fontFamily: 'var(--font-mono)' }}>
          {dateStr} — {timeStr}
        </span>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        <MetricCard icon={<Users size={18} />}    label="Colaboradores Ativos" value={activeEmployees.length}   trend="up"      trendLabel={activeEmployees.length > 0 ? "Registrados no sistema" : "Nenhum ainda"}   color="#6366F1" delay={0} />
        <MetricCard icon={<Package size={18} />}  label="Total em Estoque"      value={totalStock.toLocaleString('pt-BR')} trend={totalStock > 0 ? "neutral" : "down"}  trendLabel={totalStock > 0 ? "Unidades" : "Vazio"} color="#22D3EE" delay={80} />
        <MetricCard icon={<Tag size={18} />}       label="Categorias"           value={categories.length}       trend="neutral" trendLabel="Cadastradas" color="#F59E0B" delay={160} />
        <MetricCard icon={<AlertTriangle size={18} />} label="Alertas de Estoque" value={lowStock.length}        trend={lowStock.length > 0 ? "down" : "up"}    trendLabel={lowStock.length > 0 ? "Atenção!" : "Tudo ok"}      color="#F43F5E" delay={240} />
        <MetricCard icon={<Activity size={18} />} label="Movimentações Hoje"    value={todayMovements}          trend={todayMovements > 0 ? "up" : "neutral"}     trendLabel="Hoje"   color="#10B981" delay={320} />
        <MetricCard icon={<CheckCircle2 size={18} />} label="Entregas no Mês"   value={thisMonthDeliveries}     trend={thisMonthDeliveries > 0 ? "up" : "neutral"}      trendLabel="Entregas"          color="#8B5CF6" delay={400} />
        <MetricCard icon={<ShieldAlert size={18} />} label="CAs a Vencer"       value={caAlerts.length}          trend={caAlerts.length > 0 ? "down" : "up"}        trendLabel={caAlerts.length > 0 ? "Vencendo em 60d" : "Em dia"}      color="#F59E0B" delay={480} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

        {/* Area chart — movements */}
        <div style={{
          background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: '22px 24px',
          animation: 'fade-up 0.6s ease both', animationDelay: '0.3s',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#E8EAF6', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                Movimentações por Período
              </h3>
              <p style={{ fontSize: 12, color: '#3D4257', margin: 0 }}>Entregas, devoluções e entradas</p>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {[
                { label: 'Entregas', color: '#6366F1' },
                { label: 'Devoluções', color: '#22D3EE' },
                { label: 'Entradas', color: '#10B981' },
              ].map((l) => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                  <span style={{ fontSize: 11, color: '#5C6388', fontFamily: 'var(--font-mono)' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData.movementsOverTime} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gEnt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gDev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#3D4257', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#3D4257', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="entregas"   name="Entregas"   stroke="#6366F1" strokeWidth={2} fill="url(#gEnt)" dot={false} />
              <Area type="monotone" dataKey="devolucoes" name="Devoluções" stroke="#22D3EE" strokeWidth={2} fill="url(#gDev)" dot={false} />
              <Area type="monotone" dataKey="entradas"   name="Entradas"   stroke="#10B981" strokeWidth={2} fill="url(#gIn)"  dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div style={{
          background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: '22px 24px',
          animation: 'fade-up 0.6s ease both', animationDelay: '0.35s',
        }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#E8EAF6', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Estoque por Categoria
          </h3>
          <p style={{ fontSize: 12, color: '#3D4257', margin: '0 0 16px' }}>Distribuição atual</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={chartData.stockByCategory} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                {chartData.stockByCategory.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {chartData.stockByCategory.slice(0, 5).map((cat) => (
              <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: cat.fill, flexShrink: 0 }} />
                <span style={{ fontSize: 11.5, color: '#5C6388', flex: 1 }}>{cat.name}</span>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: '#9BA3C4', fontFamily: 'var(--font-mono)' }}>{cat.value.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Recent movements */}
        <div style={{
          background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: '22px 24px',
          animation: 'fade-up 0.6s ease both', animationDelay: '0.4s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#E8EAF6', margin: 0, letterSpacing: '-0.02em' }}>
              Últimas Movimentações
            </h3>
            <span style={{ fontSize: 11, color: '#5C6388', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} /> Tempo real
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {movements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#3D4257', fontSize: 13 }}>
                Nenhuma movimentação registrada.
              </div>
            ) : movements.slice(0, 6).map((m) => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: m.type === 'Entrega' ? 'rgba(99,102,241,0.15)' : m.type === 'Devolução' ? 'rgba(34,211,238,0.15)' : m.type === 'Entrada' ? 'rgba(16,185,129,0.15)' : m.type === 'Baixa' ? 'rgba(244,63,94,0.15)' : 'rgba(245,158,11,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12,
                }}>
                  {m.type === 'Entrega' ? '📤' : m.type === 'Devolução' ? '📥' : m.type === 'Entrada' ? '📦' : m.type === 'Baixa' ? '🗑' : '🔄'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: '#C4C9E2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.employee !== '—' ? m.employee : m.epi}
                  </div>
                  <div style={{ fontSize: 11, color: '#3D4257', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.type} • {m.epi}
                  </div>
                </div>
                <span style={{ fontSize: 10.5, color: '#3D4257', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                  {m.date.split(' ')[1] || m.date}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Low stock alerts */}
        <div style={{
          background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: '22px 24px',
          animation: 'fade-up 0.6s ease both', animationDelay: '0.45s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#E8EAF6', margin: 0, letterSpacing: '-0.02em' }}>
              Alertas de Estoque
            </h3>
            <span className="badge badge-danger" style={{ fontSize: 10 }}>
              {lowStock.length} alertas
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lowStock.length === 0 && caAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#3D4257', fontSize: 13 }}>
                Nenhum alerta no momento.
              </div>
            ) : (<>
              {lowStock.map((item) => {
                const pct = item.minQuantity > 0 ? Math.round((item.totalQuantity / item.minQuantity) * 100) : 100
                return (
                  <div key={item.id} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.025)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#C4C9E2' }}>{item.name}</span>
                      <span className={`badge ${item.status === 'Crítico' ? 'badge-danger' : 'badge-warning'}`}>
                        {item.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 2,
                          width: `${Math.min(pct, 100)}%`,
                          background: item.status === 'Crítico'
                            ? 'linear-gradient(90deg, #F43F5E, #FB7185)'
                            : 'linear-gradient(90deg, #F59E0B, #FCD34D)',
                          transition: 'width 1s ease',
                        }} />
                      </div>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#5C6388', flexShrink: 0 }}>
                        {item.totalQuantity}/{item.minQuantity}
                      </span>
                    </div>
                  </div>
                )
              })}

              {caAlerts.length > 0 && (
                <>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#3D4257', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 6 }}>
                    Validade do CA (60 dias)
                  </div>
                  {caAlerts.map((item) => {
                    const days = caDaysLeft(item.caExpiry)
                    return (
                      <div key={`ca-${item.id}`} style={{
                        padding: '12px 14px', background: 'rgba(255,255,255,0.025)', borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                      }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#C4C9E2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                          <div style={{ fontSize: 11, color: '#3D4257', fontFamily: 'var(--font-mono)' }}>
                            CA {item.caNumber || '—'} • {caExpiryBR(item.caExpiry)}
                          </div>
                        </div>
                        <span className={`badge ${(days ?? 0) < 0 ? 'badge-danger' : 'badge-warning'}`} style={{ flexShrink: 0 }}>
                          {(days ?? 0) < 0 ? 'Vencido' : `Vence em ${days}d`}
                        </span>
                      </div>
                    )
                  })}
                </>
              )}
            </>)}
          </div>
        </div>

      </div>

      {/* Bar chart — stock by category */}
      <div style={{
        background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: '22px 24px',
        animation: 'fade-up 0.6s ease both', animationDelay: '0.5s',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#E8EAF6', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              Estoque por Categoria
            </h3>
            <p style={{ fontSize: 12, color: '#3D4257', margin: 0 }}>Quantidade disponível em cada categoria</p>
          </div>
          <button onClick={() => onNavigate?.('reports')} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 600, color: '#818CF8',
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'background 0.15s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)' }}
          >
            Ver relatório <ArrowUpRight size={12} />
          </button>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData.stockByCategory} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#3D4257', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#3D4257', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="value" name="Qtd" radius={[5, 5, 0, 0]}>
              {chartData.stockByCategory.map((entry, i) => (
                <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}
