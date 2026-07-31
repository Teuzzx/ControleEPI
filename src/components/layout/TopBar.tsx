import { useState, useRef, useEffect } from 'react'
import { Bell, RefreshCw, CheckCheck, Building2 } from 'lucide-react'
import { useSupabaseData } from '../../hooks/useSupabaseData'

interface Props {
  title: string
  subtitle?: string
  companyName: string
  role: 'matriz' | 'filial'
}

const TYPE_ICON: Record<string, string> = {
  distribuicao: '📦',
  info: 'ℹ️',
  alerta: '⚠️',
}

export default function TopBar({ title, subtitle, companyName, role }: Props) {
  const { notifications, loading, refresh, markNotificationRead, markAllNotificationsRead } = useSupabaseData()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = notifications.filter((n) => !n.read).length

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

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

      {/* Company badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 14px', borderRadius: 9,
        background: role === 'matriz' ? 'rgba(99,102,241,0.1)' : 'rgba(34,211,238,0.08)',
        border: `1px solid ${role === 'matriz' ? 'rgba(99,102,241,0.25)' : 'rgba(34,211,238,0.2)'}`,
      }}>
        <Building2 size={13} color={role === 'matriz' ? '#818CF8' : '#67E8F9'} />
        <span style={{
          fontSize: 12, fontWeight: 600,
          color: role === 'matriz' ? '#A5B4FC' : '#67E8F9',
          fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap',
        }}>
          {companyName}
        </span>
        <span style={{
          fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
          padding: '2px 7px', borderRadius: 6,
          background: role === 'matriz' ? 'rgba(99,102,241,0.2)' : 'rgba(34,211,238,0.15)',
          color: role === 'matriz' ? '#C7D2FE' : '#A5F3FC',
        }}>
          {role}
        </span>
      </div>

      {/* Refresh */}
      <button
        onClick={() => refresh()}
        title="Atualizar"
        style={{
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
      >
        <RefreshCw size={14} />
      </button>

      {/* Notifications */}
      <div style={{ position: 'relative' }}>
        <button
          ref={buttonRef}
          onClick={() => setOpen(!open)}
          title="Notificações"
          style={{
            width: 34, height: 34, borderRadius: 9,
            background: open ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
            border: open ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: open ? '#A5B4FC' : '#3D4257', position: 'relative',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
            e.currentTarget.style.color = '#9BA3C4'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = open ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)'
            e.currentTarget.style.color = open ? '#A5B4FC' : '#3D4257'
          }}
        >
          <Bell size={14} />
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: 4, right: 4,
              minWidth: 14, height: 14, borderRadius: 7,
              background: '#F43F5E', color: 'white',
              fontSize: 8.5, fontWeight: 700, fontFamily: 'var(--font-mono)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 3px',
              boxShadow: '0 0 6px rgba(244,63,94,0.7)',
            }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {open && (
          <div
            ref={panelRef}
            className="glass-strong"
            style={{
              position: 'absolute', top: 44, right: 0,
              width: 380, maxWidth: '90vw',
              borderRadius: 16, padding: '18px',
              zIndex: 100, animation: 'fade-up 0.2s ease both',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700, color: '#E8EAF6', margin: 0 }}>
                Notificações
              </h3>
              {unread > 0 && (
                <button
                  onClick={() => markAllNotificationsRead()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 11.5, fontWeight: 600, color: '#818CF8',
                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <CheckCheck size={12} /> Marcar todas
                </button>
              )}
            </div>

            <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 28, color: '#3D4257', fontSize: 13 }}>Carregando...</div>
              ) : notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 28, color: '#3D4257', fontSize: 13 }}>
                  Nenhuma notificação.
                </div>
              ) : notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markNotificationRead(n.id)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(99,102,241,0.08)',
                    border: n.read ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(99,102,241,0.2)',
                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = n.read ? 'rgba(255,255,255,0.02)' : 'rgba(99,102,241,0.08)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14 }}>{TYPE_ICON[n.type] ?? '📌'}</span>
                    <span style={{
                      fontSize: 12.5, fontWeight: 700, color: n.read ? '#6B7280' : '#E8EAF6',
                      flex: 1,
                    }}>
                      {n.title}
                    </span>
                    {!n.read && (
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: '#6366F1', boxShadow: '0 0 6px rgba(99,102,241,0.7)', flexShrink: 0,
                      }} />
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#9BA3C4', lineHeight: 1.5, marginBottom: 4 }}>{n.message}</div>
                  <div style={{ fontSize: 10.5, color: '#3D4257', fontFamily: 'var(--font-mono)' }}>
                    {formatDate(n.created_at)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
