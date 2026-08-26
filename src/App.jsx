import liff from '@line/liff'
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from './lib/supabase'
import FarmerManagement from './components/FarmerManagement'
import MyPage from './components/MyPage'
import FarmersPageComponent from './components/FarmersPage'
import BuyPage from './components/BuyPage'
import BulletinBoardPage from './components/BulletinBoardPage'
import ContactPage from './components/ContactPage'
import FarmerLogin from './components/FarmerLogin'
import {
  Leaf, ShoppingBag, UserCircle, CheckCircle2, ArrowRight,
  MessageSquare, AlertCircle, Clock, Calendar, Heart,
  Users2, MapPin, Globe, BookOpen, Settings, ChevronRight, Send, Loader2,
  X as CloseIcon, Info, ExternalLink, Sparkles, Sun, Sprout, Camera,
  Upload, Trash2, Edit, RotateCcw, LogOut, ShieldCheck, Mail
} from 'lucide-react'
import './styles/App.css'

// LIFF初期化
const MY_LIFF_ID = import.meta.env.VITE_LIFF_ID || ""
const GEMINI_MODEL = "gemini-2.5-flash"
const AI_PROXY_URL = import.meta.env.VITE_AI_PROXY_URL || ""

const getLiff = () => {
  if (typeof liff !== 'undefined') return liff
  return {
    id: "MOCK_ID",
    init: async () => { console.log("LIFF Mock: Init") },
    getProfile: async () => ({ userId: "mock_user_123", displayName: "テスト太郎" }),
    isLoggedIn: () => false,
    isInClient: () => false,
  }
}

const activeLiff = getLiff()

// Gemini AI呼び出し
async function callGemini(prompt, systemInstruction = "あなたは湯河原の農業に詳しいプロのライターです。") {
  try {
    if (AI_PROXY_URL) {
      const response = await fetch(AI_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemInstruction })
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.text) return null
      return result.text
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!apiKey) return null

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      })
    })
    const result = await response.json()
    if (!response.ok || result.error) return null
    return result.candidates?.[0]?.content?.parts?.[0]?.text || null
  } catch (error) {
    console.error("AI Error:", error)
    return null
  }
}

// UIコンポーネント
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = "button" }) => {
  const base = "w-full py-4 px-6 rounded-full font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
  const variants = {
    primary: "bg-gradient-to-r from-orange-400 to-red-500 text-white",
    secondary: "bg-gradient-to-r from-green-500 to-emerald-600 text-white",
    outline: "bg-white text-gray-700 border-2 border-gray-200",
    ghost: "bg-transparent text-gray-500",
  }
  return (<button type={type} onClick={onClick} className={`${base} ${variants[variant]} ${className}`} disabled={disabled}>{children}</button>)
}

const Card = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-[2rem] p-5 shadow-sm ${className} ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}>{children}</div>
)

// ページヘッダー
const PageHeader = ({ title, icon: Icon }) => (
  <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-100 to-yellow-50 p-6 text-center border-4 border-white shadow-lg mb-6">
    <div className="absolute top-[-20px] right-[-20px] text-yellow-300 opacity-50"><Sun size={100} /></div>
    <div className="absolute bottom-[-10px] left-[-10px] text-green-200 opacity-50"><Leaf size={70} /></div>
    <div className="relative z-10 flex flex-col items-center">
      <h1 className="text-2xl font-black text-orange-600 flex items-center justify-center gap-2">
        {Icon && <Icon size={28} />}
        {title}
      </h1>
    </div>
  </div>
)

// ホームページ
const HomePage = ({ farmers, onNavigate }) => (
  <div className="space-y-4">
    <PageHeader title="湯河原農業プラットフォーム" icon={Leaf} />

    <div className="grid grid-cols-1 gap-4">
      <Card onClick={() => onNavigate('farmers')} className="cursor-pointer hover:shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-green-100 p-4 rounded-full"><UserCircle size={32} className="text-green-600" /></div>
          <div className="flex-1">
            <h3 className="font-black text-lg text-gray-800">農家を探す</h3>
            <p className="text-sm text-gray-500">湯河原の農家さんたち</p>
          </div>
          <ChevronRight className="text-gray-300" />
        </div>
      </Card>

      <Card onClick={() => onNavigate('products')} className="cursor-pointer hover:shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-orange-100 p-4 rounded-full"><ShoppingBag size={32} className="text-orange-600" /></div>
          <div className="flex-1">
            <h3 className="font-black text-lg text-gray-800">商品を見る</h3>
            <p className="text-sm text-gray-500">季節の農産物</p>
          </div>
          <ChevronRight className="text-gray-300" />
        </div>
      </Card>

      <Card onClick={() => onNavigate('map')} className="cursor-pointer hover:shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-4 rounded-full"><MapPin size={32} className="text-blue-600" /></div>
          <div className="flex-1">
            <h3 className="font-black text-lg text-gray-800">農園の場所</h3>
            <p className="text-sm text-gray-500">Google Mapsで確認</p>
          </div>
          <ChevronRight className="text-gray-300" />
        </div>
      </Card>
    </div>

    <Card>
      <h3 className="font-black text-lg mb-3">📱 このアプリについて</h3>
      <p className="text-sm text-gray-600 leading-relaxed">
        湯河原・熱海の農家さんたちと消費者をつなぐプラットフォーム。
        新鮮な農産物の情報をリアルタイムで共有します。
      </p>
    </Card>
  </div>
)

