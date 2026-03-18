"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { IconSparkles, IconSend, IconX } from "@tabler/icons-react"

interface ChangeLogSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (title: string, description: string) => Promise<void>
}

export function ChangeLogSheet({ open, onOpenChange, onSave }: ChangeLogSheetProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    await onSave(title.trim(), description.trim())
    setTitle("")
    setDescription("")
    setSaving(false)
    onOpenChange(false)
  }

  const handleClose = () => {
    setTitle("")
    setDescription("")
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[50vw] p-0 flex flex-col">

        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b bg-green-50 dark:bg-green-950/20 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <IconSparkles className="size-5" />
            Registrar nuevo cambio
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Documenta los cambios aplicados al chatbot para que todo el equipo esté al tanto.
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Título del cambio
            </label>
            <Input
              placeholder="ej: Actualización del prompt de ventas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="focus-visible:ring-green-400"
            />
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Descripción detallada
            </label>
            <Textarea
              placeholder={`Describe los cambios con el máximo detalle:\n\n- Qué se modificó\n- Por qué se hizo el cambio\n- Qué impacto se espera\n- Cualquier contexto relevante`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[320px] resize-y focus-visible:ring-green-400 flex-1"
              onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleSave() }}
            />
            <p className="text-[11px] text-muted-foreground">Ctrl + Enter para guardar</p>
          </div>
        </div>

        {/* Footer anchored at bottom */}
        <div className="px-6 py-4 border-t bg-background flex items-center justify-between gap-3 shrink-0">
          <Button variant="ghost" onClick={handleClose} className="text-muted-foreground gap-2">
            <IconX className="size-4" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            <IconSend className="size-4" />
            {saving ? "Guardando..." : "Guardar cambio"}
          </Button>
        </div>

      </SheetContent>
    </Sheet>
  )
}
