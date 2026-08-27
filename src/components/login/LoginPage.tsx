import { useState, type FormEvent, type MouseEvent } from 'react'
import {
  Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft,
  Loader2, AlertCircle, CheckCircle2, ShieldCheck, KeyRound, Send,
} from 'lucide-react'
import { login, requestPasswordReset, resetPasswordWithCode, type SessionUser } from '../../lib/auth'

interface Props {
  onLogin: (user: SessionUser) => void
}

type AuthState = 'idle' | 'loading' | 'success' | 'error'

const BG_PRIMARY = 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=1600&q=80'
const BG_FALLBACK = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=80'

const C = {
  bg: '#09090F',
  card: 'rgba(18, 22, 33, 0.72)',
  field: '#171B28',
  border: 'rgba(255, 255, 255, 0.08)',
  text: '#FFFFFF',
  muted: '#A3A3B2',
  primary: '#6D5EF8',
  primaryLight: '#8575FF',
  glow: 'rgba(109, 94, 248, 0.25)',
}

const EMAIL_KEY = 'epi_login_email'

function readSavedEmail(): string {
  try {
    return localStorage.getItem(EMAIL_KEY) || ''
  } catch {
    return ''
  }
}

export default function LoginPage({ onLogin }: Props) {
  const [identifier, setIdentifier] = useState(() => readSavedEmail())
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(() => readSavedEmail() !== '')
  const [authState, setAuthState] = useState<AuthState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [infoMsg, setInfoMsg] = useState('')
  const [bgFallback, setBgFallback] = useState(false)
  const [view, setView] = useState<'login' | 'forgot' | 'reset'>('login')
  const [forgotEmail, setForgotEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
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
      try {
        if (remember) {
          localStorage.setItem(EMAIL_KEY, identifier.trim())
        } else {
          localStorage.removeItem(EMAIL_KEY)
        }
      } catch {
        // armazenamento indisponível: segue sem persistir
      }
      setAuthState('success')
      await new Promise((r) => setTimeout(r, 800))
      onLogin(user)
    } catch (err) {
      setAuthState('error')
      setErrorMsg((err as Error).message)
    }
  }

  const openForgot = () => {
    setForgotEmail(identifier)
    setErrorMsg('')
    setInfoMsg('')
    setAuthState('idle')
    setView('forgot')
  }

  const handleRequestReset = async (e: FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim()) {
      setErrorMsg('Informe seu e-mail de login.')
      setAuthState('error')
      return
    }
    setAuthState('loading')
    setErrorMsg('')
    setInfoMsg('')
    try {
      await requestPasswordReset(forgotEmail)
      setAuthState('success')
      setInfoMsg('Se existir uma conta com este e-mail, você receberá um código de verificação em instantes.')
      await new Promise((r) => setTimeout(r, 1000))
      setView('reset')
      setAuthState('idle')
    } catch (err) {
      setAuthState('error')
      setErrorMsg((err as Error).message)
    }
  }

  const handleSubmitReset = async (e: FormEvent) => {
    e.preventDefault()
    if (!resetCode.trim() || !newPassword || !confirmPassword) {
      setErrorMsg('Preencha o código, a nova senha e a confirmação.')
      setAuthState('error')
      return
    }
    if (newPassword.length < 6) {
      setErrorMsg('A nova senha deve ter pelo menos 6 caracteres.')
      setAuthState('error')
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('As senhas não coincidem. Verifique e tente novamente.')
      setAuthState('error')
      return
    }
    setAuthState('loading')
    setErrorMsg('')
    try {
      await resetPasswordWithCode(forgotEmail, resetCode, newPassword)
      setPassword('')
      setResetCode('')
      setNewPassword('')
      setConfirmPassword('')
      setView('login')
      setInfoMsg('Senha redefinida com sucesso! Faça login com a nova senha.')
      setAuthState('idle')
    } catch (err) {
      setAuthState('error')
      setErrorMsg((err as Error).message)
    }
  }

  const backToLogin = () => {
    setView('login')
    setErrorMsg('')
    setInfoMsg('')
    setAuthState('idle')
  }

  const spawnRipple = (e: MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    const ink = document.createElement('span')
    const size = Math.max(rect.width, rect.height)
    ink.className = 'btn-ripple-ink'
    ink.style.width = `${size}px`
    ink.style.height = `${size}px`
    ink.style.left = `${e.clientX - rect.left - size / 2}px`
    ink.style.top = `${e.clientY - rect.top - size / 2}px`
    btn.appendChild(ink)
    window.setTimeout(() => ink.remove(), 750)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: C.bg,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
      }}
    >
      {/* ── Wallpaper de fundo: fotografia de EPI ─────────────────── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <img
          src={bgFallback ? BG_FALLBACK : BG_PRIMARY}
          alt=""
          onError={() => setBgFallback(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            animation: 'ken-burns 30s ease-in-out infinite alternate',
          }}
        />
        {/* Gradiente escuro ~80% para leitura */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(9,9,15,0.78) 0%, rgba(9,9,15,0.62) 34%, rgba(9,9,15,0.8) 68%, rgba(9,9,15,0.95) 100%)',
          }}
        />
        {/* Vinheta nas bordas */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 120% 95% at 50% 40%, transparent 48%, rgba(0,0,0,0.62) 100%)',
          }}
        />
        {/* Iluminação suave nas laterais */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(109,94,248,0.14) 0%, transparent 32%), linear-gradient(270deg, rgba(109,94,248,0.12) 0%, transparent 32%)',
          }}
        />
      </div>

      {/* ── Conteúdo ─────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 430 }}>
          {/* ── Cabeçalho ── */}
          <header style={{ textAlign: 'center', marginBottom: 34 }}>
            <div
              className="blur-reveal float-gentle"
              style={{
                width: 96,
                height: 96,
                margin: '0 auto 22px',
                borderRadius: 30,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <img
                src="/logo-norion.png"
                alt="Norion"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 30,
                }}
              />
            </div>

            <h1
              className="blur-reveal"
              style={{
                margin: 0,
                fontFamily: 'var(--font-sans)',
                fontSize: 30,
                fontWeight: 700,
                color: C.text,
                letterSpacing: '-0.03em',
                animationDelay: '0.08s',
              }}
            >
              Controle de EPI
            </h1>

            <p
              className="blur-reveal"
              style={{
                margin: '10px auto 0',
                maxWidth: 300,
                fontSize: 12.5,
                lineHeight: 1.6,
                color: C.muted,
                animationDelay: '0.16s',
              }}
            >
              Sistema Inteligente de Gestão de Equipamentos de Proteção Individual
            </p>
          </header>

          {/* ── Card flutuante ── */}
          <div
            className="blur-reveal"
            style={{
              background: C.card,
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              border: `1px solid ${C.border}`,
              borderRadius: 30,
              padding: '36px 28px',
              boxShadow:
                '0 40px 90px rgba(0,0,0,0.45), 0 0 60px rgba(109,94,248,0.07)',
              position: 'relative',
              overflow: 'hidden',
              animationDelay: '0.24s',
            }}
          >
            {/* Brilho interno superior */}
            <div
              style={{
                position: 'absolute',
                top: -90,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 280,
                height: 170,
                background: 'radial-gradient(ellipse, rgba(109,94,248,0.16), transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            {view === 'login' && (
              <>
                <div style={{ marginBottom: 28, position: 'relative' }}>
                  <h2
                    style={{
                      margin: '0 0 8px',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 28,
                      fontWeight: 700,
                      color: C.text,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Bem-vindo novamente
                  </h2>
                  <p style={{ margin: 0, fontSize: 14, color: C.muted, lineHeight: 1.5 }}>
                    Faça login para continuar utilizando o sistema.
                  </p>
                </div>

                {infoMsg && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: 'rgba(16,185,129,0.08)',
                      border: '1px solid rgba(16,185,129,0.25)',
                      borderRadius: 14,
                      padding: '12px 16px',
                      marginBottom: 16,
                      animation: 'blur-reveal 0.35s cubic-bezier(0.16,1,0.3,1) both',
                    }}
                  >
                    <CheckCircle2 size={16} color="#4ADE80" strokeWidth={2} />
                    <span style={{ fontSize: 13, color: '#4ADE80' }}>{infoMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* E-mail */}
                <div className="login-field">
                  <Mail
                    size={17}
                    color="#6E6E84"
                    strokeWidth={1.9}
                    style={{ position: 'absolute', left: 18, pointerEvents: 'none' }}
                  />
                  <input
                    className="login-input"
                    type="text"
                    value={identifier}
                    onChange={(e) => { setIdentifier(e.target.value); if (authState === 'error') setAuthState('idle') }}
                    placeholder="E-mail ou matrícula"
                    autoComplete="username"
                    disabled={authState === 'loading' || authState === 'success'}
                  />
                </div>

                {/* Senha */}
                <div className="login-field">
                  <Lock
                    size={17}
                    color="#6E6E84"
                    strokeWidth={1.9}
                    style={{ position: 'absolute', left: 18, pointerEvents: 'none' }}
                  />
                  <input
                    className="login-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (authState === 'error') setAuthState('idle') }}
                    placeholder="Sua senha"
                    autoComplete="current-password"
                    disabled={authState === 'loading' || authState === 'success'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    style={{
                      position: 'absolute',
                      right: 14,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6E6E84',
                      padding: 6,
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#A3A3B2')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#6E6E84')}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {/* Lembrar + Esqueci */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 2,
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
                    <div
                      onClick={() => setRemember(!remember)}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 6,
                        border: remember ? 'none' : '1px solid rgba(255,255,255,0.16)',
                        background: remember ? 'linear-gradient(135deg, #6D5EF8, #8575FF)' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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
                    <span style={{ fontSize: 13, color: '#8A8A9C', userSelect: 'none' }}>Lembrar de mim</span>
                  </label>
                  <button
                    type="button"
                    onClick={openForgot}
                    style={{
                      fontSize: 13,
                      color: '#8B7CFF',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 600,
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#A99BFF')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#8B7CFF')}
                  >
                    Esqueci minha senha
                  </button>
                </div>

                {/* Erro */}
                {authState === 'error' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 14,
                      padding: '12px 16px',
                      animation: 'blur-reveal 0.35s cubic-bezier(0.16,1,0.3,1) both',
                    }}
                  >
                    <AlertCircle size={16} color="#F87171" strokeWidth={2} />
                    <span style={{ fontSize: 13, color: '#F87171' }}>{errorMsg}</span>
                  </div>
                )}

                {/* Botão principal */}
                <button
                  type="submit"
                  className="login-btn-primary"
                  onClick={spawnRipple}
                  disabled={authState === 'loading' || authState === 'success'}
                  style={{ marginTop: 6 }}
                >
                  {authState === 'loading' && <Loader2 size={17} strokeWidth={2.5} style={{ animation: 'spin-slow 0.8s linear infinite' }} />}
                  {authState === 'success' && <CheckCircle2 size={17} strokeWidth={2.5} />}
                  {authState === 'idle' || authState === 'error' ? (
                    <>
                      Acessar Sistema
                      <ArrowRight size={17} strokeWidth={2.4} />
                    </>
                  ) : authState === 'loading' ? (
                    'Autenticando...'
                  ) : (
                    'Acesso liberado!'
                  )}
                </button>
              </div>
              </form>
              </>
            )}

            {view === 'forgot' && (
              <>
                <div style={{ marginBottom: 28, position: 'relative' }}>
                  <h2
                    style={{
                      margin: '0 0 8px',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 26,
                      fontWeight: 700,
                      color: C.text,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Recuperar senha
                  </h2>
                  <p style={{ margin: 0, fontSize: 13.5, color: C.muted, lineHeight: 1.55 }}>
                    Informe o e-mail do seu login. Enviaremos um código de verificação de 6 dígitos.
                  </p>
                </div>

                <form onSubmit={handleRequestReset} noValidate style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="login-field">
                      <Mail
                        size={17}
                        color="#6E6E84"
                        strokeWidth={1.9}
                        style={{ position: 'absolute', left: 18, pointerEvents: 'none' }}
                      />
                      <input
                        className="login-input"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => { setForgotEmail(e.target.value); if (authState === 'error') setAuthState('idle') }}
                        placeholder="Seu e-mail de login"
                        autoComplete="email"
                        disabled={authState === 'loading' || authState === 'success'}
                      />
                    </div>

                    {authState === 'error' && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          background: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          borderRadius: 14,
                          padding: '12px 16px',
                          animation: 'blur-reveal 0.35s cubic-bezier(0.16,1,0.3,1) both',
                        }}
                      >
                        <AlertCircle size={16} color="#F87171" strokeWidth={2} />
                        <span style={{ fontSize: 13, color: '#F87171' }}>{errorMsg}</span>
                      </div>
                    )}

                    {authState === 'success' && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          background: 'rgba(16,185,129,0.08)',
                          border: '1px solid rgba(16,185,129,0.25)',
                          borderRadius: 14,
                          padding: '12px 16px',
                          animation: 'blur-reveal 0.35s cubic-bezier(0.16,1,0.3,1) both',
                        }}
                      >
                        <CheckCircle2 size={16} color="#4ADE80" strokeWidth={2} />
                        <span style={{ fontSize: 13, color: '#4ADE80' }}>{infoMsg}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="login-btn-primary"
                      onClick={spawnRipple}
                      disabled={authState === 'loading' || authState === 'success'}
                      style={{ marginTop: 6 }}
                    >
                      {authState === 'loading' && <Loader2 size={17} strokeWidth={2.5} style={{ animation: 'spin-slow 0.8s linear infinite' }} />}
                      {authState === 'success' && <CheckCircle2 size={17} strokeWidth={2.5} />}
                      {authState === 'idle' || authState === 'error' ? (
                        <>
                          Enviar código
                          <Send size={17} strokeWidth={2.4} />
                        </>
                      ) : authState === 'loading' ? (
                        'Enviando...'
                      ) : (
                        'Código enviado!'
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={backToLogin}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 7,
                        fontSize: 13,
                        color: '#8A8A9C',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px 0',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 600,
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#C4C9E2')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#8A8A9C')}
                    >
                      <ArrowLeft size={15} /> Voltar ao login
                    </button>
                  </div>
                </form>
              </>
            )}

            {view === 'reset' && (
              <>
                <div style={{ marginBottom: 28, position: 'relative' }}>
                  <h2
                    style={{
                      margin: '0 0 8px',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 26,
                      fontWeight: 700,
                      color: C.text,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Digite o código
                  </h2>
                  <p style={{ margin: 0, fontSize: 13.5, color: C.muted, lineHeight: 1.55 }}>
                    Informe o código de 6 dígitos recebido por e-mail e defina a nova senha.
                  </p>
                </div>

                <form onSubmit={handleSubmitReset} noValidate style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="login-field">
                      <KeyRound
                        size={17}
                        color="#6E6E84"
                        strokeWidth={1.9}
                        style={{ position: 'absolute', left: 18, pointerEvents: 'none' }}
                      />
                      <input
                        className="login-input"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={resetCode}
                        onChange={(e) => { setResetCode(e.target.value.replace(/\D/g, '')); if (authState === 'error') setAuthState('idle') }}
                        placeholder="Código de 6 dígitos"
                        style={{ textAlign: 'center', letterSpacing: '0.5em', fontWeight: 700, fontSize: 18 }}
                        disabled={authState === 'loading' || authState === 'success'}
                      />
                    </div>

                    <div className="login-field">
                      <Lock
                        size={17}
                        color="#6E6E84"
                        strokeWidth={1.9}
                        style={{ position: 'absolute', left: 18, pointerEvents: 'none' }}
                      />
                      <input
                        className="login-input"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); if (authState === 'error') setAuthState('idle') }}
                        placeholder="Nova senha (mín. 6 caracteres)"
                        autoComplete="new-password"
                        disabled={authState === 'loading' || authState === 'success'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label={showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        style={{
                          position: 'absolute',
                          right: 14,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#6E6E84',
                          padding: 6,
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#A3A3B2')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#6E6E84')}
                      >
                        {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>

                    <div className="login-field">
                      <Lock
                        size={17}
                        color="#6E6E84"
                        strokeWidth={1.9}
                        style={{ position: 'absolute', left: 18, pointerEvents: 'none' }}
                      />
                      <input
                        className="login-input"
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); if (authState === 'error') setAuthState('idle') }}
                        placeholder="Confirme a nova senha"
                        autoComplete="new-password"
                        disabled={authState === 'loading' || authState === 'success'}
                      />
                    </div>

                    {authState === 'error' && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          background: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          borderRadius: 14,
                          padding: '12px 16px',
                          animation: 'blur-reveal 0.35s cubic-bezier(0.16,1,0.3,1) both',
                        }}
                      >
                        <AlertCircle size={16} color="#F87171" strokeWidth={2} />
                        <span style={{ fontSize: 13, color: '#F87171' }}>{errorMsg}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="login-btn-primary"
                      onClick={spawnRipple}
                      disabled={authState === 'loading' || authState === 'success'}
                      style={{ marginTop: 6 }}
                    >
                      {authState === 'loading' && <Loader2 size={17} strokeWidth={2.5} style={{ animation: 'spin-slow 0.8s linear infinite' }} />}
                      {authState === 'idle' || authState === 'error' ? (
                        <>
                          Redefinir senha
                          <ArrowRight size={17} strokeWidth={2.4} />
                        </>
                      ) : (
                        'Redefinindo...'
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={backToLogin}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 7,
                        fontSize: 13,
                        color: '#8A8A9C',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px 0',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 600,
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#C4C9E2')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#8A8A9C')}
                    >
                      <ArrowLeft size={15} /> Voltar ao login
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* ── Selo de segurança ── */}
          <footer
            className="blur-reveal"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 9,
              marginTop: 30,
              textAlign: 'center',
              animationDelay: '0.38s',
            }}
          >
            <div
              className="glow-pulse-soft"
              style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                background: 'rgba(109,94,248,0.12)',
                border: '1px solid rgba(109,94,248,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={20} color="#8B7CFF" strokeWidth={2} />
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#E4E4EF' }}>
              Seus dados estão protegidos
            </div>
            <div style={{ fontSize: 11, color: '#6E6E84', letterSpacing: '0.03em' }}>
              Comunicação criptografada • Login seguro • Ambiente protegido
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 10.5,
                color: '#4A4A5E',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Norion • Tecnologia e Inovação
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
