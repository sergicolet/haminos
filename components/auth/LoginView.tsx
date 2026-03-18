"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { IconMail, IconBrandGoogle, IconLoader2, IconCircleCheck } from "@tabler/icons-react"
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  auth,
  googleProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInWithPopup
} from '@/lib/firebase'

export function LoginView() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [linkSent, setLinkSent] = useState(false)
  const [verifyingLink, setVerifyingLink] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined' && isSignInWithEmailLink(auth, window.location.href)) {
      setVerifyingLink(true)
      let emailForSignIn = window.localStorage.getItem('emailForSignIn')

      if (!emailForSignIn) {
        emailForSignIn = window.prompt('Por motivos de seguridad, por favor confirma el email con el que pediste el enlace:');
      }

      if (emailForSignIn) {
        signInWithEmailLink(auth, emailForSignIn, window.location.href)
          .then(async (result) => {
            window.localStorage.removeItem('emailForSignIn');
            const idToken = await result.user.getIdToken(true);

            const response = await signIn('credentials', {
              idToken,
              redirect: false,
            })

            if (response?.error) {
              toast.error("Acceso denegado", { description: "Estás logueado en Firebase, pero tu email no está en la colección 'users'." })
            } else {
              toast.success("Bienvenido", { description: "Autenticado con éxito sin contraseña." })
              router.push('/dashboard')
              router.refresh()
            }
          })
          .catch(() => {
            toast.error("Enlace no válido o caducado", { description: "Por favor vuelve a iniciar el proceso." })
          })
          .finally(() => {
            setVerifyingLink(false)
          })
      } else {
        setVerifyingLink(false)
      }
    }
  }, [router])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      const actionCodeSettings = {
        url: window.location.origin + '/login',
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email.trim(), actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email.trim());
      setLinkSent(true)
      toast.success("Enlace enviado", { description: "Busca en tu bandeja de entrada o spam." })

    } catch (error: any) {
      toast.error("Error al enviar enlace", { description: error.message || "No se ha podido enviar." })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true)
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken(true);

      const response = await signIn('credentials', {
        idToken,
        redirect: false,
      })

      if (response?.error) {
        toast.error("Acceso denegado", { description: "Tu cuenta de Google no tiene acceso configurado." })
      } else {
        toast.success("Bienvenido", { description: "Has iniciado sesión con Google." })
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error("Error con Google", { description: error.message || "Ha fallado el inicio." })
      }
    } finally {
      setLoadingGoogle(false)
    }
  }

  if (verifyingLink) {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <IconLoader2 className="size-10 animate-spin text-primary mb-4" />
          <h2 className="font-semibold text-lg">Verificando magic link...</h2>
          <p className="text-muted-foreground text-sm mt-2 text-center text-balance">
            Comprobando tu usuario y cruzando datos con la base de datos de Haminos...
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1 text-center pt-8 pb-4">
        <div className="mx-auto size-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
          <span className="text-2xl font-bold text-primary">H</span>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Haminos Admin</CardTitle>
        <CardDescription>
          Identifícate para entrar al entorno seguro
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-5">
        <Button
          variant="outline"
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || loadingGoogle}
          className="h-11 w-full"
        >
          {loadingGoogle ? (
            <IconLoader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <IconBrandGoogle className="mr-2 size-4" />
          )}
          Identificarse con Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">O acceder con Magic Link</span>
          </div>
        </div>

        {linkSent ? (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 text-center">
            <IconCircleCheck className="size-10 text-primary mx-auto mb-3" />
            <h3 className="font-medium mb-1">El email ya va de camino</h3>
            <p className="text-sm text-muted-foreground">Si autorizamos tu correo, te llegará un enlace para entrar directo a Haminos.</p>
          </div>
        ) : (
          <form onSubmit={handleEmailLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ejemplo@haminos.com"
                  className="pl-9 h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || loadingGoogle}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="h-11 w-full mt-1"
              disabled={loading || loadingGoogle}
            >
              {loading ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : (
                "Pedir enlace de acceso"
              )}
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="pb-6 pt-0">
        <p className="text-center text-xs text-muted-foreground w-full px-4">
          Tu cuenta debe existir en la base de datos interna de administradores (colección "users").
        </p>
      </CardFooter>
    </Card>
  )
}
