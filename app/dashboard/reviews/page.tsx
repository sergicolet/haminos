"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { SiteHeader } from "@/components/site-header"
import { ConversationPanel } from "@/components/chat/ConversationPanel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/components/auth/AuthProvider"
import { useAllAnnotations, useChangeLogs } from "@/hooks/useAnnotations"
import { useChatLogs } from "@/hooks/useChatLogs"
import {
  IconAlertTriangle,
  IconMessage2,
  IconCheck,
  IconSparkles,
  IconPlus,
  IconX,
  IconExternalLink,
  IconFilter,
} from "@tabler/icons-react"
import { serverTimestamp, addDoc, collection, updateDoc, doc, db } from "@/lib/firebase"

// ── Color constants ────────────────────────────────────────────────
const RED = {
  bg: "bg-red-50 dark:bg-red-950/20",
  border: "border-red-200 dark:border-red-900",
  text: "text-red-600 dark:text-red-400",
  badge: "border-red-300 text-red-600 bg-red-50 dark:bg-red-950/20",
  btn: "bg-red-600 hover:bg-red-700 text-white",
  ring: "focus-visible:ring-red-400",
}
const GREEN = {
  bg: "bg-green-50 dark:bg-green-950/20",
  border: "border-green-200 dark:border-green-900",
  text: "text-green-600 dark:text-green-400",
  badge: "border-green-300 text-green-600 bg-green-50 dark:bg-green-950/20",
  btn: "bg-green-600 hover:bg-green-700 text-white",
  ring: "focus-visible:ring-green-400",
}

// ── Types ──────────────────────────────────────────────────────────
type Tab = "annotations" | "changelog"
type Filter = "all" | "open" | "resolved"

