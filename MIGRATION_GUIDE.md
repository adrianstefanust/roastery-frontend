# Nuxt/Vue → React/Next.js Migration Guide

## ✅ Migration Status

This project has been migrated from:
- **Nuxt 4 + Vue 3 + Nuxt UI** → **Next.js 15 + React 19 + shadcn/ui**

## Project Structure Comparison

### Before (Nuxt/Vue)
```
roastery-frontend/
├── pages/              # Auto-routed Vue pages
├── layouts/            # Vue layouts
├── composables/        # Vue composables
├── stores/             # Pinia stores
├── middleware/         # Nuxt middleware
├── types/              # TypeScript types
└── assets/css/         # Tailwind CSS
```

### After (Next.js/React)
```
roastery-frontend-react/
├── app/                # App Router pages & layouts
├── components/         # React components (shadcn/ui)
├── lib/
│   ├── hooks/          # React hooks (from composables)
│   ├── stores/         # Zustand stores (from Pinia)
│   └── config/         # Configuration
├── types/              # TypeScript types (same)
└── middleware.ts       # Next.js middleware
```

## Key Technology Migrations

| Nuxt/Vue | Next.js/React |
|----------|---------------|
| Nuxt 4 | Next.js 15 |
| Vue 3 | React 19 |
| Nuxt UI v4 | shadcn/ui |
| Pinia | Zustand |
| Vue Composables | React Hooks |
| Nuxt Middleware | Next.js Middleware |
| `useRouter()` | `useRouter()` from next/navigation |
| `useCookie()` | `js-cookie` |
| `useToast()` | `sonner` |
| `$fetch` | `fetch` API |

## Installed Dependencies

```json
{
  "dependencies": {
    "next": "^16.1.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "latest",
    "date-fns": "latest",
    "zod": "latest",
    "lucide-react": "latest",
    "js-cookie": "latest",
    "sonner": "latest",
    "@radix-ui/*": "various (from shadcn)"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "@types/js-cookie": "latest",
    "typescript": "latest",
    "tailwindcss": "latest",
    "eslint": "latest",
    "eslint-config-next": "latest"
  }
}
```

## Migration Mappings

### 1. State Management (Pinia → Zustand)

**Before (Pinia):**
```typescript
// stores/auth.ts
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)

  const setUser = (newUser: User) => {
    user.value = newUser
  }

  return { user, token, setUser }
})
```

**After (Zustand):**
```typescript
// lib/stores/auth-store.ts
import { create } from 'zustand'

interface AuthState {
  user: User | null
  token: string | null
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user })
}))
```

### 2. Composables → React Hooks

**Before (Vue Composable):**
```typescript
// composables/useAuth.ts
export const useAuth = () => {
  const authStore = useAuthStore()
  const router = useRouter()

  const login = async (email: string, password: string) => {
    // ...
  }

  return { login }
}
```

**After (React Hook):**
```typescript
// lib/hooks/use-auth.ts
import { useAuthStore } from '@/lib/stores/auth-store'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()

  const login = async (email: string, password: string) => {
    // ...
  }

  return { login }
}
```

### 3. Pages (Vue SFC → React TSX)

**Before (Vue SFC):**
```vue
<!-- pages/login.vue -->
<template>
  <div>
    <UCard>
      <form @submit.prevent="onSubmit">
        <UFormField label="Email">
          <UInput v-model="email" />
        </UFormField>
        <UButton type="submit">Login</UButton>
      </form>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

const email = ref('')
const { login } = useAuth()

const onSubmit = async () => {
  await login(email.value, password.value)
}
</script>
```

**After (React TSX):**
```tsx
// app/login/page.tsx
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/hooks/use-auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(email, password)
  }

  return (
    <div>
      <Card>
        <form onSubmit={onSubmit}>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit">Login</Button>
        </form>
      </Card>
    </div>
  )
}
```

### 4. Layouts (Vue → React)

**Before (Vue Layout):**
```vue
<!-- layouts/dashboard.vue -->
<template>
  <div>
    <header>
      <nav>...</nav>
    </header>
    <main>
      <slot />
    </main>
  </div>
</template>
```

**After (React Layout):**
```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <header>
        <nav>...</nav>
      </header>
      <main>{children}</main>
    </div>
  )
}
```

### 5. Middleware

**Before (Nuxt Middleware):**
```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})
```

