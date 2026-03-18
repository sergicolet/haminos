"use client"

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useChangeLogs } from '@/hooks/useAnnotations'
import type { User } from '@/lib/firebase'
import {
  IconSparkles,
  IconPlus,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconX,
} from '@tabler/icons-react'

interface ChangeLogPanelProps {
  sessionId: string
  user: User
}

export function ChangeLogPanel({ sessionId, user }: ChangeLogPanelProps) {
  const [collapsed, setCollapsed] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const { logs, addChangeLog, markAsApplied } = useChangeLogs(sessionId)

  const userInfo = {
    email: user.email || '',
    displayName: user.displayName || user.email || 'Usuario',
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSaving(true)
    await addChangeLog(title, description, userInfo, sessionId)
    setTitle('')
    setDescription('')
    setShowForm(false)
    setSaving(false)
  }

  const pendingLogs = logs.filter((l) => l.status === 'pending')
  const appliedLogs = logs.filter((l) => l.status === 'applied')

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold text-sm">
          <IconSparkles className="size-4" />
          Cambios aplicados
          {logs.length > 0 && (
            <span className="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {logs.length}
            </span>
          )}
        </div>
        {collapsed ? (
          <IconChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <IconChevronUp className="size-4 text-muted-foreground" />
        )}
      </button>

      {!collapsed && (
        <>
          {/* Logs list */}
          {logs.length > 0 && (
            <ScrollArea className="max-h-48">
              <div className="flex flex-col gap-2 pr-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border text-sm flex flex-col gap-1.5 transition-all ${
                      log.status === 'applied'
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-foreground">{log.title}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] py-0 ${
                            log.status === 'applied'
                              ? 'border-green-400 text-green-600'
                              : 'border-amber-400 text-amber-600'
                          }`}
                        >
                          {log.status === 'applied' ? '✓ Aplicado' : '⏳ Pendiente'}
                        </Badge>
                      </div>
                      {log.status === 'pending' && (
                        <button
                          onClick={() => markAsApplied(log.id, userInfo)}
                          className="shrink-0 flex items-center gap-1 text-[11px] text-green-600 hover:text-green-700 font-medium transition-colors"
                        >
                          <IconCheck className="size-3.5" />
                          Aplicar
                        </button>
                      )}
                    </div>
                    {log.description && (
                      <p className="text-muted-foreground leading-snug text-[13px]">{log.description}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      <span className="font-medium">{log.createdByName}</span>
                      {' · '}
                      {log.createdAt?.toDate
                        ? format(log.createdAt.toDate(), "d MMM yyyy, HH:mm", { locale: es })
                        : '—'}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Add form */}
          {showForm ? (
            <div className="flex flex-col gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
              <Input
                placeholder="Título del cambio..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-sm focus-visible:ring-green-400 h-8"
              />
              <Textarea
                placeholder="Descripción del cambio realizado (opcional)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[60px] resize-none text-sm focus-visible:ring-green-400"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setShowForm(false); setTitle(''); setDescription('') }}
                  className="h-7 px-2 text-muted-foreground"
                >
                  <IconX className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!title.trim() || saving}
                  className="h-7 bg-green-600 hover:bg-green-700 text-white gap-1.5"
                >
                  <IconCheck className="size-3.5" />
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(true)}
              className="self-start border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 gap-1.5"
            >
              <IconPlus className="size-3.5" />
              Registrar cambio
            </Button>
          )}
        </>
      )}
    </div>
  )
}
