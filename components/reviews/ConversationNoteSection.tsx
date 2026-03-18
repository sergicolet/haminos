"use client"

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useConversationNotes } from '@/hooks/useAnnotations'
import type { User } from '@/lib/firebase'
import { IconNotes, IconSend, IconChevronDown, IconChevronUp } from '@tabler/icons-react'

interface ConversationNoteSectionProps {
  sessionId: string
  user: User
}

export function ConversationNoteSection({ sessionId, user }: ConversationNoteSectionProps) {
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [collapsed, setCollapsed] = useState(true)

  const { notes, addNote } = useConversationNotes(sessionId)

  const userInfo = {
    email: user.email || '',
    displayName: user.displayName || user.email || 'Usuario',
  }

  const handleSubmit = async () => {
    if (!content.trim()) return
    setSaving(true)
    await addNote(content, userInfo)
    setContent('')
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold text-sm">
          <IconNotes className="size-4" />
          Notas de conversación
          {notes.length > 0 && (
            <span className="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {notes.length}
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
          {/* Existing notes */}
          {notes.length > 0 && (
            <ScrollArea className="max-h-48">
              <div className="flex flex-col gap-2 pr-1">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-sm"
                  >
                    <p className="text-foreground leading-snug whitespace-pre-wrap">{note.content}</p>
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      <span className="font-medium">{note.createdByName}</span>
                      {' · '}
                      {note.createdAt?.toDate
                        ? format(note.createdAt.toDate(), "d MMM yyyy, HH:mm", { locale: es })
                        : '—'}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Add note form */}
          <Textarea
            placeholder="Añade una nota sobre esta conversación..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[72px] resize-none text-sm focus-visible:ring-red-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) handleSubmit()
            }}
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || saving}
            className="self-end bg-red-600 hover:bg-red-700 text-white gap-1.5"
          >
            <IconSend className="size-3.5" />
            {saving ? 'Guardando...' : 'Añadir nota'}
          </Button>
        </>
      )}
    </div>
  )
}
