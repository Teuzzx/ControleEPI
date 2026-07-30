import { useState, useEffect } from 'react'
import LoginPage from './components/login/LoginPage'
import Sidebar, { type Page } from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import Overview from './pages/Overview'
import Employees from './pages/Employees'
import Stock from './pages/Stock'
import Teams from './pages/Teams'
import Movements from './pages/Movements'
import Reports from './pages/Reports'
import Categories from './pages/Categories'
import Entries from './pages/Entries'

const PAGE_META: Record<Page, { title: string; subtitle: string }> = {
  overview:   { title: 'Dashboard',           subtitle: 'Visão geral do sistema' },
  employees:  { title: 'Colaboradores',        subtitle: 'Gerenciamento de pessoas' },
  stock:      { title: 'Estoque de EPIs',      subtitle: 'Controle de itens e variações' },
  entries:    { title: 'Entradas de Estoque',  subtitle: 'Registro de produtos recebidos' },
  categories: { title: 'Categorias',           subtitle: 'Organização por tipo de EPI' },
  teams:      { title: 'Equipes',              subtitle: 'Gestão de times e grupos' },
  movements:  { title: 'Movimentações',        subtitle: 'Sincronizado via aplicativo mobile' },
  reports:    { title: 'Relatórios',           subtitle: 'Análise e exportação de dados' },
}

function PageComponent({ page }: { page: Page }) {
  switch (page) {
    case 'overview':   return <Overview />
    case 'employees':  return <Employees />
    case 'stock':      return <Stock />
    case 'entries':    return <Entries />
    case 'categories': return <Categories />
    case 'teams':      return <Teams />
    case 'movements':  return <Movements />
    case 'reports':    return <Reports />
    default:           return <Overview />
  }
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem('auth') === 'true')
  const [currentPage, setCurrentPage] = useState<Page>('overview')
  const [transitioning, setTransitioning] = useState(false)

  const handleLogin = () => {
    localStorage.setItem('auth', 'true')
    setAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('auth')
    setAuthenticated(false)
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

  if (!authenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  const meta = PAGE_META[currentPage]

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--background)',
      overflow: 'hidden',
    }}>
      {/* Sidebar */}
      <Sidebar current={currentPage} onNavigate={handleNavigate} onLogout={handleLogout} />

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        minWidth: 0,
        overflow: 'hidden',
      }}>
        <TopBar title={meta.title} subtitle={meta.subtitle} />

        <main style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'translateY(8px)' : 'translateY(0)',
          transition: 'opacity 0.15s ease, transform 0.15s ease',
        }}>
          <PageComponent page={currentPage} />
        </main>
      </div>
    </div>
  )
}
