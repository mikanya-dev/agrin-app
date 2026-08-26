import React, { useState } from 'react'
import { Mail, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setMessage({ type: 'error', text: '必須項目を入力してください' })
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('contacts')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            subject: formData.subject,
            message: formData.message,
            created_at: new Date().toISOString()
          }
        ])

      if (error) throw error

      setMessage({ type: 'success', text: 'お問い合わせをお送りしました。ご連絡ありがとうございます。' })
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
      setTimeout(() => setMessage(null), 5000)
    } catch (err) {
      console.error('送信エラー:', err)
      setMessage({ type: 'error', text: 'お問い合わせの送信に失敗しました。もう一度お試しください。' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pb-40 px-4 space-y-6 font-bold">
      {/* メッセージ表示 */}
      {message && (
        <div className={`fixed top-4 left-4 right-4 p-4 rounded-xl shadow-lg z-50 ${
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message.text}
        </div>
      )}

      {/* ヘッダー */}
      <div className="relative overflow-hidden rounded-[2rem] p-6 text-center shadow-lg mb-6 bg-gradient-to-br from-orange-100 to-yellow-50 text-orange-600 border-4 border-white">
        <div className="relative z-10 flex flex-col items-center">
          <h1 className="text-2xl font-black tracking-tight leading-tight mb-2 drop-shadow-sm flex items-center justify-center gap-2">
            <Mail size={32} />
            お問い合わせ
          </h1>
          <div className="inline-block px-4 py-1.5 rounded-full mt-2 bg-white/80 backdrop-blur-sm border border-orange-200">
            <p className="text-xs font-bold text-gray-700">ご質問やご不明な点はこちらからお願いします</p>
          </div>
        </div>
      </div>

      {/* フォーム */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 名前 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">お名前 *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="山田太郎"
              className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm font-bold focus:border-orange-500 focus:outline-none"
              required
            />
          </div>

          {/* メールアドレス */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">メールアドレス *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@mail.com"
              className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm font-bold focus:border-orange-500 focus:outline-none"
              required
            />
          </div>

          {/* 電話番号 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">電話番号</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="090-1234-5678"
              className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm font-bold focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* 件名 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">件名</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="お問い合わせの件名"
              className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm font-bold focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* メッセージ */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">メッセージ *</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="お問い合わせの内容をご入力ください"
              rows="6"
              className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm font-bold focus:border-orange-500 focus:outline-none resize-none"
              required
            />
          </div>

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-2xl font-bold text-white transition-colors ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="inline animate-spin mr-2" />
                送信中...
              </>
            ) : (
              '送信する'
            )}
          </button>
        </form>
      </div>

      {/* 農園ログインリンク */}
      <div className="text-center pb-6">
        <p className="text-xs text-gray-500 mb-2">農園の方はこちら</p>
        <a
          href="?mode=farmer"
          className="text-xs text-green-600 font-bold hover:text-green-700 underline"
        >
          農園ログイン
        </a>
      </div>
    </div>
  )
}
