import { Search, Bell, RefreshCw } from 'lucide-react'

interface Props {
  title: string
  subtitle?: string
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  overview:   { title: 'Dashboard',      subtitle: 'Visão geral do sistema' },
  employees:  { title: 'Colaboradores',  subtitle: 'Gerenciamento de pessoas' },
  stock:      { title: 'Estoque de EPIs', subtitle: 'Controle de itens e variações' },
  entries:    { title: 'Entradas',       subtitle: 'Registro de entrada de produtos' },
  categories: { title: 'Categorias',    subtitle: 'Organização por tipo de EPI' },
  teams:      { title: 'Equipes',        subtitle: 'Gestão de times e grupos' },
  movements:  { title: 'Movimentações', subtitle: 'Sincronizado via aplicativo mobile' },
  reports:    { title: 'Relatórios',     subtitle: 'Análise e exportação de dados' },
}

export default function TopBar({ title, subtitle }: Props) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <header style={{
      height: 64,
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 28px',
      gap: 16,
      background: 'rgba(7,9,15,0.8)',
      backdropFilter: 'blur(12px)',
      flexShrink: 0,
    }}>
      {/* Title */}
      <div style={{ flex: 1 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 16.5, fontWeight: 700,
          color: '#E8EAF6', margin: 0,
          letterSpacing: '-0.025em', lineHeight: 1.2,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 11.5, color: '#3D4257', margin: 0, fontWeight: 400 }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search
          size={14}
          style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: '#3D4257', pointerEvents: 'none',
          }}
        />
        <input
          placeholder="Pesquisar..."
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 9,
            padding: '7px 14px 7px 34px',
            color: '#E8EAF6',
            fontSize: 13,
            fontFamily: 'var(--font-sans)',
            outline: 'none',
            width: 220,
            transition: 'border-color 0.2s, background 0.2s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'
            e.currentTarget.style.background = 'rgba(99,102,241,0.04)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          }}
        />
        <kbd style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          fontSize: 9.5, color: '#3D4257', fontFamily: 'var(--font-mono)',
          background: 'rgba(255,255,255,0.05)', padding: '2px 5px', borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          ⌘K
        </kbd>
      </div>

      {/* Date */}
      <span style={{ fontSize: 11.5, color: '#3D4257', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', display: 'none' }}
        className="topbar-date"
      >
        {dateStr}
      </span>

      {/* Refresh */}
      <button style={{
        width: 34, height: 34, borderRadius: 9,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: '#3D4257',
        transition: 'background 0.15s, color 0.15s',
      }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
          e.currentTarget.style.color = '#9BA3C4'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          e.currentTarget.style.color = '#3D4257'
        }}
        title="Atualizar"
      >
        <RefreshCw size={14} />
      </button>

      {/* Notifications */}
      <button style={{
        width: 34, height: 34, borderRadius: 9,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: '#3D4257', position: 'relative',
        transition: 'background 0.15s, color 0.15s',
      }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
          e.currentTarget.style.color = '#9BA3C4'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          e.currentTarget.style.color = '#3D4257'
        }}
      >
        <Bell size={14} />
        <span style={{
          position: 'absolute', top: 7, right: 7, width: 6, height: 6,
          borderRadius: '50%', background: '#F43F5E',
          boxShadow: '0 0 6px rgba(244,63,94,0.7)',
        }} />
      </button>

      <style>{`
        @media (min-width: 1100px) { .topbar-date { display: block !important; } }
      `}</style>
    </header>
  )
}
