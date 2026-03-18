"use client"

import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  deleteDoc,
} from '@/lib/firebase'
import { db } from '@/lib/firebase'
import type { MessageAnnotation, ConversationNote, ChangeLog } from '@/lib/types'

interface UserInfo {
  email: string
  displayName: string
}

// ── Message Annotations ────────────────────────────────────────────

export function useMessageAnnotations(chatLogId: string | null) {
  const [annotations, setAnnotations] = useState<MessageAnnotation[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!chatLogId) {
      setAnnotations([])
      return
    }
    setLoading(true)
    const q = query(
      collection(db, 'message_annotations'),
      where('chatLogId', '==', chatLogId),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(q, (snap: any) => {
      setAnnotations(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as MessageAnnotation)))
      setLoading(false)
    })
    return () => unsub()
  }, [chatLogId])

  const addAnnotation = useCallback(
    async (sessionId: string, content: string, type: 'correction' | 'comment', user: UserInfo) => {
      if (!chatLogId || !content.trim()) return
      await addDoc(collection(db, 'message_annotations'), {
        chatLogId,
        sessionId,
        content: content.trim(),
        type,
        status: 'open',
        createdBy: user.email,
        createdByName: user.displayName,
        createdAt: serverTimestamp(),
      })
    },
    [chatLogId]
  )

  const resolveAnnotation = useCallback(async (annotationId: string, user: UserInfo) => {
    await updateDoc(doc(db, 'message_annotations', annotationId), {
      status: 'resolved',
      resolvedBy: user.email,
      resolvedByName: user.displayName,
      resolvedAt: serverTimestamp(),
    })
  }, [])

  return { annotations, loading, addAnnotation, resolveAnnotation }
}

// ── Session Annotations Count (for badge indicators on message list) ──

export function useSessionAnnotationCounts(sessionId: string | null) {
  const [counts, setCounts] = useState<Record<string, { total: number, open: number }>>({})

  useEffect(() => {
    if (!sessionId) return
    const q = query(
      collection(db, 'message_annotations'),
      where('sessionId', '==', sessionId)
    )
    const unsub = onSnapshot(q, (snap: any) => {
      const map: Record<string, { total: number, open: number }> = {}
      snap.docs.forEach((d: any) => {
        const data = d.data()
        const chatLogId = data.chatLogId
        if (!map[chatLogId]) {
          map[chatLogId] = { total: 0, open: 0 }
        }
        map[chatLogId].total++
        if (data.status === 'open') {
          map[chatLogId].open++
        }
      })
      setCounts(map)
    })
    return () => unsub()
  }, [sessionId])

  return counts
}

// ── Conversation Notes ──────────────────────────────────────────────

export function useConversationNotes(sessionId: string | null) {
  const [notes, setNotes] = useState<ConversationNote[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      setNotes([])
      return
    }
    setLoading(true)
    const q = query(
      collection(db, 'conversation_notes'),
      where('sessionId', '==', sessionId),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ConversationNote)))
      setLoading(false)
    })
    return () => unsub()
  }, [sessionId])

  const addNote = useCallback(
    async (content: string, user: UserInfo) => {
      if (!sessionId || !content.trim()) return
      const now = serverTimestamp()
      await addDoc(collection(db, 'conversation_notes'), {
        sessionId,
        content: content.trim(),
        createdBy: user.email,
        createdByName: user.displayName,
        createdAt: now,
        updatedAt: now,
      })
    },
    [sessionId]
  )

  return { notes, loading, addNote }
}

// ── All Annotations (global, for Reviews tab) ──────────────────────

export function useAllAnnotations() {
  const [annotations, setAnnotations] = useState<MessageAnnotation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const q = query(
      collection(db, 'message_annotations'),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap: any) => {
      setAnnotations(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as MessageAnnotation)))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const addAnnotation = useCallback(
    async (content: string, type: 'correction' | 'comment', user: UserInfo) => {
      if (!content.trim()) return
      await addDoc(collection(db, 'message_annotations'), {
        chatLogId: null,
        sessionId: null,
        content: content.trim(),
        type,
        status: 'open',
        createdBy: user.email,
        createdByName: user.displayName,
        createdAt: serverTimestamp(),
      })
    },
    []
  )

  const resolveAnnotation = useCallback(async (annotationId: string, user: UserInfo) => {
    await updateDoc(doc(db, 'message_annotations', annotationId), {
      status: 'resolved',
      resolvedBy: user.email,
      resolvedByName: user.displayName,
      resolvedAt: serverTimestamp(),
    })
  }, [])

  return { annotations, loading, resolveAnnotation, addAnnotation }
}

// ── Change Logs ─────────────────────────────────────────────────────

export function useChangeLogs(sessionId?: string | null) {
  const [logs, setLogs] = useState<ChangeLog[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    let q
    if (sessionId) {
      q = query(
        collection(db, 'change_logs'),
        where('relatedSessionId', '==', sessionId),
        orderBy('createdAt', 'desc')
      )
    } else {
      q = query(collection(db, 'change_logs'), orderBy('createdAt', 'desc'))
    }
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChangeLog)))
      setLoading(false)
    })
    return () => unsub()
  }, [sessionId])

  const addChangeLog = useCallback(
    async (title: string, description: string, user: UserInfo, relatedSessionId?: string) => {
      if (!title.trim()) return
      await addDoc(collection(db, 'change_logs'), {
        title: title.trim(),
        description: description.trim(),
        relatedSessionId: relatedSessionId || null,
        status: 'pending',
        createdBy: user.email,
        createdByName: user.displayName,
        createdAt: serverTimestamp(),
      })
    },
    []
  )

  const markAsApplied = useCallback(async (logId: string, user: UserInfo) => {
    await updateDoc(doc(db, 'change_logs', logId), {
      status: 'applied',
      appliedAt: serverTimestamp(),
      appliedBy: user.email,
      appliedByName: user.displayName,
    })
  }, [])

  return { logs, loading, addChangeLog, markAsApplied }
}

// ── AI Reports ───────────────────────────────────────────────────────

export function useAIReports() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    // No usamos orderBy('createdAt') porque filtraría documentos que solo tengan 'datetime'
    const q = query(collection(db, 'ai_reports'))
    const unsub = onSnapshot(q, (snap) => {
      const fetchedReports = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      
      // Ordenamos en memoria para soportar ambos formatos (createdAt y datetime)
      fetchedReports.sort((a: any, b: any) => {
        const dateA = a.datetime ? new Date(a.datetime).getTime() : (a.createdAt?.toDate?.() || new Date(0)).getTime();
        const dateB = b.datetime ? new Date(b.datetime).getTime() : (b.createdAt?.toDate?.() || new Date(0)).getTime();
        return dateB - dateA;
      })

      setReports(fetchedReports)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const deleteReport = useCallback(async (reportId: string) => {
    await deleteDoc(doc(db, 'ai_reports', reportId))
  }, [])

  return { reports, loading, deleteReport }
}
