"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { SiteHeader } from "@/components/site-header"
import { SessionsTable } from "@/components/dashboard/SessionsTable"
import { ConversationPanel } from "@/components/chat/ConversationPanel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useChatLogs } from "@/hooks/useChatLogs"
import { useAuth } from "@/components/auth/AuthProvider"
import { useAllAnnotations, useChangeLogs } from "@/hooks/useAnnotations"
import {
  IconAlertTriangle,
  IconCheck,
  IconSparkles,
  IconPlus,
  IconX,
  IconExternalLink,
  IconFilter,
  IconSearch,
  IconMessage,
  IconClipboardList,
} from "@tabler/icons-react"
import { ChangeLogSheet } from "@/components/reviews/ChangeLogSheet"
import { AnnotationSheet } from "@/components/reviews/AnnotationSheet"

type Tab = "conversaciones" | "revisiones"
type AnnFilter = "all" | "open" | "resolved"

export default function ConversationsPage() {
  const { user, isAdmin } = useAuth()
  const [tab, setTab] = React.useState<Tab>("conversaciones")

  // ── Conversations tab state ─────────────────────────────────────
  const [filters, setFilters] = React.useState<{
    dateRange?: { from: Date; to: Date }
    category?: string
    intention?: string
    searchQuery?: string
    timeRange: "7d" | "30d" | "thisMonth" | "thisWeek" | "custom"
  }>({ timeRange: "7d" })

  const [selectedSession, setSelectedSession] = React.useState<string | null>(null)
  const [panelOpen, setPanelOpen] = React.useState(false)
  const [sessionMessages, setSessionMessages] = React.useState<import('@/lib/types').ChatLog[]>([])
  const [messagesLoading, setMessagesLoading] = React.useState(false)
  const [highlightedMessageId, setHighlightedMessageId] = React.useState<string | null>(null)

  const { loading, sessions, getSessionMessages } = useChatLogs(filters)

  const handleViewConversation = async (sessionId: string, highlightedId?: string) => {
    setSelectedSession(sessionId)
    setHighlightedMessageId(highlightedId || null)
    setSessionMessages([])
    setMessagesLoading(true)
    setPanelOpen(true)
    const msgs = await getSessionMessages(sessionId)
    setSessionMessages(msgs)
    setMessagesLoading(false)
  }

  const allCategories = React.useMemo(() => {
    const cats = new Set<string>()
    sessions().forEach((s) => s.categories.forEach((c) => cats.add(c)))
    return Array.from(cats)
  }, [sessions])

  const allIntentions = React.useMemo(() => ["informacion", "comprar", "reclamar", "objecion"], [])

  // ── Reviews tab state ───────────────────────────────────────────
  const [annFilter, setAnnFilter] = React.useState<AnnFilter>("all")
  const [search, setSearch] = React.useState("")
  const [viewFilter, setViewFilter] = React.useState<"all" | "annotations" | "changelog">("all")

  // ChangeLog & Annotation forms
  const [showForm, setShowForm] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [expandedLogId, setExpandedLogId] = React.useState<string | null>(null)
  const [changeLogSheetOpen, setChangeLogSheetOpen] = React.useState(false)
  const [annotationSheetOpen, setAnnotationSheetOpen] = React.useState(false)

  const { annotations, loading: annLoading, resolveAnnotation, addAnnotation } = useAllAnnotations()
  const { logs, loading: logLoading, addChangeLog, markAsApplied } = useChangeLogs()

  const userInfo = React.useMemo(
    () => ({
      email: user?.email || "",
      displayName: user?.displayName || user?.email || "Usuario",
    }),
    [user]
  )

  const filteredAnnotations = React.useMemo(() => {
    return annotations.filter((a) => {
      const matchFilter = annFilter === "all" || a.status === annFilter
      const searchLow = search.toLowerCase()
      const matchSearch =
        !search ||
        a.content.toLowerCase().includes(searchLow) ||
        a.createdByName.toLowerCase().includes(searchLow) ||
        (a.sessionId && a.sessionId.toLowerCase().includes(searchLow))
      return matchFilter && matchSearch
    })
  }, [annotations, annFilter, search])

  const filteredLogs = React.useMemo(() => {
    return logs.filter((l) => {
      const searchLow = search.toLowerCase()
      return (
        !search ||
        l.title.toLowerCase().includes(searchLow) ||
        l.description.toLowerCase().includes(searchLow) ||
        l.createdByName.toLowerCase().includes(searchLow)
      )
    })
  }, [logs, search])

  const openCount = annotations.filter((a) => a.status === "open").length
  const pendingLogs = logs.filter((l) => l.status === "pending").length

  const handleAddLog = async (t: string, d: string) => {
    await addChangeLog(t, d, userInfo)
  }

  const handleAddAnnotation = async (content: string, type: 'correction' | 'comment') => {
    await addAnnotation(content, type, userInfo)
  }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <>
      <SiteHeader title="Conversaciones" />
      <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden max-w-full">
        <div className="flex flex-col gap-0 py-4 px-2 lg:px-4 w-full max-w-full">

          {/* Page heading */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold tracking-tight">Historial de Mensajes</h2>
            <p className="text-muted-foreground text-sm">
              Consulta conversaciones y gestiona las revisiones del chatbot.
            </p>
          </div>

          {/* ── Main tab bar ────────────────────────────────────── */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl w-full mb-4 border">
            <button
              onClick={() => setTab("conversaciones")}
              className={`flex flex-1 items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === "conversaciones"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconMessage className="size-4" />
              Conversaciones
            </button>
            <button
              onClick={() => setTab("revisiones")}
              className={`flex flex-1 items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === "revisiones"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconClipboardList className="size-4" />
              Revisiones
              {openCount > 0 && (
                <span className="bg-red-100 dark:bg-red-900/40 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {openCount}
                </span>
              )}
            </button>
          </div>

          {/* ══ CONVERSACIONES TAB ════════════════════════════════ */}
          {tab === "conversaciones" && (
            <SessionsTable
              sessions={sessions()}
              loading={loading}
              onViewConversation={handleViewConversation}
              filters={filters}
              onFiltersChange={setFilters as any}
              categories={allCategories || []}
              intentions={allIntentions}
            />
          )}

          {/* ══ REVISIONES TAB ═══════════════════════════════════ */}
          {tab === "revisiones" && (
            <div className="flex flex-col gap-5 w-full">

              {/* ── Single toolbar row ── */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 w-full justify-between bg-muted/30 p-3 rounded-xl border border-dashed border-muted-foreground/20">
                {/* Left: stats */}
                <div className="flex items-center gap-2 flex-wrap order-2 md:order-1">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
                    <IconAlertTriangle className="size-3 text-red-600 dark:text-red-400" />
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400">{openCount} abiertas</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <IconCheck className="size-3 text-zinc-400" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      {annotations.filter((a) => a.status === "resolved").length} resueltas
                    </span>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20">
                      <IconSparkles className="size-3 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400">{pendingLogs} cambios pendientes</span>
                    </div>
                  )}
                </div>

                {/* Right: view filter + search + status filter + admin CTA */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap order-1 md:order-2 w-full md:w-auto">
                  <div className="h-5 w-px bg-border" />

                  {/* View filter dropdown */}
                  <Select
                    value={viewFilter}
                    onValueChange={(v: any) => setViewFilter(v)}
                  >
                    <SelectTrigger className="h-7 text-xs w-[140px] bg-muted/50 border-none gap-2">
                      <IconFilter className="size-3 text-muted-foreground" />
                      <SelectValue placeholder="Filtrar vista" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los registros</SelectItem>
                      <SelectItem value="annotations">
                        <div className="flex items-center gap-2">
                          <IconAlertTriangle className="size-3.5 text-red-500" />
                          <span>Anotaciones</span>
                          {openCount > 0 && (
                            <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1 rounded-full">
                              {openCount}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                      {isAdmin && (
                        <SelectItem value="changelog">
                          <div className="flex items-center gap-2">
                            <IconSparkles className="size-3.5 text-green-500" />
                            <span>Cambios</span>
                            {pendingLogs > 0 && (
                              <span className="bg-green-100 text-green-600 text-[10px] font-bold px-1 rounded-full">
                                {pendingLogs}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>

                  {/* Search */}
                  <div className="relative">
                    <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-7 h-7 text-xs w-48"
                    />
                  </div>

                  {/* Status filter dropdown (annotations) */}
                  {viewFilter !== "changelog" && (
                    <Select
                      value={annFilter}
                      onValueChange={(v: any) => setAnnFilter(v)}
                    >
                      <SelectTrigger className="h-7 text-xs w-[120px] bg-muted/50 border-none">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="open">Abiertas</SelectItem>
                        <SelectItem value="resolved">Resueltas</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {/* Admin CTA Buttons */}
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                        <button
                          onClick={() => setAnnotationSheetOpen(true)}
                          className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition-all"
                        >
                          <IconPlus className="size-3.5" />
                          <span className="md:hidden lg:inline">Anotación</span>
                          <span className="hidden md:inline lg:hidden">Anot.</span>
                        </button>
                        <button
                          onClick={() => setChangeLogSheetOpen(true)}
                          className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold shadow-sm transition-all"
                        >
                          <IconPlus className="size-3.5" />
                          <span className="md:hidden lg:inline">Cambios</span>
                          <span className="hidden md:inline lg:hidden">Camb.</span>
                        </button>
                    </div>
                  )}
                </div>
              </div>


              {/* ── Unified list ────────────────────────────────── */}
              {(annLoading || logLoading) ? (
                <SkeletonList />
              ) : (() => {
                const annItems = viewFilter !== "changelog" ? filteredAnnotations : []
                const logItems = viewFilter !== "annotations" && isAdmin ? filteredLogs : []

                if (annItems.length + logItems.length === 0) return (
                  <EmptyState
                    icon={<IconAlertTriangle className="size-8 text-muted-foreground/30" />}
                    title="Sin resultados"
                    subtitle="No hay anotaciones ni cambios que coincidan con los filtros."
                  />
                )

                return (
                  <div className="flex flex-col gap-2">
                    {(() => {
                      const allItems = [
                        ...annItems.map(a => ({ ...a, _type: 'ann' as const, _date: a.createdAt?.toDate?.() || new Date(0) })),
                        ...logItems.map(l => ({ ...l, _type: 'log' as const, _date: l.createdAt?.toDate?.() || new Date(0) }))
                      ].sort((a, b) => b._date.getTime() - a._date.getTime())

                      return allItems.map((item) => {
                        if (item._type === 'ann') {
                          const ann = item
                          const isResolved = ann.status === "resolved"
                          const isCorrection = ann.type === "correction"
                          
                          // Theme logic: Corrections stay red, Resolved comments turn Green, Open comments stay Orange
                          const theme = isCorrection ? 'red' : (isResolved ? 'green' : 'orange')
                          const themeClasses = {
                            red: "border-red-400 dark:border-red-600 bg-red-50/50 dark:bg-red-950/20",
                            green: "border-green-400 dark:border-green-600 bg-green-50/50 dark:bg-green-950/20",
                            orange: "border-orange-400 dark:border-orange-600 bg-orange-50/50 dark:bg-orange-950/20"
                          }
                          const barClasses = { red: "bg-red-500", green: "bg-green-500", orange: "bg-orange-500" }
                          const textClasses = { red: "text-red-900 dark:text-red-100", green: "text-green-900 dark:text-green-100", orange: "text-orange-900 dark:text-orange-100" }

                          return (
                            <div key={`ann-${ann.id}`} className={`rounded-lg border overflow-hidden flex transition-all shadow-sm ${themeClasses[theme]}`}>
                              <div className={`w-1 shrink-0 ${barClasses[theme]}`} />
                                <div className={`flex-1 px-3 py-2.5 flex flex-col md:flex-row md:items-center gap-3 min-w-0`}>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
                                    <span className={`shrink-0 text-[10px] font-bold ${isResolved ? "text-green-600" : (isCorrection ? "text-red-600" : "text-orange-600")}`}>
                                      {isResolved ? "✓" : isCorrection ? "⚠" : "💬"}
                                    </span>
                                    <p className={`text-sm line-clamp-2 flex-1 min-w-0 break-words font-medium ${isResolved ? textClasses[theme] : "text-foreground"}`}>
                                      {ann.content}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground shrink-0">
                                    <span className="font-medium whitespace-nowrap">{ann.createdByName}</span>
                                    <span className="hidden sm:inline">·</span>
                                    <span className="whitespace-nowrap">{ann.createdAt?.toDate ? format(ann.createdAt.toDate(), "d MMM, HH:mm", { locale: es }) : "—"}</span>
                                    {isResolved && ann.resolvedByName && (<><span className="hidden sm:inline">·</span><span className="text-green-600 font-bold whitespace-nowrap">✓ {ann.resolvedByName}</span></>)}
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 ml-auto md:ml-0">
                                    {ann.sessionId && (
                                      <button onClick={() => handleViewConversation(ann.sessionId!, ann.chatLogId)} className="flex items-center gap-1 text-[11px] bg-foreground text-background hover:opacity-80 font-medium px-2 py-0.5 rounded-md transition-colors">
                                        <IconExternalLink className="size-3" />Ver chat
                                      </button>
                                    )}
                                    {isAdmin && !isResolved && (
                                      <button onClick={() => resolveAnnotation(ann.id, userInfo)} className="flex items-center gap-1 text-[11px] bg-green-600 hover:bg-green-700 text-white font-medium px-2 py-0.5 rounded-md transition-colors">
                                        <IconCheck className="size-3" />Resolver
                                      </button>
                                    )}
                                  </div>
                                </div>
                            </div>
                          )
                        } else {
                          const log = item
                          const applied = log.status === "applied"
                          const isExpanded = expandedLogId === log.id
                          return (
                            <React.Fragment key={`log-${log.id}`}>
                              <div className={`rounded-lg border overflow-hidden flex transition-all shadow-sm ${applied ? "border-green-400 dark:border-green-600 bg-green-50/50 dark:bg-green-950/20" : "border-amber-400 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/20"}`}>
                                <div className={`w-1 shrink-0 ${applied ? "bg-green-500" : "bg-amber-500"}`} />
                                <div className={`flex-1 px-3 py-2.5 flex items-center gap-3 min-w-0`}>
                                  <span className={`shrink-0 text-[10px] font-bold ${applied ? "text-green-600" : "text-amber-600"}`}>
                                    {applied ? "✓" : "⏳"}
                                  </span>
                                  <p className={`text-sm font-semibold truncate flex-1 min-w-0 ${applied ? "text-green-900 dark:text-green-100" : "text-foreground"}`}>{log.title}</p>
                                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0 hidden sm:flex">
                                    <span className="font-medium">{log.createdByName}</span>
                                    <span>·</span>
                                    <span>{log.createdAt?.toDate ? format(log.createdAt.toDate(), "d MMM, HH:mm", { locale: es }) : "—"}</span>
                                    {applied && (log as any).appliedByName && (<><span>·</span><span className="text-green-600 font-bold">✓ {(log as any).appliedByName}</span></>)}
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {log.description && (
                                      <button onClick={() => setExpandedLogId(isExpanded ? null : log.id)} className="flex items-center gap-1 text-[11px] bg-foreground text-background hover:opacity-80 font-medium px-2 py-0.5 rounded-md">
                                        {isExpanded ? "Ver menos" : "Ver más"}
                                      </button>
                                    )}
                                    {isAdmin && !applied && (
                                      <button onClick={() => markAsApplied(log.id, userInfo)} className="flex items-center gap-1 text-[11px] bg-green-600 hover:bg-green-700 text-white font-medium px-2 py-0.5 rounded-md">
                                        <IconCheck className="size-3" />Aplicado
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {isExpanded && log.description && (
                                <div className="px-4 py-3 rounded-b-lg border border-t-0 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 text-sm text-foreground whitespace-pre-wrap leading-relaxed -mt-1">
                                  {log.description}
                                </div>
                              )}
                            </React.Fragment>
                          )
                        }
                      })
                    })()}
                  </div>
                )
              })()}
            </div>
          )}

        </div>
      </div>

      {/* Conversation panel (shared by both tabs) */}
      <ConversationPanel
        open={panelOpen}
        onOpenChange={(open) => {
          setPanelOpen(open)
          if (!open) setHighlightedMessageId(null)
        }}
        sessionId={selectedSession}
        messages={sessionMessages}
        messagesLoading={messagesLoading}
        currentUser={user}
        isAdmin={isAdmin}
        highlightId={highlightedMessageId}
      />

      <ChangeLogSheet
        open={changeLogSheetOpen}
        onOpenChange={setChangeLogSheetOpen}
        onSave={handleAddLog}
      />

      <AnnotationSheet
        open={annotationSheetOpen}
        onOpenChange={setAnnotationSheetOpen}
        onSave={handleAddAnnotation}
      />
    </>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────

function SkeletonList() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 rounded-xl border bg-muted animate-pulse" />
      ))}
    </div>
  )
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      {icon}
      <p className="font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground max-w-xs">{subtitle}</p>
    </div>
  )
}
