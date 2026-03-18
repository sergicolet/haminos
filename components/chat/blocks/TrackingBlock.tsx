"use client"

import { IconCopy, IconExternalLink, IconPackage } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import type { TrackingBlock as TrackingBlockType } from "@/lib/types"

interface TrackingBlockProps {
  data: TrackingBlockType["data"]
}

export function TrackingBlock({ data }: TrackingBlockProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(data.code)
    toast.success("Código copiado")
  }

  return (
    <div className="my-4 bg-white border-[1.5px] border-zinc-200 rounded-[14px] p-4 max-w-[280px] shadow-sm flex flex-col gap-3 text-zinc-900">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="size-8 bg-black rounded-lg flex items-center justify-center shrink-0">
          <IconPackage className="size-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-[13px] leading-tight font-syne">{data.carrier || "Envío en camino"}</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[11px] text-green-600 font-medium">En camino</span>
          </div>
        </div>
      </div>

      {/* Message */}
      <p className="text-[12px] leading-relaxed text-zinc-600">
        {data.message || "Tu pedido ya está en camino. Rastrealo con este código:"}
      </p>

      {/* Code Area */}
      <div className="bg-zinc-100 rounded-xl p-2.5 flex items-center justify-between gap-2 border border-zinc-200/50">
        <span className="font-mono text-[12px] font-bold tracking-wider truncate uppercase pl-1">
          {data.code}
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={(e) => {
            e.stopPropagation()
            handleCopy()
          }}
          className="size-8 rounded-lg bg-black hover:bg-zinc-800 text-white shrink-0 shadow-sm transition-transform active:scale-95"
        >
          <IconCopy className="size-3.5" strokeWidth={2.5} />
          <span className="sr-only">Copiar código</span>
        </Button>
      </div>

      {/* Action Link */}
      {data.url && (
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center gap-2 bg-black hover:bg-zinc-800 text-white rounded-xl py-2.5 px-4 text-[12px] font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-black/10"
        >
          <IconExternalLink className="size-3.5" strokeWidth={2.5} />
          Rastrear en {data.carrier || "el sitio"}
        </a>
      )}
    </div>
  )
}
