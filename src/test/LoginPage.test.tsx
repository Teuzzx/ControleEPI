import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '../components/login/LoginPage'

describe('LoginPage', () => {
  it('should render the login form with welcome message', () => {
    render(<LoginPage onLogin={() => {}} />)
    expect(screen.getByText('Bem-vindo de volta')).toBeInTheDocument()
    expect(screen.getByText('Sistema de Gestão')).toBeInTheDocument()
  })

  it('should show error when submitting empty form', async () => {
    const user = userEvent.setup()
    render(<LoginPage onLogin={() => {}} />)
    await user.click(screen.getByText('Acessar Sistema'))
    expect(screen.getByText('Preencha todos os campos para continuar.')).toBeInTheDocument()
  })

  it('should show "Feito pela Norion" branding', () => {
    render(<LoginPage onLogin={() => {}} />)
    const norionElements = screen.getAllByText(/Norion/i)
    expect(norionElements.length).toBeGreaterThanOrEqual(1)
  })
})
