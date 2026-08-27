import { useState, useMemo } from 'react'
import { FileText, Download, FileSpreadsheet, CheckCircle2, Package, ArrowLeftRight, AlertTriangle, Truck, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { useSupabaseData } from '../hooks/useSupabaseData'
import type { Epi, Movement, Employee } from '../data/mock'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const REPORT_TYPES = [
  { id: 'stock',         label: 'Estoque Atual',          icon: '📦', desc: 'Situação atual de todos os EPIs', color: '#6366F1' },
  { id: 'entries',       label: 'Entradas Realizadas',    icon: '📥', desc: 'Histórico de entradas no período', color: '#10B981' },
  { id: 'movements',     label: 'Movimentações',          icon: '🔄', desc: 'Todas as movimentações do período', color: '#8B5CF6' },
  { id: 'employee',      label: 'Histórico de Colaborador', icon: '👤', desc: 'EPIs por colaborador', color: '#F59E0B' },
  { id: 'product',       label: 'Histórico de Produto',   icon: '🏷️', desc: 'Movimentações por EPI', color: '#22D3EE' },
  { id: 'low_stock',     label: 'Estoque Crítico',        icon: '⚠️', desc: 'Produtos abaixo do mínimo', color: '#F43F5E' },
  { id: 'top_products',  label: 'Mais Distribuídos',     icon: '📊', desc: 'Produtos mais entregues', color: '#EC4899' },
  { id: 'devolutions',   label: 'Devoluções',             icon: '↩️', desc: 'Histórico de devoluções', color: '#F97316' },
]

const TYPE_BADGE: Record<string, string> = {
  'Entrega': 'badge-success',
  'Devolução': 'badge-warning',
  'Troca': 'badge-info',
  'Entrada': 'badge-neutral',
  'Baixa': 'badge-danger',
  'Distribuição': 'badge-info',
}

const STATUS_BADGE: Record<string, string> = {
  'Crítico': 'badge-danger',
  'Estoque Baixo': 'badge-warning',
  'Disponível': 'badge-success',
}

const CHART_REPORTS = ['stock', 'low_stock', 'top_products']

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

interface ReportData {
  title: string
  headers: string[]
  rows: string[][]
  badgeCol: number
  emptyMsg: string
}

function formatAdmission(value?: string): string {
  if (!value) return '—'
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10)))
    : new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('pt-BR')
}

