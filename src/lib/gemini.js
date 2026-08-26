const GEMINI_MODEL = "gemini-2.5-flash"

/**
 * Gemini API 呼び出しヘルパー
 * @param {string} prompt - AIへの指示・質問
 * @param {string} systemInstruction - AIの振る舞い設定
 * @returns {Promise<string|null>} 生成テキスト。失敗時は null
 */
export async function callGemini(prompt, systemInstruction = "あなたは湯河原の農業に詳しいプロのライターです。") {
  try {
    // プロキシ経由 (本番)
    const AI_PROXY_URL = import.meta.env.VITE_AI_PROXY_URL || ""
    if (AI_PROXY_URL) {
      const response = await fetch(AI_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemInstruction })
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.text) {
        console.error("AI Proxy Error:", response.status, result)
        return null
      }
      return result.text
    }

    // 直接呼び出し (開発用)
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!apiKey) {
      console.error("Gemini APIキーが未設定です")
      return null
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
    const payload = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      console.error("Gemini API Error:", response.status)
      return null
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null
  } catch (error) {
    console.error("AI Error:", error)
    return null
  }
}

/**
 * 農園説明文を生成
 */
export async function generateFarmDescription(farmName, crops, area) {
  const prompt = `
湯河原の農園「${farmName}」の魅力的な説明文を200字以内で作成してください。
栽培品目: ${crops}
${area ? `所在地: ${area}` : ''}

消費者向けに、親しみやすく、購買意欲が湧く表現で記述してください。
`
  return callGemini(prompt)
}

/**
 * アピールポイントを生成
 */
export async function generateAppealPoint(farmName, crops, specialty) {
  const prompt = `
湯河原の農園「${farmName}」のアピールポイント（短い強み）を50字以内で作成してください。
栽培品目: ${crops}
${specialty ? `特徴: ${specialty}` : ''}

インパクトのある、記憶に残るフレーズでお願いします。
`
  return callGemini(prompt)
}

/**
 * 品種説明を生成
 */
export async function generateCropDescription(cropName, season, farmName) {
  const prompt = `
品種「${cropName}」についての説明を作成してください キャーって感じで

【構成】以下の3つの要素を含めてください：

1. 名前の由来
   品種名がどうして名付けられたのか その背景や意味を簡潔に

2. 味のオススメ理由
   味の特徴（甘さ 酸味 食感など）と食べ方のオススメを楽しく

3. 豆知識
   栽培の工夫 栄養 歴史 選び方など ユーザーが喜ぶ情報

【重要】
- 全体で120〜150文字程度
- 絵文字を2〜3個含める
- 句読点は最小限に マジで句読点使わない感じで
- キャーとかオーマイゴッドみたいなテンションの楽しいキャラクターで
- ${season}月が旬です
${farmName ? `- ${farmName}産` : ''}
- 消費者向けに親しみやすく 購買意欲がメラメラになる内容で
`
  return callGemini(prompt)
}
