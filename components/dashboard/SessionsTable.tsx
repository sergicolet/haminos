"use client"

import * as React from "react"
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDownload,
  IconEye,
  IconSearch,
  IconFilter,
  IconX,
  IconSparkles,
} from "@tabler/icons-react"
import { format, differenceInSeconds } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import type { Session } from "@/lib/types"
import type { DateRange } from "react-day-picker"

interface SessionsTableProps {
  sessions: Session[]
  loading?: boolean
  onViewConversation: (sessionId: string) => void
  filters: {
    dateRange?: { from: Date; to: Date }
    category?: string
    intention?: string
    searchQuery?: string
  }
  onFiltersChange: (filters: SessionsTableProps["filters"]) => void
  categories: string[]
  intentions: string[]
}

const ITEMS_PER_PAGE = 10

export function SessionsTable({
  sessions,
  loading,
  onViewConversation,
  filters,
  onFiltersChange,
  categories,
  intentions,
}: SessionsTableProps) {
  const [page, setPage] = React.useState(0)
  const [searchInput, setSearchInput] = React.useState(filters.searchQuery || "")
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    filters.dateRange ? { from: filters.dateRange.from, to: filters.dateRange.to } : undefined
  )
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [analyzing, setAnalyzing] = React.useState(false)

  const totalPages = Math.ceil(sessions.length / ITEMS_PER_PAGE)
  const paginatedSessions = sessions.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  )

  const handleSearch = React.useCallback(() => {
    onFiltersChange({ ...filters, searchQuery: searchInput })
    setPage(0)
  }, [filters, onFiltersChange, searchInput])

  const handleCategoryChange = (value: string) => {
    onFiltersChange({ ...filters, category: value })
    setPage(0)
  }

  const handleIntentionChange = (value: string) => {
    onFiltersChange({ ...filters, intention: value })
    setPage(0)
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    if (range?.from && range?.to) {
      onFiltersChange({ ...filters, dateRange: { from: range.from, to: range.to } })
      setPage(0)
    }
  }

  const clearFilters = () => {
    setSearchInput("")
    setDateRange(undefined)
    onFiltersChange({})
    setPage(0)
  }

  const exportCSV = () => {
    const headers = ["Session ID", "Mensajes", "Primera Interaccion", "Ultima Interaccion", "Categorias"]
    const rows = sessions.map((s) => [
      s.sessionId,
      s.messageCount,
      format(s.firstInteraction, "yyyy-MM-dd HH:mm"),
      format(s.lastInteraction, "yyyy-MM-dd HH:mm"),
      s.categories.join("; "),
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `haminos_sessions_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`
    link.click()
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedSessions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedSessions.map((s) => s.sessionId)))
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleAnalyzeSelected = async () => {
    if (selectedIds.size === 0) return
    setAnalyzing(true)
    try {
      const res = await fetch("/api/ai/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "manual_selection",
          sessionIds: Array.from(selectedIds),
        }),
      })
      if (!res.ok) throw new Error("Error al iniciar el análisis")
      toast.success("Análisis iniciado", {
        description: "La IA está procesando las conversaciones seleccionadas. El reporte aparecerá en el historial en breve.",
      })
      setSelectedIds(new Set())
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const hasActiveFilters = filters.searchQuery || filters.category || filters.intention || filters.dateRange

  return (
    <div className="flex flex-col gap-4">
      {/* Filters Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por texto o session ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>

          {/* Category Filter */}
          <Select value={filters.category || "all"} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat} className="capitalize">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Intention Filter */}
          <Select value={filters.intention || "all"} onValueChange={handleIntentionChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Intencion" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {intentions.map((int) => (
                <SelectItem key={int} value={int} className="capitalize">
                  {int}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                <IconFilter className="mr-2 size-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM", { locale: es })} -{" "}
                      {format(dateRange.to, "dd/MM", { locale: es })}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy", { locale: es })
                  )
                ) : (
                  "Rango de fechas"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <IconX className="mr-1 size-4" />
              Limpiar
            </Button>
          )}
        </div>

        {/* Actions Row */}
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={handleAnalyzeSelected}
              disabled={analyzing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <IconSparkles className="size-4" />
              {analyzing ? "Analizando..." : `Analizar ${selectedIds.size} seleccionadas`}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <IconDownload className="mr-2 size-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted text-xs uppercase tracking-wider">
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedIds.size === paginatedSessions.length && paginatedSessions.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Categorias</TableHead>
              <TableHead className="text-center">Duracion</TableHead>
              <TableHead className="text-center">Mensajes</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="animate-pulse bg-muted rounded h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No se encontraron sesiones
                </TableCell>
              </TableRow>
                        ) : (
              paginatedSessions.map((session) => {
                const diffSeconds = differenceInSeconds(session.lastInteraction, session.firstInteraction)
                const mins = Math.floor(diffSeconds / 60)
                const secs = diffSeconds % 60
                const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`

                return (
                  <TableRow key={session.sessionId}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(session.sessionId)}
                        onCheckedChange={() => toggleSelect(session.sessionId)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {format(session.lastInteraction, "dd/MM/yyyy HH:mm", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {session.categories?.slice(0, 2).map((cat) => (
                          <Badge key={cat} variant="outline" className="capitalize text-[10px] px-1.5 py-0 h-5">
                            {cat}
                          </Badge>
                        ))}
                        {session.categories?.length > 2 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                            +{session.categories.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {durationStr}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-bold">{session.messageCount}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewConversation(session.sessionId)}
                        className="h-8 px-2"
                      >
                        <IconEye className="mr-1 size-3" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-muted-foreground text-sm">
          Mostrando {sessions.length > 0 ? page * ITEMS_PER_PAGE + 1 : 0} a{" "}
          {Math.min((page + 1) * ITEMS_PER_PAGE, sessions.length)} de {sessions.length} sesiones
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setPage(0)}
            disabled={page === 0}
          >
            <IconChevronsLeft className="size-4" />
            <span className="sr-only">Primera pagina</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <IconChevronLeft className="size-4" />
            <span className="sr-only">Pagina anterior</span>
          </Button>
          <span className="text-sm font-medium">
            {page + 1} / {Math.max(1, totalPages)}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            <IconChevronRight className="size-4" />
            <span className="sr-only">Siguiente pagina</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setPage(totalPages - 1)}
            disabled={page >= totalPages - 1}
          >
            <IconChevronsRight className="size-4" />
            <span className="sr-only">Ultima pagina</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
