import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, Package, Tag, UsersRound, ArrowLeftRight,
  BarChart3, Shield, ChevronLeft, ChevronRight, ChevronDown, Bell, Settings, LogOut,
  Warehouse, FolderOpen, Building2, Send, Boxes, Megaphone,
} from 'lucide-react'

export type Page =
  | 'overview'
  | 'employees'
  | 'stock'
  | 'categories'
  | 'departments'
  | 'movements'
  | 'reports'
  | 'entries'
  | 'companies'
  | 'distribution'
  | 'avisos'

interface NavItem {
  id: Page
  label: string
  icon: React.ReactNode
}

interface NavGroup {
  label: string
  icon: React.ReactNode
  items: NavItem[]
  matrizOnly?: boolean
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operacional',
    icon: <Boxes size={15} />,
    items: [
      { id: 'employees',  label: 'Colaboradores',  icon: <Users size={17} /> },
      { id: 'stock',      label: 'Estoque de EPIs', icon: <Package size={17} /> },
      { id: 'entries',    label: 'Entradas',       icon: <Warehouse size={17} /> },
      { id: 'categories', label: 'Categorias',     icon: <Tag size={17} /> },
    ],
  },
  {
    label: 'Organização',
    icon: <UsersRound size={15} />,
    items: [
      { id: 'departments', label: 'Departamentos',  icon: <UsersRound size={17} /> },
      { id: 'movements',   label: 'Movimentações',  icon: <ArrowLeftRight size={17} /> },
      { id: 'reports',     label: 'Relatórios',     icon: <BarChart3 size={17} /> },
    ],
  },
  {
    label: 'Rede de Empresas',
    icon: <Building2 size={15} />,
    matrizOnly: true,
    items: [
      { id: 'companies',    label: 'Empresas',     icon: <Building2 size={17} /> },
      { id: 'distribution', label: 'Distribuição', icon: <Send size={17} /> },
      { id: 'avisos',       label: 'Avisos',       icon: <Megaphone size={17} /> },
    ],
  },
]

const DASHBOARD_ITEM: NavItem = { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={17} /> }

interface Props {
  current: Page
  onNavigate: (p: Page) => void
  onLogout: () => void
  userName: string
  userRole: 'matriz' | 'filial'
  companyName: string
}

