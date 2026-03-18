"use client"

import { IconBrandWhatsapp } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import type { WhatsappBlock as WhatsappBlockType } from "@/lib/types"

interface WhatsappBlockProps {
  data: WhatsappBlockType["data"]
}

export function WhatsappBlock({ data }: WhatsappBlockProps) {
  return (
    <div className="my-4 max-w-[280px] flex flex-col gap-2">
      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-xl py-3 px-4 text-[13px] font-bold font-syne shadow-lg shadow-green-500/20 transition-all hover:scale-[1.02] active:scale-95"
      >
        <IconBrandWhatsapp className="size-5" strokeWidth={2.5} />
        {data.label || "Escribinos por WhatsApp"}
      </a>
      {data.tiempo && (
        <div className="flex items-center gap-2 pl-1">
          <div className="size-1.5 rounded-full bg-green-500" />
          <span className="text-[11px] text-zinc-400 font-medium">
            {data.tiempo}
          </span>
        </div>
      )}
    </div>
  )
}
