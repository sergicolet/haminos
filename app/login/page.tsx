"use client"

import { LoginView } from '@/components/auth/LoginView'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { IconLoader2 } from '@tabler/icons-react'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <IconLoader2 className="size-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <LoginView />
    </main>
  )
}
