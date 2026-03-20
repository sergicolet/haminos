import { NextResponse } from 'next/server'

const WEBHOOK_URL = process.env.N8N_AI_WEBHOOK_URL || 'https://haminos-ecom-n8n.5pbmxd.easypanel.host/webhook/haminos-ai-analyze'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, range, customPrompt, sessionIds, startDate } = body

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        range,
        customPrompt,
        sessionIds,
        startDate,
        source: 'haminos-dashboard',
        timestamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `n8n error: ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
