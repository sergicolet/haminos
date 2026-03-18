"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { IconMail, IconLock, IconLoader2, IconEye, IconEyeOff } from "@tabler/icons-react"
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export function LoginView() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password)
      const idToken = await result.user.getIdToken(true)

      const response = await signIn('credentials', { idToken, redirect: false })

      if (response?.error) {
        toast.error("Acceso denegado", { description: "Este usuario no tiene acceso al panel." })
      } else {
        toast.success("Bienvenido")
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error: any) {
      const code = error?.code
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        toast.error("Credenciales incorrectas", { description: "Email o contraseña no válidos." })
      } else {
        toast.error("Error al iniciar sesión", { description: error.message })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1 text-center pt-8 pb-4">
        <div className="mx-auto size-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
          <span className="text-2xl font-bold text-primary" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>H</span>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Haminos Admin</CardTitle>
        <CardDescription>Identifícate para entrar al entorno seguro</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="admin@haminos.com"
                className="pl-9 h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-9 pr-10 h-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="h-11 w-full mt-1" disabled={loading}>
            {loading ? <IconLoader2 className="size-4 animate-spin" /> : "Entrar"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="pb-6 pt-0">
        <p className="text-center text-xs text-muted-foreground w-full px-4">
          Solo usuarios autorizados en Firebase Authentication tienen acceso.
        </p>
      </CardFooter>
    </Card>
  )
}
