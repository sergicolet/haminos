"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { IconMessage, IconSend, IconX, IconAlertTriangle, IconMessage2 } from "@tabler/icons-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AnnotationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (content: string, type: 'correction' | 'comment') => Promise<void>
}

export function AnnotationSheet({ open, onOpenChange, onSave }: AnnotationSheetProps) {
  const [content, setContent] = useState("")
  const [type, setType] = useState<'correction' | 'comment'>("comment")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!content.trim()) return
    setSaving(true)
    await onSave(content.trim(), type)
    setContent("")
    setType("comment")
    setSaving(false)
    onOpenChange(false)
  }

  const handleClose = () => {
    setContent("")
    setType("comment")
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[50vw] p-0 flex flex-col">

        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b bg-orange-50 dark:bg-orange-950/20 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <IconMessage className="size-5" />
            Añadir nueva anotación
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Registra una anotación general sobre el comportamiento del bot o puntos de mejora fuera de un chat específico.
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Tipo de anotación
            </label>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger className="w-full focus-visible:ring-orange-400">
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comment">
                  <div className="flex items-center gap-2">
                    <IconMessage2 className="size-4 text-orange-500" />
                    <span>Comentario / Mejora</span>
                  </div>
                </SelectItem>
                <SelectItem value="correction">
                  <div className="flex items-center gap-2">
                    <IconAlertTriangle className="size-4 text-red-500" />
                    <span>Corrección urgente</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Contenido de la anotación
            </label>
            <Textarea
              placeholder={`Describe aquí tu observación o sugerencia:\n\nej: "He notado que el bot a veces confunde los métodos de envío en el prompt general..."`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[320px] resize-y focus-visible:ring-orange-400 flex-1"
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
            disabled={!content.trim() || saving}
            className="bg-orange-600 hover:bg-orange-700 text-white gap-2 shadow-sm"
          >
            <IconSend className="size-4" />
            {saving ? "Guardando..." : "Guardar anotación"}
          </Button>
        </div>

      </SheetContent>
    </Sheet>
  )
}
