import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '../components/login/LoginPage'

describe('LoginPage', () => {
  it('should render the login form with welcome message', () => {
    render(<LoginPage onLogin={() => {}} />)
    expect(screen.getByText('Bem-vindo novamente')).toBeInTheDocument()
    expect(screen.getByText('Faça login para continuar utilizando o sistema.')).toBeInTheDocument()
  })

  it('should show error when submitting empty form', async () => {
    const user = userEvent.setup()
    render(<LoginPage onLogin={() => {}} />)
    await user.click(screen.getByText('Acessar Sistema'))
    expect(screen.getByText('Preencha todos os campos para continuar.')).toBeInTheDocument()
  })

  it('should show "Norion" branding', () => {
    render(<LoginPage onLogin={() => {}} />)
    const norionElements = screen.getAllByText(/Norion/i)
    expect(norionElements.length).toBeGreaterThanOrEqual(1)
  })

  it('should not render demo credential buttons', () => {
    render(<LoginPage onLogin={() => {}} />)
    expect(screen.queryByText('Acesso de demonstração')).not.toBeInTheDocument()
    expect(screen.queryByText('admin@norion.com')).not.toBeInTheDocument()
  })
})
