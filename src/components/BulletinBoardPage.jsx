import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { MessageSquare, ShieldCheck, Clock, ThumbsUp, X as CloseIcon, Loader2, Sun, Leaf, Check } from 'lucide-react'

export default function BulletinBoardPage({ farmers = [], boardType = 'customer' }) {
  const [posts, setPosts] = useState([])
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostContent, setNewPostContent] = useState('')
  const [penName, setPenName] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [showExpired, setShowExpired] = useState(false)
  const [editingPostId, setEditingPostId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [loadingPosts, setLoadingPosts] = useState(true)

  const tableName = boardType === 'customer' ? 'bulletin_board_customer' : 'bulletin_board_farmer'

  // 投稿一覧を取得
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoadingPosts(true)
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })

        if (error) throw error
        setPosts(data || [])
      } catch (err) {
        console.error('投稿取得エラー:', err)
        setMessage({ type: 'error', text: '投稿の読み込みに失敗しました' })
      } finally {
        setLoadingPosts(false)
      }
    }

    fetchPosts()

    // リアルタイムサブスクリプション（Supabase v2形式）
    const channel = supabase
      .channel(`public:${tableName}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            if (payload.new.status === 'approved') {
              setPosts(prev => [payload.new, ...prev])
            }
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.status === 'approved') {
              setPosts(prev => [payload.new, ...prev.filter(p => p.id !== payload.new.id)])
            } else {
              setPosts(prev => prev.filter(p => p.id !== payload.new.id))
            }
          } else if (payload.eventType === 'DELETE') {
            setPosts(prev => prev.filter(p => p.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tableName])

  const handleAddPost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      setMessage({ type: 'error', text: '内容を入力してください' })
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from(tableName)
        .insert([
          {
            title: newPostTitle,
            content: newPostContent,
            author: penName.trim() || 'お客様',
            status: 'approved',
            end_date: endDate || null,
            likes: 0
          }
        ])

      if (error) throw error

      setNewPostTitle('')
      setNewPostContent('')
      setEndDate('')
      setPenName('')
      setMessage({ type: 'success', text: '投稿しました！' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      console.error('投稿エラー:', err)
      setMessage({ type: 'error', text: '投稿に失敗しました' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePost = async (postId) => {
    if (!window.confirm('この投稿を削除してもよろしいですか？')) return

    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', postId)

      if (error) throw error

      setMessage({ type: 'success', text: '削除しました' })
      setTimeout(() => setMessage(null), 2000)
    } catch (err) {
      console.error('削除エラー:', err)
      setMessage({ type: 'error', text: '削除に失敗しました' })
    }
  }

  const handleLike = async (postId, currentLikes) => {
    try {
      const { error } = await supabase
        .from(tableName)
        .update({ likes: currentLikes + 1 })
        .eq('id', postId)

      if (error) throw error
    } catch (err) {
      console.error('いいねエラー:', err)
    }
  }

  const isFarmerBoard = boardType === 'farmer'
  const headerColor = isFarmerBoard
    ? 'bg-[#88D8B0] text-white border-none'
    : 'bg-gradient-to-br from-orange-100 to-yellow-50 text-orange-600 border-4 border-white'

  const bgColor = isFarmerBoard ? 'bg-[#FFFDF5]' : ''

  // 投稿が終了しているかチェック
  const isPostExpired = (endDateStr) => {
    if (!endDateStr) return false
    return new Date(endDateStr + 'T23:59:59') < new Date()
  }

  // 表示する投稿をフィルター
  const visiblePosts = posts.filter(post => {
    const isExpired = isPostExpired(post.end_date)
    return showExpired || !isExpired
  })

  const expiredPosts = posts.filter(post => isPostExpired(post.end_date))

  return (
    <div className={`pb-40 px-4 space-y-6 text-left font-bold ${bgColor}`}>
      {/* メッセージ表示 */}
      {message && (
        <div className={`fixed top-4 left-4 right-4 p-4 rounded-xl shadow-lg z-50 ${
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message.text}
        </div>
      )}

      {/* ヘッダー */}
      <div className={`relative overflow-hidden rounded-[2rem] p-6 text-center shadow-lg mb-6 ${headerColor}`}>
        {!isFarmerBoard && (
          <>
            <div className="absolute top-[-20px] right-[-20px] text-yellow-300 opacity-50"><Sun size={100} /></div>
            <div className="absolute bottom-[-10px] left-[-10px] text-green-200 opacity-50"><Leaf size={70} /></div>
          </>
        )}
        <div className="relative z-10 flex flex-col items-center">
          <h1 className="text-2xl font-black tracking-tight leading-tight mb-2 drop-shadow-sm flex items-center justify-center gap-2">
            {boardType === 'customer' ? <MessageSquare size={28} /> : <ShieldCheck size={28} />}
            {boardType === 'customer' ? '広場' : '農家専用掲示板'}
          </h1>
          <div className={`inline-block px-4 py-1.5 rounded-full mt-2 ${
            isFarmerBoard ? 'bg-white/20 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm border border-orange-200'
          }`}>
            <p className={`text-xs font-bold ${isFarmerBoard ? 'text-white' : 'text-gray-700'}`}>
              {boardType === 'customer' ? '人が集い、想いが行き交う場所' : '農家同士の情報交換'}
            </p>
          </div>
        </div>
      </div>

      {/* 投稿フォーム */}
      <div className={`rounded-2xl p-6 shadow-sm ${isFarmerBoard ? 'bg-white border border-[#E0E0E0]' : 'bg-white border border-orange-100'}`}>
        <h2 className="text-lg font-black text-gray-800 mb-4">新しい投稿</h2>

        <input
          type="text"
          placeholder="タイトルを入力"
          value={newPostTitle}
          onChange={(e) => setNewPostTitle(e.target.value)}
          className="w-full p-3 mb-3 border border-gray-300 rounded-xl text-sm font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />

        <textarea
          placeholder="内容を入力"
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          className="w-full p-3 mb-3 border border-gray-300 rounded-xl text-sm font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none h-24"
        />

        {!isFarmerBoard && (
          <input
            type="text"
            placeholder="ペンネーム（省略可）"
            value={penName}
            onChange={(e) => setPenName(e.target.value)}
            className="w-full p-3 mb-3 border border-gray-300 rounded-xl text-sm font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        )}

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full p-3 mb-4 border border-gray-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-400"
        />

        <button
          onClick={handleAddPost}
          disabled={isSubmitting}
          className={`w-full py-3 rounded-2xl font-bold text-white transition-colors ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600'
          }`}
        >
          {isSubmitting ? <Loader2 size={20} className="inline animate-spin mr-2" /> : '投稿'}
        </button>
      </div>

      {/* 投稿一覧 */}
      {loadingPosts ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-orange-500" />
        </div>
      ) : visiblePosts.length > 0 ? (
        <div className="space-y-4">
          {visiblePosts.map(post => (
            <div
              key={post.id}
              className={`rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                isFarmerBoard ? 'bg-white border border-[#E0E0E0]' : 'bg-orange-50/50 border border-orange-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{post.title}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Clock size={12} />
                    {post.created_at ? new Date(post.created_at).toLocaleString() : '今'}
                  </p>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.content}</p>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleLike(post.id, post.likes || 0)}
                  className="flex items-center gap-1 text-gray-500 font-bold text-xs hover:text-orange-500"
                >
                  <ThumbsUp size={16} /> {post.likes || 0}
                </button>
                <span className="text-xs text-gray-400">{post.author}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <MessageSquare size={40} className="mx-auto mb-2 opacity-50" />
          <p>投稿がまだありません</p>
        </div>
      )}

      {/* 過去の投稿セクション */}
      {expiredPosts.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowExpired(!showExpired)}
            className="w-full p-4 text-center font-bold text-orange-600 bg-orange-50 rounded-xl border border-orange-200"
          >
            📅 過去のものを表示 ({expiredPosts.length}件)
          </button>

          {showExpired && (
            <div className="space-y-4 mt-4">
              {expiredPosts.map(post => (
                <div
                  key={post.id}
                  className={`rounded-2xl p-4 shadow-sm opacity-60 ${
                    isFarmerBoard ? 'bg-white border border-[#E0E0E0]' : 'bg-orange-50/50 border border-orange-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{post.title}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Clock size={12} />
                        {post.created_at ? new Date(post.created_at).toLocaleString() : '今'}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.content}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-bold">終了</span>
                    <span className="text-xs text-gray-400">{post.author}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