**After (Next.js Middleware):**
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}
```

### 6. Component Library Mapping

| Nuxt UI Component | shadcn/ui Component |
|-------------------|---------------------|
| `<UButton>` | `<Button>` |
| `<UInput>` | `<Input>` |
| `<UCard>` | `<Card>` |
| `<UFormField>` | `<Label>` + error handling |
| `<UAlert>` | `<Alert>` |
| `<UBadge>` | `<Badge>` |
| `<UAvatar>` | `<Avatar>` |
| `<UProgress>` | `<Progress>` |
| `<UAccordion>` | `<Accordion>` |
| `<UCheckbox>` | `<Checkbox>` |
| `<URadioGroup>` | `<RadioGroup>` |
| `<UToggle>` | `<Switch>` |
| `<UTextarea>` | `<Textarea>` |
| `<USelect>` | `<Select>` |
| `<UIcon>` | `lucide-react` icons |
| `useToast()` | `sonner` |

## Directory Structure

```
roastery-frontend-react/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page (/)
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── register/
│   │   └── page.tsx            # Register page
│   └── dashboard/
│       ├── layout.tsx          # Dashboard layout
│       ├── page.tsx            # Dashboard home
│       ├── inventory/
│       │   ├── lots/
│       │   │   ├── page.tsx    # Lots list
│       │   │   └── [id]/
│       │   │       └── page.tsx # Lot detail
│       │   └── grn/
│       │       └── page.tsx    # GRN form
│       └── users/
│           └── page.tsx        # Users management
├── components/
│   └── ui/                     # shadcn/ui components
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       └── ...
├── lib/
│   ├── hooks/
│   │   ├── use-auth.ts         # Auth hook
│   │   └── use-inventory.ts    # Inventory hook
│   ├── stores/
│   │   ├── auth-store.ts       # Auth Zustand store
│   │   └── inventory-store.ts  # Inventory Zustand store
│   ├── config/
│   │   └── env.ts              # Environment config
│   └── utils.ts                # Utility functions
├── types/
│   ├── api.ts                  # API types
│   ├── models.ts               # Data models
│   └── index.ts                # Type exports
├── middleware.ts               # Next.js middleware
├── .env.local                  # Environment variables
└── tailwind.config.ts          # Tailwind configuration
```

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_BASE=http://localhost:8080
```

## Component Prop Mapping Examples

### Button Props

| Nuxt UI | shadcn/ui |
|---------|-----------|
| `leading-icon="i-heroicons-user"` | `<Button><User className="mr-2 h-4 w-4" />Text</Button>` |
| `color="primary"` | `variant="default"` |
| `color="error"` | `variant="destructive"` |
| `variant="outline"` | `variant="outline"` |
| `size="lg"` | `size="lg"` |
| `block` | `className="w-full"` |
| `:loading="true"` | `disabled={isLoading}` + custom spinner |

### Input Props

| Nuxt UI | shadcn/ui |
|---------|-----------|
| `v-model="value"` | `value={value} onChange={(e) => setValue(e.target.value)}` |
| `leading-icon="i-heroicons-envelope"` | Wrap with `<div className="relative">` + icon |
| `type="email"` | `type="email"` |
| `placeholder="..."` | `placeholder="..."` |

## Migration Checklist

### Phase 1: Setup ✅
- [x] Create Next.js 15 project
- [x] Install shadcn/ui
- [x] Install dependencies (Zustand, date-fns, zod, etc.)
- [x] Set up TypeScript configuration
- [x] Configure Tailwind CSS

### Phase 2: Core Infrastructure ✅
- [x] Migrate types (api.ts, models.ts)
- [x] Create environment configuration
- [x] Create Zustand stores (auth)
- [x] Create React hooks (useAuth)
- [x] Set up middleware

### Phase 3: Authentication Pages 🔄
- [x] Create login page
- [x] Create register page
- [ ] Test authentication flow
- [ ] Add form validation with zod

### Phase 4: Dashboard 🔄
- [x] Create dashboard layout
- [x] Create dashboard home page
- [ ] Add statistics cards
- [ ] Add quick actions

### Phase 5: Feature Pages ⏳
- [ ] Migrate inventory pages
- [ ] Migrate production pages
- [ ] Migrate finance pages
- [ ] Migrate users page

### Phase 6: Polish ⏳
- [ ] Add loading states
- [ ] Add error boundaries
- [ ] Implement responsive design
- [ ] Add animations
- [ ] Update documentation

## Running the Project

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Production
```bash
npm start
```

## Key Differences to Remember

1. **Client Components**: Pages using hooks must have `'use client'` directive
2. **Server Components**: By default, components are server components
3. **Routing**: File-system based in `app/` directory
4. **Layouts**: Nested layouts using `layout.tsx` files
5. **Metadata**: Export `metadata` object or `generateMetadata` function
6. **Data Fetching**: Use React Server Components for server-side data fetching
7. **State**: Use Zustand for global state, `useState` for local state
8. **Effects**: Use `useEffect` instead of Vue lifecycle hooks
9. **Refs**: Use `useRef` instead of Vue `ref`
10. **Computed**: Use `useMemo` instead of Vue `computed`

## Troubleshooting

### Common Issues

**Issue**: "use client" directive missing
**Solution**: Add `'use client'` at the top of components using hooks

**Issue**: Hydration errors
**Solution**: Ensure client and server render the same initial UI

**Issue**: Middleware not running
**Solution**: Check `matcher` config in middleware.ts

**Issue**: Cookies not working
**Solution**: Ensure `js-cookie` is installed and used correctly

## Next Steps

1. Complete authentication flow testing
2. Migrate remaining pages from Vue to React
3. Add missing features (mobile menu, loading states, etc.)
4. Set up error boundaries
5. Implement comprehensive testing
6. Deploy to production

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [React Documentation](https://react.dev/)

---

**Migration Date**: 2026-01-19
**Next.js Version**: 15.1.3
**React Version**: 19.0.0
**shadcn/ui Version**: Latest (3.7.0)
