"use client"

import * as React from "react"
import { SiteHeader } from "@/components/site-header"
import { KpiCards } from "@/components/dashboard/KpiCards"
import { MessagesByDayChart } from "@/components/dashboard/MessagesByDayChart"
import { CategoryChart } from "@/components/dashboard/CategoryChart"
import { IntentionChart } from "@/components/dashboard/IntentionChart"
import { SessionsTable } from "@/components/dashboard/SessionsTable"
import { ConversationPanel } from "@/components/chat/ConversationPanel"
import { useChatLogs } from "@/hooks/useChatLogs"

export default function DashboardPage() {
  const [filters, setFilters] = React.useState<{
    timeRange: '7d' | '30d' | 'thisMonth' | 'thisWeek'
  }>({
    timeRange: '7d'
  })

  const {
    loading,
    kpis,
    messagesByDay,
    categoryDistribution,
    intentionDistribution,
  } = useChatLogs(filters)

  return (
    <>
      <SiteHeader title="Dashboard" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col gap-6 py-6 px-2 lg:px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Vista General</h2>
              <p className="text-muted-foreground">Resumen del rendimiento del chatbot.</p>
            </div>
            <div className="flex items-center gap-2 bg-muted p-1 rounded-lg self-start sm:self-auto overflow-x-auto max-w-full">
              {[
                { id: '7d', label: '7 Días' },
                { id: 'thisWeek', label: 'Semana' },
                { id: 'thisMonth', label: 'Mes' },
                { id: '30d', label: '30 Días' },
              ].map((range) => (
                <button
                  key={range.id}
                  onClick={() => setFilters({ timeRange: range.id as any })}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    filters.timeRange === range.id
                      ? "bg-background text-primary shadow-sm border border-primary/20"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Cards */}
          <KpiCards data={kpis()} loading={loading} />

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2">
              <MessagesByDayChart data={messagesByDay()} loading={loading} />
            </div>
            <div className="md:col-span-2 lg:col-span-1">
              <CategoryChart data={categoryDistribution()} loading={loading} />
            </div>
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <IntentionChart data={intentionDistribution()} loading={loading} />
            </div>
            <Card className="flex flex-col justify-center items-center p-8 text-center overflow-hidden relative border-primary/20" style={{ background: 'linear-gradient(135deg, #1a0a0d 0%, #2d1017 50%, #1a0a0d 100%)' }}>
              <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 50% 0%, #c38692 0%, transparent 70%)' }} />
              <div className="relative size-12 rounded-2xl bg-[#c38692]/20 border border-[#c38692]/30 flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-[#c38692]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>H</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-white relative">Haminos Analytics</h3>
              <p className="text-white/50 text-sm max-w-[260px] relative">
                Explora el historial completo de mensajes y análisis detallado en las demás pestañas.
              </p>
              <div className="mt-6 flex gap-3 relative">
                <Button asChild size="sm" style={{ background: '#c38692', color: 'white' }} className="hover:opacity-90 border-0">
                  <Link href="/dashboard/analytics">Ir a Analítica</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white">
                  <Link href="/dashboard/conversations">Mensajes</Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { IconInnerShadowTop } from "@tabler/icons-react"
