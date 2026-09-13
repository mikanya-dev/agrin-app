import React, { useState, useEffect } from 'react'
import liff from '@line/liff'
import { supabase } from '../lib/supabase'
import { Loader2, AlertCircle, LogIn, MessageSquare } from 'lucide-react'

export default function FarmerLogin({ onLoginSuccess }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [farmers, setFarmers] = useState([])
  const [selectedFarmerId, setSelectedFarmerId] = useState('')
  const [step, setStep] = useState('initial') // 'initial' | 'select'
  const [isLiffClient, setIsLiffClient] = useState(false)
  const [demoLineId, setDemoLineId] = useState('') // デモ用LINE ID入力

  useEffect(() => {
    initializeLogin()
  }, [])

  const initializeLogin = async () => {
    try {
      const liffId = import.meta.env.VITE_LIFF_ID
      if (!liffId) {
        // LIFF ID がない場合は、農園選択画面へ
        await fetchFarmers()
        setStep('select')
        setLoading(false)
        return
      }

      // ローカル開発時は LIFF をスキップ
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        await fetchFarmers()
        setStep('select')
        setLoading(false)
        return
      }

      // LIFF 初期化
      await liff.init({ liffId })
      const inClient = liff.isInClient()
      setIsLiffClient(inClient)

      if (inClient && liff.isLoggedIn()) {
        // スマホ（LINE LIFF）：既にログイン済み
        const profile = await liff.getProfile()
        await searchAndLoginByLineId(profile.userId)
      } else if (inClient && !liff.isLoggedIn()) {
        // スマホ（LINE LIFF）：未ログイン → liff.login() で認証
        liff.login()
      } else {
        // PC ブラウザ：LINE ログイン画面へ
        setStep('initial')
        setLoading(false)
      }
    } catch (err) {
      console.error('初期化エラー:', err)
      // エラー時は農園選択画面へ
      await fetchFarmers()
      setStep('select')
      setLoading(false)
    }
  }

  const searchAndLoginByLineId = async (lineId) => {
    try {
      const { data, error } = await supabase
        .from('farm_members')
        .select('farm_id')
        .eq('line_id', lineId)
        .single()

      if (error || !data) {
        // 見つからない → 農園選択画面へ
        await fetchFarmers()
        setStep('select')
        setLoading(false)
      } else {
        // 見つかった → LINE ID を保存してログイン
        localStorage.setItem('lineId', lineId)
        onLoginSuccess(data.farm_id)
      }
    } catch (err) {
      console.error('LINE ID 検索エラー:', err)
      // 見つからない場合は農園選択画面へ
      await fetchFarmers()
      setStep('select')
      setLoading(false)
    }
  }

  const fetchFarmers = async () => {
    try {
      const { data, error } = await supabase
        .from('farms')
        .select('id, farm_name')
        .order('id', { ascending: true })

      if (error) throw error
      setFarmers(data || [])
    } catch (err) {
      console.error('農園一覧取得エラー:', err)
      setError('農園一覧の取得に失敗しました')
    }
  }

  const handleSelectFarmer = () => {
    if (!selectedFarmerId) {
      setError('農園を選択してください')
      return
    }
    onLoginSuccess(selectedFarmerId)
  }

  const handleLiffLogin = () => {
    liff.login()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-orange-500 mx-auto mb-4" />
          <p className="font-bold text-gray-700">ログイン中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={24} className="text-red-500" />
            <h2 className="font-bold text-lg text-gray-800">エラー</h2>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={initializeLogin}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600"
          >
            もう一度試す
          </button>
        </div>
      </div>
    )
  }

  // LINE ログイン画面
  if (step === 'initial') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
          <div className="bg-green-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <MessageSquare size={60} className="text-green-500" />
          </div>

          <h1 className="text-3xl font-black text-gray-800 mb-6">LINEでログイン</h1>

          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            農家メンバーの選択には<br/>
            LINEアカウントを使用します。<br/>
            初回の1回だけ設定されれば、<br/>
            次回からは自動でマイページが開きます。
          </p>

          <button
            onClick={handleLiffLogin}
            className="w-full bg-green-500 text-white py-4 rounded-full font-black text-lg hover:bg-green-600 transition-colors mb-6"
          >
            LINEでログインする
          </button>

          {!isLiffClient && (
            <p className="text-xs text-gray-500 text-center">
              PC ブラウザからのアクセスです
            </p>
          )}
        </div>
      </div>
    )
  }

  // 農園選択画面
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full">
        <h1 className="text-2xl font-black text-gray-800 mb-2 text-center">🌾 農園を選択</h1>
        <p className="text-xs text-gray-500 text-center mb-8">連携したい農園を選んでください</p>

        <div className="space-y-4">
          {/* デバッグモード：LINE ID 検索 */}
          {import.meta.env.DEV && (
            <div className="border-2 border-yellow-300 bg-yellow-50 p-4 rounded-2xl">
              <p className="text-xs text-yellow-700 font-bold mb-2">🐛 デバッグ：LINE ID で検索</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={demoLineId}
                  onChange={(e) => setDemoLineId(e.target.value)}
                  placeholder="LINE ID を入力"
                  className="flex-1 p-2 border-2 border-yellow-200 rounded-lg text-xs font-bold focus:border-yellow-400 focus:outline-none"
                />
                <button
                  onClick={() => demoLineId && searchAndLoginByLineId(demoLineId)}
                  disabled={!demoLineId}
                  className="px-3 py-2 bg-yellow-500 text-white text-xs font-bold rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  検索
                </button>
              </div>
            </div>
          )}

          <div>
            <select
              value={selectedFarmerId}
              onChange={(e) => setSelectedFarmerId(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-2xl font-bold text-gray-700 focus:border-green-500 focus:outline-none"
            >
              <option value="">-- 選択してください --</option>
              {farmers.map(farmer => (
                <option key={farmer.id} value={farmer.id}>
                  {farmer.farm_name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSelectFarmer}
            className="w-full bg-green-500 text-white py-4 rounded-2xl font-black hover:bg-green-600 transition-colors"
          >
            ログイン
          </button>
        </div>
      </div>
    </div>
  )
}
