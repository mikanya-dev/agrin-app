import React, { useMemo, useState, useEffect } from 'react'
import { ShoppingBag, CalendarDays, Sparkles, Loader2, ChevronRight, X as CloseIcon } from 'lucide-react'
import { generateCropDescription } from '../lib/gemini'

const parseMonths = (timing) => {
  if (!timing) return []
  return timing.match(/\d+/g)?.map(Number) || []
}

export default function BuyPage({ farmers = [], onVarietyClick = () => {} }) {
  const [selectedCrop, setSelectedCrop] = useState(null)
  const [aiSuggestion, setAiSuggestion] = useState(null)
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const currentMonth = new Date().getMonth() + 1
  const nextMonth = (currentMonth % 12) + 1

  // モーダルが開かれたら AI生成を実行
  useEffect(() => {
    if (selectedCrop) {
      setIsGeneratingAi(true)
      setAiSuggestion(null)
      const generateAi = async () => {
        // 販売時期から最初の月を取得
        const months = selectedCrop.activeMonths && selectedCrop.activeMonths.length > 0
          ? selectedCrop.activeMonths[0]
          : currentMonth
        const text = await generateCropDescription(selectedCrop.name, months, '')
        setAiSuggestion(text)
        setIsGeneratingAi(false)
      }
      generateAi()
    }
  }, [selectedCrop, currentMonth])

  // 現在月と来月の旬の商品を収集
  const currentSeasonItems = useMemo(() => {
    let items = []
    farmers.forEach(farmer => {
      if (farmer.crops_list?.salesRows) {
        farmer.crops_list.salesRows.forEach(item => {
          const months = parseMonths(item.timing)
          if ((months.includes(currentMonth) || months.includes(nextMonth)) && item.content) {
            items.push({
              ...item,
              farmerName: farmer.farm_name,
              farmerId: farmer.id,
              farmerIcon: farmer.icon_url
            })
          }
        })
      }
    })
    return items
  }, [farmers, currentMonth, nextMonth])

  // 品種ごとにグループ化
  const groupedVarieties = useMemo(() => {
    let varieties = {}
    currentSeasonItems.forEach(item => {
      if (!varieties[item.content]) {
        varieties[item.content] = {
          name: item.content,
          items: [],
          activeMonths: []
        }
      }
      varieties[item.content].items.push(item)
      const months = parseMonths(item.timing)
      months.forEach(m => {
        if (!varieties[item.content].activeMonths.includes(m)) {
          varieties[item.content].activeMonths.push(m)
        }
      })
    })
    return Object.values(varieties)
  }, [currentSeasonItems])

  // 年間スケジュール用データ
  const scheduleData = useMemo(() => {
    let dataMap = new Map()
    farmers.forEach(farmer => {
      if (farmer.crops_list?.salesRows) {
        farmer.crops_list.salesRows.forEach(item => {
          if (item.content && item.timing) {
            const varietyName = item.content
            if (!dataMap.has(varietyName)) {
              dataMap.set(varietyName, {
                name: varietyName,
                activeMonths: new Set(),
                items: []
              })
            }
            const entry = dataMap.get(varietyName)
            const itemMonths = parseMonths(item.timing)
            itemMonths.forEach(m => entry.activeMonths.add(m))
            entry.items.push({
              farmerName: farmer.farm_name,
              ...item
            })
          }
        })
      }
    })

    return Array.from(dataMap.values()).map(entry => ({
      name: entry.name,
      activeMonths: Array.from(entry.activeMonths).sort((a, b) => a - b),
      items: entry.items
    })).sort((a, b) => {
      const minA = a.activeMonths.length > 0 ? a.activeMonths[0] : 13
      const minB = b.activeMonths.length > 0 ? b.activeMonths[0] : 13
      return minA - minB
    })
  }, [farmers])

  // 選択された品種を作っている農家を見つける
  const selectedCropFarmers = useMemo(() => {
    if (!selectedCrop) return []
    return farmers.filter(farmer =>
      farmer.crops_list?.salesRows?.some(item => item.content === selectedCrop.name)
    )
  }, [selectedCrop, farmers])

  return (
    <div className="pb-32 px-4 space-y-8 font-bold">
      {/* ページヘッダー */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-100 to-yellow-50 p-6 shadow-lg mb-6 border-4 border-white -mx-4">
        <div className="absolute top-[-20px] right-[-20px] text-yellow-300 opacity-50"><ShoppingBag size={100} /></div>
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="bg-white/60 p-2 rounded-xl">
              <ShoppingBag size={28} className="text-orange-500" />
            </div>
            <h1 className="text-3xl font-black text-orange-600">ゆがわらアグリの旬</h1>
          </div>
          <div className="flex justify-center">
            <div className="bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-orange-200">
              <p className="text-xs font-bold text-gray-700">各園の旬をお伝えします</p>
            </div>
          </div>
        </div>
      </div>

      {/* 今、これが旬！*/}
      <div className="space-y-4">
        <div className="flex items-center justify-between pl-2">
          <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <span className="bg-red-100 p-1.5 rounded-lg text-red-500">🌱</span>
            今、これが旬！
            <span className="text-sm font-bold text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200">{currentMonth}月 〜 {nextMonth}月</span>
          </h3>
        </div>

        {groupedVarieties.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {groupedVarieties.map((variety, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedCrop(variety)}
                className="bg-white rounded-xl p-3 border border-orange-100 shadow-sm flex items-center justify-between cursor-pointer hover:bg-orange-50 transition-colors active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-[120px] flex items-center gap-3 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold text-base shrink-0">
                      {variety.name[0]}
                    </div>
                    <h4 className="text-sm font-black text-gray-800 leading-tight break-words whitespace-normal">{variety.name}</h4>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-bold">{variety.items.length}件</span>
                  <ChevronRight size={20} className="text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-[2rem] p-8 text-center text-gray-400 font-bold border-2 border-dashed border-gray-200">
            ただいま準備中...<br/>来月の旬をお楽しみに！
          </div>
        )}
      </div>

      {/* 年間旬スケジュール */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between pl-2">
          <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
            <span className="bg-green-100 p-1.5 rounded-lg text-green-600">📅</span>
            年間カレンダー
          </h3>
        </div>

        {scheduleData.length > 0 ? (
          <div className="p-4 shadow-sm border-2 border-gray-100 bg-white rounded-2xl font-bold">
            <div className="space-y-3">
              <div className="flex text-[10px] text-gray-400 font-bold border-b border-gray-50 pb-2">
                <div className="w-20 shrink-0">品種名</div>
                <div className="flex-1 grid grid-cols-12 gap-0 text-center text-[9px]">
                  {[...Array(12)].map((_, i) => <div key={i}>{i + 1}</div>)}
                </div>
              </div>
              {scheduleData.map((cropData, idx) => {
                const months = cropData.activeMonths
                return (
                  <div key={idx} onClick={() => setSelectedCrop(cropData)} className="flex items-center text-sm group cursor-pointer active:scale-95 transition-transform hover:bg-orange-50 p-1 rounded-lg">
                    <div className="w-20 shrink-0 font-black text-gray-700 truncate pr-2 text-xs hover:text-orange-500 transition-colors">{cropData.name}</div>
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
        ) : (
          <div className="bg-white rounded-[2rem] p-8 text-center text-gray-400 font-bold border-2 border-dashed border-gray-200">
            まだ予定がありません
          </div>
        )}
      </div>

      {/* 品種詳細モーダル */}
      {selectedCrop && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 md:p-4" onClick={() => setSelectedCrop(null)}>
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-auto max-h-[85vh] relative" onClick={e => e.stopPropagation()}>
            {/* 閉じるボタン */}
            <button onClick={() => setSelectedCrop(null)} className="absolute top-4 right-4 p-3 bg-gray-100 rounded-full text-gray-500 active:scale-90 transition-transform z-30 shadow-sm">
              <CloseIcon size={20} />
            </button>

            {/* スクロール可能領域 */}
            <div className="overflow-y-auto flex-1 scrollbar-hide">
              <div className="p-6 space-y-6 font-bold">
                {/* ヘッダー */}
                <div className="bg-gradient-to-r from-orange-100 to-yellow-50 -m-6 mb-6 p-6 border-b-4 border-orange-400">
                  <h2 className="text-3xl font-black text-gray-800">{selectedCrop.name}</h2>
                </div>

                {/* AI生成品種豆知識 */}
                <div className="bg-orange-50 rounded-2xl p-5 border-t-4 border-orange-500 shadow-sm">
              <p className="text-xs font-black text-orange-600 mb-4 flex items-center gap-2">
                <span>✨</span> AIソムリエの豆知識
              </p>
              {isGeneratingAi ? (
                <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                  <Loader2 size={16} className="animate-spin" />
                  生成中...
                </div>
              ) : aiSuggestion ? (
                <p className="text-sm font-bold text-gray-700 leading-relaxed">{aiSuggestion}</p>
              ) : (
                <p className="text-sm text-gray-500">豆知識を生成できませんでした</p>
              )}
                </div>

                {/* 農家一覧 */}
                <section>
                  <h3 className="text-base font-black text-gray-700 mb-4 ml-2">👨‍🌾 作っている農家さん ({selectedCropFarmers.length})</h3>
                  {selectedCropFarmers.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCropFarmers.map(farmer => {
                        const item = farmer.crops_list?.salesRows?.find(r => r.content === selectedCrop.name)
                        return (
                          <div key={farmer.id} className="bg-blue-50 rounded-2xl p-4 space-y-3">
                            {/* ヘッダー：農家情報と販売月バッジ */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center shrink-0">
                                  {farmer.icon_url ? (
                                    <img src={farmer.icon_url} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-xl">👨</span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <h4 className="font-black text-gray-800 text-sm">{farmer.farm_name}</h4>
                                    {item?.timing && (
                                      <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0">
                                        {item.timing}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 収穫量 */}
                            {item?.volume && (
                              <p className="text-xs font-bold text-orange-600">◎{item.volume}</p>
                            )}

                            {/* 販売情報 */}
                            <p className="text-xs text-gray-600">市場出荷メインのため、LINEからご連絡いただいた場合に販売のご案内をしています🙏</p>

                            <button className="w-full bg-orange-500 text-white py-3 rounded-2xl font-bold hover:bg-orange-600 transition-colors">
                              🏡 農家ページへ
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">この品種を作っている農家さんの情報を取得できませんでした</p>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
