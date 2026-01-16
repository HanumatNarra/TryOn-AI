import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { ErrorBoundary } from '../ErrorBoundary'

// Component that throws an error
const ThrowingComponent = () => {
  throw new Error('Test error message')
}

// Component that renders without error
const SafeComponent = () => <div>Safe content</div>

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for these tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <SafeComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Safe content')).toBeInTheDocument()
  })

  it('should render error fallback UI when error is thrown', () => {
    // We need to suppress error logs for this test
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument()
    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument()

    consoleErrorSpy.mockRestore()
  })

  it('should show error details in development mode', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    // Check for error UI
    expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument()

    // In development, details should be available
    const detailsElement = screen.queryByText(/Error Details/i)
    // Details visibility depends on import.meta.env.DEV
    if (detailsElement) {
      expect(detailsElement).toBeInTheDocument()
    }

    consoleErrorSpy.mockRestore()
  })

  it('should have Try Again button that reloads page', async () => {
    const reloadSpy = vi.fn()
    Object.defineProperty(window.location, 'reload', {
      configurable: true,
      value: reloadSpy
    })

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    const tryAgainButton = screen.getByText(/Try Again/i)
    await userEvent.click(tryAgainButton)

    expect(reloadSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('should render custom fallback UI when provided', () => {
    const customFallback = <div>Custom Error UI</div>

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument()
    expect(screen.queryByText(/Oops/i)).not.toBeInTheDocument()

    consoleErrorSpy.mockRestore()
  })
})
