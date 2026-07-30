import { describe, it, expect } from 'vitest'
import {
  employees, teams, roles, categories, epis, movements, chartData,
  type Employee, type Team, type Category, type Epi, type Movement,
} from '../data/mock'

describe('Mock Data - All Empty (awaiting Supabase)', () => {
  it('employees should be empty', () => {
    expect(employees).toHaveLength(0)
  })

  it('teams should be empty', () => {
    expect(teams).toHaveLength(0)
  })

  it('categories should be empty', () => {
    expect(categories).toHaveLength(0)
  })

  it('EPIs should be empty', () => {
    expect(epis).toHaveLength(0)
  })

  it('movements should be empty', () => {
    expect(movements).toHaveLength(0)
  })

  it('chartData should still have structure with zeros', () => {
    expect(chartData.stockByCategory.length).toBeGreaterThan(0)
    chartData.stockByCategory.forEach((item) => {
      expect(item.value).toBe(0)
      expect(item.fill).toMatch(/^#/)
    })
    expect(chartData.movementsOverTime.length).toBeGreaterThan(0)
    chartData.movementsOverTime.forEach((item) => {
      expect(item.entregas).toBe(0)
    })
  })
})
