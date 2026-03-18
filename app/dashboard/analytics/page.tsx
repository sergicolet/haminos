"use client"

import * as React from "react"
import { SiteHeader } from "@/components/site-header"
import { MessagesByDayChart } from "@/components/dashboard/MessagesByDayChart"
import { CategoryChart } from "@/components/dashboard/CategoryChart"
import { IntentionChart } from "@/components/dashboard/IntentionChart"
import { HourlyDistributionChart } from "@/components/dashboard/HourlyDistributionChart"
import { useChatLogs } from "@/hooks/useChatLogs"

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

export default function AnalyticsPage() {
  const [filters, setFilters] = React.useState<{
    category?: string
    intention?: string
    timeRange: '7d' | '30d' | 'thisMonth' | 'thisWeek'
  }>({
    timeRange: '30d'
  })

  const {
    loading,
    messagesByDay,
    categoryDistribution,
    intentionDistribution,
    hourlyDistribution,
  } = useChatLogs(filters)

  return (
    <>
      <SiteHeader title="Analítica" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col gap-6 py-6 px-2 lg:px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Analítica Detallada</h2>
              <p className="text-muted-foreground">Explora profundamente las métricas de interacciones.</p>
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
                  onClick={() => setFilters(prev => ({ ...prev, timeRange: range.id as any }))}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    filters.timeRange === range.id 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <MessagesByDayChart data={messagesByDay()} loading={loading} />
            </div>
            
            <HourlyDistributionChart data={hourlyDistribution()} loading={loading} />
            
            <CategoryChart data={categoryDistribution()} loading={loading} />

            <div className="lg:col-span-2">
              <IntentionChart data={intentionDistribution()} loading={loading} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
