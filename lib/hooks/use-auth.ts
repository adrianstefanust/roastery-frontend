import { useAuthStore } from '@/lib/stores/auth-store'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { env } from '@/lib/config/env'

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
    return {}
  }
}

export function useAuth() {
  const router = useRouter()
  const { user, token, isAuthenticated, setUser, setToken, logout: storeLogout } = useAuthStore()

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${env.apiBase}/api/v1/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw { status: response.status, data: error }
      }

      const data: { token: string } = await response.json()

      // Store token
      setToken(data.token)

      // Parse JWT to get user info
      const tokenPayload = parseJwt(data.token)
      setUser({
        id: tokenPayload.sub,
        email,
        role: tokenPayload.role,
        tenant_id: tokenPayload.tenant_id,
        created_at: '',
        updated_at: ''
      })

      toast.success('Login successful', {
        description: 'Welcome back!'
      })

      return { success: true }
    } catch (error: any) {
      let errorMessage = 'An error occurred during login'

      // Handle network errors (fetch failures)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = 'Network error: Could not connect to server. Please check if the API is running.'
      } else if (error.status === 401) {
        errorMessage = 'Invalid email or password'
      } else if (error.status === 400) {
        errorMessage = 'Please check your input and try again'
      } else if (error.data && error.data.error) {
        errorMessage = error.data.error
      }

      toast.error('Login failed', {
        description: errorMessage
      })

      return { success: false, error: errorMessage }
    }
  }

  const register = async (
    companyName: string,
    email: string,
    password: string
  ) => {
    try {
      const response = await fetch(`${env.apiBase}/api/v1/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_name: companyName,
          email,
          password
        })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw { status: response.status, data: error }
      }

      toast.success('Registration successful', {
        description: 'Please sign in with your credentials'
      })

      return { success: true }
    } catch (error: any) {
      let errorMessage = 'An error occurred during registration'

      if (error.status === 409) {
        errorMessage = 'This email is already registered'
      } else if (error.status === 400) {
        errorMessage = error.data?.error || 'Please check your input'
      }

      toast.error('Registration failed', {
        description: errorMessage
      })

      return { success: false, error: errorMessage }
    }
  }

  const logout = async () => {
    storeLogout()

    toast.info('Logged out', {
      description: 'You have been logged out successfully'
    })

    router.push('/login')
  }

  // Role checks
  const hasRole = (...roles: string[]) => {
    return user?.role ? roles.includes(user.role) : false
  }

  const isAdmin = hasRole('OWNER', 'SUPERADMIN')
  const isAccountant = hasRole('ACCOUNTANT', 'OWNER', 'SUPERADMIN')
  const isRoaster = hasRole('ROASTER', 'OWNER', 'SUPERADMIN')

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
    hasRole,
    isAdmin,
    isAccountant,
    isRoaster
  }
}
