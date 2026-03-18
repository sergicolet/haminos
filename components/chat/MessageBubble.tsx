"use client"

import { useState } from 'react'
import { cn } from "@/lib/utils"
import { parseBlocks } from "@/lib/parseBlocks"
import { TrackingBlock } from "./blocks/TrackingBlock"
import { WhatsappBlock } from "./blocks/WhatsappBlock"
import { CatalogBlock } from "./blocks/CatalogBlock"
import { ProductBlock } from "./blocks/ProductBlock"
import { AnnotationDialog } from "@/components/reviews/AnnotationDialog"
import type { MessageBlock } from "@/lib/types"
import type { User } from '@/lib/firebase'
import { IconMessage2, IconBrandWhatsapp } from "@tabler/icons-react"

// Render text that may contain markdown links [label](url)
function RichText({ text }: { text: string }) {
  const parts = text.replace(/\\n/g, '\n').split(/(\[[^\]]+\]\([^)]+\))/g)
  return (
    <p className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (!match) return <span key={i}>{part}</span>
        const [, label, url] = match
        const isWhatsapp = url.includes('wa.me') || url.includes('whatsapp')
        if (isWhatsapp) {
          return (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 mt-2 px-3 py-2 rounded-xl text-white text-[12px] font-bold no-underline transition-all hover:scale-[1.02] active:scale-95"
              style={{ background: "#25D366", boxShadow: "0 4px 12px rgba(37,211,102,0.3)" }}
            >
              <IconBrandWhatsapp className="size-4 shrink-0" strokeWidth={2.5} />
              {label}
            </a>
          )
        }
        return (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="underline font-medium text-white/90 hover:text-white"
          >
            {label}
          </a>
        )
      })}
    </p>
  )
}

interface MessageBubbleProps {
  content: string
  isUser: boolean
  timestamp?: Date
  chatLogId?: string
  sessionId?: string
  currentUser?: User | null
  isAdmin?: boolean
  annotationCount?: number
  highlighted?: boolean
  hasOpenAnnotations?: boolean
}

function BlockRenderer({ block }: { block: MessageBlock }) {
  switch (block.type) {
    case "text":
      return <RichText text={block.data} />
    case "tracking":
      return <TrackingBlock data={block.data} />
    case "whatsapp":
      return <WhatsappBlock data={block.data} />
    case "catalog":
      return <CatalogBlock data={block.data} />
    case "product":
      return <ProductBlock data={block.data} />
    default:
      return null
  }
}

export function MessageBubble({
  content,
  isUser,
  timestamp,
  chatLogId,
  sessionId,
  currentUser,
  isAdmin = false,
  annotationCount = 0,
  highlighted = false,
  hasOpenAnnotations = false,
}: MessageBubbleProps) {
  const blocks = isUser ? [{ type: "text" as const, data: content }] : parseBlocks(content)
  const [dialogOpen, setDialogOpen] = useState(false)

  const canAnnotate = !!(chatLogId && sessionId && currentUser && !isUser)
  const preview = content.split('[').map(s => s.split(']').pop() || '').join('').trim().slice(0, 120)

  // Separate product blocks (rendered full-width) from inline blocks
  const inlineBlocks = blocks.filter(b => b.type !== 'product')
  const productBlocks = blocks.filter(b => b.type === 'product') as import('@/lib/types').ProductBlock[]

  const hasInline = inlineBlocks.length > 0
  const hasProducts = productBlocks.length > 0

  const bubbleClasses = cn(
    "relative max-w-[85%] min-w-0 rounded-2xl px-4 py-3 text-left transition-all duration-300 ease-out break-words overflow-hidden",
    isUser
      ? "bg-zinc-950 text-white rounded-br-none"
      : "bg-[#c38692] text-white rounded-bl-none",
    canAnnotate && "cursor-pointer hover:shadow-lg active:scale-[0.99] group/bubble",
    highlighted && "z-20 ring-2 ring-red-500 shadow-[0_0_25px_-5px_rgba(239,68,68,0.4)] scale-[1.02]"
  )

  const bubbleContent = (
    <>
      {inlineBlocks.map((block, index) => (
        <BlockRenderer key={index} block={block} />
      ))}
      {timestamp && !hasProducts && (
        <p className={cn("text-[10px] mt-2 font-medium", isUser ? "text-white/50" : "text-white/60")}>
          {timestamp.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
      {annotationCount > 0 && (
        <span className={cn(
          "absolute -top-2 -right-2 size-5 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-all",
          hasOpenAnnotations ? "bg-red-600 animate-pulse" : "bg-red-500"
        )}>
          {hasOpenAnnotations ? (annotationCount > 9 ? "9+" : annotationCount) : "✓"}
        </span>
      )}
      {canAnnotate && (
        <div className={cn(
          "absolute -bottom-2 flex items-center gap-1.5 px-2 py-1 rounded-full shadow-md transition-opacity duration-200",
          "opacity-0 group-hover/bubble:opacity-100 pointer-events-none bg-red-600 text-white",
          isUser ? "right-1" : "left-1"
        )}>
          <IconMessage2 className="size-3" />
          <span className="text-[9px] font-bold uppercase tracking-wider">
            {annotationCount > 0
              ? (hasOpenAnnotations ? "Corrección" : "Revisado")
              : "Anotar"
            }
          </span>
        </div>
      )}
    </>
  )

  return (
    <>
      <div className={cn("flex flex-col w-full group relative gap-2", isUser ? "items-end" : "items-start")}>
        {/* Inline bubble (text, tracking, etc.) */}
        {hasInline && (
          canAnnotate ? (
            <div
              role="button"
              tabIndex={0}
              className={bubbleClasses}
              onClick={() => setDialogOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setDialogOpen(true)
                }
              }}
              title="Haz clic para añadir una anotación"
            >
              {bubbleContent}
            </div>
          ) : (
            <div className={bubbleClasses}>{bubbleContent}</div>
          )
        )}

        {/* Product cards — full width, outside bubble */}
        {hasProducts && (
          <div className="w-full overflow-hidden rounded-2xl shadow-md p-3" style={{ background: "#c38692" }}>
            {productBlocks.map((b, i) => (
              <ProductBlock key={i} data={b.data} />
            ))}
            {timestamp && (
              <p className="text-[10px] mt-1 text-muted-foreground">
                {timestamp.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        )}
      </div>

      {canAnnotate && currentUser && (
        <AnnotationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          chatLogId={chatLogId!}
          sessionId={sessionId!}
          messagePreview={preview || content.slice(0, 120)}
          user={currentUser}
          isAdmin={isAdmin}
        />
      )}
    </>
  )
}
