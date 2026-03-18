"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'

interface AuthContextType {
  user: any
  loading: boolean
  isAdmin: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const loading = status === 'loading'
  const router = useRouter()
  const pathname = usePathname()

  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (session?.user) {
      setUser(session.user)
      setIsAdmin(true) // En Haminos, asumimos que cualquier usuario con sesión es administrador por ahora
    } else {
      setUser(null)
      setIsAdmin(false)
      
      if (!loading && pathname.startsWith('/dashboard')) {
        router.push('/login')
      }
    }
  }, [session, loading, pathname, router])

  const logout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

