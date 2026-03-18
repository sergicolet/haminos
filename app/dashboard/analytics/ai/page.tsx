"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { SiteHeader } from "@/components/site-header"
import { useAIReports } from "@/hooks/useAnnotations"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { subDays } from "date-fns"
import { 
  IconSparkles, 
  IconCalendar, 
  IconHistory, 
  IconRefresh,
  IconClock,
  IconLayoutGrid,
  IconFileText,
  IconBrain,
  IconBulb,
  IconCode,
  IconChartBar,
  IconTrash,
  IconLoader2,
  IconExternalLink
} from "@tabler/icons-react"
import ReactMarkdown from "react-markdown"
import { toast } from "sonner"
import { useAuth } from "@/components/auth/AuthProvider"
import { useChatLogs } from "@/hooks/useChatLogs"
import { ConversationPanel } from "@/components/chat/ConversationPanel"

// Helper to format dates from different sources (Firestore Timestamp or ISO string)
function formatDate(dateValue: any, formatStr: string = "PPP p") {
  if (!dateValue) return "—"
  
  let date: Date
  if (dateValue.toDate) {
    date = dateValue.toDate()
  } else if (typeof dateValue === 'string') {
    date = new Date(dateValue)
  } else if (dateValue instanceof Date) {
    date = dateValue
  } else {
    return "—"
  }

  try {
    return format(date, formatStr, { locale: es })
  } catch (e) {
    return "—"
  }
}

// Helper to format the period string (e.g., "2026-03-09...-2026-03-12..." or "Selección manual")
function formatPeriod(periodStr?: string) {
  if (!periodStr) return null
  
  // Handle manual selection label directly
  if (periodStr.includes('Selección manual')) return periodStr

  // Try to parse range: YYYY-MM-DD - YYYY-MM-DD or ISOZ-ISO
  const parts = periodStr.includes(' - ') ? periodStr.split(' - ') : periodStr.split('Z-')
  
  if (parts.length < 2) return periodStr
  
  try {
    const startDate = new Date(parts[0].includes('T') ? parts[0] + (parts[0].endsWith('Z') || parts[0].includes('-') ? '' : 'Z') : parts[0])
    const endDate = new Date(parts[1])
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return periodStr

    // If they are the same day, just show one
    if (format(startDate, "yyyy-MM-dd") === format(endDate, "yyyy-MM-dd")) {
      return format(startDate, "d MMM yyyy", { locale: es })
    }

    return `${format(startDate, "d MMM", { locale: es })} - ${format(endDate, "d MMM", { locale: es })}`
  } catch (e) {
    return periodStr
  }
}