// 農家一覧
const FarmersPage = ({ farmers, onNavigate, onSelectFarmer }) => (
  <div className="space-y-4">
    <PageHeader title="農家さんたち" icon={Users2} />
    <div className="space-y-3">
      {farmers.length === 0 ? (
        <Card><p className="text-center text-gray-500">農家データがありません</p></Card>
      ) : (
        farmers.map((farmer, idx) => (
          <Card
            key={farmer.id}
            onClick={() => { onSelectFarmer(farmer); onNavigate('farmer-detail'); }}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-green-100 rounded-full flex items-center justify-center font-bold text-2xl">
                {idx + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-black text-lg text-gray-800">{farmer.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{farmer.email}</p>
              </div>
              <ChevronRight className="text-gray-300" />
            </div>
          </Card>
        ))
      )}
    </div>
  </div>
)

// 農家詳細
const FarmerDetailPage = ({ farmer, onNavigate }) => {
  const [aiDescription, setAiDescription] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (farmer) {
      const generateDescription = async () => {
        const text = await callGemini(
          `「${farmer.name}」という農家さんについて、その魅力を「めっちゃ楽しくテンション高め」に紹介してください。\n【条件】\n・100文字以内\n・絵文字をふんだんに使う\n・親しみやすい口語調`,
          "あなたは湯河原の陽気なライターです。"
        )
        setAiDescription(text)
        setIsLoading(false)
      }
      generateDescription()
    }
  }, [farmer])

  if (!farmer) return null

  return (
    <div className="space-y-4">
      <button onClick={() => onNavigate('farmers')} className="mb-4 text-sm font-bold text-orange-600 flex items-center gap-1">← 農家一覧に戻る</button>
      <PageHeader title={farmer.name} icon={UserCircle} />

      {isLoading ? (
        <Card><div className="flex items-center justify-center gap-2"><Loader2 size={20} className="animate-spin" /> AIが説明を考え中...</div></Card>
      ) : (
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-orange-100">
          <div className="flex gap-3">
            <Sparkles size={20} className="text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-black text-orange-400 mb-1">AI紹介</p>
              <p className="text-sm font-bold text-gray-700">{aiDescription || "読み込み中..."}</p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="font-black mb-3">📧 連絡先</h3>
        <p className="text-sm text-gray-600 break-all">{farmer.email}</p>
      </Card>

      <Button variant="secondary">農家さんに連絡する</Button>
    </div>
  )
}

// 商品一覧
const ProductsPage = ({ farmers, onNavigate }) => {
  const products = useMemo(() => {
    const allProducts = []
    farmers.forEach(farmer => {
      allProducts.push({
        id: `${farmer.id}_main`,
        name: `${farmer.name}の農産物`,
        farmer: farmer.name,
        description: "新鮮な季節の野菜"
      })
    })
    return allProducts
  }, [farmers])

  return (
    <div className="space-y-4">
      <PageHeader title="商品を探す" icon={ShoppingBag} />
      <div className="space-y-3">
        {products.length === 0 ? (
          <Card><p className="text-center text-gray-500">商品がありません</p></Card>
        ) : (
          products.map(product => (
            <Card key={product.id} className="cursor-pointer hover:shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-yellow-100 rounded-xl flex items-center justify-center text-2xl">🌾</div>
                <div className="flex-1">
                  <h3 className="font-black text-lg text-gray-800">{product.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">農家: {product.farmer}</p>
                </div>
                <ChevronRight className="text-gray-300" />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

// マップページ
const MapPage = ({ farmers }) => {
  const mapRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current) return

    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
    const initMap = () => {
      const { google } = window
      if (!google) return

      const map = new google.maps.Map(mapRef.current, {
        zoom: 13,
        center: { lat: 35.1459, lng: 139.1022 },
        mapTypeControl: false,
        fullscreenControl: true,
        zoomControl: true,
      })

      farmers.forEach(farmer => {
        new google.maps.Marker({
          position: { lat: 35.1459 + Math.random() * 0.01, lng: 139.1022 + Math.random() * 0.01 },
          map: map,
          title: farmer.name,
          label: { text: '🌾', fontSize: '20px' }
        })
      })
    }

    if (!window.google) {
      const script = document.createElement('script')
      script.src = GOOGLE_MAPS_API_KEY
        ? `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`
        : 'https://maps.googleapis.com/maps/api/js'
      script.async = true
      script.defer = true
      script.onload = initMap
      document.head.appendChild(script)
    } else {
      initMap()
    }
  }, [farmers])

  return (
    <div className="space-y-4">
      <PageHeader title="農園マップ" icon={MapPin} />
      <Card>
        <div ref={mapRef} style={{ width: '100%', height: '400px' }} className="rounded-2xl" />
      </Card>
      <Card>
        <p className="text-sm text-gray-600">湯河原・熱海地域の農園位置を表示しています。</p>
      </Card>
    </div>
  )
}

// ナビゲーション
const Navigation = ({ currentPage, onNavigate, isFarmerLoggedIn }) => {
  const menuItems = isFarmerLoggedIn
    ? [
        { id: 'know', icon: BookOpen, label: '知る' },
        { id: 'buy', icon: ShoppingBag, label: '買う' },
        { id: 'farmer_board', icon: MessageSquare, label: '広場' },
        { id: 'farmer-bulletin', icon: ShieldCheck, label: '農家掲示板' },
        { id: 'mypage', icon: UserCircle, label: 'マイページ' },
      ]
    : [
        { id: 'know', icon: BookOpen, label: '知る' },
        { id: 'buy', icon: ShoppingBag, label: '買う' },
        { id: 'farmer_board', icon: MessageSquare, label: '広場' },
        { id: 'empty', icon: null, label: '' }, // 空白
        { id: 'contact', icon: Mail, label: 'お問合せ' },
      ]

  return (
    <div className={`fixed bottom-0 left-0 right-0 shadow-lg transition-colors ${
      isFarmerLoggedIn
        ? 'bg-gradient-to-r from-green-600 to-emerald-600'
        : 'bg-white border-t border-gray-200'
    }`}>
      <div className="grid gap-0 p-0 max-w-2xl mx-auto" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {menuItems.map(({ id, icon: Icon, label }) => {
          if (id === 'empty') {
            return <div key={id} />
          }

          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex flex-col items-center gap-1 py-4 px-2 transition-colors ${
                isFarmerLoggedIn
                  ? currentPage === id
                    ? 'text-white border-b-2 border-white'
                    : 'text-white/70 border-b-2 border-transparent hover:text-white/90'
                  : currentPage === id
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-gray-400 border-b-2 border-transparent hover:text-gray-600'
              }`}
            >
              {Icon && <Icon size={24} />}
              <span className="text-xs font-bold">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// メインアプリ
export default function App() {
  const [session, setSession] = useState(null)
  const [farmers, setFarmers] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('know')
  const [selectedFarmer, setSelectedFarmer] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')

  // farmerId を localStorage から復元
  const [farmerId, setFarmerId] = useState(() => {
    const saved = localStorage.getItem('farmerId')
    return saved || null
  })

  // ログインフラグを localStorage から復元
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const saved = localStorage.getItem('isLoggedIn')
    return saved === 'true'
  })

  // LINE IDを state で管理
  const [lineId, setLineId] = useState(() => {
    const saved = localStorage.getItem('lineId')
    return saved || null
  })

  const [isFarmerMode, setIsFarmerMode] = useState(false)

  // URL パラメータで農家モードを検出
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('mode') === 'farmer') {
      setIsFarmerMode(true)
    }
  }, [])

  // farmerId と isLoggedIn を localStorage に保存
  useEffect(() => {
    if (farmerId) {
      localStorage.setItem('farmerId', farmerId)
    } else {
      localStorage.removeItem('farmerId')
    }
  }, [farmerId])

  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem('isLoggedIn', 'true')
    } else {
      localStorage.removeItem('isLoggedIn')
    }
  }, [isLoggedIn])

  // LINE ID を localStorage に保存
  useEffect(() => {
    if (lineId) {
      localStorage.setItem('lineId', lineId)
    } else {
      localStorage.removeItem('lineId')
    }
  }, [lineId])

  // ログイン状態で自動的にマイページを表示
  useEffect(() => {
    if (isLoggedIn && farmerId) {
      setCurrentPage('mypage')
    } else if (!isLoggedIn && currentPage === 'mypage') {
      // ログアウト時はお客様モードに戻す
      setCurrentPage('know')
    }
  }, [isLoggedIn, farmerId])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription?.unsubscribe()
  }, [])

  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        const { data, error } = await supabase
          .from('farms')
          .select('*')

        if (error) throw error

        // farm_profiles から is_active = true のものを取得
        if (data && data.length > 0) {
          const { data: profiles } = await supabase
            .from('farm_profiles')
            .select('farm_id, icon_url, crops_list')
            .eq('is_active', true)

          const profileMap = profiles?.reduce((acc, p) => {
            acc[p.farm_id] = p
            return acc
          }, {}) || {}

          const activeFarmIds = Object.keys(profileMap)
          const activeFarms = data
            .filter(f => activeFarmIds.includes(f.id))
            .map(f => ({ ...f, icon_url: profileMap[f.id]?.icon_url, crops_list: profileMap[f.id]?.crops_list }))

          setFarmers(activeFarms)
        } else {
          setFarmers([])
        }
      } catch (err) {
        console.error('農家データ取得エラー:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFarmers()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 size={40} className="animate-spin text-orange-500" /></div>
  }

  // 農家ログインモード
  if (isFarmerMode && !farmerId) {
    return (
      <FarmerLogin
        onLoginSuccess={(id) => {
          setFarmerId(id)
          setCurrentPage('mypage')
          // URL から ?mode=farmer を削除
          window.history.replaceState({}, document.title, window.location.pathname)
        }}
      />
    )
  }

  const renderPage = () => {
    const pageProps = { farmers, onNavigate: setCurrentPage, onSelectFarmer: setSelectedFarmer }

    switch (currentPage) {
      case 'know':
        return <FarmersPageComponent farmers={farmers} onNavigate={setCurrentPage} onSelectFarmer={setSelectedFarmer} />
      case 'farmer-detail':
        return <FarmerDetailPage farmer={selectedFarmer} onNavigate={setCurrentPage} />
      case 'buy':
        return <BuyPage farmers={farmers} />
      case 'farmer_board':
        return <BulletinBoardPage farmers={farmers} boardType="customer" />
      case 'farmer-bulletin':
        return <BulletinBoardPage farmers={farmers} boardType="farmer" />
      case 'contact':
        return <ContactPage />
      case 'mypage':
        return <MyPage farmerId={farmerId} onLogout={() => {
          setIsLoggedIn(false)
          setCurrentPage('know')
        }} />
      default:
        return (
          <div className="space-y-4">
            <PageHeader title="マイページ" icon={UserCircle} />
            {!isAdmin ? (
              <Card>
                <button
                  onClick={() => setIsAdmin(true)}
                  className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600"
                >
                  管理者として農園情報を操作
                </button>
              </Card>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => setIsAdmin(false)}
                  className="w-full bg-gray-300 text-gray-700 py-2 rounded-xl font-bold"
                >
                  終了
                </button>
                <FarmerManagement lineId="admin" onSaveSuccess={() => fetchFarmers()} />
              </div>
            )}
          </div>
        )
    }
  }

  // `/farmer` URL の場合はログイン画面表示
  const isFarmerPath = window.location.pathname === '/farmer'

  if (isFarmerPath && !isLoggedIn) {
    return <FarmerLogin onLoginSuccess={(id) => {
      setFarmerId(id)
      setIsLoggedIn(true)
    }} />
  }

  // `/farmer` 以外で farmerId がない場合はスキップ（通常画面表示）

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 pb-24">
      <style>{`
        body {
          font-family: "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Open Sans", sans-serif;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* 開発モード用のデバッグ表示 */}
      {import.meta.env.DEV && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-300 text-black p-2 text-xs font-mono z-50 flex gap-4 flex-wrap">
          <div>farmerId: <span className="font-bold">{farmerId || 'null'}</span></div>
          <div>isLoggedIn: <span className="font-bold">{isLoggedIn ? 'true' : 'false'}</span></div>
          <div>lineId: <span className="font-bold">{lineId || 'null'}</span></div>
        </div>
      )}

      <div className="max-w-2xl mx-auto p-4">
        {renderPage()}
      </div>

      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} isFarmerLoggedIn={isLoggedIn} />
    </div>
  )
}
