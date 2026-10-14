import { describe, it, expect } from 'vitest'
import { str, num, rows, onlyDigits, matches } from '../lib/normalize'

/**
 * Regressão: colunas textuais do Postgres são nullable, mas as interfaces
 * do app as tratam como `string`. Sem normalizar na fronteira, um
 * `registration`/`cpf`/`manufacturer` null derrubava a página com
 * "Cannot read properties of null (reading 'toLowerCase')".
 */
describe('normalize', () => {
  describe('str', () => {
    it('converte null e undefined em string vazia', () => {
      expect(str(null)).toBe('')
      expect(str(undefined)).toBe('')
    })

    it('preserva strings válidas', () => {
      expect(str('Carlos Eduardo Mendes')).toBe('Carlos Eduardo Mendes')
      expect(str('')).toBe('')
    })

    it('converte primitivos sem quebrar a tipagem', () => {
      expect(str(42)).toBe('42')
      expect(str(0)).toBe('0')
      expect(str(false)).toBe('false')
    })

    it('devolve vazio para objetos (evita "[object Object]" na UI)', () => {
      expect(str({ a: 1 })).toBe('')
      expect(str([1, 2])).toBe('')
    })
  })

  describe('num', () => {
    it('devolve o fallback para null/undefined/vazio', () => {
      expect(num(null)).toBe(0)
      expect(num(undefined)).toBe(0)
      expect(num('')).toBe(0)
      expect(num(null, 7)).toBe(7)
    })

    it('converte bigints numéricos vindos como string do PostgREST', () => {
      expect(num('15')).toBe(15)
      expect(num('0')).toBe(0)
    })

    it('devolve o fallback para valores não numéricos', () => {
      expect(num('abc')).toBe(0)
      expect(num(NaN)).toBe(0)
      expect(num(Infinity, 3)).toBe(3)
      expect(num({}, 5)).toBe(5)
    })

    it('preserva números válidos, inclusive negativos e fracionários', () => {
      expect(num(15)).toBe(15)
      expect(num(-2)).toBe(-2)
      expect(num(1.5)).toBe(1.5)
    })
  })

  describe('rows', () => {
    it('transforma resposta null/undefined do PostgREST em lista vazia', () => {
      expect(rows(null)).toEqual([])
      expect(rows(undefined)).toEqual([])
    })

    it('preserva listas preenchidas', () => {
      expect(rows([1, 2, 3])).toEqual([1, 2, 3])
      expect(rows([])).toEqual([])
    })
  })

  describe('onlyDigits', () => {
    it('remove a pontuação de CPF', () => {
      expect(onlyDigits('423.891.670-09')).toBe('42389167009')
      expect(onlyDigits('42389167009')).toBe('42389167009')
    })

    it('não quebra com null', () => {
      expect(onlyDigits(null)).toBe('')
    })
  })

  describe('matches', () => {
    it('aceita campo nulo sem estourar (o bug original)', () => {
      // Antes: `null.toLowerCase()` -> TypeError
      expect(matches(null, 'carlos')).toBe(false)
      expect(matches(undefined, 'carlos')).toBe(false)
    })

    it('faz a comparação case-insensitive', () => {
      expect(matches('Carlos Eduardo', 'carlos')).toBe(true)
      expect(matches('MAT-00124', 'mat-')).toBe(true)
    })

    it('considera busca vazia como "todos"', () => {
      expect(matches('qualquer', '')).toBe(true)
      expect(matches(null, '')).toBe(true)
    })
  })
})