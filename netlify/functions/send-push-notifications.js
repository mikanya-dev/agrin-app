/**
 * Netlify Function: プッシュ通知送信
 *
 * トリガー: Supabase Database Trigger または REST API
 * 機能: 登録ユーザーに一括でプッシュ通知を送信
 */

import webpush from 'web-push'

// 環境変数から VAPID 鍵を取得
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

// web-push の設定
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:admin@yugawara-farm.jp',
    vapidPublicKey,
    vapidPrivateKey
  )
}

export const handler = async (event) => {
  // CORS ヘッダー
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  }

  // OPTIONS リクエスト対応
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers }
  }

  // POST のみ許可
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { postId, title, body, data } = JSON.parse(event.body || '{}')

    if (!postId || !title) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'postId and title are required' })
      }
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured')
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'VAPID keys not configured' })
      }
    }

    // Supabase から登録済み購読者を取得
    const subscriptions = await fetchPushSubscriptions()

    if (subscriptions.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'No subscriptions found',
          sent: 0
        })
      }
    }

    // 通知ペイロード
    const notificationPayload = {
      title,
      body: body || '',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: {
        postId,
        url: data?.url || '/',
        ...data
      }
    }

    // 全購読者に通知を送信（並列処理）
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        sendNotificationToSubscriber(sub, notificationPayload, postId)
      )
    )

    // 結果集計
    const successCount = results.filter((r) => r.status === 'fulfilled' && r.value).length
    const failedCount = results.length - successCount

    console.log(`[Push] Sent: ${successCount}/${subscriptions.length}, Failed: ${failedCount}`)

    // 送信ログを Supabase に保存
    await savePushLog(postId, subscriptions.length, successCount)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        sent: successCount,
        failed: failedCount,
        total: subscriptions.length
      })
    }
  } catch (error) {
    console.error('[Push] Error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Internal server error'
      })
    }
  }
}

/**
 * Supabase から登録済み購読者を取得
 */
async function fetchPushSubscriptions() {
  try {
    // Supabase REST API を使用
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not configured')
      return []
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?is_active=eq.true`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('[Push] Fetch subscriptions error:', response.statusText)
      return []
    }

    return await response.json()
  } catch (error) {
    console.error('[Push] Fetch error:', error)
    return []
  }
}

/**
 * 購読者に通知を送信
 */
async function sendNotificationToSubscriber(subscription, payload, postId) {
  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    }

    await webpush.sendNotification(pushSubscription, JSON.stringify(payload))
    return true
  } catch (error) {
    if (error.statusCode === 410) {
      // 購読が無効（削除済み）
      await markSubscriptionInactive(subscription.endpoint)
    }
    console.error(`[Push] Send error for ${subscription.endpoint}:`, error.message)
    return false
  }
}

/**
 * 購読を無効に更新
 */
async function markSubscriptionInactive(endpoint) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

    await fetch(
      `${supabaseUrl}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: false })
      }
    )
  } catch (error) {
    console.error('[Push] Mark inactive error:', error)
  }
}

/**
 * 送信ログを保存
 */
async function savePushLog(postId, totalSent, successCount) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

    await fetch(`${supabaseUrl}/rest/v1/push_logs`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        post_id: postId,
        total_sent: totalSent,
        success_count: successCount,
        failed_count: totalSent - successCount
      })
    })
  } catch (error) {
    console.error('[Push] Log save error:', error)
  }
}
