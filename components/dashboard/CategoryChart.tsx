"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Legend } from "recharts"
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

interface CategoryChartProps {
  data: { name: string; value: number }[]
  loading?: boolean
}

const COLORS = [
  "#c38692",
  "#a85f6e",
  "#d4a0a9",
  "#8b3a4a",
  "#e8c4ca",
  "#c06070",
  "#f0d8dc",
  "#954d5a",
]

export function CategoryChart({ data, loading }: CategoryChartProps) {
  const chartConfig: ChartConfig = data.reduce((acc, item, index) => {
    acc[item.name] = {
      label: item.name,
      color: COLORS[index % COLORS.length],
    }
    return acc
  }, {} as ChartConfig)

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribucion por Categoria</CardTitle>
        <CardDescription>
          Temas consultados por los usuarios
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse bg-muted rounded-full h-48 w-48" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos disponibles
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="80%"
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={(props: any) =>
                  `${props.name ?? ''}: ${((props.percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {data.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    className="stroke-background stroke-2"
                  />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [
                      `${value} mensajes (${((Number(value) / total) * 100).toFixed(1)}%)`,
                      name,
                    ]}
                  />
                }
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
