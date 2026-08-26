import React, { useState, useEffect } from 'react'
import { UserCircle, ExternalLink, Info, Sun, Leaf, X as CloseIcon, MessageSquare, Globe, Link as LinkIcon, Loader2, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { generateCropDescription } from '../lib/gemini'

const parseMonths = (timing) => {
  if (!timing) return []
  return timing.match(/\d+/g)?.map(Number) || []
}

export default function FarmersPage({ farmers = [], onFarmerClick = () => {} }) {
  const [selectedFarmer, setSelectedFarmer] = useState(null)
  const [selectedCrop, setSelectedCrop] = useState(null)
  const [showInfo, setShowInfo] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState(null)
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)

  // モーダルが開かれたら AI生成を実行
  useEffect(() => {
    if (selectedCrop) {
      setIsGeneratingAi(true)
      setAiSuggestion(null)
      const generateAi = async () => {
        const currentMonth = new Date().getMonth() + 1
        // timing から最初の月を抽出（例: "9月, 10月, 11月" → 9）
        let season = currentMonth
        if (selectedCrop.timing) {
          const monthMatch = selectedCrop.timing.match(/\d+/)
          if (monthMatch) {
            season = parseInt(monthMatch[0])
          }
        }
        const text = await generateCropDescription(selectedCrop.content, season, selectedCrop.farmerName)
        setAiSuggestion(text)
        setIsGeneratingAi(false)
      }
      generateAi()
    }
  }, [selectedCrop])

  const shuffledFarmers = [...farmers].sort(() => Math.random() - 0.5)

  const handleFarmerClick = async (farmer) => {
    try {
      // farm_profiles から詳細情報を取得
      const { data } = await supabase
        .from('farm_profiles')
        .select('*')
        .eq('farm_id', farmer.id)
        .single()

      // 詳細情報とマージ
      setSelectedFarmer({ ...farmer, ...data })
      onFarmerClick?.(farmer)
    } catch (error) {
      console.error('農家詳細取得エラー:', error)
      setSelectedFarmer(farmer)
    }
  }

  const handleCropClick = (crop, farmerName, farmerId) => {
    // その品種を作っている全農家を検索
    const farmersWithCrop = []
    farmers.forEach(farmer => {
      if (farmer.crops_list?.salesRows) {
        const foundCrop = farmer.crops_list.salesRows.find(r => r.content === crop.content)
        if (foundCrop) {
          farmersWithCrop.push({
            ...farmer,
            crop: { ...foundCrop, content: crop.content }
          })
        }
      }
    })

    setSelectedCrop({
      ...crop,
      farmerName,
      farmerId,
      relatedFarmers: farmersWithCrop.length > 0 ? farmersWithCrop : [{ farm_name: farmerName, id: farmerId, crop }]
    })
  }

  return (
    <div className="pb-32 px-4 space-y-8 font-bold">
      {/* ページヘッダー */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-100 to-yellow-50 p-6 shadow-lg mb-6 border-4 border-white -mx-4">
        <div className="absolute top-[-20px] right-[-20px] text-yellow-300 opacity-50"><Sun size={100} /></div>
        <div className="absolute bottom-[-10px] left-[-10px] text-green-200 opacity-50"><Leaf size={70} /></div>
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="bg-white/60 p-2 rounded-xl">
              <UserCircle size={28} className="text-orange-500" />
            </div>
            <h1 className="text-3xl font-black text-orange-600">知る</h1>
          </div>
          <div className="flex justify-center">
            <div className="bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-orange-200">
              <p className="text-xs font-bold text-gray-700">団体紹介・メンバーのこと</p>
            </div>
          </div>
          <button onClick={() => setShowInfo(true)} className="absolute top-2 right-2 bg-white/60 hover:bg-white p-2 rounded-full transition-colors">
            <Info size={20} className="text-orange-500" />
          </button>
        </div>
      </div>

      {/* 団体紹介セクション */}
      <div>
        <h3 className="text-lg font-black text-[#4F6F52] mb-4 flex items-center gap-2">🌾 私たちについて</h3>
        <div className="space-y-3">
          <p className="text-sm font-bold text-gray-700">神奈川県湯河原町/静岡県熱海市泉の
「アグリン」という農家団体です</p>

          <div className="bg-white rounded-2xl p-4 border-l-4 border-[#4F6F52] shadow-sm">
            <p className="text-xs font-black text-gray-400 uppercase mb-2">存在意義</p>
            <p className="text-sm text-gray-800 font-bold leading-relaxed">
              個ではできないことを、仲間と一緒に切り開く。<br/>
              繋がり、学び、高めあえる「共存共栄」を目指します
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border-l-4 border-[#4F6F52] shadow-sm">
            <p className="text-xs font-black text-gray-400 uppercase mb-2">活動内容</p>
            <p className="text-sm text-gray-800 font-bold leading-relaxed">
              農家紹介、マルシェやイベント出店、季節の情報発信、農業体験企画など、消費者へ繋ぐ活動をします
            </p>
          </div>
        </div>
      </div>

      {/* メンバー農家グリッド */}
      <div>
        <h3 className="text-lg font-black text-[#4F6F52] mb-4 flex items-center gap-2">🌾 メンバー</h3>
        <div className="grid grid-cols-3 gap-2 px-2 font-bold">
          {shuffledFarmers.map(f => (
            <div key={f.id} className="bg-white p-3 text-center shadow-sm rounded-2xl border border-gray-100 font-bold h-full flex flex-col justify-between">
              <div onClick={() => handleFarmerClick(f)} className="w-20 h-20 bg-green-50 rounded-full mx-auto mb-2 overflow-hidden border-4 border-white shadow-md shrink-0 font-bold cursor-pointer active:scale-95 transition-transform">
                <img src={f.icon_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover font-bold" alt={f.name} />
              </div>
              <h3 onClick={() => handleFarmerClick(f)} className="font-black text-xs mb-1 font-bold cursor-pointer active:text-orange-500 transition-colors leading-tight break-words">
                {f.farm_name || "未設定"}
              </h3>
            </div>
          ))}
        </div>
      </div>

      {/* 情報ポップアップ */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setShowInfo(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#88D8B0]/20 p-2 rounded-full">
                <Info size={24} className="text-[#88D8B0]" />
              </div>
              <h2 className="font-black text-lg text-gray-800">ようこそ</h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-bold text-gray-700 leading-relaxed whitespace-pre-line">
                {`ようこそ、「アグリン」紹介サイトへ🍊

ここは、神奈川県湯河原町で農業に関わる人たちがゆるく繋がり、情報発信する場所です。（一部、静岡県熱海市泉エリア）

つくる人の言葉や想いを知って、農家を身近に感じてもらえたら嬉しいです。

まずは、どんな人たちがいるのかのぞいてみてください。`}
              </p>
              <button onClick={() => setShowInfo(false)} className="w-full bg-[#88D8B0] text-white py-3 rounded-2xl font-bold text-sm hover:bg-[#6BBF95] transition-colors">
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 農家詳細モーダル */}
      {selectedFarmer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 md:p-4" onClick={() => setSelectedFarmer(null)}>
          <div
            className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[95vh] md:h-[90vh] relative"
            onClick={e => e.stopPropagation()}
          >
            {/* 閉じるボタン */}
            <button onClick={() => setSelectedFarmer(null)} className="absolute top-4 left-4 p-3 bg-gray-100 rounded-full text-gray-500 active:scale-90 transition-transform z-30 shadow-sm">
              <CloseIcon size={20} />
            </button>

            {/* スクロール可能領域 */}
            <div className="overflow-y-auto flex-1 scrollbar-hide">
              {/* ヘッダー */}
              <div className="pt-12 px-6 pb-4 bg-white">
                <div className="flex items-start gap-4 text-left">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-orange-100 shadow-lg shrink-0">
                    <img src={selectedFarmer.icon_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt={selectedFarmer.farm_name} />
                  </div>
                  <div className="flex-1">
                    {selectedFarmer.appeal_point && (
                      <div className="mb-2">
                        <span className="bg-yellow-300 text-gray-700 text-xs font-black px-3 py-1.5 rounded-full shadow-md inline-block">{selectedFarmer.appeal_point}</span>
                      </div>
                    )}
                    <h2 className="text-2xl font-black text-gray-800 leading-tight">{selectedFarmer.farm_name || "未設定"}</h2>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-8 pb-10 font-bold">
                {/* 紹介文 */}
                {selectedFarmer.description && (
                  <div className="p-6 shadow-sm border-2 border-gray-100 bg-white rounded-2xl">
                    <p className="text-sm text-gray-800 leading-relaxed font-bold whitespace-pre-wrap">{selectedFarmer.description}</p>
                  </div>
                )}

                {/* SNSリンク */}
                {(selectedFarmer.instagram_id || selectedFarmer.web_url || selectedFarmer.twitter_id) && (
                  <section className="flex gap-2 flex-wrap justify-center pt-2">
                    {selectedFarmer.instagram_id && (
                      <button onClick={() => window.open(`https://instagram.com/${selectedFarmer.instagram_id}`, '_blank')} className="bg-gradient-to-r from-purple-400 to-pink-500 text-white font-bold px-4 py-2 rounded-full text-xs active:scale-90 transition-transform shadow-md">
                        📱 Instagram
                      </button>
                    )}
                    {selectedFarmer.web_url && (
                      <button onClick={() => window.open(selectedFarmer.web_url, '_blank')} className="bg-blue-500 text-white font-bold px-4 py-2 rounded-full text-xs active:scale-90 transition-transform shadow-md">
                        🌐 Web
                      </button>
                    )}
                    {selectedFarmer.twitter_id && (
                      <button onClick={() => window.open(`https://x.com/${selectedFarmer.twitter_id}`, '_blank')} className="bg-sky-500 text-white font-bold px-4 py-2 rounded-full text-xs active:scale-90 transition-transform shadow-md">
                        𝕏 Twitter
                      </button>
                    )}
                  </section>
                )}

                {/* 農園データ */}
                {(selectedFarmer.area_size || selectedFarmer.start_year || selectedFarmer.workers) && (
                  <section className="font-bold">
                    <h4 className="text-base font-black text-orange-500 mb-4 ml-2 border-l-4 border-orange-500 pl-3 uppercase tracking-widest">🏡 農園データ</h4>
                    <div className="p-6 shadow-sm border-2 border-gray-100 bg-white rounded-2xl space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        {selectedFarmer.areas && selectedFarmer.areas.length > 0 && (
                          <div>
                            <p className="text-xs font-black text-gray-400 mb-1">エリア</p>
                            <p className="text-sm text-gray-800">{selectedFarmer.areas.join(' / ')}</p>
                          </div>
                        )}
                        {selectedFarmer.area_size && (
                          <div>
                            <p className="text-xs font-black text-gray-400 mb-1">畑の面積</p>
                            <p className="text-sm text-gray-800">{selectedFarmer.area_size}</p>
                          </div>
                        )}
                        {selectedFarmer.start_year && (
                          <div>
                            <p className="text-xs font-black text-gray-400 mb-1">農園開始年</p>
                            <p className="text-sm text-gray-800">{selectedFarmer.start_year}年</p>
                          </div>
                        )}
                        {selectedFarmer.workers && (
                          <div>
                            <p className="text-xs font-black text-gray-400 mb-1">人数（年間）</p>
                            <p className="text-sm text-gray-800">{selectedFarmer.workers}</p>
                          </div>
                        )}
                      </div>
                      {selectedFarmer.total_volume && (
                        <div className="border-t border-gray-100 pt-4">
                          <p className="text-xs font-black text-gray-400 mb-1">全体の生産量</p>
                          <p className="text-sm text-gray-800">{selectedFarmer.total_volume}</p>
                        </div>
                      )}
                      {selectedFarmer.sales_channels && selectedFarmer.sales_channels.length > 0 && (
                        <div className="border-t border-gray-100 pt-4 font-bold">
                          <p className="text-xs font-black text-gray-400 mb-2">主な販路</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedFarmer.sales_channels.map(ch => (
                              <span key={ch} className="bg-orange-50 text-orange-600 border border-orange-100 px-2 py-1 rounded-lg text-[10px] font-black">
                                {ch}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* 年間販売カレンダー */}
                {selectedFarmer.crops_list && selectedFarmer.crops_list.salesRows && selectedFarmer.crops_list.salesRows.length > 0 && (
                  <section className="font-bold">
                    <h4 className="text-base font-black text-orange-500 mb-4 ml-2 border-l-4 border-orange-500 pl-3 uppercase tracking-widest">🗓 年間販売カレンダー</h4>
                    <div className="p-4 shadow-sm border-2 border-gray-100 bg-white rounded-2xl">
                      <div className="space-y-3">
                        <div className="flex text-[10px] text-gray-400 font-bold border-b border-gray-50 pb-2">
                          <div className="w-20 shrink-0">品種名</div>
                          <div className="flex-1 grid grid-cols-12 gap-0 text-center text-[9px]">
                            {[...Array(12)].map((_, i) => <div key={i}>{i + 1}</div>)}
                          </div>
                        </div>
                        {selectedFarmer.crops_list.salesRows.map((item, idx) => {
                          const months = parseMonths(item.timing)
                          return (
                            <div key={idx} className="flex items-center text-sm group cursor-pointer active:scale-95 transition-transform">
                              <div
                                onClick={() => handleCropClick(item, selectedFarmer.farm_name, selectedFarmer.id)}
                                className="w-20 shrink-0 font-black text-gray-700 truncate pr-2 text-xs hover:text-orange-500 transition-colors"
                              >
                                {item.content}
                              </div>
                              <div className="flex-1 h-3 bg-gray-50 rounded-full relative overflow-hidden border border-gray-100">
                                <div className="absolute inset-0 grid grid-cols-12 gap-0">
                                  {[...Array(12)].map((_, i) => (
                                    <div key={i} className={`h-full ${months.includes(i + 1) ? 'bg-gradient-to-r from-orange-300 to-orange-400' : ''}`} />
                                  ))}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </section>
                )}

                {/* 繁忙期 */}
                {selectedFarmer.crops_list && selectedFarmer.crops_list.busyMonths && selectedFarmer.crops_list.busyMonths.length > 0 && (
                  <section className="font-bold">
                    <h4 className="text-base font-black text-orange-500 mb-4 ml-2 border-l-4 border-orange-500 pl-3 uppercase tracking-widest">⏰ 繁忙期</h4>
                    <div className="p-4 shadow-sm border-2 border-gray-100 bg-white rounded-2xl">
                      <div className="grid grid-cols-6 gap-2">
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                          <div key={m} className={`py-2 px-1 rounded-lg font-bold text-xs text-center transition-all ${selectedFarmer.crops_list.busyMonths.includes(m) ? 'bg-orange-300 text-white' : 'bg-gray-100 text-gray-300'}`}>
                            {m}月
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </div>

            {/* 閉じるボタン（下部） */}
            <div className="p-6 bg-white border-t border-gray-100">
              <button onClick={() => setSelectedFarmer(null)} className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-sm hover:bg-orange-600 transition-colors active:scale-95">
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 品種詳細モーダル */}
      {selectedCrop && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 md:p-4" onClick={() => setSelectedCrop(null)}>
          <div
            className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-auto max-h-[85vh] relative"
            onClick={e => e.stopPropagation()}
          >
            {/* 閉じるボタン */}
            <button onClick={() => setSelectedCrop(null)} className="absolute top-4 right-4 p-3 bg-gray-100 rounded-full text-gray-500 active:scale-90 transition-transform z-30 shadow-sm">
              <CloseIcon size={20} />
            </button>

            {/* スクロール可能領域 */}
            <div className="overflow-y-auto flex-1 scrollbar-hide">
              <div className="p-6 space-y-6 font-bold">
                {/* 品種名 */}
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-3 rounded-xl">
                    <span className="text-2xl">🍊</span>
                  </div>
                  <h2 className="text-2xl font-black text-gray-800">{selectedCrop.content}</h2>
                </div>

                {/* 品種画像 */}
                {selectedCrop.image && (
                  <div className="w-full h-40 overflow-hidden rounded-2xl border-2 border-gray-100">
                    <img src={selectedCrop.image} className="w-full h-full object-cover" alt={selectedCrop.content} />
                  </div>
                )}

                {/* AI生成品種豆知識 */}
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-4 border-t-4 border-orange-400 shadow-sm">
                  <p className="text-xs font-black text-orange-600 mb-3 flex items-center gap-2">
                    <span>🍷</span> AIソムリエの豆知識
                  </p>
                  {isGeneratingAi ? (
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                      <Loader2 size={16} className="animate-spin" />
                      生成中...
                    </div>
                  ) : aiSuggestion ? (
                    <p className="text-sm font-bold text-gray-800 leading-relaxed">{aiSuggestion}</p>
                  ) : (
                    <p className="text-sm text-gray-500">豆知識を生成できませんでした</p>
                  )}
                </div>

                {/* 販売時期 */}
                {selectedCrop.timing && (
                  <div className="bg-yellow-50 rounded-2xl p-4 border-2 border-yellow-100">
                    <p className="text-xs font-black text-gray-400 uppercase mb-2">📅 販売時期</p>
                    <p className="text-lg font-black text-orange-600">{selectedCrop.timing}</p>
                  </div>
                )}

                {/* 収穫量 */}
                {selectedCrop.volume && (
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase mb-2">📦 収穫量</p>
                    <p className="text-base font-bold text-gray-700">{selectedCrop.volume}</p>
                  </div>
                )}

                {/* 作っている農家さん */}
                {selectedCrop.relatedFarmers && selectedCrop.relatedFarmers.length > 0 && (
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase mb-4">👨‍🌾 作っている農家さん</p>
                    <div className="space-y-3">
                      {selectedCrop.relatedFarmers.map((farmer, idx) => (
                        <div key={idx} className="bg-green-50 rounded-2xl p-4 border-2 border-green-100">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 shrink-0 flex items-center justify-center">
                              {farmer.icon_url ? (
                                <img src={farmer.icon_url} className="w-full h-full object-cover" alt={farmer.farm_name} />
                              ) : (
                                <span className="text-xl">👨</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-black text-gray-800">{farmer.farm_name}</p>
                              <p className="text-xs text-gray-500 mt-1">市場出荷メインのため、LINEからご連絡ください</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedCrop(null)
                              handleFarmerClick(farmer)
                            }}
                            className="w-full bg-orange-500 text-white font-bold py-2 rounded-xl active:scale-95 transition-transform text-sm hover:bg-orange-600"
                          >
                            🏡 農家ページへ
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 関連URL */}
                {selectedCrop.url && (
                  <button
                    onClick={() => window.open(selectedCrop.url, '_blank')}
                    className="w-full bg-blue-500 text-white font-bold py-3 rounded-2xl active:scale-95 transition-transform shadow-md hover:bg-blue-600"
                  >
                    🔗 詳しく見る
                  </button>
                )}
              </div>
            </div>

            {/* 閉じるボタン（下部） */}
            <div className="p-6 bg-white border-t border-gray-100">
              <button onClick={() => setSelectedCrop(null)} className="w-full bg-gray-200 text-gray-700 py-3 rounded-2xl font-bold hover:bg-gray-300 transition-colors active:scale-95">
                × 閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
