"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

interface MessagesByDayChartProps {
  data: { date: string; messages: number }[]
  loading?: boolean
}

const chartConfig = {
  messages: {
    label: "Mensajes",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function MessagesByDayChart({ data, loading }: MessagesByDayChartProps) {
  // Take last 30 days
  const chartData = data.slice(-30)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mensajes por Dia</CardTitle>
        <CardDescription>
          Ultimos 30 dias de actividad del chatbot
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse bg-muted rounded h-full w-full" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos disponibles
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = parseISO(value)
                  return format(date, "d MMM", { locale: es })
                }}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      const date = parseISO(value)
                      return format(date, "EEEE, d 'de' MMMM", { locale: es })
                    }}
                  />
                }
              />
              <Bar
                dataKey="messages"
                fill="var(--color-messages)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