// ══════════════════════════════════════════════════════════════════
export default function ReviewsPage() {
  const { user, isAdmin } = useAuth()
  const [tab, setTab] = React.useState<Tab>("annotations")
  const [filter, setFilter] = React.useState<Filter>("all")
  const [search, setSearch] = React.useState("")

  // ConversationPanel state
  const [panelOpen, setPanelOpen] = React.useState(false)
  const [selectedSession, setSelectedSession] = React.useState<string | null>(null)
  const { getSessionMessages } = useChatLogs({})

  // Annotations
  const { annotations, loading: annLoading, resolveAnnotation } = useAllAnnotations()

  // ChangeLog
  const { logs, loading: logLoading, addChangeLog, markAsApplied } = useChangeLogs()

  // ChangeLog form
  const [showForm, setShowForm] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const userInfo = React.useMemo(
    () => ({
      email: user?.email || "",
      displayName: user?.displayName || user?.email || "Usuario",
    }),
    [user]
  )

  const openAnnotation = (sessionId: string) => {
    setSelectedSession(sessionId)
    setPanelOpen(true)
  }

  // ── Filtered annotations ──────────────────────────────────────
  const filteredAnnotations = React.useMemo(() => {
    return annotations.filter((a) => {
      const matchFilter =
        filter === "all" || a.status === filter
      const searchLow = search.toLowerCase()
      const matchSearch =
        !search ||
        a.content.toLowerCase().includes(searchLow) ||
        a.createdByName.toLowerCase().includes(searchLow) ||
        (a.sessionId ?? '').toLowerCase().includes(searchLow)
      return matchFilter && matchSearch
    })
  }, [annotations, filter, search])

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

  const handleAddLog = async () => {
    if (!title.trim()) return
    setSaving(true)
    await addChangeLog(title, description, userInfo)
    setTitle("")
    setDescription("")
    setShowForm(false)
    setSaving(false)
  }

  const openCount = annotations.filter((a) => a.status === "open").length
  const resolvedCount = annotations.filter((a) => a.status === "resolved").length
  const pendingLogs = logs.filter((l) => l.status === "pending").length

  // ── Render ─────────────────────────────────────────────────────
  return (
    <>
      <SiteHeader title="Revisiones" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col gap-6 py-6 px-2 lg:px-4 max-w-4xl">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Centro de Revisiones</h2>
              <p className="text-muted-foreground text-sm">
                Gestiona anotaciones sobre conversaciones y cambios aplicados al chatbot.
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${RED.bg} ${RED.border}`}>
                <IconAlertTriangle className={`size-3.5 ${RED.text}`} />
                <span className={`text-xs font-semibold ${RED.text}`}>{openCount} abiertas</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                <IconCheck className="size-3.5 text-zinc-400" />
                <span className="text-xs font-semibold text-muted-foreground">{resolvedCount} resueltas</span>
              </div>
              {isAdmin && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${GREEN.bg} ${GREEN.border}`}>
                  <IconSparkles className={`size-3.5 ${GREEN.text}`} />
                  <span className={`text-xs font-semibold ${GREEN.text}`}>{pendingLogs} cambios pendientes</span>
                </div>
              )}
            </div>
          </div>

          {/* Tab bar + search */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg self-start">
              <button
                onClick={() => setTab("annotations")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  tab === "annotations"
                    ? "bg-background shadow-sm text-red-600"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <IconAlertTriangle className="size-3.5" />
                Anotaciones
                {openCount > 0 && (
                  <span className="bg-red-100 dark:bg-red-900/40 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {openCount}
                  </span>
                )}
              </button>
              {isAdmin && (
                <button
                  onClick={() => setTab("changelog")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    tab === "changelog"
                      ? "bg-background shadow-sm text-green-600"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <IconSparkles className="size-3.5" />
                  Cambios
                  {pendingLogs > 0 && (
                    <span className="bg-green-100 dark:bg-green-900/40 text-green-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {pendingLogs}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <IconFilter className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>

            {/* Filter (annotations tab only) */}
            {tab === "annotations" && (
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg self-start">
                {(["all", "open", "resolved"] as Filter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      filter === f
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f === "all" ? "Todas" : f === "open" ? "Abiertas" : "Resueltas"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── ANNOTATIONS TAB ─────────────────────────────────── */}
          {tab === "annotations" && (
            <div className="flex flex-col gap-3">
              {annLoading ? (
                <SkeletonList />
              ) : filteredAnnotations.length === 0 ? (
                <EmptyState
                  icon={<IconAlertTriangle className="size-8 text-red-300" />}
                  title="Sin anotaciones"
                  subtitle="No hay anotaciones que coincidan con el filtro."
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredAnnotations.map((ann) => {
                    const isResolved = ann.status === "resolved"
                    return (
                      <div
                        key={ann.id}
                        className={`p-4 rounded-xl border flex flex-col gap-3 transition-all ${
                          isResolved
                            ? "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 opacity-70"
                            : `${RED.bg} ${RED.border}`
                        }`}
                      >
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                ann.type === "correction"
                                  ? "border-red-400 text-red-600"
                                  : "border-orange-400 text-orange-600"
                              }`}
                            >
                              {ann.type === "correction" ? "⚠ Corrección" : "💬 Comentario"}
                            </Badge>
                            {isResolved ? (
                              <Badge variant="outline" className="text-xs border-green-400 text-green-600">
                                ✓ Resuelta
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs border-red-300 text-red-500">
                                ● Abierta
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* View chat button */}
                            <button
                              onClick={() => openAnnotation(ann.sessionId ?? '')}
                              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                            >
                              <IconExternalLink className="size-3.5" />
                              Ver chat
                            </button>
                            {/* Admin resolve */}
                            {isAdmin && !isResolved && (
                              <button
                                onClick={() => resolveAnnotation(ann.id, userInfo)}
                                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-semibold transition-colors"
                              >
                                <IconCheck className="size-3.5" />
                                Resolver
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <p className="text-sm text-foreground leading-relaxed">{ann.content}</p>

                        {/* Meta */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span className="font-medium text-foreground">{ann.createdByName}</span>
                          <span>·</span>
                          <span>
                            {ann.createdAt?.toDate
                              ? format(ann.createdAt.toDate(), "d MMM yyyy 'a las' HH:mm", { locale: es })
                              : "—"}
                          </span>
                          <span>·</span>
                          <span className="font-mono text-[11px] opacity-60">{ann.sessionId}</span>
                        </div>

                        {/* Resolved by */}
                        {isResolved && ann.resolvedByName && (
                          <div className="flex items-center gap-1.5 text-xs text-green-600 border-t border-zinc-200 dark:border-zinc-800 pt-2 mt-1">
                            <IconCheck className="size-3.5" />
                            <span>
                              Resuelto por <span className="font-medium">{ann.resolvedByName}</span>
                              {ann.resolvedAt?.toDate
                                ? ` · ${format(ann.resolvedAt.toDate(), "d MMM yyyy, HH:mm", { locale: es })}`
                                : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── CHANGELOG TAB (admin only) ───────────────────────── */}
          {tab === "changelog" && isAdmin && (
            <div className="flex flex-col gap-4">
              {/* Add new change */}
              {showForm ? (
                <div className={`p-4 rounded-xl border flex flex-col gap-3 ${GREEN.bg} ${GREEN.border}`}>
                  <div className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
                    <IconSparkles className="size-4" />
                    Registrar nuevo cambio
                  </div>
                  <Input
                    placeholder="Título del cambio aplicado..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`text-sm ${GREEN.ring}`}
                  />
                  <Textarea
                    placeholder="Descripción detallada del cambio (opcional)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`min-h-[80px] resize-none text-sm ${GREEN.ring}`}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setShowForm(false); setTitle(""); setDescription("") }}
                      className="text-muted-foreground"
                    >
                      <IconX className="size-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddLog}
                      disabled={!title.trim() || saving}
                      className={GREEN.btn}
                    >
                      <IconCheck className="size-4 mr-1" />
                      {saving ? "Guardando..." : "Guardar cambio"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className={`self-start border-green-300 ${GREEN.text} hover:${GREEN.bg} gap-2`}
                  onClick={() => setShowForm(true)}
                >
                  <IconPlus className="size-4" />
                  Registrar cambio
                </Button>
              )}

              {/* List */}
              {logLoading ? (
                <SkeletonList />
              ) : filteredLogs.length === 0 ? (
                <EmptyState
                  icon={<IconSparkles className="size-8 text-green-300" />}
                  title="Sin cambios registrados"
                  subtitle="Registra aquí los cambios que se aplican al chatbot."
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredLogs.map((log) => {
                    const applied = log.status === "applied"
                    return (
                      <div
                        key={log.id}
                        className={`p-4 rounded-xl border flex flex-col gap-3 transition-all ${
                          applied
                            ? `${GREEN.bg} ${GREEN.border}`
                            : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">{log.title}</span>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                applied
                                  ? "border-green-400 text-green-600"
                                  : "border-amber-400 text-amber-600"
                              }`}
                            >
                              {applied ? "✓ Aplicado" : "⏳ Pendiente"}
                            </Badge>
                          </div>
                          {!applied && (
                            <button
                              onClick={() => markAsApplied(log.id, userInfo)}
                              className={`flex items-center gap-1 text-xs font-semibold ${GREEN.text} hover:text-green-700 transition-colors shrink-0`}
                            >
                              <IconCheck className="size-3.5" />
                              Marcar como aplicado
                            </button>
                          )}
                        </div>

                        {log.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed">{log.description}</p>
                        )}

                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span className="font-medium text-foreground">{log.createdByName}</span>
                          <span>·</span>
                          <span>
                            {log.createdAt?.toDate
                              ? format(log.createdAt.toDate(), "d MMM yyyy 'a las' HH:mm", { locale: es })
                              : "—"}
                          </span>
                          {log.relatedSessionId && (
                            <>
                              <span>·</span>
                              <button
                                onClick={() => openAnnotation(log.relatedSessionId!)}
                                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <IconExternalLink className="size-3" />
                                {log.relatedSessionId}
                              </button>
                            </>
                          )}
                        </div>

                        {applied && log.appliedAt?.toDate && (
                          <div className={`flex items-center gap-1.5 text-xs ${GREEN.text} border-t ${GREEN.border} pt-2 mt-1`}>
                            <IconCheck className="size-3.5" />
                            <span>
                              Aplicado
                              {(log as any).appliedByName ? ` por ${(log as any).appliedByName}` : ""}
                              {` · ${format(log.appliedAt.toDate(), "d MMM yyyy, HH:mm", { locale: es })}`}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Conversation panel */}
      <ConversationPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        sessionId={selectedSession}
        messages={selectedSession ? getSessionMessages(selectedSession) : []}
        currentUser={user}
        isAdmin={isAdmin}
      />
    </>
  )
}

// ── Helper components ──────────────────────────────────────────────

function SkeletonList() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-24 rounded-xl border bg-muted animate-pulse"
        />
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
