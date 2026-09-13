/**
 * プッシュ通知許可モーダル
 */

import React, { useState, useEffect } from 'react'
import { Bell, X, AlertCircle, CheckCircle2, Smartphone } from 'lucide-react'
import { subscribeToPushNotifications, getPushSubscriptionStatus, isIOSSafari, getPushNotificationSupport } from '../lib/pushNotifications'

export function PushNotificationModal({ isOpen, onClose, farmerId = null }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [support] = useState(getPushNotificationSupport())
  const [iOS] = useState(isIOSSafari())

  useEffect(() => {
    if (isOpen) {
      checkSubscriptionStatus()
    }
  }, [isOpen])

  const checkSubscriptionStatus = async () => {
    const status = await getPushSubscriptionStatus()
    setIsSubscribed(status?.isSubscribed || false)
  }

  const handleEnable = async () => {
    if (!support.isSupported) {
      alert('お使いのブラウザではプッシュ通知に対応していません')
      return
    }

    setIsLoading(true)
    try {
      const subscription = await subscribeToPushNotifications(farmerId)
      if (subscription) {
        setIsSubscribed(true)
        // 3秒後に自動クローズ
        setTimeout(() => onClose(), 3000)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Bell className="text-orange-500" size={28} />
            <h2 className="text-2xl font-bold text-gray-800">お知らせを受け取る</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* 本文 */}
        <div className="space-y-4 mb-8">
          {isSubscribed ? (
            <>
              <div className="bg-green-50 rounded-lg p-4 flex gap-3">
                <CheckCircle2 className="text-green-500 flex-shrink-0" size={24} />
                <div>
                  <p className="font-bold text-green-800">有効です</p>
                  <p className="text-sm text-green-700">プッシュ通知の許可設定が完了しました。</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-700">
                新しい投稿やお知らせをリアルタイムで受け取れます。
              </p>

              {/* 対応状況 */}
              {!support.isSupported ? (
                <div className="bg-yellow-50 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} />
                  <div>
                    <p className="font-bold text-yellow-800">非対応ブラウザ</p>
                    <p className="text-sm text-yellow-700">お使いのブラウザはプッシュ通知に対応していません。</p>
                  </div>
                </div>
              ) : iOS ? (
                <div className="bg-blue-50 rounded-lg p-4 flex gap-3">
                  <Smartphone className="text-blue-600 flex-shrink-0" size={24} />
                  <div>
                    <p className="font-bold text-blue-800">iPhone をお使いの方へ</p>
                    <p className="text-sm text-blue-700">
                      iOS Safari ではアプリをフォアグラウンドで開いている間のみ通知が届きます。
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    ✓ ブラウザを閉じていても通知が届きます（Android/Windows/Mac）
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ボタン */}
        <div className="space-y-3">
          {isSubscribed ? (
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-full font-bold text-lg hover:shadow-lg transition-all"
            >
              了解
            </button>
          ) : (
            <>
              <button
                onClick={handleEnable}
                disabled={isLoading || !support.isSupported}
                className={`w-full py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                  isLoading || !support.isSupported
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-400 to-red-500 text-white hover:shadow-lg active:scale-95'
                }`}
              >
                {isLoading ? '処理中...' : '許可する'}
              </button>
              <button
                onClick={onClose}
                className="w-full bg-white text-gray-700 border-2 border-gray-200 py-4 rounded-full font-bold text-lg hover:bg-gray-50 transition-all"
              >
                後で
              </button>
            </>
          )}
        </div>

        {/* フッター */}
        <p className="text-xs text-gray-400 text-center mt-6">
          通知は設定からいつでも変更・オフできます
        </p>
      </div>
    </div>
  )
}