export default function AIAnalysisPage() {
  const { user, isAdmin } = useAuth()
  const { reports, loading, deleteReport } = useAIReports()
  const [selectedReportId, setSelectedReportId] = React.useState<string | null>(null)
  const [triggering, setTriggering] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [isWaitingForNewReport, setIsWaitingForNewReport] = React.useState(false)
  
  // States for the report generation dialog
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedDays, setSelectedDays] = React.useState("1")
  
  // Conversation panel state
  const [selectedSessionId, setSelectedSessionId] = React.useState<string | null>(null)
  const [panelOpen, setPanelOpen] = React.useState(false)
  const [sessionMessages, setSessionMessages] = React.useState<any[]>([])
  const [messagesLoading, setMessagesLoading] = React.useState(false)

  const { getSessionMessages } = useChatLogs({})

  const handleViewConversation = async (sessionId: string) => {
    setSelectedSessionId(sessionId)
    setSessionMessages([])
    setMessagesLoading(true)
    setPanelOpen(true)
    try {
      const msgs = await getSessionMessages(sessionId)
      setSessionMessages(msgs)
    } catch (error) {
      toast.error("Error al cargar la conversación")
    } finally {
      setMessagesLoading(false)
    }
  }

  // Custom components for ReactMarkdown 
  const MarkdownComponents = {
    h2: ({ children }: any) => (
      <h2 className="text-xl font-bold text-foreground mt-8 mb-4 pb-2 border-b border-primary/20 flex items-center gap-2">
        <span className="shrink-0 size-2 rounded-full bg-primary/80" />
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-lg font-bold text-foreground/90 mt-6 mb-3 flex items-center gap-2">
        <span className="shrink-0 w-1 h-4 bg-emerald-400/50 rounded-full" />
        {children}
      </h3>
    ),
    p: ({ children }: any) => (
      <p className="text-muted-foreground leading-relaxed mb-4 last:mb-0">
        {renderContentWithCitations(children)}
      </p>
    ),
    ul: ({ children }: any) => (
      <ul className="space-y-3 mb-6 list-none">
        {children}
      </ul>
    ),
    li: ({ children }: any) => (
      <li className="flex items-start gap-2 group">
        <span className="shrink-0 size-1.5 rounded-full bg-primary/80/40 mt-2.5 transition-colors group-hover:bg-primary/80" />
        <span className="text-muted-foreground flex-1">{renderContentWithCitations(children)}</span>
      </li>
    ),
    strong: ({ children }: any) => (
      <strong className="font-extrabold text-foreground border-b border-primary/10 transition-colors hover:border-primary/30">
        {children}
      </strong>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-primary bg-primary/5 py-4 px-6 my-6 rounded-r-xl italic text-foreground/90 shadow-sm border-y border-r border-primary/10">
        {children}
      </blockquote>
    ),
  }

  // Helper to detect and replace [[sessionId]] with interactive badges
  const renderContentWithCitations = (content: any) => {
    if (typeof content !== 'string') {
      if (Array.isArray(content)) {
        return content.map((child, i) => (
          typeof child === 'string' ? renderCitationsInText(child, i) : child
        ))
      }
      return content
    }
    return renderCitationsInText(content)
  }

  const renderCitationsInText = (text: string, keyPrefix: string | number = 'text') => {
    const parts = text.split(/(\[\[[a-zA-Z0-9_, ]+\]\])/g)
    return parts.map((part, i) => {
      const match = part.match(/\[\[([a-zA-Z0-9_, ]+)\]\]/)
      if (match) {
        const ids = match[1].split(',').map(id => id.trim())
        return (
          <span key={`${keyPrefix}-cite-${i}`} className="inline-flex items-center gap-1 mx-1">
            {ids.map((id, idx) => (
              <button
                key={id}
                onClick={() => handleViewConversation(id)}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/15 dark:bg-primary/20 text-primary dark:text-primary/80 text-[10px] font-bold hover:bg-primary/20 dark:hover:bg-primary/25 transition-colors border border-primary/20"
                title={`Ver conversación ${id}`}
              >
                <IconExternalLink className="size-2.5" />
                {id.split('_')[1] || id}
              </button>
            ))}
          </span>
        )
      }
      return part
    })
  }

  // Track the count of reports before triggering to detect new arrivals
  const previousReportsCount = React.useRef(reports.length)

  const selectedReport = React.useMemo(
    () => reports.find((r) => r.id === selectedReportId),
    [reports, selectedReportId]
  )

  // Logic to parse the AI response based on [ANALISIS] and [SUGERENCIAS] tags
  const parsedSections = React.useMemo(() => {
    const rawText = selectedReport?.text || selectedReport?.result || ""
    if (!rawText) return { analysis: "", suggestions: "" }

    const analysisMatch = rawText.match(/\[ANALISIS\]([\s\S]*?)(?=\[SUGERENCIAS\]|$)/i)
    const suggestionsMatch = rawText.match(/\[SUGERENCIAS\]([\s\S]*?)$/i)

    const analysis = analysisMatch ? analysisMatch[1].trim() : ""
    const suggestions = suggestionsMatch ? suggestionsMatch[1].trim() : ""

    // If no tags are found, we treat the whole text as analysis for backward compatibility
    if (!analysis && !suggestions) {
      return { analysis: rawText, suggestions: "" }
    }

    return { analysis, suggestions }
  }, [selectedReport])

  // Polling/Sync logic: Auto-select new report when it arrives after a trigger
  React.useEffect(() => {
    if (isWaitingForNewReport && reports.length > previousReportsCount.current) {
      const latestReport = reports[0]
      if (latestReport) {
        setSelectedReportId(latestReport.id)
        setIsWaitingForNewReport(false)
        toast.success("¡Reporte listo!", {
          description: "El nuevo análisis se ha generado y seleccionado automáticamente.",
        })
      }
    }
    // Update the ref whenever reports change, unless we're waiting
    if (!isWaitingForNewReport) {
      previousReportsCount.current = reports.length
    }
  }, [reports, isWaitingForNewReport])

  const handleTriggerDaily = async (days: string) => {
    setTriggering(true)
    setIsWaitingForNewReport(true)
    setDialogOpen(false)
    previousReportsCount.current = reports.length
    
    // Calculate start date based on selected days in Argentina time (UTC-3)
    let startDate: string | null = null
    if (days !== "all") {
      const date = subDays(new Date(), parseInt(days))
      // To send "Argentina Time" ISO string:
      // Subtract 3 hours from the UTC date and append -03:00
      const argDate = new Date(date.getTime() - (3 * 60 * 60 * 1000))
      startDate = argDate.toISOString().replace('Z', '-03:00')
    }

    try {
      const res = await fetch("/api/ai/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: "daily_summary",
          startDate 
        }),
      })
      if (!res.ok) throw new Error("Error al iniciar el resumen diario")
      toast.info("Generando reporte...", {
        description: "Gemini está analizando los datos. Seleccionaremos el reporte en cuanto esté listo.",
      })
    } catch (error: any) {
      toast.error(error.message)
      setIsWaitingForNewReport(false)
    } finally {
      setTriggering(false)
    }
  }

  const handleDeleteReport = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      setDeletingId(id)
      await deleteReport(id)
      if (selectedReportId === id) {
        setSelectedReportId(null)
      }
      toast.success("Reporte eliminado correctamente")
    } catch (error) {
      toast.error("Error al eliminar el reporte")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <SiteHeader title="Análisis con IA" />
      <div className="flex flex-1 flex-col overflow-hidden h-[calc(100vh-3.5rem)]">
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar: History and Actions */}
          <div className="w-80 border-r bg-primary/5 flex flex-col overflow-hidden">
            <div className="p-4 border-b bg-background/50 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                  <IconHistory className="size-4" />
                  Historial
                </h2>
              </div>
              
              <div className="space-y-2">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={triggering || isWaitingForNewReport}
                      className={`w-full justify-start gap-2 h-9 border-dashed transition-all ${
                        isWaitingForNewReport 
                          ? "border-amber-500/50 bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400" 
                          : "border-primary/50 hover:border-primary hover:bg-primary/8 dark:hover:bg-primary/10 text-primary dark:text-primary/80"
                      }`}
                    >
                      <IconRefresh className={triggering || isWaitingForNewReport ? "animate-spin size-4" : "size-4"} />
                      {isWaitingForNewReport ? "Esperando nuevo reporte..." : "Generar nuevo reporte"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <IconSparkles className="size-5 text-primary" />
                        Generar Análisis IA
                      </DialogTitle>
                      <DialogDescription>
                        Selecciona el periodo de tiempo que deseas que la IA analice para este reporte.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <label className="text-sm font-medium mb-2 block">Analizar conversaciones desde:</label>
                      <Select value={selectedDays} onValueChange={setSelectedDays}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona un periodo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Últimas 24 horas</SelectItem>
                          <SelectItem value="3">Últimos 3 días</SelectItem>
                          <SelectItem value="7">Últimos 7 días</SelectItem>
                          <SelectItem value="30">Últimos 30 días</SelectItem>
                          <SelectItem value="all">Todo el historial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="default" 
                        onClick={() => handleTriggerDaily(selectedDays)}
                        className="w-full bg-primary hover:bg-primary/90 text-white"
                      >
                        Iniciar Análisis
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <ScrollArea className="flex-1 px-3 py-4">
              <div className="flex flex-col gap-2">
                {loading && (
                  <div className="flex flex-col gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
                    ))}
                  </div>
                )}
                
                {!loading && reports.length === 0 && (
                  <div className="py-12 text-center flex flex-col items-center gap-3">
                    <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                      <IconSparkles className="size-6 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">No hay reportes disponibles.</p>
                  </div>
                )}

                {reports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReportId(report.id)}
                    className={`group p-4 rounded-xl border text-left transition-all duration-200 relative overflow-hidden cursor-pointer ${
                      selectedReportId === report.id
                        ? "bg-primary/5 border-primary/50 ring-1 ring-primary/20 shadow-sm"
                        : "bg-background border-transparent hover:bg-muted/50 hover:border-muted-foreground/10"
                    }`}
                  >
                    {selectedReportId === report.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/80" />
                    )}
                    
                    <div className="flex items-center justify-between mb-2">
                      <Badge 
                        variant={report.type === "daily_summary" ? "secondary" : "outline"}
                        className={`text-[10px] px-1.5 h-4 font-medium ${
                          report.type === "daily_summary" 
                            ? "bg-primary/15 text-primary dark:bg-primary/20 dark:text-primary/80" 
                            : ""
                        }`}
                      >
                        {report.type === "daily_summary" ? "Resumen Diario" : "Análisis Manual"}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                          <IconClock className="size-3" />
                          {formatDate(report.datetime || report.createdAt, "d MMM, HH:mm")}
                        </span>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                              disabled={deletingId === report.id}
                            >
                              {deletingId === report.id ? (
                                <IconLoader2 className="size-3 animate-spin" />
                              ) : (
                                <IconTrash className="size-3" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar reporte?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente el análisis de la base de datos.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(e) => handleDeleteReport(e as any, report.id)}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    <p className={`text-sm font-bold leading-tight line-clamp-2 ${
                      selectedReportId === report.id ? "text-primary dark:text-primary/70" : "text-foreground"
                    }`}>
                      {report.query || (report.type === "daily_summary" ? "Perspectivas de Conversación" : "Análisis Detallado")}
                    </p>

                    {report.period && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-primary dark:text-primary/80 font-medium">
                        <IconClock className="size-3" />
                        {formatPeriod(report.period)}
                      </div>
                    )}
                    
                    {report.status === "processing" && (
                      <div className="mt-3 space-y-1.5">
                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary/80 animate-pulse" />
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-primary font-semibold animate-pulse uppercase tracking-tighter">Procesando</span>
                          <span className="text-muted-foreground tracking-tighter italic">Gemini 1.5 Pro</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content: Report Detail */}
          <div className="flex-1 bg-background flex flex-col overflow-hidden relative">
            {!selectedReport ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-8 max-w-2xl mx-auto">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative size-24 rounded-full bg-background border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center shadow-2xl">
                    <IconBrain className="size-12 text-primary" stroke={1.5} />
                  </div>
                  <IconSparkles className="absolute -top-2 -right-2 size-8 text-primary/80 animate-pulse" />
                </div>
                
                <div className="space-y-3">
                  <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                    Haminos <span className="text-primary">Analytics AI</span>
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Impulsa tu negocio con insights generados por inteligencia artificial a partir de tus conversaciones con clientes.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  <Card className="bg-muted/30 border-none">
                    <CardHeader className="pb-2">
                      <IconChartBar className="size-5 text-primary mb-2" />
                      <CardTitle className="text-sm">Análisis Diario</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                      Resúmenes automáticos de todas las interacciones del día anterior.
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30 border-none">
                    <CardHeader className="pb-2">
                      <IconBulb className="size-5 text-primary mb-2" />
                      <CardTitle className="text-sm">Recomendaciones</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                      Sugerencias accionables para mejorar la tasa de conversión y satisfacción.
                    </CardContent>
                  </Card>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="lg" 
                      disabled={triggering || isWaitingForNewReport}
                      className={`rounded-full px-8 h-12 shadow-lg gap-2 transition-all ${
                        isWaitingForNewReport
                          ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20"
                          : "bg-primary hover:bg-primary/90 shadow-primary/20"
                      }`}
                    >
                      <IconRefresh className={triggering || isWaitingForNewReport ? "animate-spin size-4" : "size-5"} />
                      {isWaitingForNewReport ? "Generando análisis..." : "Iniciar Nuevo Análisis Diario"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <IconSparkles className="size-5 text-primary" />
                        Generar Análisis IA
                      </DialogTitle>
                      <DialogDescription>
                        Selecciona el periodo de tiempo que deseas que la IA analice para este reporte.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <label className="text-sm font-medium mb-2 block">Analizar conversaciones desde:</label>
                      <Select value={selectedDays} onValueChange={setSelectedDays}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona un periodo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Últimas 24 horas</SelectItem>
                          <SelectItem value="3">Últimos 3 días</SelectItem>
                          <SelectItem value="7">Últimos 7 días</SelectItem>
                          <SelectItem value="30">Últimos 30 días</SelectItem>
                          <SelectItem value="all">Todo el historial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="default" 
                        onClick={() => handleTriggerDaily(selectedDays)}
                        className="w-full bg-primary hover:bg-primary/90 text-white"
                      >
                        Iniciar Análisis
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Report Header */}
                <header className="px-8 py-6 border-b bg-muted/5">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                      <h1 className="text-3xl font-extrabold tracking-tight">
                        {selectedReport.query || (selectedReport.type === "daily_summary" ? "Resumen Diario de Conversaciones" : "Análisis Detallado")}
                      </h1>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
                        <span className="flex items-center gap-1.5 font-medium whitespace-nowrap">
                          <IconCalendar className="size-4 text-primary" />
                          Generado: {formatDate(selectedReport.datetime || selectedReport.createdAt)}
                        </span>
                        {selectedReport.period && (
                          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary dark:text-primary/80 gap-1.5 px-3 py-1 font-medium text-xs">
                            <IconClock className="size-3.5" />
                            Periodo analizado: {formatPeriod(selectedReport.period)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </header>

                <Tabs defaultValue="analysis" className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-8 border-b bg-background z-10">
                    <div className="">
                      <TabsList className="h-14 bg-transparent p-0 gap-6">
                        <TabsTrigger 
                          value="analysis" 
                          className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 gap-2"
                        >
                          <IconLayoutGrid className="size-4" />
                          Análisis Completo
                        </TabsTrigger>
                        <TabsTrigger 
                          value="recommendations" 
                          className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 gap-2"
                        >
                          <IconBulb className="size-4" />
                          Sugerencias
                        </TabsTrigger>
                      </TabsList>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 bg-zinc-50/50 dark:bg-zinc-950/20">
                    <div className="p-4 md:p-6 lg:p-8">
                      {selectedReport.status === "processing" ? (
                        <Card className="border-dashed border-2 bg-background/50">
                          <CardContent className="py-24 flex flex-col items-center justify-center gap-6">
                            <div className="relative">
                              <div className="size-16 border-4 border-primary/10 border-t-emerald-500 rounded-full animate-spin" />
                              <IconBrain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-6 text-primary animate-pulse" stroke={1.5} />
                            </div>
                            <div className="space-y-2 text-center">
                              <h3 className="text-xl font-bold">Procesando insights...</h3>
                              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                Gemini está analizando las tendencias, sentimientos y datos de las conversaciones para generar este reporte.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <>
                          <TabsContent value="analysis" className="mt-0 focus-visible:ring-0">
                            <div className="prose-none max-w-none">
                                  {parsedSections.analysis ? (
                                    <ReactMarkdown components={MarkdownComponents}>{parsedSections.analysis}</ReactMarkdown>
                                  ) : (
                                    <div className="py-12 text-center text-muted-foreground italic border rounded-lg bg-muted/20">
                                      No hay un análisis detallado disponible para este reporte.
                                    </div>
                                  )}
                                </div>
                          </TabsContent>

                          <TabsContent value="recommendations" className="mt-0 focus-visible:ring-0">
                            <div className="space-y-6">
                              <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                                <IconBulb className="size-6 text-primary dark:text-primary/80" />
                                <div>
                                  <h3 className="font-bold text-primary dark:text-primary-foreground">Información Accionable</h3>
                                  <p className="text-sm text-primary/80 dark:text-primary/70">Basado en el análisis de las últimas conversaciones.</p>
                                </div>
                              </div>
                              {/* Aquí podríamos parsear las recomendaciones si estuvieran estructuradas, 
                                  por ahora mostramos el resultado también */}
                              <div className="prose-none max-w-none">
                                {parsedSections.suggestions ? (
                                  <ReactMarkdown components={MarkdownComponents}>
                                    {parsedSections.suggestions}
                                  </ReactMarkdown>
                                ) : (
                                  <p className="text-muted-foreground italic">No hay sugerencias específicas extraídas para este periodo.</p>
                                )}
                              </div>
                            </div>
                          </TabsContent>

                        </>
                      )}
                    </div>
                  </ScrollArea>
                </Tabs>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Conversation panel */}
      <ConversationPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        sessionId={selectedSessionId}
        messages={sessionMessages}
        messagesLoading={messagesLoading}
        currentUser={user}
        isAdmin={isAdmin}
      />
    </>
  )
}
