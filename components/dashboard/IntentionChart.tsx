"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"
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

interface IntentionChartProps {
  data: { name: string; value: number }[]
  loading?: boolean
}

const COLORS = [
  "#c38692",
  "#a85f6e",
  "#d4a0a9",
  "#8b3a4a",
]

export function IntentionChart({ data, loading }: IntentionChartProps) {
  const chartConfig: ChartConfig = data.reduce((acc, item, index) => {
    acc[item.name] = {
      label: item.name,
      color: COLORS[index % COLORS.length],
    }
    return acc
  }, {} as ChartConfig)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribucion por Intencion</CardTitle>
        <CardDescription>
          Intenciones de los usuarios al consultar
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse bg-muted rounded h-full w-full" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos disponibles
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart 
              data={data} 
              layout="vertical" 
              margin={{ top: 10, right: 30, left: 80, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis 
                type="category" 
                dataKey="name" 
                tickLine={false} 
                axisLine={false}
                width={90}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [`${value} mensajes`, name]}
                  />
                }
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
