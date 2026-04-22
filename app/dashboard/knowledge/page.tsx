"use client"

import * as React from "react"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { IconEdit, IconTrash, IconPlus, IconLoader2, IconSearch, IconDatabase } from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface KnowledgeEntry {
  id: string;
  metadata: {
    text?: string;
    [key: string]: any;
  };
}

export default function KnowledgePage() {
  const [entries, setEntries] = React.useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<KnowledgeEntry | null>(null);
  const [formData, setFormData] = React.useState({ text: "", id: "" });
  const [saving, setSaving] = React.useState(false);

  const fetchEntries = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/knowledge");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEntries(data);
    } catch (error: any) {
      console.error(error);
      toast.error("Error al cargar el conocimiento: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleEdit = (entry: KnowledgeEntry) => {
    setEditingEntry(entry);
    setFormData({ 
      text: entry.metadata.text || "", 
      id: entry.id 
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingEntry(null);
    setFormData({ text: "", id: "" });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta entrada?")) return;
    
    try {
      const res = await fetch(`/api/knowledge?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      toast.success("Entrada eliminada correctamente");
      fetchEntries();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSave = async () => {
    if (!formData.text) return toast.error("El texto es obligatorio");
    
    setSaving(true);
    try {
      const method = editingEntry ? "PATCH" : "POST";
      const res = await fetch("/api/knowledge", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingEntry ? editingEntry.id : formData.id || undefined,
          text: formData.text,
          metadata: editingEntry?.metadata || {}
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al guardar");
      }
      
      toast.success(editingEntry ? "Entrada actualizada" : "Entrada creada");
      setIsDialogOpen(false);
      fetchEntries();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredEntries = entries.filter(entry => 
    entry.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry.metadata.text || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <SiteHeader title="Knowledge Base" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col gap-6 py-6 px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <IconDatabase className="size-5 text-[#c38692]" />
                <h2 className="text-2xl font-bold tracking-tight">Base de Conocimiento</h2>
              </div>
              <p className="text-muted-foreground">Gestiona la información que utiliza tu IA de Pinecone para responder a los usuarios.</p>
            </div>
            <Button onClick={handleAdd} className="bg-[#c38692] hover:bg-[#c38692]/90 text-white">
              <IconPlus className="mr-2 size-4" /> Nueva Entrada
            </Button>
          </div>

          <div className="flex items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar en el conocimiento..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[200px]">ID</TableHead>
                  <TableHead>Contenido</TableHead>
                  <TableHead className="w-[100px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <IconLoader2 className="size-8 animate-spin text-[#c38692]" />
                        <p>Cargando base de conocimiento...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <IconDatabase className="size-8 opacity-20" />
                        <p>{searchTerm ? "No se encontraron resultados para tu búsqueda." : "No hay información en la base de conocimiento."}</p>
                        {!searchTerm && (
                           <Button variant="outline" size="sm" onClick={handleAdd} className="mt-2">
                             Crear primera entrada
                           </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => (
                    <TableRow key={entry.id} className="group">
                      <TableCell className="font-mono text-[10px] text-muted-foreground">
                        <div className="truncate max-w-[180px]" title={entry.id}>
                          {entry.id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[600px]">
                          <p className="line-clamp-2 text-sm leading-relaxed">
                            {entry.metadata.text || <span className="italic text-muted-foreground">Sin contenido de texto</span>}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)} title="Editar">
                            <IconEdit className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(entry)} className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Eliminar">
                            <IconTrash className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingEntry ? <IconEdit className="size-5 text-[#c38692]" /> : <IconPlus className="size-5 text-[#c38692]" />}
              {editingEntry ? "Editar Entrada de Conocimiento" : "Nueva Entrada de Conocimiento"}
            </DialogTitle>
            <DialogDescription>
              La información que añadas será procesada vectorialmente para que la IA pueda consultarla durante las conversaciones.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {!editingEntry && (
              <div className="grid gap-2">
                <Label htmlFor="id" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Identificador Único (Opcional)</Label>
                <Input 
                  id="id" 
                  placeholder="Ej: horario_atencion, politicas_reembolso..." 
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  className="bg-muted/30"
                />
                <p className="text-[10px] text-muted-foreground">Si se deja vacío, se generará uno automáticamente.</p>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="text" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Contenido del Conocimiento</Label>
              <Textarea 
                id="text" 
                rows={12}
                placeholder="Escribe aquí la información detallada... (Ej: Nuestro horario es de Lunes a Viernes de 9:00 a 18:00)" 
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                className="resize-none focus-visible:ring-[#c38692]"
              />
              <p className="text-[10px] text-muted-foreground flex justify-between">
                <span>Sé lo más específico posible para mejores resultados.</span>
                <span>{formData.text.length} caracteres</span>
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#c38692] hover:bg-[#c38692]/90 text-white min-w-[120px]">
              {saving ? (
                <>
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                editingEntry ? "Actualizar Cambios" : "Guardar en Pinecone"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
