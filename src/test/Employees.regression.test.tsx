import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Employees from '../pages/Employees'
import type { Department, Employee } from '../data/mock'

/**
 * Regressão do bug reportado: "erro ao selecionar os colaboradores".
 *
 * O `useSupabaseData` devolvia colunas textuais do Postgres direto para a
 * UI. Como `employees.registration`, `cpf`, `phone`, `sector`, `company` e
 * `role` são `TEXT DEFAULT ''` (sem NOT NULL), uma linha com coluna nula
 * quebrava a página inteira em `e.registration.toLowerCase()`.
 *
 * Aqui simulamos exatamente esse payload: collaborators com campos nulos.
 */

// employees com colunas nulas — o payload que derrubava a página
const employeesWithNulls = [
  {
    id: 1,
    name: 'Carlos Eduardo Mendes',
    cpf: null,
    phone: null,
    registration: null,
    role: null,
    team: '',
    sector: null,
    company: null,
    admissionDate: '',
    status: 'Ativo' as const,
  },
  {
    id: 2,
    name: '',
    cpf: null,
    phone: null,
    registration: null,
    role: null,
    team: '',
    sector: null,
    company: null,
    admissionDate: '',
    status: 'Ativo' as const,
  },
] as unknown as Employee[]

const departments: Department[] = [
  { id: 1, name: 'Operações', description: '', color: '#6366F1', memberCount: 2 },
]

const refresh = vi.fn(async () => {})

vi.mock('../hooks/useSupabaseData', () => ({
  useSupabaseData: () => ({
    loading: false,
    error: null,
    employees: employeesWithNulls,
    departments,
    movements: [],
    categories: [],
    epis: [],
    entries: [],
    notifications: [],
    chartData: { stockByCategory: [], movementsOverTime: [], stockTrend: [] },
    refresh,
    addEmployee: vi.fn(async () => {}),
    updateEmployee: vi.fn(async () => {}),
    deleteEmployee: vi.fn(async () => {}),
    addDepartment: vi.fn(async () => {}),
    updateDepartment: vi.fn(async () => {}),
    deleteDepartment: vi.fn(async () => {}),
    addCategory: vi.fn(async () => {}),
    updateCategory: vi.fn(async () => {}),
    deleteCategory: vi.fn(async () => {}),
    addEntry: vi.fn(async () => {}),
    addEpi: vi.fn(async () => {}),
    updateEpi: vi.fn(async () => {}),
    deleteEpi: vi.fn(async () => {}),
    distributeToCompany: vi.fn(async () => {}),
    markNotificationRead: vi.fn(async () => {}),
    markAllNotificationsRead: vi.fn(async () => {}),
  }),
}))

describe('Employees — colaboradores com colunas nulas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza a página sem estourar quando CPF/matrícula são null', () => {
    // Antes: `e.registration.toLowerCase()` lançava TypeError e a página
    // inteira ficava em branco.
    render(<Employees />)
    expect(screen.getByRole('heading', { name: 'Colaboradores' })).toBeInTheDocument()
    expect(screen.getByText('Carlos Eduardo Mendes')).toBeInTheDocument()
  })

  it('a busca por texto não quebra com campos nulos', async () => {
    const user = userEvent.setup()
    render(<Employees />)
    const search = screen.getByPlaceholderText('Buscar por nome, matrícula ou CPF...')
    await user.type(search, 'carlos')
    expect(screen.getByText('Carlos Eduardo Mendes')).toBeInTheDocument()
  })

  it('busca por CPF pontuado funciona mesmo com o campo vazio no banco', async () => {
    const user = userEvent.setup()
    render(<Employees />)
    await user.type(
      screen.getByPlaceholderText('Buscar por nome, matrícula ou CPF...'),
      '423',
    )
    expect(screen.getByText('Nenhum colaborador encontrado.')).toBeInTheDocument()
  })

  it('avatar de colaborador sem nome não renderiza a palavra "undefined"', () => {
    // Antes: `"".split(" ").map(n => n[0]).join("")` produzia "undefined"
    // e `colors["".charCodeAt(0)]` gerava `background: "undefined28"`.
    render(<Employees />)
    const table = screen.getByRole('table')
    expect(within(table).queryByText('undefined')).not.toBeInTheDocument()
    expect(within(table).getAllByText('?').length).toBeGreaterThan(0)
  })

  it('abre o histórico do colaborador sem quebrar', async () => {
    const user = userEvent.setup()
    render(<Employees />)
    await user.click(screen.getByText('Carlos Eduardo Mendes'))
    expect(screen.getByText('Histórico de Movimentações')).toBeInTheDocument()
    expect(
      screen.getByText('Nenhuma movimentação registrada para este colaborador.'),
    ).toBeInTheDocument()
  })

  it('exibe o modal de edição com valores seguros', async () => {
    const user = userEvent.setup()
    render(<Employees />)
    const row = screen.getByText('Carlos Eduardo Mendes').closest('tr') as HTMLElement
    const editButton = within(row).getByTitle('Editar')
    await user.click(editButton)

    // O Modal é renderizado por portal direto em document.body, então a
    // busca precisa ser no document — não no container do render().
    const dialog = document.querySelector('.modal-overlay') as HTMLElement
    expect(dialog).not.toBeNull()

    const nameInput = dialog.querySelector(
      'input[placeholder="Nome Completo"]',
    ) as HTMLInputElement
    expect(nameInput.value).toBe('Carlos Eduardo Mendes')

    // campo null vira string vazia, nunca o texto "null"/"undefined"
    const cpfInput = dialog.querySelector('input[placeholder="CPF"]') as HTMLInputElement
    expect(cpfInput.value).toBe('')

    const registrationInput = dialog.querySelector(
      'input[placeholder="Matrícula"]',
    ) as HTMLInputElement
    expect(registrationInput.value).toBe('')
  })
})