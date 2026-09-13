/**
 * プッシュ通知クライアント
 *
 * - Service Worker の登録
 * - 通知許可の取得
 * - 購読トークンの管理
 */

import { supabase } from './supabase'

// VAPID 公開鍵（環境変数から取得）
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

/**
 * Service Worker を登録
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    })
    console.log('[Push] Service Worker registered:', registration)
    return registration
  } catch (error) {
    console.error('[Push] SW registration failed:', error)
    return null
  }
}

/**
 * プッシュ通知許可をリクエスト
 * @returns {Promise<'granted'|'denied'|'default'>}
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Notification not supported')
    return 'default'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission
  }

  return 'denied'
}

/**
 * プッシュ購読を取得・登録
 * @param {string} farmerId - 農家ID（オプション）
 * @returns {Promise<PushSubscriptionJSON|null>}
 */
export async function subscribeToPushNotifications(farmerId = null) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('[Push] Push notifications not supported')
    return null
  }

  if (!VAPID_PUBLIC_KEY) {
    console.error('[Push] VAPID_PUBLIC_KEY not configured')
    return null
  }

  try {
    // Service Worker 登録
    const registration = await registerServiceWorker()
    if (!registration) return null

    // 通知許可を取得
    const permission = await requestNotificationPermission()
    if (permission !== 'granted') {
      console.log('[Push] Notification permission:', permission)
      return null
    }

    // 既存の購読をチェック
    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      // 新しく購読
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })
      console.log('[Push] New subscription:', subscription)
    } else {
      console.log('[Push] Existing subscription found')
    }

    // Supabase に登録
    await savePushSubscription(subscription, farmerId)

    return subscription.toJSON()
  } catch (error) {
    console.error('[Push] Subscribe error:', error)
    return null
  }
}

/**
 * 購読をSupabaseに保存
 */
async function savePushSubscription(subscription, farmerId = null) {
  try {
    const subscriptionData = subscription.toJSON()
    const { endpoint, keys } = subscriptionData

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        farmer_id: farmerId,
        user_agent: navigator.userAgent,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'endpoint'
      })

    if (error) {
      console.error('[Push] Save subscription error:', error)
      return false
    }

    console.log('[Push] Subscription saved to Supabase')
    return true
  } catch (error) {
    console.error('[Push] Save subscription error:', error)
    return false
  }
}

/**
 * プッシュ購読を解除
 */
export async function unsubscribeFromPushNotifications() {
  try {
    if (!('serviceWorker' in navigator)) return

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()

      // Supabase から削除
      await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('endpoint', subscription.endpoint)

      console.log('[Push] Unsubscribed')
      return true
    }
  } catch (error) {
    console.error('[Push] Unsubscribe error:', error)
  }

  return false
}

/**
 * 現在の購読ステータスを確認
 */
export async function getPushSubscriptionStatus() {
  try {
    if (!('serviceWorker' in navigator)) return null

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    const permission = Notification.permission

    return {
      isSubscribed: !!subscription,
      permission,
      subscription: subscription ? subscription.toJSON() : null
    }
  } catch (error) {
    console.error('[Push] Status check error:', error)
    return null
  }
}

/**
 * テスト通知を送信（開発用）
 */
export async function sendTestNotification(title = 'テスト通知', body = 'プッシュ通知が機能しています') {
  try {
    if (!('serviceWorker' in navigator)) return false

    const registration = await navigator.serviceWorker.ready
    await registration.showNotification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'test-notification'
    })

    console.log('[Push] Test notification sent')
    return true
  } catch (error) {
    console.error('[Push] Test notification error:', error)
    return false
  }
}

/**
 * Base64 を Uint8Array に変換（VAPID 鍵用）
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)))
}

/**
 * iOS Safari 対応チェック
 */
export function isIOSSafari() {
  const ua = navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(ua) && /safari/.test(ua) && !/chrome|firefox/.test(ua)
}

/**
 * プッシュ通知対応状況
 */
export function getPushNotificationSupport() {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    notification: 'Notification' in window,
    pushManager: 'PushManager' in window,
    isSupported: 'serviceWorker' in navigator && 'Notification' in window && 'PushManager' in window,
    isIOSSafari: isIOSSafari()
  }
}
