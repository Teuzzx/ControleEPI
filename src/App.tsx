import { useState, useEffect, useCallback } from 'react'
import LoginPage from './components/login/LoginPage'
import Sidebar, { type Page } from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import Overview from './pages/Overview'
import Employees from './pages/Employees'
import Stock from './pages/Stock'
import Departments from './pages/Departments'
import Movements from './pages/Movements'
import Reports from './pages/Reports'
import Categories from './pages/Categories'
import Entries from './pages/Entries'
import Companies from './pages/Companies'
import Distribution from './pages/Distribution'
import Avisos from './pages/Avisos'
import Settings from './pages/Settings'
import { DataClientProvider } from './lib/clientContext'
import { loadSession, saveSession, clearSession, getAuthClient, resetAuthClient, createSessionClient, type SessionUser } from './lib/auth'

const PAGE_META: Record<Page, { title: string; subtitle: string }> = {
  overview:     { title: 'Dashboard',           subtitle: 'Visão geral do sistema' },
  employees:    { title: 'Colaboradores',        subtitle: 'Gerenciamento de pessoas' },
  stock:        { title: 'Estoque de EPIs',      subtitle: 'Controle de itens e variações' },
  entries:      { title: 'Entradas de Estoque',  subtitle: 'Registro de produtos recebidos' },
  categories:   { title: 'Categorias',           subtitle: 'Organização por tipo de EPI' },
  departments:  { title: 'Departamentos',        subtitle: 'Gestão de departamentos' },
  movements:    { title: 'Movimentações',        subtitle: 'Sincronizado via aplicativo mobile' },
  reports:      { title: 'Relatórios',           subtitle: 'Análise e exportação de dados' },
  companies:    { title: 'Empresas',             subtitle: 'Rede de empresas vinculadas' },
  distribution: { title: 'Distribuição',         subtitle: 'Envio de EPIs para as empresas' },
  avisos:       { title: 'Avisos',               subtitle: 'Comunicados para a rede de empresas' },
  settings:     { title: 'Configurações',        subtitle: 'Usuários e acesso ao sistema' },
}

function PageComponent({ page, onNavigate, userRole }: { page: Page; onNavigate?: (page: Page) => void; userRole: 'matriz' | 'filial' }) {
  switch (page) {
    case 'overview':     return <Overview onNavigate={onNavigate} />
    case 'employees':    return <Employees />
    case 'stock':        return <Stock />
    case 'entries':      return <Entries />
    case 'categories':   return <Categories />
    case 'departments':  return <Departments />
    case 'movements':    return <Movements />
    case 'reports':      return <Reports />
    case 'companies':    return <Companies />
    case 'distribution': return <Distribution />
    case 'avisos':       return <Avisos />
    case 'settings':     return <Settings userRole={userRole} />
    default:             return <Overview />
  }
}

export default function App() {
  const [user, setUser] = useState<SessionUser | null>(() => loadSession())
  const [currentPage, setCurrentPage] = useState<Page>('overview')
  const [transitioning, setTransitioning] = useState(false)
  const [dataClient, setDataClient] = useState(() => getAuthClient())

  // Sessão salva → cria client do banco da empresa do usuário (filial) ou o da matriz autenticado
  useEffect(() => {
    if (!user) return
    if (user.companyId != null && user.companyUrl && user.companyKey) {
      try {
        setDataClient(createSessionClient(user.companyUrl, user.companyKey, user.token))
      } catch {
        setDataClient(getAuthClient())
      }
    } else {
      setDataClient(getAuthClient())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.companyId])

  const handleLogin = useCallback((u: SessionUser) => {
    saveSession(u)
    // O authedClient é criado sem token antes do login; após salvar a sessão,
    // descarta o cache para o próximo getAuthClient() montar o client autenticado.
    resetAuthClient()
    setDataClient(getAuthClient())
    setUser(u)
    setCurrentPage('overview')
  }, [])

  const handleLogout = () => {
    clearSession()
    setUser(null)
    setCurrentPage('overview')
  }

  const handleNavigate = (page: Page) => {
    if (page === currentPage) return
    setTransitioning(true)
    setTimeout(() => {
      setCurrentPage(page)
      setTransitioning(false)
    }, 150)
  }

  const refreshKey = user?.role ?? 'guest'

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  // Filial sem banco configurado (pendente) — a matriz nunca passa por aqui
  if (user.role === 'filial' && user.companyId != null && (!user.companyUrl || !user.companyKey)) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--background)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div className="glass-strong" style={{ maxWidth: 520, width: '100%', borderRadius: 20, padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏗️</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#E8EAF6', margin: '0 0 8px' }}>
            Aguardando configuração
          </h2>
          <p style={{ fontSize: 14, color: '#5C6388', lineHeight: 1.6, margin: '0 0 20px' }}>
            Olá, <strong style={{ color: '#9BA3C4' }}>{user.name}</strong>! Sua conta em <strong style={{ color: '#67E8F9' }}>{user.companyName}</strong> ainda não está
            vinculada a um banco de dados. A matriz precisa conectar a empresa pelo painel de Empresas.
          </p>
          <button
            onClick={handleLogout}
            style={{
              padding: '11px 24px', borderRadius: 10,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#9BA3C4', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Sair
          </button>
        </div>
      </div>
    )
  }

  const meta = PAGE_META[currentPage]

  return (
    <DataClientProvider client={dataClient}>
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--background)',
        overflow: 'hidden',
      }}>
        <Sidebar
          current={currentPage}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          userName={user.name}
          userRole={user.role}
          companyName={user.companyName}
        />

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          minWidth: 0,
          overflow: 'hidden',
        }}>
          <TopBar
            key={refreshKey}
            title={meta.title}
            subtitle={meta.subtitle}
            companyName={user.companyName}
            role={user.role}
          />

          <main
            key={`${currentPage}-${refreshKey}`}
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              opacity: transitioning ? 0 : 1,
              transform: transitioning ? 'translateY(8px)' : 'none',
              transition: 'opacity 0.15s ease, transform 0.15s ease',
            }}
          >
            <PageComponent page={currentPage} onNavigate={handleNavigate} userRole={user.role} />
          </main>
        </div>
      </div>
    </DataClientProvider>
  )
}
