import type { Timestamp } from '@/lib/firebase'

// ── Review System ────────────────────────────────────────────────
export interface MessageAnnotation {
  id: string
  chatLogId?: string
  sessionId?: string
  content: string
  type: 'correction' | 'comment'
  status: 'open' | 'resolved'
  createdBy: string        // email
  createdByName: string
  createdAt: Timestamp
  resolvedBy?: string
  resolvedByName?: string
  resolvedAt?: Timestamp
}

export interface ConversationNote {
  id: string
  sessionId: string
  content: string
  createdBy: string
  createdByName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ChangeLog {
  id: string
  title: string
  description: string
  relatedSessionId?: string
  status: 'pending' | 'applied'
  createdBy: string        // solo admin
  createdByName: string
  createdAt: Timestamp
  appliedAt?: Timestamp
}

export interface AIReport {
  id: string
  type: "daily_summary" | "manual_selection"
  status: "processing" | "completed" | "failed"
  query?: string
  dateRange?: { from: Timestamp; to: Timestamp }
  result?: string // Generated markdown
  sessionIds?: string[]
  createdAt: Timestamp
  createdBy?: string
  createdByName?: string
}

export interface ChatLog {
  id: string
  session: string
  chatInput: string
  message: string
  categoria: string
  intencion: string
  status: string
  type: string
  date: Timestamp
}

export interface Session {
  sessionId: string
  messageCount: number
  firstInteraction: Date
  lastInteraction: Date
  categories: string[]
}

export type BlockType = 'text' | 'tracking' | 'whatsapp' | 'catalog' | 'product'

export interface TextBlock {
  type: 'text'
  data: string
}

export interface TrackingBlock {
  type: 'tracking'
  data: {
    carrier: string
    code: string
    url: string
    message: string
  }
}

export interface WhatsappBlock {
  type: 'whatsapp'
  data: {
    url: string
    label: string
    tiempo?: string
  }
}

export interface CatalogBlock {
  type: 'catalog'
  data: {
    url: string
    label: string
  }
}

export interface ProductBlock {
  type: 'product'
  data: {
    img: string
    title: string
    price: string
    stock?: string
    desc: string
    url: string
    cart?: string
  }[]
}

export type MessageBlock = TextBlock | TrackingBlock | WhatsappBlock | CatalogBlock | ProductBlock

export interface KPIData {
  totalConversations: number
  totalMessages: number
  topCategory: string
  topIntention: string
}
