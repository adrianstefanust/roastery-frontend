import { create } from 'zustand'
import Cookies from 'js-cookie'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isInitialized: boolean
  setUser: (user: User) => void
  setToken: (token: string) => void
  logout: () => void
  initialize: () => void
}

const parseJwt = (token: string): any => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Failed to parse JWT:', error)
    return null
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitialized: false,

  setUser: (user) => {
    set({ user })
  },

  setToken: (token) => {
    set({ token, isAuthenticated: !!token })
    // Store token in cookie (7 days)
    Cookies.set('auth_token', token, {
      expires: 7,
      sameSite: 'lax'
    })
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false })
    Cookies.remove('auth_token')
  },

  initialize: () => {
    const token = Cookies.get('auth_token')
    if (token) {
      set({ token, isAuthenticated: true })

      // Parse JWT to restore user info
      const tokenPayload = parseJwt(token)
      if (tokenPayload && tokenPayload.sub) {
        set({
          user: {
            id: tokenPayload.sub,
            email: tokenPayload.email || '',
            role: tokenPayload.role,
            tenant_id: tokenPayload.tenant_id,
            currency: tokenPayload.currency || 'USD',
            created_at: '',
            updated_at: ''
          },
          isInitialized: true
        })
      } else {
        set({ isInitialized: true })
      }
    } else {
      set({ isInitialized: true })
    }
  }
}))
