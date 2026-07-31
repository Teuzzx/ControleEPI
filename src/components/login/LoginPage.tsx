import { useState, useEffect, useRef, useCallback } from 'react'
import { Eye, EyeOff, Shield, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { login, type SessionUser } from '../../lib/auth'

interface Props {
  onLogin: (user: SessionUser) => void
}

type AuthState = 'idle' | 'loading' | 'success' | 'error'

// Floating particle
interface Particle {
  id: number
  x: number
  size: number
  duration: number
  delay: number
  opacity: number
}

function generateParticles(n: number): Particle[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: 1 + Math.random() * 2.5,
    duration: 8 + Math.random() * 12,
    delay: Math.random() * 10,
    opacity: 0.15 + Math.random() * 0.35,
  }))
}

const PARTICLES = generateParticles(30)

// ── 3D Cube ──────────────────────────────────────────────────────────────────
function Cube3D({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const size = 110

  const faces = [
    { name: 'front',  transform: `rotateY(0deg) translateZ(${size / 2}px)` },
    { name: 'back',   transform: `rotateY(180deg) translateZ(${size / 2}px)` },
    { name: 'right',  transform: `rotateY(90deg) translateZ(${size / 2}px)` },
    { name: 'left',   transform: `rotateY(-90deg) translateZ(${size / 2}px)` },
    { name: 'top',    transform: `rotateX(90deg) translateZ(${size / 2}px)` },
    { name: 'bottom', transform: `rotateX(-90deg) translateZ(${size / 2}px)` },
  ]

  const tiltX = (mouseY - 0.5) * -18
  const tiltY = (mouseX - 0.5) * 18

  return (
    <div
      style={{
        perspective: '1400px',
        perspectiveOrigin: '50% 45%',
        width: size,
        height: size,
        position: 'relative',
      }}
    >
      <div
        className="cube-wrapper"
        style={{
          width: size,
          height: size,
          position: 'relative',
          transformStyle: 'preserve-3d',
          animationName: 'float-slow',
          animationDuration: '16s',
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
          transform: `perspective(1400px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
          transition: 'transform 0.3s ease-out',
        }}
      >
        {faces.map((face) => (
          <div
            key={face.name}
            style={{
              position: 'absolute',
              width: size,
              height: size,
              transform: face.transform,
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.3)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 10,
                border: '1px solid rgba(99,102,241,0.18)',
                borderRadius: 4,
              }}
            />
            {face.name === 'front' && (
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(99,102,241,0.35)', boxShadow: '0 0 20px rgba(99,102,241,0.5)' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Small floating orb ───────────────────────────────────────────────────────
function FloatingOrb({
  x, y, size, color, delay, duration,
}: {
  x: number; y: number; size: number; color: string; delay: number; duration: number
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        filter: `blur(${size * 0.3}px)`,
        opacity: 0.25,
        animation: `float-slow-alt ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        pointerEvents: 'none',
      }}
    />
  )
}

// ── Small geometric shape ────────────────────────────────────────────────────
function SmallCube({ x, y, delay, color }: { x: number; y: number; delay: number; color: string }) {
  const s = 32 + Math.random() * 24
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: s,
        height: s,
        border: `1px solid ${color}55`,
        background: `${color}08`,
        borderRadius: 6,
        animation: `float-slow-alt ${10 + delay * 2}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        transform: `rotate(${15 + delay * 10}deg)`,
      }}
    />
  )
}

// ── Main Login Page ──────────────────────────────────────────────────────────
export default function LoginPage({ onLogin }: Props) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [authState, setAuthState] = useState<AuthState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 })
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setMouse({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim() || !password.trim()) {
      setErrorMsg('Preencha todos os campos para continuar.')
      setAuthState('error')
      return
    }

    setAuthState('loading')
    setErrorMsg('')

    try {
      const user = await login(identifier, password)
      setAuthState('success')
      await new Promise((r) => setTimeout(r, 800))
      onLogin(user)
    } catch (err) {
      setAuthState('error')
      setErrorMsg((err as Error).message)
    }
  }

  const parallaxX = (mouse.x - 0.5) * 24
  const parallaxY = (mouse.y - 0.5) * 16

  return (
    <div
      ref={containerRef}
      className="animate-fade-in"
      onMouseMove={handleMouseMove}
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'radial-gradient(ellipse 80% 60% at 30% 30%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 70% 80%, rgba(34,211,238,0.06) 0%, transparent 55%), #07090F',
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ── Animated background particles ── */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              bottom: -10,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: p.id % 3 === 0 ? '#6366F1' : p.id % 3 === 1 ? '#22D3EE' : '#A78BFA',
              opacity: p.opacity,
              animation: `particle-rise ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}

        {/* Background orbs */}
        <FloatingOrb x={10} y={15} size={380} color="rgba(99,102,241,1)" delay={0} duration={20} />
        <FloatingOrb x={72} y={65} size={300} color="rgba(34,211,238,1)" delay={3} duration={18} />
        <FloatingOrb x={55} y={10} size={220} color="rgba(167,139,250,1)" delay={5} duration={22} />

        {/* Grid overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <div
        className="login-left animate-slide-left"
        style={{
          flex: '1',
          minWidth: 0,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 40px',
          position: 'relative',
          zIndex: 1,
          display: 'none',
        }}
      >
        {/* Brand mark */}
        <div style={{ position: 'absolute', top: 40, left: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
            }}>
              <Shield size={18} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#E8EAF6', letterSpacing: '-0.02em' }}>
                EPI<span style={{ color: '#6366F1' }}>Admin</span>
              </span>
              <div style={{ fontSize: 9, color: '#2D3050', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 1 }}>
                by <span style={{ color: '#818CF8' }}>Norion</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3D composition */}
        <div
          style={{
            position: 'relative',
            width: 480,
            height: 480,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Glow behind cube */}
          <div style={{
            position: 'absolute',
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)',
            animation: 'pulse-glow 4s ease-in-out infinite',
          }} />

          {/* Main cube — moves with mouse */}
          <div style={{
            transform: `translate(${parallaxX}px, ${parallaxY}px)`,
            transition: 'transform 0.15s ease-out',
          }}>
            <Cube3D mouseX={mouse.x} mouseY={mouse.y} />
          </div>

          {/* Orbiting elements */}
          <div style={{ position: 'absolute', inset: 0, animation: 'spin-slow 20s linear infinite', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', transform: 'translateX(160px)', width: 12, height: 12, borderRadius: '50%', background: '#6366F1', boxShadow: '0 0 20px rgba(99,102,241,0.8)' }} />
          </div>
          <div style={{ position: 'absolute', inset: 0, animation: 'spin-slow 14s linear infinite reverse', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', transform: 'translateX(120px)', width: 8, height: 8, borderRadius: '50%', background: '#22D3EE', boxShadow: '0 0 16px rgba(34,211,238,0.8)' }} />
          </div>

          {/* Outer ring */}
          <div style={{
            position: 'absolute',
            width: 340,
            height: 340,
            borderRadius: '50%',
            border: '1px solid rgba(99,102,241,0.12)',
          }} />
          <div style={{
            position: 'absolute',
            width: 260,
            height: 260,
            borderRadius: '50%',
            border: '1px dashed rgba(34,211,238,0.1)',
          }} />

          {/* Small floating cubes */}
          <SmallCube x={8} y={12} delay={0} color="#6366F1" />
          <SmallCube x={75} y={8} delay={1.5} color="#22D3EE" />
          <SmallCube x={82} y={72} delay={2.8} color="#A78BFA" />
          <SmallCube x={6} y={75} delay={0.7} color="#F59E0B" />

          {/* Floating stats chips */}
          <div
            style={{
              position: 'absolute',
              top: 60,
              right: 20,
              transform: `translate(${parallaxX * 0.4}px, ${parallaxY * 0.4}px)`,
              transition: 'transform 0.2s ease-out',
            }}
          >
            <div className="glass" style={{ padding: '10px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 8px rgba(74,222,128,0.6)' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#9BA3C4', fontFamily: 'var(--font-mono)' }}>3.795 itens em estoque</span>
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 70,
              left: 10,
              transform: `translate(${-parallaxX * 0.3}px, ${parallaxY * 0.3}px)`,
              transition: 'transform 0.2s ease-out',
            }}
          >
            <div className="glass" style={{ padding: '10px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366F1', boxShadow: '0 0 8px rgba(99,102,241,0.6)' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#9BA3C4', fontFamily: 'var(--font-mono)' }}>12 colaboradores hoje</span>
            </div>
          </div>
        </div>

        {/* Copy below */}
        <div style={{ textAlign: 'center', maxWidth: 440, marginTop: 32 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            fontWeight: 700,
            color: '#E8EAF6',
            margin: '0 0 12px',
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
          }}>
            Gestão de EPIs{' '}
            <span className="gradient-text">inteligente</span>
          </h1>
          <p style={{ fontSize: 15, color: '#5C6388', lineHeight: 1.7, margin: '0 0 24px' }}>
            Controle total do seu almoxarifado. Colaboradores, estoque e movimentações em tempo real.
          </p>

          {/* Norion branding */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ height: 1, width: 40, background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3))' }} />
            <span style={{ fontSize: 11, color: '#2D3050', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', fontWeight: 500 }}>
              <span className="gradient-text" style={{ fontWeight: 700 }}>Norion</span>
              <span style={{ color: '#2D3050' }}> • Tecnologia e Inovação</span>
            </span>
            <div style={{ height: 1, width: 40, background: 'linear-gradient(90deg, rgba(99,102,241,0.3), transparent)' }} />
          </div>
        </div>
      </div>

      {/* ── Right panel — Login form ──────────────────────────────────────── */}
      <div
        className="login-right"
        style={{
          width: '100%',
          maxWidth: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          className="animate-scale-in"
          style={{
            width: '100%',
            maxWidth: 440,
            animationDelay: '0.15s',
          }}
        >
          {/* Card */}
          <div
            className="glass-strong"
            style={{
              borderRadius: 20,
              padding: '40px 40px 36px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.08), 0 0 40px rgba(99,102,241,0.06)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Subtle gradient border glow */}
            <div style={{
              position: 'absolute',
              inset: -1,
              borderRadius: 21,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15), transparent 40%, transparent 60%, rgba(34,211,238,0.1))',
              zIndex: -1,
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              padding: '1px',
            }} />
            {/* Logo inside form */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 13,
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 24px rgba(99,102,241,0.45)',
                flexShrink: 0,
              }}>
                <Shield size={21} color="white" strokeWidth={2.5} />
              </div>
              <div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 19, fontWeight: 700,
                  color: '#E8EAF6', letterSpacing: '-0.025em', lineHeight: 1.2,
                }}>
                  EPI<span style={{ color: '#818CF8' }}>Admin</span>
                </div>
                <div style={{ fontSize: 11, color: '#5C6388', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Sistema de Gestão
                </div>
              </div>
            </div>

            {/* Heading */}
            <div style={{ marginBottom: 32 }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 24, fontWeight: 700,
                color: '#E8EAF6', margin: '0 0 6px',
                letterSpacing: '-0.025em',
              }}>
                Bem-vindo de volta
              </h2>
              <p style={{ fontSize: 14, color: '#5C6388', margin: 0, lineHeight: 1.5 }}>
                Acesse sua conta para continuar
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* E-mail / Matrícula */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9BA3C4', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    E-mail ou Matrícula
                  </label>
                  <input
                    className="input-field"
                    type="text"
                    value={identifier}
                    onChange={(e) => { setIdentifier(e.target.value); if (authState === 'error') setAuthState('idle') }}
                    placeholder="email@empresa.com.br ou MAT-00124"
                    autoComplete="username"
                    disabled={authState === 'loading' || authState === 'success'}
                  />
                </div>

                {/* Password */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9BA3C4', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Senha
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input-field"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (authState === 'error') setAuthState('idle') }}
                      placeholder="••••••••••••"
                      autoComplete="current-password"
                      style={{ paddingRight: 48 }}
                      disabled={authState === 'loading' || authState === 'success'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: '#5C6388',
                        padding: 4, display: 'flex', alignItems: 'center',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#9BA3C4')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#5C6388')}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember + forgot */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <div
                      onClick={() => setRemember(!remember)}
                      style={{
                        width: 18, height: 18, borderRadius: 5,
                        border: remember ? '2px solid #6366F1' : '1px solid rgba(255,255,255,0.15)',
                        background: remember ? '#6366F1' : 'transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                        flexShrink: 0,
                      }}
                    >
                      {remember && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span style={{ fontSize: 13, color: '#6B7280', userSelect: 'none' }}>Lembrar acesso</span>
                  </label>
                  <button
                    type="button"
                    style={{
                      fontSize: 13, color: '#818CF8', background: 'none', border: 'none',
                      cursor: 'pointer', padding: 0,
                      transition: 'color 0.15s',
                      fontFamily: 'var(--font-sans)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#A5B4FC')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#818CF8')}
                  >
                    Esqueci a senha
                  </button>
                </div>

                {/* Error message */}
                {authState === 'error' && (
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 10, padding: '10px 14px',
                      animation: 'fade-up 0.3s ease',
                    }}
                  >
                    <AlertCircle size={15} color="#F87171" strokeWidth={2} />
                    <span style={{ fontSize: 13, color: '#F87171' }}>{errorMsg}</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={authState === 'loading' || authState === 'success'}
                  style={{
                    marginTop: 4,
                    opacity: authState === 'loading' || authState === 'success' ? 0.85 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  }}
                >
                  {authState === 'loading' && <Loader2 size={16} strokeWidth={2.5} style={{ animation: 'spin-slow 0.8s linear infinite' }} />}
                  {authState === 'success' && <CheckCircle2 size={16} strokeWidth={2.5} />}
                  {authState === 'idle' || authState === 'error' ? (
                    <>
                      Acessar Sistema
                      <ArrowRight size={16} strokeWidth={2.5} />
                    </>
                  ) : authState === 'loading' ? (
                    'Autenticando...'
                  ) : (
                    'Acesso liberado!'
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <span style={{ fontSize: 11, color: '#3D4257', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Acesso restrito
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            </div>

            {/* Demo credentials */}
            <div style={{
              marginTop: 16,
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: 12,
              padding: '12px 16px',
            }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#818CF8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                Acesso de demonstração
              </div>
              {[
                { label: 'Matriz', email: 'admin@norion.com', pass: 'admin123' },
                { label: 'Filial', email: 'filial@norion.com', pass: 'filial123' },
              ].map((acc) => (
                <button
                  key={acc.label}
                  onClick={() => { setIdentifier(acc.email); setPassword(acc.pass) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 8, padding: '8px 12px', marginBottom: 6, cursor: 'pointer',
                    fontFamily: 'var(--font-mono)', fontSize: 11.5, transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
                >
                  <span style={{ color: '#5C6388' }}>{acc.label}: {acc.email}</span>
                  <span style={{ color: '#818CF8', fontWeight: 700 }}>{acc.pass}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Version info */}
          <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 8px rgba(74,222,128,0.6)' }} />
            <span style={{ fontSize: 11.5, color: '#3D4257', fontFamily: 'var(--font-mono)' }}>
              Sistema Online — v2.4.1
            </span>
          </div>

          {/* Feito pela Norion */}
          <div style={{ textAlign: 'center', marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{
              fontSize: 10.5,
              color: '#2D3050',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.05em',
              fontWeight: 500,
            }}>
              Feito com <span style={{ color: '#F43F5E' }}>❤</span> pela{' '}
              <span style={{
                color: '#818CF8',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Norion
              </span>
              <span style={{ color: '#1D2040', margin: '0 6px' }}>•</span>
              <span style={{ color: '#2D3050', fontWeight: 400 }}>Tecnologia e Inovação</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Responsive left panel (visible on large screens via CSS) ── */}
      <style>{`
        @media (min-width: 900px) {
          .login-left { display: flex !important; }
          .login-right { max-width: 520px !important; padding: 60px 48px !important; }
        }
      `}</style>
    </div>
  )
}