function buildReportData(
  id: string,
  epis: Epi[],
  movements: Movement[],
  employees: Employee[],
  cutoffDate: string | null,
): ReportData {
  const inPeriod = (m: Movement) => !cutoffDate || m.date.slice(0, 10) >= cutoffDate
  switch (id) {
    case 'stock':
      return {
        title: 'Estoque Atual',
        headers: ['Produto', 'Categoria', 'Fabricante', 'Qtd Total', 'Qtd Mínima', 'Status', 'Localização'],
        rows: epis.map((e) => [e.name, e.category, e.manufacturer, String(e.totalQuantity), String(e.minQuantity), e.status, e.location]),
        badgeCol: 5,
        emptyMsg: 'Nenhum EPI cadastrado.',
      }
    case 'low_stock':
      return {
        title: 'Estoque Crítico',
        headers: ['Produto', 'Categoria', 'Qtd Atual', 'Qtd Mínima', 'Status', 'Localização'],
        rows: epis
          .filter((e) => e.status === 'Estoque Baixo' || e.status === 'Crítico')
          .map((e) => [e.name, e.category, String(e.totalQuantity), String(e.minQuantity), e.status, e.location]),
        badgeCol: 4,
        emptyMsg: 'Nenhum produto com alerta de estoque.',
      }
    case 'movements':
      return {
        title: 'Movimentações',
        headers: ['#', 'Tipo', 'Colaborador', 'EPI', 'Qtd', 'Data', 'Operador', 'Obs'],
        rows: movements.filter(inPeriod).map((m) => [String(m.id), m.type, m.employee, m.epi, String(m.quantity), m.date, m.operator, m.notes || '']),
        badgeCol: 1,
        emptyMsg: 'Nenhuma movimentação registrada.',
      }
    case 'employee':
      return {
        title: 'Histórico de Colaborador',
        headers: ['Nome', 'Matrícula', 'CPF', 'Cargo', 'Equipe', 'Setor', 'Empresa', 'Admissão', 'Status'],
        rows: employees.map((e) => [e.name, e.registration, e.cpf, e.role, e.team, e.sector, e.company, e.admissionDate ? formatAdmission(e.admissionDate) : '—', e.status]),
        badgeCol: 8,
        emptyMsg: 'Nenhum colaborador cadastrado.',
      }
    case 'product':
      return {
        title: 'Histórico de Produto',
        headers: ['EPI', 'Tipo', 'Colaborador', 'Qtd', 'Data', 'Operador', 'Obs'],
        rows: movements.filter(inPeriod).map((m) => [m.epi, m.type, m.employee, String(m.quantity), m.date, m.operator, m.notes || '']),
        badgeCol: 1,
        emptyMsg: 'Nenhuma movimentação registrada.',
      }
    case 'top_products':
      return {
        title: 'Produtos Mais Distribuídos',
        headers: ['Produto', 'Quantidade'],
        rows: [...epis].sort((a, b) => b.totalQuantity - a.totalQuantity).map((e) => [e.name, String(e.totalQuantity)]),
        badgeCol: -1,
        emptyMsg: 'Nenhum produto cadastrado.',
      }
    case 'devolutions':
      return {
        title: 'Devoluções',
        headers: ['#', 'Colaborador', 'EPI', 'Qtd', 'Data', 'Obs'],
        rows: movements
          .filter((m) => m.type === 'Devolução')
          .filter(inPeriod)
          .map((m) => [String(m.id), m.employee, m.epi, String(m.quantity), m.date, m.notes || '']),
        badgeCol: -1,
        emptyMsg: 'Nenhuma devolução registrada.',
      }
    case 'entries':
      return {
        title: 'Entradas Realizadas',
        headers: ['EPI', 'Tipo', 'Colaborador', 'Qtd', 'Data', 'Operador', 'Obs'],
        rows: movements
          .filter((m) => m.type === 'Entrada')
          .filter(inPeriod)
          .map((m) => [m.epi, m.type, m.employee, String(m.quantity), m.date, m.operator, m.notes || '']),
        badgeCol: 1,
        emptyMsg: 'Nenhuma entrada registrada.',
      }
    default:
      return {
        title: REPORT_TYPES.find((r) => r.id === id)?.label ?? 'Relatório',
        headers: ['Relatório'],
        rows: [],
        badgeCol: -1,
        emptyMsg: 'Nenhum dado disponível.',
      }
  }
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

function loadLogoDataUrl(): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(null)
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = '/logo-norion.png'
  })
}

function generatePDF(filename: string, title: string, periodLabel: string, headers: string[], rows: string[][], logoDataUrl: string | null) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const now = new Date()
  const dateStr = now.toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  // ── Cabeçalho ──
  doc.setFillColor(13, 15, 24)
  doc.rect(0, 0, pageW, 30, 'F')
  doc.setFillColor(99, 102, 241)
  doc.rect(0, 30, pageW, 1.6, 'F')

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', 12, 5.5, 13, 13)
    } catch {
      // sem logo: segue apenas com o texto
    }
  }

  const textX = logoDataUrl ? 28.5 : 12
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(232, 234, 246)
  doc.text('Controle de EPI', textX, 11.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.8)
  doc.setTextColor(156, 163, 175)
  doc.text('Sistema de Gestão de Equipamentos de Proteção Individual', textX, 17.5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12.5)
  doc.setTextColor(255, 255, 255)
  doc.text(title, pageW - 14, 10.5, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(165, 180, 252)
  doc.text(`Período: ${periodLabel}`, pageW - 14, 15.5, { align: 'right' })
  doc.setTextColor(199, 203, 226)
  doc.text(`Gerado em ${dateStr}`, pageW - 14, 20.5, { align: 'right' })

  // ── Barra de resumo ──
  doc.setFillColor(28, 30, 46)
  doc.rect(0, 31.6, pageW, 9, 'F')
  doc.setFontSize(9.5)
  doc.setTextColor(156, 163, 175)
  doc.text(`Registros: ${rows.length}`, 12, 37.4)
  doc.text('Norion • Tecnologia e Inovação', pageW / 2, 37.4, { align: 'center' })
  doc.text(periodLabel.toUpperCase(), pageW - 12, 37.4, { align: 'right' })

  // ── Tabela ──
  autoTable(doc, {
    head: [headers],
    body: rows.map((r) => r.map((c) => c || '—')),
    startY: 43,
    margin: { left: 12, right: 12, bottom: 18 },
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 2.6,
      textColor: [226, 228, 240],
      fillColor: [17, 19, 28],
      lineColor: [45, 48, 80],
      lineWidth: 0.15,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [28, 30, 46],
    },
    didDrawPage: (data: { pageNumber: number }) => {
      const pageCount = doc.getNumberOfPages()
      doc.setDrawColor(45, 48, 80)
      doc.setLineWidth(0.3)
      doc.line(12, pageH - 12, pageW - 12, pageH - 12)
      doc.setFontSize(8)
      doc.setTextColor(120, 127, 160)
      doc.text('Controle de EPI • by Norion', 12, pageH - 7)
      doc.text(`Página ${data.pageNumber} de ${pageCount}`, pageW - 12, pageH - 7, { align: 'right' })
    },
  })

  doc.save(`${filename}.pdf`)
}

