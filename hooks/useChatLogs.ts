"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { startOfDay, endOfDay, subDays, startOfWeek, startOfMonth } from 'date-fns'
import type { ChatLog, Session, KPIData } from '@/lib/types'

interface Filters {
  dateRange?: { from: Date; to: Date }
  timeRange?: '7d' | '30d' | 'thisMonth' | 'thisWeek'
  category?: string
  intention?: string
  searchQuery?: string
}

export function useChatLogs(filters: Filters = {}) {
  const [logs, setLogs] = useState<ChatLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const messageCache = useRef<Map<string, ChatLog[]>>(new Map())

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/logs')
      if (!res.ok) throw new Error('Error al obtener los logs')
      const data = await res.json()
      
      const flattenedLogs: ChatLog[] = []
      
      // data is an array of sessions from the Haminos API
      data.forEach((session: any) => {
        session.messages.forEach((msg: any, index: number) => {
          if (msg.role === 'user') {
            const botMsg = session.messages[index + 1]?.role === 'assistant' 
              ? session.messages[index + 1] 
              : null;

            // Extraemos la intención real de la base de datos (guardada en metadata por el chatbot)
            const realIntention = msg.metadata?.intencion || 'Consulta';

            flattenedLogs.push({
              id: msg.id,
              date: { toDate: () => new Date(msg.timestamp) },
              chatInput: msg.content,
              message: botMsg ? botMsg.content : '',
              session: session.id,
              categoria: msg.category || 'general',
              intencion: realIntention,
              status: 'completed',
              type: 'chat'
            } as ChatLog)
          }
        })
      })

      setLogs(flattenedLogs)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Apply filter: dateRange takes priority over timeRange; no filter = all logs
  const filteredLogs = useCallback((): ChatLog[] => {
    if (filters.dateRange?.from) {
      const from = startOfDay(filters.dateRange.from)
      const to = endOfDay(filters.dateRange.to ?? filters.dateRange.from)
      return logs.filter(l => {
        const d = l.date.toDate()
        return d >= from && d <= to
      })
    }
    const now = new Date()
    let from: Date | null = null
    if (filters.timeRange === '7d')       from = startOfDay(subDays(now, 6))
    else if (filters.timeRange === '30d') from = startOfDay(subDays(now, 29))
    else if (filters.timeRange === 'thisWeek')  from = startOfWeek(now, { weekStartsOn: 1 })
    else if (filters.timeRange === 'thisMonth') from = startOfMonth(now)
    if (!from) return logs
    return logs.filter(l => l.date.toDate() >= from!)
  }, [logs, filters.dateRange, filters.timeRange])

  const sessions = useCallback((): Session[] => {
    const sessionMap = new Map<string, Session>()

    for (const log of filteredLogs()) {
      const date = log.date.toDate()
      const sessionId = log.session || 'SESS_SIN_ID'
      const existing = sessionMap.get(sessionId)

      if (existing) {
        existing.messageCount++
        if (date < existing.firstInteraction) existing.firstInteraction = date
        if (date > existing.lastInteraction)  existing.lastInteraction  = date
        if (log.categoria && !existing.categories.includes(log.categoria)) {
          existing.categories.push(log.categoria)
        }
      } else {
        sessionMap.set(sessionId, {
          sessionId,
          messageCount: 1,
          firstInteraction: date,
          lastInteraction: date,
          categories: log.categoria ? [log.categoria] : [],
        })
      }
    }

    return Array.from(sessionMap.values()).sort(
      (a, b) => b.lastInteraction.getTime() - a.lastInteraction.getTime()
    )
  }, [filteredLogs])

  const getSessionMessages = useCallback(
    (sessionId: string): ChatLog[] => {
      // Return logs from state, filtering by session
      return logs.filter(l => l.session === sessionId).sort((a,b) => a.date.toDate().getTime() - b.date.toDate().getTime())
    },
    [logs]
  )

  const kpis = useCallback((): KPIData => {
    const categoryCount: Record<string, number> = {}
    const intentionCount: Record<string, number> = {}
    const uniqueSessions = new Set<string>()

    for (const log of filteredLogs()) {
      uniqueSessions.add(log.session)
      categoryCount[log.categoria] = (categoryCount[log.categoria] || 0) + 1
      intentionCount[log.intencion] = (intentionCount[log.intencion] || 0) + 1
    }

    const topCategory  = Object.entries(categoryCount) .sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
    const topIntention = Object.entries(intentionCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'

    return {
      totalConversations: uniqueSessions.size,
      totalMessages: filteredLogs().length,
      topCategory,
      topIntention,
    }
  }, [filteredLogs])

  const messagesByDay = useCallback(() => {
    const dayCount: Record<string, number> = {}
    for (const log of filteredLogs()) {
      const dateStr = log.date.toDate().toISOString().split('T')[0]
      dayCount[dateStr] = (dayCount[dateStr] || 0) + 1
    }
    return Object.entries(dayCount)
      .map(([date, count]) => ({ date, messages: count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [filteredLogs])

  const categoryDistribution = useCallback(() => {
    const cnt: Record<string, number> = {}
    for (const log of filteredLogs()) cnt[log.categoria] = (cnt[log.categoria] || 0) + 1
    return Object.entries(cnt).map(([name, value]) => ({ name, value }))
  }, [filteredLogs])

  const intentionDistribution = useCallback(() => {
    const cnt: Record<string, number> = {}
    for (const log of filteredLogs()) cnt[log.intencion] = (cnt[log.intencion] || 0) + 1
    return Object.entries(cnt).map(([name, value]) => ({ name, value }))
  }, [filteredLogs])

  const hourlyDistribution = useCallback(() => {
    const hourCount: Record<number, number> = {}
    for (let i = 0; i < 24; i++) hourCount[i] = 0
    for (const log of filteredLogs()) {
      const hour = log.date.toDate().getHours()
      hourCount[hour]++
    }
    return Object.entries(hourCount).map(([hour, count]) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      messages: count,
    }))
  }, [filteredLogs])

  return {
    logs,
    loading,
    error,
    sessions,
    kpis,
    messagesByDay,
    categoryDistribution,
    intentionDistribution,
    hourlyDistribution,
    getSessionMessages,
  }
}
