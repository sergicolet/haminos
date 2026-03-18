"use client"

import { useState, useRef, useEffect, type ReactNode } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageBubble } from "./MessageBubble"
import { ConversationNoteSection } from "@/components/reviews/ConversationNoteSection"
import { ChangeLogPanel } from "@/components/reviews/ChangeLogPanel"
import { parseBlocks } from "@/lib/parseBlocks"
import { IconMessage } from "@tabler/icons-react"
import { useSessionAnnotationCounts } from "@/hooks/useAnnotations"
import type { ChatLog } from "@/lib/types"
import type { User } from '@/lib/firebase'

interface ConversationPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string | null
  messages: ChatLog[]
  messagesLoading?: boolean
  currentUser?: User | null
  isAdmin?: boolean
  highlightId?: string | null
}

export function ConversationPanel({
  open,
  onOpenChange,
  sessionId,
  messages,
  messagesLoading = false,
  currentUser,
  isAdmin = false,
  highlightId = null,
}: ConversationPanelProps) {
  const categories = [...new Set(messages.map((m) => m.categoria))]

  // Real-time open annotation counts keyed by chatLogId
  const annotationCounts = useSessionAnnotationCounts(open ? sessionId : null)

  // Total open annotations for the header badge
  const totalOpen = Object.values(annotationCounts).reduce((acc, curr) => acc + curr.open, 0)

  // Scroll to highlighted message
  const highlightedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && highlightId && !messagesLoading && messages.length > 0) {
      // Small delay to ensure rendering is complete
      const timer = setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [open, highlightId, messagesLoading, messages.length])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col overflow-x-hidden">
        {/* ── Header ─────────────────────────────────────────── */}
        <SheetHeader className="p-0 border-b shrink-0">
          {/* Chat-style header — replicates the Shopify widget */}
          <div className="flex items-center gap-3 px-5 py-4 bg-zinc-950">
            <div className="relative size-10 rounded-full bg-black flex items-center justify-center shrink-0">
              <span className="text-base font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>H</span>
              <span className="absolute bottom-0.5 right-0.5 size-2.5 rounded-full bg-[#c38692] border-2 border-zinc-900" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-white text-base font-semibold tracking-widest uppercase" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Haminos AI
              </SheetTitle>
              <SheetDescription className="text-white/60 text-xs flex items-center gap-1.5 mt-0.5">
                <span className="size-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                En línea
              </SheetDescription>
            </div>
          </div>

          {/* Meta info bar */}
          <div className="px-4 py-2.5 flex items-center gap-2 flex-wrap bg-background">
            <span className="text-[10px] font-mono text-muted-foreground/60 truncate max-w-[200px]">
              {sessionId || "N/A"}
            </span>
            {messages.length > 0 && (
              <>
                <Badge variant="secondary" className="text-[10px]">{messages.length} mensajes</Badge>
                {categories.slice(0, 3).map((cat) => (
                  <Badge key={cat} variant="outline" className="capitalize text-[10px]">{cat}</Badge>
                ))}
                {totalOpen > 0 && (
                  <Badge variant="outline" className="border-red-400 text-red-600 bg-red-50 dark:bg-red-950/20 text-[10px]">
                    ⚠ {totalOpen} abierta{totalOpen !== 1 ? 's' : ''}
                  </Badge>
                )}
              </>
            )}
          </div>
        </SheetHeader>

        {/* ── Messages ────────────────────────────────────────── */}
        <ScrollArea data-conversation-scroll className="flex-1 conversation-scroll-area">
          {messagesLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-6">
              <div className="size-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Cargando mensajes...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-10 gap-3">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <IconMessage className="size-6" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-medium">No se encontraron mensajes</p>
                <p className="text-sm text-muted-foreground max-w-[200px]">
                  La conversación puede estar vacía o el ID de sesión es inválido.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'hidden', width: '100%' }} className="flex flex-col gap-12 px-4 py-12 min-w-0">
              {currentUser && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400">
                  <span>💬</span>
                  <span>Pasa el cursor sobre los mensajes del bot para añadir una anotación</span>
                </div>
              )}

              {messages.map((message, index) => {
                const showDate =
                  index === 0 ||
                  format(message.date.toDate(), "yyyy-MM-dd") !==
                    format(messages[index - 1].date.toDate(), "yyyy-MM-dd")

                const userContent = typeof message.chatInput === 'string' ? message.chatInput : String(message.chatInput || "")
                const botContent = typeof message.message === 'string' ? message.message : String(message.message || "")

                const renderBubbles = (content: string, isUser: boolean) => {
                  const blocks = isUser
                    ? [{ type: "text" as const, data: content }]
                    : parseBlocks(content)
                  const bubbles: ReactNode[] = []

                  blocks.forEach((block, bIdx) => {
                    if (block.type === "text") {
                      const lines = block.data.split("\n").filter((line) => line.trim() !== "")
                      lines.forEach((line, lIdx) => {
                        const isLast = bIdx === blocks.length - 1 && lIdx === lines.length - 1
                        bubbles.push(
                          <MessageBubble
                            key={`${isUser ? "u" : "b"}-${bIdx}-${lIdx}`}
                            content={line}
                            isUser={isUser}
                            timestamp={isLast ? message.date.toDate() : undefined}
                            chatLogId={message.id}
                            sessionId={message.session}
                            currentUser={currentUser}
                            isAdmin={isAdmin}
                            annotationCount={isLast ? (annotationCounts[message.id]?.total || 0) : 0}
                            hasOpenAnnotations={isLast ? (annotationCounts[message.id]?.open > 0) : false}
                            highlighted={message.id === highlightId}
                          />
                        )
                      })
                    } else {
                      const tag = `[${block.type.toUpperCase()}]${JSON.stringify(block.data)}[/${block.type.toUpperCase()}]`
                      const isLast = bIdx === blocks.length - 1
                      bubbles.push(
                        <MessageBubble
                          key={`${isUser ? "u" : "b"}-${bIdx}`}
                          content={tag}
                          isUser={isUser}
                          timestamp={isLast ? message.date.toDate() : undefined}
                          chatLogId={message.id}
                          sessionId={message.session}
                          currentUser={currentUser}
                          isAdmin={isAdmin}
                          annotationCount={isLast ? (annotationCounts[message.id]?.total || 0) : 0}
                          hasOpenAnnotations={isLast ? (annotationCounts[message.id]?.open > 0) : false}
                          highlighted={message.id === highlightId}
                        />
                      )
                    }
                  })

                  return bubbles
                }

                return (
                  <div
                    key={message.id}
                    ref={message.id === highlightId ? highlightedRef : null}
                    className="flex flex-col gap-8 w-full min-w-0"
                  >
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <Badge variant="secondary" className="text-xs">
                          {format(message.date.toDate(), "EEEE, d 'de' MMMM", { locale: es })}
                        </Badge>
                      </div>
                    )}
                    {/* User bubbles */}
                    <div className="flex flex-col gap-6 items-end w-full min-w-0">
                      {renderBubbles(userContent, true)}
                    </div>
                    {/* Bot bubbles */}
                    <div className="flex flex-col gap-6 items-start w-full min-w-0">
                      {renderBubbles(botContent, false)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* ── Review Panel ─────────────────────────────────────── */}
        {currentUser && sessionId && (
          <div className="border-t bg-zinc-50 dark:bg-zinc-950 p-5 flex flex-col gap-4">
            <ConversationNoteSection sessionId={sessionId} user={currentUser} />

            {isAdmin && (
              <>
                <div className="border-t border-dashed" />
                <ChangeLogPanel sessionId={sessionId} user={currentUser} />
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
