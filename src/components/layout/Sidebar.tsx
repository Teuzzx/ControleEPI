import { useState } from 'react'
import {
  LayoutDashboard, Users, Package, Tag, UsersRound, ArrowLeftRight,
  BarChart3, Shield, ChevronLeft, ChevronRight, Bell, Settings, LogOut,
  Warehouse, FolderOpen,
} from 'lucide-react'

export type Page =
  | 'overview'
  | 'employees'
  | 'stock'
  | 'categories'
  | 'teams'
  | 'movements'
  | 'reports'
  | 'entries'

interface NavItem {
  id: Page
  label: string
  icon: React.ReactNode
  badge?: number
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview',   label: 'Dashboard',      icon: <LayoutDashboard size={17} />, },
  { id: 'employees',  label: 'Colaboradores',  icon: <Users size={17} />, },
  { id: 'stock',      label: 'Estoque',        icon: <Package size={17} />, badge: 3 },
  { id: 'entries',    label: 'Entradas',       icon: <Warehouse size={17} />, },
  { id: 'categories', label: 'Categorias',     icon: <FolderOpen size={17} />, },
  { id: 'teams',      label: 'Equipes',        icon: <UsersRound size={17} />, },
  { id: 'movements',  label: 'Movimentações',  icon: <ArrowLeftRight size={17} />, },
  { id: 'reports',    label: 'Relatórios',     icon: <BarChart3 size={17} />, },
]

interface Props {
  current: Page
  onNavigate: (p: Page) => void
  onLogout: () => void
}

export default function Sidebar({ current, onNavigate, onLogout }: Props) {
  const [collapsed, setCollapsed] = useState(false)

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

        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map((item, i) => {
            const active = current === item.id
            return (
              <li key={item.id}
                style={{ animation: `sidebar-item-in 0.4s ease both`, animationDelay: `${i * 0.04}s` }}
              >
                <button
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
                  }}
                >
                  {/* Active indicator */}
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

                  {!collapsed && (
                    <>
                      <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                      {item.badge && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
                          background: 'rgba(239,68,68,0.15)', color: '#F87171',
                          border: '1px solid rgba(239,68,68,0.2)',
                          padding: '1px 7px', borderRadius: 10,
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
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
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.045)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'white',
            flexShrink: 0,
          }}>
            JF
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#9BA3C4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Juliana Ferreira
              </div>
              <div style={{ fontSize: 10.5, color: '#3D4257', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Administrador
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
