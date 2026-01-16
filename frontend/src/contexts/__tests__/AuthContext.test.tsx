import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { AuthProvider, useAuth } from '../AuthContext'
import * as supabaseModule from '../../lib/supabase'

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      onAuthStateChange: vi.fn()
    }
  }
}))

const TestComponent = () => {
  const { user, session, loading, signIn, signUp, signOut } = useAuth()

  return (
    <div>
      {loading ? (
        <div data-testid="loading">Loading...</div>
      ) : (
        <>
          <div data-testid="user-info">
            {user ? `User: ${user.email}` : 'No user'}
          </div>
          <button onClick={() => signIn('test@example.com', 'password')}>
            Sign In
          </button>
          <button onClick={() => signUp('test@example.com', 'password')}>
            Sign Up
          </button>
          <button onClick={signOut}>Sign Out</button>
        </>
      )}
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide initial loading state', async () => {
    const { supabase } = await import('../../lib/supabase')
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null })
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })

  it('should handle sign in successfully', async () => {
    const user = { email: 'test@example.com', id: '123' }
    const { supabase } = await import('../../lib/supabase')

    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null })
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user, session: {} },
      error: null
    })
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    })

    const signInButton = screen.getByText('Sign In')
    await userEvent.click(signInButton)

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    })
  })

  it('should handle sign out', async () => {
    const { supabase } = await import('../../lib/supabase')
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null })
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    })

    const signOutButton = screen.getByText('Sign Out')
    await userEvent.click(signOutButton)

    expect(supabase.auth.signOut).toHaveBeenCalled()
  })
})
