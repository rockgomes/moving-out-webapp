import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { NavBar } from './NavBar'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signOut: vi.fn() },
  }),
}))

describe('NavBar', () => {
  it('renders the logo', () => {
    render(<NavBar />)
    expect(screen.getByText('MoveOutSale')).toBeInTheDocument()
  })

  it('shows login and signup buttons when no user', () => {
    render(<NavBar />)
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
  })

  it('shows user avatar and List Item button when logged in', () => {
    const mockUser = {
      id: '123',
      display_name: 'John Doe',
      avatar_url: null,
      facebook_id: null,
      city: null,
      state: null,
      zip_code: null,
      created_at: new Date().toISOString(),
    }
    render(<NavBar user={mockUser} />)
    expect(screen.getByLabelText('User menu')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /list item/i })).toBeInTheDocument()
  })
})