function initialsOf(name: string): string {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

export default function Sidebar({ current, onNavigate, onLogout, userName, userRole, companyName }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  const visibleGroups = NAV_GROUPS.filter((g) => !g.matrizOnly || userRole === 'matriz')

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev }
      for (const group of visibleGroups) {
        if (group.items.some((item) => item.id === current)) {
          next[group.label] = true
        }
      }
      return next
    })
  }, [current])

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const renderItem = (item: NavItem, active: boolean) => (
    <button
      key={item.id}
      onClick={() => onNavigate(item.id)}
      className={`sidebar-nav-item${active ? ' active' : ''}`}
      title={collapsed ? item.label : undefined}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: collapsed ? '9px 0' : '9px 12px',
        borderRadius: 9,
        border: 'none',
        cursor: 'pointer',
        background: active ? 'rgba(99,102,241,0.14)' : 'transparent',
        color: active ? '#A5B4FC' : '#5C6388',
        fontFamily: 'var(--font-sans)',
        fontSize: 13.5,
        fontWeight: active ? 600 : 500,
        justifyContent: collapsed ? 'center' : 'flex-start',
        position: 'relative',
        whiteSpace: 'nowrap',
        letterSpacing: '-0.01em',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#9BA3C4' }
      }}
      onMouseLeave={(e) => {
        if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5C6388' }
      }}
    >
      {active && !collapsed && (
        <div style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: 3, height: 20, borderRadius: '0 2px 2px 0',
          background: 'linear-gradient(to bottom, #6366F1, #818CF8)',
        }} />
      )}
      <span className="nav-icon" style={{ color: active ? '#6366F1' : '#3D4257', display: 'flex', flexShrink: 0 }}>
        {item.icon}
      </span>
      {!collapsed && <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>}
    </button>
  )

  const renderGroup = (group: NavGroup) => {
    const open = openGroups[group.label] ?? false
    const groupActive = group.items.some((item) => item.id === current)
    return (
      <div key={group.label} style={{ marginBottom: 2 }}>
        <button
          onClick={() => toggleGroup(group.label)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '9px 0' : '9px 12px',
            borderRadius: 9,
            border: 'none',
            cursor: 'pointer',
            background: 'transparent',
            color: groupActive ? '#A5B4FC' : '#5C6388',
            fontFamily: 'var(--font-sans)',
            fontSize: 13.5,
            fontWeight: groupActive ? 600 : 500,
            justifyContent: collapsed ? 'center' : 'flex-start',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#9BA3C4' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = groupActive ? '#A5B4FC' : '#5C6388' }}
          title={collapsed ? group.label : undefined}
        >
          <span className="nav-icon" style={{ color: groupActive ? '#6366F1' : '#3D4257', display: 'flex', flexShrink: 0 }}>
            {group.icon}
          </span>
          {!collapsed && (
            <>
              <span style={{ flex: 1, textAlign: 'left' }}>{group.label}</span>
              <ChevronDown
                size={13}
                style={{
                  color: '#3D4257',
                  transition: 'transform 0.2s ease',
                  transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </>
          )}
        </button>
        {open && !collapsed && (
          <div style={{
            marginLeft: 10,
            paddingLeft: 18,
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            animation: 'fade-up 0.2s ease both',
          }}>
            {group.items.map((item) => renderItem(item, current === item.id))}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside
      style={{
        width: collapsed ? 68 : 228,
        minHeight: '100vh',
        background: 'rgba(10,12,18,0.95)',
        borderRight: '1px solid rgba(255,255,255,0.055)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{
        padding: collapsed ? '24px 0' : '24px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        justifyContent: collapsed ? 'center' : 'flex-start',
        flexShrink: 0,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
          flexShrink: 0,
        }}>
          <Shield size={16} color="white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 15.5, fontWeight: 700,
              color: '#E8EAF6', letterSpacing: '-0.025em', lineHeight: 1.2,
            }}>
              EPI<span style={{ color: '#818CF8' }}>Admin</span>
            </div>
            <div style={{ fontSize: 9.5, color: '#3D4257', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              by <span style={{ color: '#818CF8' }}>Norion</span>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: collapsed ? '16px 8px' : '16px 10px', overflowY: 'auto', overflowX: 'hidden' }}>
        {!collapsed && (
          <div style={{ fontSize: 10, fontWeight: 700, color: '#2D3050', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 10px 10px', fontFamily: 'var(--font-mono)' }}>
            Menu Principal
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {renderItem(DASHBOARD_ITEM, current === DASHBOARD_ITEM.id)}
          {visibleGroups.map(renderGroup)}
        </div>
      </nav>

      {/* Bottom */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: collapsed ? '12px 8px' : '12px 10px',
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        {[
          { icon: <Bell size={16} />, label: 'Notificações' },
          { icon: <Settings size={16} />, label: 'Configurações' },
        ].map(({ icon, label }) => (
          <button
            key={label}
            title={collapsed ? label : undefined}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: collapsed ? '9px 0' : '9px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 9, border: 'none', cursor: 'pointer',
              background: 'transparent', color: '#3D4257',
              fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 500,
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              e.currentTarget.style.color = '#6B7280'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#3D4257'
            }}
          >
            {icon}
            {!collapsed && <span>{label}</span>}
          </button>
        ))}

        {/* User */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: collapsed ? '10px 0' : '10px 12px',
          marginTop: 4,
          borderRadius: 10,
          background: 'rgba(255,255,255,0.025)',
          justifyContent: collapsed ? 'center' : 'flex-start',
          transition: 'background 0.15s',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: userRole === 'matriz' ? 'linear-gradient(135deg, #4F46E5, #7C3AED)' : 'linear-gradient(135deg, #0E7490, #22D3EE)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'white',
            flexShrink: 0,
          }}>
            {initialsOf(userName)}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#9BA3C4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userName}
              </div>
              <div style={{ fontSize: 10.5, color: '#3D4257', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userRole === 'matriz' ? 'Matriz • Administrador' : companyName}
              </div>
            </div>
          )}
          {!collapsed && (
            <button onClick={onLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3D4257', display: 'flex', padding: 2 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#F87171')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#3D4257')}
              title="Sair"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute', top: '50%', right: -12, transform: 'translateY(-50%)',
          width: 24, height: 24, borderRadius: '50%',
          background: '#0D0F18', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#5C6388', zIndex: 10,
          transition: 'background 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#1A1C2A'
          e.currentTarget.style.color = '#9BA3C4'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#0D0F18'
          e.currentTarget.style.color = '#5C6388'
        }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
