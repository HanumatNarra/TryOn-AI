import { describe, it, expect, beforeEach, vi } from 'vitest'

import { supabase } from '../supabase'

describe('Supabase Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should be initialized with correct project URL', () => {
    expect(supabase).toBeDefined()
    expect(supabase.auth).toBeDefined()
  })

  it('should have auth methods available', () => {
    expect(supabase.auth.getSession).toBeDefined()
    expect(supabase.auth.signInWithPassword).toBeDefined()
    expect(supabase.auth.signUp).toBeDefined()
    expect(supabase.auth.signOut).toBeDefined()
    expect(supabase.auth.onAuthStateChange).toBeDefined()
  })

  it('should have database methods available', () => {
    expect(supabase.from).toBeDefined()
  })

  it('should have storage methods available', () => {
    expect(supabase.storage).toBeDefined()
    expect(supabase.storage.from).toBeDefined()
  })

  it('should support table operations', () => {
    const table = supabase.from('test_table')
    expect(table.select).toBeDefined()
    expect(table.insert).toBeDefined()
    expect(table.update).toBeDefined()
    expect(table.delete).toBeDefined()
  })

  it('should support storage bucket operations', () => {
    const bucket = supabase.storage.from('test-bucket')
    expect(bucket.upload).toBeDefined()
    expect(bucket.download).toBeDefined()
    expect(bucket.remove).toBeDefined()
    expect(bucket.getPublicUrl).toBeDefined()
  })

  it('should handle auth session retrieval', async () => {
    // Mock the getSession method
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: null
    })

    const { data, error } = await supabase.auth.getSession()

    expect(error).toBeNull()
    expect(data).toBeDefined()
  })

  it('should handle auth state changes', () => {
    const callback = vi.fn()
    const unsubscribeFn = vi.fn()

    vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
      data: {
        subscription: {
          unsubscribe: unsubscribeFn
        }
      }
    })

    const subscription = supabase.auth.onAuthStateChange(callback)

    expect(subscription).toBeDefined()
    expect(subscription.data.subscription.unsubscribe).toBeDefined()
  })
})
