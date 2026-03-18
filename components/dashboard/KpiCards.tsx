"use client"

import { IconMessage, IconUsers, IconCategory, IconTarget } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { KPIData } from "@/lib/types"

interface KpiCardsProps {
  data: KPIData
  loading?: boolean
}

export function KpiCards({ data, loading }: KpiCardsProps) {
  const cards = [
    {
      title: "Total Conversaciones",
      value: data.totalConversations,
      icon: IconUsers,
      description: "Sesiones unicas registradas",
    },
    {
      title: "Total Mensajes",
      value: data.totalMessages,
      icon: IconMessage,
      description: "Interacciones del chatbot",
    },
    {
      title: "Categoria Principal",
      value: data.topCategory,
      icon: IconCategory,
      description: "Tema mas consultado",
    },
    {
      title: "Intencion Principal",
      value: data.topIntention,
      icon: IconTarget,
      description: "Intencion mas frecuente",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="@container/card">
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <span className="size-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <card.icon className="size-3.5 text-primary" />
              </span>
              {card.title}
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {loading ? (
                <span className="animate-pulse bg-muted rounded h-8 w-24 inline-block" />
              ) : (
                typeof card.value === "number"
                  ? card.value.toLocaleString()
                  : card.value
              )}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="capitalize border-primary/30 text-primary bg-primary/5">
                {typeof card.value === "string" ? card.value : "Activo"}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">
              {card.description}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
