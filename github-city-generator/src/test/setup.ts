import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
})

// Mock global fetch for GitHub API calls
global.fetch = vi.fn()

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeEach(() => {
  console.error = vi.fn()
  console.warn = vi.fn()
})

afterEach(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})

// Mock setTimeout and other timers
vi.mock('setTimeout', () => vi.fn())
vi.mock('setInterval', () => vi.fn())
vi.mock('clearTimeout', () => vi.fn())
vi.mock('clearInterval', () => vi.fn())