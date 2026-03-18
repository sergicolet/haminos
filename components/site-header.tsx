import * as React from "react"
import { IconRefresh } from "@tabler/icons-react"
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { SidebarTrigger } from "@/components/ui/sidebar"

interface SiteHeaderProps {
  title?: string
}

export function SiteHeader({ title = "Chatbot Analytics" }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex h-[--header-height] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[--header-height]">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/30 gap-1.5">
          <span className="size-1.5 rounded-full bg-primary inline-block animate-pulse" />
          En vivo
        </Badge>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <IconRefresh className="mr-2 size-4" />
            Actualizar
          </Button>
        </div>
      </div>
    </header>
  )
}
