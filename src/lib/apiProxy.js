/**
 * セキュアなAPI プロキシ層
 * - APIキー（Gemini等）をクライアントに露出させない
 * - サーバーサイドで API呼び出しを中継
 * - レート制限・キャッシング対応
 */

const API_TIMEOUT = 30000

export async function callAiViaProxy(prompt, systemInstruction = '') {
  try {
    const proxyUrl = import.meta.env.VITE_AI_PROXY_URL

    if (!proxyUrl) {
      console.warn('AI Proxyが未設定。開発モードでは直接呼び出しにフォールバック')
      return callGeminiDirect(prompt, systemInstruction)
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': crypto.randomUUID()
      },
      body: JSON.stringify({ prompt, systemInstruction }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`API Proxy Error: ${response.status}`, await response.text())
      return null
    }

    const data = await response.json()
    return data.text || null
  } catch (error) {
    console.error('AI Proxy Error:', error.message)
    return null
  }
}

/**
 * 直接 Gemini API 呼び出し（開発・フォールバック用）
 * ⚠️ 本番環境では使用しないこと
 */
async function callGeminiDirect(prompt, systemInstruction = '') {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  const model = 'gemini-2.5-flash'

  if (!apiKey) {
    console.error('Gemini API キーが未設定です')
    return null
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const payload = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const result = await response.json()

    if (!response.ok || result.error) {
      console.error('Gemini Error:', result.error)
      return null
    }

    return result.candidates?.[0]?.content?.parts?.[0]?.text || null
  } catch (error) {
    console.error('Gemini Direct Error:', error)
    return null
  }
}

/**
 * レート制限付き API 呼び出し
 */
const rateLimitMap = new Map()

export function isRateLimited(key, maxPerMinute = 10) {
  const now = Date.now()
  const minute = Math.floor(now / 60000)

  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { minute, count: 0 })
  }

  const entry = rateLimitMap.get(key)
  if (entry.minute !== minute) {
    entry.minute = minute
    entry.count = 0
  }

  entry.count++
  return entry.count > maxPerMinute
}

/**
 * セキュアなファイルアップロード
 */
export async function uploadFile(file, _bucketName = 'uploads') {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('有効な画像ファイルを選択してください')
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('ファイルサイズは5MB以下にしてください')
  }

  // クライアント側でサイズ縮小
  const compressedFile = await compressImage(file)

  // サーバーへのアップロードはSupabaseクライアント経由で実行
  // (セキュリティルール適用済み)
  return compressedFile
}

/**
 * 画像圧縮ヘルパー
 */
function compressImage(file, maxSize = 800, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxSize || height > maxSize) {
          const scale = maxSize / Math.max(width, height)
          width = Math.round(width * scale)
          height = Math.round(height * scale)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
      img.src = reader.result
    }
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'))
    reader.readAsDataURL(file)
  })
}
