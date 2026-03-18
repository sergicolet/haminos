"use client"

import { IconShoppingBag } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import type { CatalogBlock as CatalogBlockType } from "@/lib/types"

interface CatalogBlockProps {
  data: CatalogBlockType["data"]
}

export function CatalogBlock({ data }: CatalogBlockProps) {
  return (
    <div className="my-4 max-w-[280px]">
      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-center gap-3 bg-black hover:bg-zinc-800 text-white rounded-xl py-3 px-4 text-[13px] font-bold font-syne shadow-lg shadow-black/10 transition-all hover:scale-[1.02] active:scale-95"
      >
        <IconShoppingBag className="size-5" strokeWidth={2.5} />
        {data.label || "Ver catálogo completo"}
      </a>
    </div>
  )
}
