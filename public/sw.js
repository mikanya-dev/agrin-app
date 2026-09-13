/**
 * Service Worker - プッシュ通知ハンドラ
 *
 * クライアントとバックグラウンドで通知を管理
 */

const CACHE_NAME = 'agrin-app-v1'

// インストール時
self.addEventListener('install', (event) => {
  console.log('[SW] Install')
  self.skipWaiting()
})

// アクティベーション時
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate')
  event.waitUntil(clients.claim())
})

// プッシュ通知受信
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event.data)

  if (!event.data) {
    console.log('[SW] Push event but no data')
    return
  }

  let notificationData = {}
  try {
    notificationData = event.data.json()
  } catch (e) {
    notificationData = {
      title: 'お知らせ',
      body: event.data.text()
    }
  }

  const { title = 'お知らせ', body = '', icon = '/icon-192x192.png', badge = '/badge-72x72.png', data = {} } = notificationData

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag: data.postId || 'agrin-notification',
      data: {
        url: data.url || '/',
        ...data
      },
      vibrate: [100, 50, 100],
      sound: '/notification.mp3',
      requireInteraction: false
    })
  )
})

// 通知クリック時
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.data)

  event.notification.close()

  const urlToOpen = event.notification.data.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 既に開いているウィンドウをチェック
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      // 新しいウィンドウを開く
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// 通知クローズ時（iOS Safari では呼ばれない）
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.data)
})

// バックグラウンド同期（オプション）
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-push-subscription') {
    event.waitUntil(syncPushSubscription())
  }
})

async function syncPushSubscription() {
  try {
    const subscription = await self.registration.pushManager.getSubscription()
    if (subscription) {
      console.log('[SW] Syncing subscription:', subscription)
      // サーバーに購読情報を送信（再度登録）
      await fetch('/api/register-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON())
      })
    }
  } catch (error) {
    console.error('[SW] Sync error:', error)
  }
}
