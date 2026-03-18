"use client"

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMessageAnnotations } from '@/hooks/useAnnotations'
import type { User } from '@/lib/firebase'
import { IconAlertTriangle, IconMessage2, IconCheck, IconSend } from '@tabler/icons-react'

interface AnnotationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chatLogId: string
  sessionId: string
  messagePreview: string
  user: User
  isAdmin: boolean
}

export function AnnotationDialog({
  open,
  onOpenChange,
  chatLogId,
  sessionId,
  messagePreview,
  user,
  isAdmin,
}: AnnotationDialogProps) {
  const [content, setContent] = useState('')
  const [type, setType] = useState<'correction' | 'comment'>('correction')
  const [saving, setSaving] = useState(false)

  const { annotations, addAnnotation, resolveAnnotation } = useMessageAnnotations(
    open ? chatLogId : null
  )

  const userInfo = {
    email: user.email || '',
    displayName: user.displayName || user.email || 'Usuario',
  }

  const handleSubmit = async () => {
    if (!content.trim()) return
    setSaving(true)
    await addAnnotation(sessionId, content, type, userInfo)
    setContent('')
    setSaving(false)
    onOpenChange(false)
  }

  const openAnnotations = annotations.filter((a) => a.status === 'open')
  const resolvedAnnotations = annotations.filter((a) => a.status === 'resolved')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[50vw] p-0 flex flex-col">

        {/* ── Top: header + message preview ──────────────────── */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b bg-red-50 dark:bg-red-950/20 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <IconAlertTriangle className="size-5" />
            Anotar Mensaje
          </SheetTitle>
          <SheetDescription asChild>
            <div className="mt-2 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900 text-sm text-muted-foreground line-clamp-3 italic">
              "{messagePreview || '…'}"
            </div>
          </SheetDescription>
        </SheetHeader>

        {/* ── Middle: scrollable annotations list ─────────────── */}
        <ScrollArea className="flex-1 px-5 py-4">
          {annotations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Aún no hay anotaciones en este mensaje.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {openAnnotations.length} abiertas · {resolvedAnnotations.length} resueltas
              </p>
              {annotations.map((ann) => (
                <div
                  key={ann.id}
                  className={cn(
                    "p-3 rounded-xl border text-sm flex flex-col gap-1.5 transition-all shadow-sm",
                    ann.status === 'resolved'
                      ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                      : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900",
                    ann.type === 'correction' && "border-red-200 dark:border-red-900"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] py-0",
                          ann.type === 'correction'
                            ? 'border-red-400 text-red-600'
                            : 'border-orange-400 text-orange-600'
                        )}
                      >
                        {ann.type === 'correction' ? '⚠ Corrección' : '💬 Comentario'}
                      </Badge>
                      {ann.status === 'resolved' && (
                        <Badge variant="outline" className="text-[10px] py-0 border-green-400 text-green-600 bg-green-50 dark:bg-green-950/20">
                          ✓ Resuelto
                        </Badge>
                      )}
                    </div>
                    {isAdmin && ann.status === 'open' && (
                      <button
                        onClick={() => resolveAnnotation(ann.id, userInfo)}
                        className="shrink-0 flex items-center gap-1 text-[11px] text-green-600 hover:text-green-700 font-medium"
                      >
                        <IconCheck className="size-3.5" />
                        Resolver
                      </button>
                    )}
                  </div>
                  <p className="text-foreground leading-snug">{ann.content}</p>
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-medium">{ann.createdByName}</span>
                    {' · '}
                    {ann.createdAt?.toDate
                      ? format(ann.createdAt.toDate(), "d MMM yyyy, HH:mm", { locale: es })
                      : '—'}
                  </p>
                  {ann.status === 'resolved' && ann.resolvedByName && (
                    <p className="text-[11px] text-green-600">
                      Resuelto por <span className="font-medium">{ann.resolvedByName}</span>
                      {ann.resolvedAt?.toDate
                        ? ` · ${format(ann.resolvedAt.toDate(), "d MMM yyyy, HH:mm", { locale: es })}`
                        : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* ── Bottom: form anchored to footer ─────────────────── */}
        <div className="px-5 py-4 border-t bg-background flex flex-col gap-3 shrink-0">
          {/* Type toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setType('correction')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${type === 'correction'
                ? 'bg-red-600 text-white border-red-600'
                : 'border-border text-muted-foreground hover:border-red-300 hover:text-red-600'
                }`}
            >
              <IconAlertTriangle className="size-4" />
              Corrección
            </button>
            <button
              onClick={() => setType('comment')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${type === 'comment'
                ? 'bg-red-600 text-white border-red-600'
                : 'border-border text-muted-foreground hover:border-red-300 hover:text-red-600'
                }`}
            >
              <IconMessage2 className="size-4" />
              Comentario
            </button>
          </div>

          <Textarea
            placeholder={
              type === 'correction'
                ? 'Escribe la corrección... ej: "No tenemos tienda física"'
                : 'Escribe tu comentario sobre este mensaje...'
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[400px] resize-none focus-visible:ring-red-400"
            onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit() }}
          />

          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || saving}
            className="w-full bg-red-600 hover:bg-red-700 text-white gap-2"
          >
            <IconSend className="size-4" />
            {saving ? 'Guardando...' : 'Guardar anotación'}
          </Button>
        </div>

      </SheetContent>
    </Sheet>
  )
}
