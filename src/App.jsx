import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import './styles/App.css'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // セッション確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // リアルタイムセッション監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription?.unsubscribe()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">読み込み中...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center py-12">
          <h1 className="text-4xl font-black text-orange-600 mb-2">🌾 農家プラットフォーム</h1>
          <p className="text-gray-600 font-bold">湯河原産直連携 - Supabase + Netlify</p>
        </header>

        <main className="space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-md border-2 border-green-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">✨ セットアップ完了</h2>
            <ul className="space-y-3 text-gray-700 font-bold">
              <li>✅ React + Vite</li>
              <li>✅ Supabase 統合</li>
              <li>✅ Netlify デプロイ設定</li>
              <li>✅ セキュアな API プロキシ層</li>
              <li>✅ Tailwind CSS</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-3xl p-6 border-l-4 border-blue-500">
            <h3 className="font-bold text-blue-900 mb-2">📝 次のステップ</h3>
            <ol className="text-sm text-blue-800 space-y-1 font-bold">
              <li>1. Supabase プロジェクトを作成 (supabase.com)</li>
              <li>2. .env.local に認証情報を追加</li>
              <li>3. Netlify に連携 (github → Netlify)</li>
              <li>4. 環境変数を Netlify に設定</li>
            </ol>
          </div>

          {session ? (
            <div className="bg-green-100 rounded-3xl p-6 border-2 border-green-500">
              <p className="text-green-900 font-bold">🔐 ログイン済み</p>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-3xl p-6">
              <p className="text-gray-600 font-bold">ログイン機能をここに実装できます</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
