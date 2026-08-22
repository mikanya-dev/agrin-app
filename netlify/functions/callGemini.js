/**
 * Netlify Function: Gemini API セキュアプロキシ
 *
 * 目的: APIキーをサーバーサイドで保管し、クライアント側を保護
 *
 * 使用方法:
 * 1. Netlifyの環境変数に GEMINI_API_KEY を設定
 * 2. クライアントからこのエンドポイントにPOST
 */

const GEMINI_MODEL = 'gemini-2.5-flash'
const API_TIMEOUT = 30000

// Rate limiting
const rateLimitMap = new Map()

function isRateLimited(identifier, maxPerMinute = 10) {
  const now = Date.now()
  const minute = Math.floor(now / 60000)

  if (!rateLimitMap.has(identifier)) {
    rateLimitMap.set(identifier, { minute, count: 0 })
  }

  const entry = rateLimitMap.get(identifier)
  if (entry.minute !== minute) {
    entry.minute = minute
    entry.count = 0
  }

  entry.count++
  return entry.count > maxPerMinute
}

export default async (req, context) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Request-ID'
      }
    })
  }

  // POSTのみ許可
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error('GEMINI_API_KEY環境変数が未設定')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // リクエスト解析
    const body = await req.json()
    const { prompt, systemInstruction = '' } = body

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid prompt' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Rate limiting チェック
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown'
    if (isRateLimited(clientIp, 10)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Gemini API 呼び出し
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
    const payload = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    const result = await response.json()

    if (!response.ok || result.error) {
      console.error('Gemini API Error:', result.error)
      return new Response(JSON.stringify({
        error: 'API Error',
        details: result.error?.message
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text

    return new Response(JSON.stringify({ text: text || null }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*'
      }
    })
  } catch (error) {
    console.error('Function Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
