import React, { useState, useEffect, useRef } from 'react'
import { Calendar, Trash2, Camera, ChevronDown, ChevronUp, ExternalLink, ArrowUp, ArrowDown, Sparkles, Loader2 } from 'lucide-react'
import { generateCropDescription } from '../lib/gemini'

export default function CropsList({ initialData = null, onDataChange = null }) {
  const [busyMonths, setBusyMonths] = useState([])
  const [cropTagsText, setCropTagsText] = useState('')
  const [salesRows, setSalesRows] = useState([])
  const [expandedRows, setExpandedRows] = useState({})
  const isInitializedRef = useRef(false)

  useEffect(() => {
    if (initialData && !isInitializedRef.current) {
      setBusyMonths(initialData.busyMonths || [])
      setSalesRows(initialData.salesRows || [])
      isInitializedRef.current = true
    }
  }, [])

  useEffect(() => {
    if (isInitializedRef.current && onDataChange) {
      onDataChange({ busyMonths, salesRows })
    }
  }, [busyMonths, salesRows, onDataChange])

  const toggleRow = (i) => {
    setExpandedRows(prev => ({ ...prev, [i]: !prev[i] }))
  }

  const moveRow = (i, direction) => {
    const newRows = [...salesRows]
    if (direction === 'up' && i > 0) {
      [newRows[i], newRows[i-1]] = [newRows[i-1], newRows[i]]
    } else if (direction === 'down' && i < newRows.length - 1) {
      [newRows[i], newRows[i+1]] = [newRows[i+1], newRows[i]]
    }
    setSalesRows(newRows)
  }

  const handleAddCrops = () => {
    const inputCrops = cropTagsText.split(/[、,]/).map(s => s.trim()).filter(s => s !== "")
    const existingCrops = salesRows.map(row => row.content)
    const cropsToAdd = inputCrops.filter(c => !existingCrops.includes(c))
    if (cropsToAdd.length > 0) {
      const newRows = cropsToAdd.map(crop => ({ content: crop, volume: '', timing: '', canRefer: true, message: '', url: '', image: null }))
      setSalesRows([...salesRows, ...newRows])
      setCropTagsText("")
    } else {
      setSalesRows([...salesRows, {content:'', volume:'', timing:'', canRefer:true, message: '', url: '', image: null}])
      setCropTagsText("")
    }
  }

  const parseMonths = (timing) => {
    if (!timing) return []
    return timing.match(/\d+/g)?.map(Number) || []
  }

  const handleImageUpload = (i, e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const n = [...salesRows]
        n[i].image = ev.target?.result
        setSalesRows(n)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = (i) => {
    const n = [...salesRows]
    n[i].image = null
    setSalesRows(n)
  }

  const generateCropMessage = async (i) => {
    const row = salesRows[i]
    if (!row.content) return
    const months = parseMonths(row.timing)
    const season = months.length > 0 ? months[0] : new Date().getMonth() + 1
    const text = await generateCropDescription(row.content, season, '')
    if (text) {
      const n = [...salesRows]
      n[i].message = text
      setSalesRows(n)
    }
  }

  return (
    <div className="space-y-8">
      <section className="font-bold">
        <h3 className="text-lg font-black mb-3 flex items-center gap-2 text-[#4F6F52] ml-2">
          <Calendar className="text-[#88D8B0]" /> 繁忙期・栽培リスト
        </h3>
        <div className="bg-white rounded-2xl p-4 space-y-6 shadow-sm">
          <div className="relative pt-2">
            <span className="absolute -top-2 left-1 bg-white px-2 text-xs font-black text-gray-400 z-10">繁忙月を選択</span>
            <div className="grid grid-cols-6 gap-2 mt-2">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <button key={m} onClick={() => setBusyMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])} className={`py-2 rounded-lg font-black text-xs transition-all border ${busyMonths.includes(m) ? 'bg-[#88D8B0] text-white border-[#88D8B0] shadow-sm' : 'bg-[#FAFAF5] text-gray-400 border-[#E0E0E0]'}`}>
                  {m}月
                </button>
              ))}
            </div>
          </div>

          <div className="border-t-2 border-[#E0E0E0] pt-6 space-y-4">
            <div>
              <label className="text-xs font-black text-gray-400 mb-2 block">栽培品目 (カンマ区切りで一括追加)</label>
              <textarea className="w-full p-3 bg-[#FAFAF5] rounded-2xl mt-1 text-base border-none shadow-inner font-bold text-gray-700" rows="8" value={cropTagsText} onChange={(e) => setCropTagsText(e.target.value)} placeholder="例：青島みかん、レタス etc..." />
            </div>
            <button onClick={handleAddCrops} className="w-full bg-[#B39CD0] text-white px-8 py-3 rounded-full text-sm font-black shadow-lg hover:bg-[#9E86C0] transition-colors">
              + 品目を作成（自動追加）
            </button>
          </div>

          <div className="space-y-4 font-bold">
            {salesRows.map((row, i) => {
              const isExpanded = expandedRows[i]
              return (
                <div key={i} className="bg-white rounded-[2rem] border border-[#E0E0E0] overflow-hidden transition-all duration-300">
                  <div className="p-4 bg-[#FAFAF5]">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-400 font-bold mb-1 block">品目名</label>
                        <div className="flex items-center gap-2">
                          {row.image && <div className="w-8 h-8 rounded-lg overflow-hidden border border-white shadow-sm shrink-0"><img src={row.image} className="w-full h-full object-cover"/></div>}
                          <input value={row.content} onChange={(e) => { const n = [...salesRows]; n[i].content = e.target.value; setSalesRows(n) }} className="w-full bg-white border border-[#E0E0E0] rounded-lg p-2 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#88D8B0] outline-none" placeholder="品目名" />
                        </div>
                      </div>
                      <div className="flex items-start gap-1 pt-6">
                        <button onClick={() => moveRow(i, 'up')} disabled={i === 0} className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-30"><ArrowUp size={14} /></button>
                        <button onClick={() => moveRow(i, 'down')} disabled={i === salesRows.length - 1} className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-30"><ArrowDown size={14} /></button>
                        <button onClick={() => setSalesRows(salesRows.filter((_, idx) => idx !== i))} className="p-1.5 bg-red-50 border border-red-100 text-red-400 hover:text-red-600 rounded-lg"><Trash2 size={14} /></button>
                      </div>
                    </div>

                    <div className="mb-2">
                      <label className="text-[10px] text-gray-400 font-bold mb-1 block">販売時期（複数選択可）</label>
                      <div className="flex flex-wrap gap-1">
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => {
                          const currentMonths = parseMonths(row.timing)
                          const isSelected = currentMonths.includes(m)
                          return (
                            <button key={m} onClick={() => {
                              let next
                              if (isSelected) { next = currentMonths.filter(x => x !== m) }
                              else { next = [...currentMonths, m].sort((a,b) => a - b) }
                              const n = [...salesRows]
                              n[i].timing = next.length > 0 ? next.map(x => `${x}月`).join(', ') : ''
                              setSalesRows(n)
                            }} className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] border transition-all ${isSelected ? 'bg-[#B39CD0] text-white border-[#B39CD0] shadow-sm' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}>
                              {m}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="mb-2">
                      <label className="text-[10px] text-gray-400 font-bold mb-1 block">収穫量</label>
                      <input value={row.volume} onChange={(e) => { const n = [...salesRows]; n[i].volume = e.target.value; setSalesRows(n) }} className="w-full bg-white border border-[#E0E0E0] rounded-lg p-2 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-[#88D8B0] outline-none" placeholder="例: 10t" />
                    </div>

                    <button onClick={() => toggleRow(i)} className="w-full py-1 flex items-center justify-center gap-1 text-xs font-bold text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                      {isExpanded ? <><ChevronUp size={14}/> 詳細を閉じる</> : <><ChevronDown size={14}/> 詳細設定（画像・メッセージ・URL）</>}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="p-4 space-y-4 bg-white border-t border-[#E0E0E0] animate-in slide-in-from-top-2 duration-200">
                      <div className="relative">
                        <label className="block mb-2 text-xs font-black text-gray-400">商品画像</label>
                        <div className="relative w-full h-48 bg-[#FAFAF5] rounded-2xl overflow-hidden flex items-center justify-center border-2 border-dashed border-[#E0E0E0] cursor-pointer hover:bg-[#F0F5EC] transition-colors">
                          {row.image ? (<img src={row.image} className="w-full h-full object-cover" />) : (<div className="text-gray-400 flex flex-col items-center"><Camera size={24} /><span className="text-xs font-bold mt-1">写真を追加</span></div>)}
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleImageUpload(i, e)} />
                          {row.image && <button onClick={(e) => {e.stopPropagation(); handleRemoveImage(i)}} className="absolute top-2 right-2 bg-white/80 p-2 rounded-full text-gray-500 shadow-sm"><Trash2 size={16}/></button>}
                        </div>
                      </div>

                      <label className="flex items-center gap-3 bg-[#FAFAF5] p-3 rounded-2xl text-sm font-bold text-stone-600 shadow-sm border border-[#E0E0E0] transition-colors">
                        <input type="checkbox" checked={row.canRefer} onChange={(e) => { const n = [...salesRows]; n[i].canRefer = e.target.checked; setSalesRows(n) }} className="accent-[#B39CD0] w-5 h-5" /> お客様への公開OK
                      </label>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs text-gray-400 font-bold">メッセージ（品種の説明など）</label>
                          <button onClick={() => generateCropMessage(i)} className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-[#B39CD0] hover:bg-[#FAFAF5] rounded-lg transition-colors">
                            <Sparkles size={12} /> AI生成
                          </button>
                        </div>
                        <textarea value={row.message || ''} onChange={(e) => { const n = [...salesRows]; n[i].message = e.target.value; setSalesRows(n) }} placeholder="品種についての説明など（未入力OK）" className="w-full bg-[#FAFAF5] p-3 rounded-2xl text-sm border-none shadow-sm font-bold mt-2 text-gray-700" rows="3" />
                      </div>

                      <div className="relative">
                        <ExternalLink size={16} className="absolute left-4 top-4 text-gray-400" />
                        <input value={row.url || ''} onChange={(e) => { const n = [...salesRows]; n[i].url = e.target.value; setSalesRows(n) }} placeholder="関連URL (https://...)" className="w-full bg-[#FAFAF5] pl-10 p-3 rounded-2xl text-sm border border-[#E0E0E0] shadow-sm font-bold text-blue-600" />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