const PERIODS = [
  { val: 'week', label: 'Semana' },
  { val: 'month', label: 'Mês' },
  { val: 'quarter', label: 'Trimestre' },
  { val: 'year', label: 'Ano' },
]

const PERIOD_LABEL: Record<string, string> = {
  week: 'Semanal',
  month: 'Mensal',
  quarter: 'Trimestral',
  year: 'Anual',
}

const PERIOD_DAYS: Record<string, number> = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
}

function periodCutoff(period: string): string | null {
  const days = PERIOD_DAYS[period]
  if (!days) return null
  const d = new Date()
  d.setDate(d.getDate() - days)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function Reports() {
  const { employees, epis, movements, loading } = useSupabaseData()
  const [selectedReport, setSelectedReport] = useState('stock')
  const [period, setPeriod] = useState('month')
  const [generating, setGenerating] = useState(false)

  const currentType = REPORT_TYPES.find((r) => r.id === selectedReport) ?? REPORT_TYPES[0]
  const reportData = useMemo(
    () => buildReportData(selectedReport, epis, movements, employees, periodCutoff(period)),
    [selectedReport, epis, movements, employees, period],
  )

  const lowStockItems = useMemo(() => epis.filter((e) => e.status === 'Estoque Baixo' || e.status === 'Crítico'), [epis])
  const totalDeliveries = useMemo(() => movements.filter((m) => m.type === 'Entrega').length, [movements])
  const totalStock = useMemo(() => epis.reduce((s, e) => s + e.totalQuantity, 0), [epis])

  const topProducts = useMemo(() =>
    [...epis]
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 7)
      .map((e) => ({ name: e.name.length > 18 ? e.name.slice(0, 16) + '...' : e.name, qty: e.totalQuantity })),
    [epis],
  )

  const handleGenerate = async (format: 'pdf' | 'csv') => {
    setGenerating(true)
    try {
      const now = new Date()
      const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-')
      const { title, headers, rows } = reportData
      const base = `${selectedReport}-${dateStr}`
      if (format === 'pdf') {
        const logo = await loadLogoDataUrl()
        generatePDF(base, title, PERIOD_LABEL[period], headers, rows, logo)
      } else {
        generateCSV(base, headers, rows)
      }
    } finally {
      setGenerating(false)
    }
  }

  const isEmpty = employees.length === 0 && epis.length === 0 && movements.length === 0

  const stats = [
    { label: 'Total de Entregas', value: totalDeliveries, icon: <Truck size={15} />, color: '#6366F1' },
    { label: 'Itens em Estoque', value: totalStock.toLocaleString('pt-BR'), icon: <Package size={15} />, color: '#22D3EE' },
    { label: 'Movimentações', value: movements.length.toLocaleString('pt-BR'), icon: <ArrowLeftRight size={15} />, color: '#10B981' },
    { label: 'Alertas Ativos', value: lowStockItems.length, icon: <AlertTriangle size={15} />, color: '#F43F5E' },
  ]

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20, animation: 'fade-up 0.5s ease both' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(79,70,229,0.1))',
            border: '1px solid rgba(99,102,241,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A5B4FC',
          }}>
            <BarChart3 size={20} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#E8EAF6', margin: '0 0 4px', letterSpacing: '-0.03em' }}>
              Relatórios
            </h2>
            <p style={{ fontSize: 13, color: '#3D4257', margin: 0 }}>Gere, visualize e exporte relatórios detalhados do sistema</p>
          </div>
        </div>

        {/* Export actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => handleGenerate('csv')}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 10, color: '#4ADE80', fontFamily: 'var(--font-sans)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.16)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.1)' }}
          >
            <FileSpreadsheet size={14} /> Exportar CSV
          </button>
          <button
            onClick={() => handleGenerate('pdf')}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px',
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)', border: 'none',
              borderRadius: 10, color: 'white', fontFamily: 'var(--font-display)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
              transition: 'transform 0.15s, box-shadow 0.15s',
              opacity: generating ? 0.8 : 1,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.4)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.3)' }}
          >
            {generating ? (
              <><span style={{ animation: 'spin-slow 0.8s linear infinite', display: 'flex' }}>⟳</span> Gerando...</>
            ) : (
              <><FileText size={14} /> Gerar PDF</>
            )}
          </button>
        </div>
      </div>

      {/* Report type picker */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 10.5, fontWeight: 700, color: '#3D4257', textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            <span style={{ width: 18, height: 18, borderRadius: 6, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#A5B4FC', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>1</span>
            Escolha o tipo de relatório
          </span>
          <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {REPORT_TYPES.map((rt) => {
            const active = selectedReport === rt.id
            return (
              <button
                key={rt.id}
                onClick={() => setSelectedReport(rt.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left',
                  padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                  background: active ? 'rgba(99,102,241,0.09)' : 'rgba(13,15,24,0.9)',
                  border: active ? '1px solid rgba(99,102,241,0.45)' : '1px solid rgba(255,255,255,0.07)',
                  fontFamily: 'var(--font-sans)',
                  boxShadow: active ? '0 0 0 3px rgba(99,102,241,0.08)' : 'none',
                  transition: 'all 0.18s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)' }
                }}
                onMouseLeave={(e) => {
                  if (!active) { e.currentTarget.style.background = 'rgba(13,15,24,0.9)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                  background: `${rt.color}18`, border: `1px solid ${rt.color}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
                }}>
                  {rt.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: active ? '#A5B4FC' : '#C4C9E2', marginBottom: 3 }}>{rt.label}</div>
                  <div style={{ fontSize: 11.5, color: '#3D4257', lineHeight: 1.45 }}>{rt.desc}</div>
                </div>
                {active && (
                  <span style={{ position: 'absolute', top: 10, right: 10, color: '#6366F1' }}>
                    <CheckCircle2 size={15} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Toolbar: period + current selection */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, flexWrap: 'wrap',
        background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '12px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 15 }}>{currentType.icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#C4C9E2' }}>{currentType.label}</div>
            <div style={{ fontSize: 11.5, color: '#3D4257' }}>
              {loading ? 'Carregando dados...' : `${reportData.rows.length} registro${reportData.rows.length !== 1 ? 's' : ''} encontrados`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#3D4257', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Período</span>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 9, padding: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
            {PERIODS.map((p) => (
              <button key={p.val} onClick={() => setPeriod(p.val)} style={{
                padding: '5px 12px', borderRadius: 7, border: 'none',
                background: period === p.val ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: period === p.val ? '#A5B4FC' : '#5C6388',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
              }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {stats.map(({ label, value, icon, color }) => (
          <div key={label} style={{
            background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '16px 18px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11, flexShrink: 0,
              background: `${color}14`, border: `1px solid ${color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color,
            }}>
              {icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10.5, color: '#3D4257', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color, letterSpacing: '-0.03em' }}>
                {isEmpty ? '0' : value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview table */}
      <div style={{ background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#E8EAF6', margin: '0 0 3px', letterSpacing: '-0.02em' }}>
              Prévia — {reportData.title}
            </h3>
            <p style={{ fontSize: 11.5, color: '#3D4257', margin: 0 }}>Visualização dos dados que serão exportados</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => handleGenerate('csv')}
              title="Exportar CSV"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 8, color: '#4ADE80', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <Download size={12} /> CSV
            </button>
            <button
              onClick={() => handleGenerate('pdf')}
              title="Exportar PDF"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 8, color: '#A5B4FC', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <FileText size={12} /> PDF
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                {reportData.headers.map((h) => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {reportData.rows.length === 0 ? (
                <tr>
                  <td colSpan={reportData.headers.length} style={{ textAlign: 'center', padding: 40, color: '#3D4257' }}>
                    {reportData.emptyMsg}
                  </td>
                </tr>
              ) : reportData.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>
                      {reportData.badgeCol === j ? (
                        <span className={`badge ${TYPE_BADGE[cell] ?? STATUS_BADGE[cell] ?? 'badge-neutral'}`} style={{ whiteSpace: 'nowrap' }}>
                          {cell}
                        </span>
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart */}
      {CHART_REPORTS.includes(selectedReport) && (
        <div style={{ background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '22px 24px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#E8EAF6', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Distribuição por Quantidade em Estoque
          </h3>
          <p style={{ fontSize: 12, color: '#3D4257', margin: '0 0 18px' }}>Top 7 produtos com maior volume em estoque</p>
          {isEmpty ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#3D4257', fontSize: 13 }}>
              Nenhum produto cadastrado para exibir no gráfico.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
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
      )}
    </div>
  )
}
