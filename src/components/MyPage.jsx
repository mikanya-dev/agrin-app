import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { generateFarmDescription, generateAppealPoint, generateCropDescription } from '../lib/gemini'
import CropsList from './CropsList'
import {
  LogOut, Camera, Loader2, CheckCircle2, AlertCircle,
  Layers, MapPin, UserCircle, Truck, Heart, Globe, Sparkles
} from 'lucide-react'

export default function MyPage({ farmerId, onLogout }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [saveMessage, setSaveMessage] = useState(null)
  const [farmName, setFarmName] = useState('')

  // フォーム状態
  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [iconUrl, setIconUrl] = useState('')
  const [description, setDescription] = useState('')
  const [appealPoint, setAppealPoint] = useState('')
  const [areas, setAreas] = useState([])
  const [startYear, setStartYear] = useState('')
  const [area, setArea] = useState('')
  const [totalVolume, setTotalVolume] = useState('')
  const [workers, setWorkers] = useState('')
  const [workersBusy, setWorkersBusy] = useState('')
  const [parson, setParson] = useState('')
  const [salesChannels, setSalesChannels] = useState([])
  const [farmLat, setFarmLat] = useState('')
  const [farmLng, setFarmLng] = useState('')
  const [nickname, setNickname] = useState('')
  const [relationWithHead, setRelationWithHead] = useState('')
  const [isFarmer, setIsFarmer] = useState('')
  const [farmStartYear, setFarmStartYear] = useState('')
  const [gender, setGender] = useState('')
  const [farmType, setFarmType] = useState('')
  const [jobType, setJobType] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [troubles, setTroubles] = useState('')
  const [skills, setSkills] = useState('')
  const [lendables, setLendables] = useState('')
  const [hobbies, setHobbies] = useState('')
  const [webUrl, setWebUrl] = useState('')
  const [shopUrl, setShopUrl] = useState('')
  const [lineId, setLineId] = useState('')
  const [instagramId, setInstagramId] = useState('')
  const [twitterId, setTwitterId] = useState('')
  const [facebookId, setFacebookId] = useState('')
  const [threadsId, setThreadsId] = useState('')
  const [tiktokId, setTiktokId] = useState('')
  const [noteId, setNoteId] = useState('')
  const [cropsData, setCropsData] = useState({ busyMonths: [], salesRows: [] })
  const [aiModalData, setAiModalData] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleCropsChange = useCallback((data) => {
    setCropsData(data)
  }, [])

  const generateAndSetDescription = async () => {
    setIsGenerating(true)
    const crops = cropsData.salesRows.map(r => r.content).join('、') || '農産物'
    const text = await generateFarmDescription(farmName, crops, areas.join('・'))
    if (text) {
      setAiModalData({ type: 'description', text })
    }
    setIsGenerating(false)
  }

  const generateAndSetAppeal = async () => {
    setIsGenerating(true)
    const crops = cropsData.salesRows.map(r => r.content).join('、') || '農産物'
    const text = await generateAppealPoint(farmName, crops, '')
    if (text) {
      setAiModalData({ type: 'appeal', text: text.substring(0, 30) })
    }
    setIsGenerating(false)
  }

  useEffect(() => {
    if (farmerId) fetchProfile()
  }, [farmerId])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('farm_profiles')
        .select('*')
        .eq('farm_id', farmerId)
        .single()

      if (error) {
        console.error('プロフィール取得エラー:', error)
        setProfile({})
      } else if (data) {
        setProfile(data)
        setDescription(data.description || '')
        setAppealPoint(data.appeal_point || '')
        setIsActive(data.is_active !== false)
        setIconUrl(data.icon_url || '')
        setAreas(data.areas || [])
        setStartYear(data.start_year || '')
        setArea(data.area_size || '')
        setTotalVolume(data.total_volume || '')
        setWorkers(data.workers || '')
        setWorkersBusy(data.workers_busy || '')
        setParson(data.members_info || '')
        setSalesChannels(data.sales_channels || [])
        setFarmLat(data.farm_lat || '')
        setFarmLng(data.farm_lng || '')
        setNickname(data.nickname || '')
        setRelationWithHead(data.relation_with_head || '')
        setIsFarmer(data.is_farmer ?? '')
        setFarmStartYear(data.farm_start_year || '')
        setGender(data.gender || '')
        setFarmType(data.farm_type || '')
        setJobType(data.job_type || '')
        setImageUrl(data.image_url || '')
        setTroubles(data.troubles || '')
        setSkills(data.skills || '')
        setLendables(data.lendables || '')
        setHobbies(data.hobbies || '')
        setWebUrl(data.web_url || '')
        setShopUrl(data.shop_url || '')
        setLineId(data.line_id || '')
        setInstagramId(data.instagram_id || '')
        setTwitterId(data.twitter_id || '')
        setFacebookId(data.facebook_id || '')
        setThreadsId(data.threads_id || '')
        setTiktokId(data.tiktok_id || '')
        setNoteId(data.note_id || '')
        if (data.crops_list) {
          setCropsData(data.crops_list)
        }
      }

      const { data: farmData } = await supabase
        .from('farms')
        .select('farm_name')
        .eq('id', farmerId)
        .single()

      if (farmData) {
        setFarmName(farmData.farm_name)
      }
    } catch (error) {
      console.error('プロフィール取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e, setUrl) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setUrl(ev.target?.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage({ type: 'loading', text: 'プロフィールを保存中...' })

    try {
      const dataToSave = {
        description,
        appeal_point: appealPoint,
        is_active: isActive,
        icon_url: iconUrl,
        areas,
        start_year: startYear ? parseInt(startYear) : null,
        area_size: area,
        total_volume: totalVolume,
        workers: workers ? parseInt(workers) : null,
        workers_busy: workersBusy ? parseInt(workersBusy) : null,
        members_info: parson,
        sales_channels: salesChannels,
        farm_lat: farmLat ? parseFloat(farmLat) : null,
        farm_lng: farmLng ? parseFloat(farmLng) : null,
        nickname,
        relation_with_head: relationWithHead,
        is_farmer: isFarmer === '' ? null : isFarmer,
        farm_start_year: farmStartYear ? parseInt(farmStartYear) : null,
        gender,
        farm_type: farmType,
        job_type: jobType,
        image_url: imageUrl,
        troubles,
        skills,
        lendables,
        hobbies,
        web_url: webUrl,
        shop_url: shopUrl,
        line_id: lineId,
        instagram_id: instagramId,
        twitter_id: twitterId,
        facebook_id: facebookId,
        threads_id: threadsId,
        tiktok_id: tiktokId,
        note_id: noteId,
        crops_list: cropsData,
        updated_at: new Date().toISOString()
      };

      // farm_id キーで upsert
      const { error } = await supabase
        .from('farm_profiles')
        .upsert({
          farm_id: farmerId,
          ...dataToSave
        })

      if (error) throw error

      setSaveMessage({ type: 'success', text: 'プロフィールが保存されました！' })
      setTimeout(() => setSaveMessage(null), 2000)
    } catch (error) {
      console.error('保存エラー:', error)
      setSaveMessage({ type: 'error', text: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) return <div className="p-4 text-center">読み込み中...</div>

  const AREA_OPTIONS = ['宮上', '宮下', '土肥', '城堀', '吉浜', '鍛冶屋', '門川']
  const SALES_CHANNEL_OPTIONS = ['JA出荷', '市場出荷（個人選果・系統外）', '直売所・道の駅（委託販売）', '庭先・自販機（無人販売含む）', 'スーパー・小売店（インショップ・コーナー納品）', '飲食店・ホテル・旅館', 'ネット販売', 'ふるさと納税', '観光農園', '栽培体験', '収穫体験', 'オーナー制度']

  const handleAiConfirm = () => {
    if (!aiModalData) return
    if (aiModalData.type === 'description') {
      setDescription(aiModalData.text)
    } else if (aiModalData.type === 'appeal') {
      setAppealPoint(aiModalData.text)
    }
    setAiModalData(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 pb-20">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-[#88D8B0] to-[#5F8D4E] text-white p-4 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">🌾 マイ農園ページ</h2>
              <p className="text-xs opacity-60">ID: {farmerId}</p>
            </div>
          </div>
          <button onClick={onLogout} className="bg-orange-400 hover:bg-orange-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 transition-colors">
            <LogOut size={18} />
            <span className="text-sm">ログアウト</span>
          </button>
        </div>

        {/* プロフィールカード */}
        <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-lg">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#88D8B0] bg-gray-100">
              <img src={iconUrl || 'https://via.placeholder.com/80'} alt="農園" className="w-full h-full object-cover" />
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <Camera size={18} />
              <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (ev) => setIconUrl(ev.target?.result)
                  reader.readAsDataURL(file)
                }
              }} />
            </label>
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-lg text-gray-800 mb-2">{farmName || '農園'}</h2>
            <button onClick={() => setIsActive(!isActive)} className={`py-1 px-3 rounded-full text-xs font-bold ${isActive ? 'bg-[#88D8B0] text-white' : 'bg-gray-200 text-gray-500'}`}>
              {isActive ? '☀️ 公開中' : '💤 非公開中'}
            </button>
          </div>
        </div>
      </div>

      {/* タブメニュー */}
      <div className="flex justify-between bg-white p-2 rounded-2xl shadow-sm m-4 sticky top-4 z-40">
        {[
          { id: 'profile', label: '🏠 プロフィール' },
          { id: 'crops', label: '🍊 栽培リスト' },
          { id: 'community', label: '🤝 交流' },
          { id: 'sns', label: '🌐 SNS・Web' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === tab.id ? 'bg-[#88D8B0] text-white shadow-sm' : 'text-gray-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* コンテンツ */}
      <div className="p-4 space-y-8">
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in">
            {/* 農園について */}
            <section>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-[#4F6F52]">
                <Layers className="text-[#88D8B0]" /> 農園について
              </h3>
              <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-400">紹介文</label>
                    <button onClick={() => generateAndSetDescription()} disabled={isSaving} className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-[#88D8B0] hover:bg-[#FAFAF5] rounded-lg transition-colors disabled:opacity-50">
                      <Sparkles size={12} /> AI生成
                    </button>
                  </div>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none text-base font-medium" rows="8" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-400">アピールポイント（30文字以内）</label>
                    <button onClick={() => generateAndSetAppeal()} disabled={isSaving} className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-[#88D8B0] hover:bg-[#FAFAF5] rounded-lg transition-colors disabled:opacity-50">
                      <Sparkles size={12} /> AI生成
                    </button>
                  </div>
                  <input type="text" maxLength="30" value={appealPoint} onChange={(e) => setAppealPoint(e.target.value)} placeholder="例：35年の実績" className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none" />
                  <p className="text-[9px] text-gray-400 mt-1">{appealPoint.length}/30</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">農園エリア</label>
                  <div className="flex flex-wrap gap-2">
                    {AREA_OPTIONS.map(a => (
                      <button key={a} onClick={() => setAreas(areas.includes(a) ? areas.filter(x => x !== a) : [...areas, a])} className={`px-3 py-1 rounded-full text-sm font-bold border transition-all ${areas.includes(a) ? 'bg-[#88D8B0] text-white border-[#88D8B0]' : 'bg-[#FAFAF5] text-gray-500 border-[#E0E0E0]'}`}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-2">農園開始年</label>
                    <input type="number" value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="2015" className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-2">畑の面積</label>
                    <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="1ha" className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">生産量</label>
                  <input value={totalVolume} onChange={(e) => setTotalVolume(e.target.value)} placeholder="年間50トン" className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-2">働く人数</label>
                    <input type="number" value={workers} onChange={(e) => setWorkers(e.target.value)} className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-2">繁忙期人数</label>
                    <input type="number" value={workersBusy} onChange={(e) => setWorkersBusy(e.target.value)} className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">メンバー</label>
                  <input value={parson} onChange={(e) => setParson(e.target.value)} placeholder="園主の夫婦、パートさん" className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">販路</label>
                  <div className="flex flex-wrap gap-2">
                    {SALES_CHANNEL_OPTIONS.map(ch => (
                      <button key={ch} onClick={() => setSalesChannels(salesChannels.includes(ch) ? salesChannels.filter(x => x !== ch) : [...salesChannels, ch])} className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${salesChannels.includes(ch) ? 'bg-[#88D8B0] text-white border-[#88D8B0]' : 'bg-[#FAFAF5] text-gray-500 border-[#E0E0E0]'}`}>
                        <Truck size={14} /> {ch}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 農家所在地 */}
            <section>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-[#4F6F52]">
                <MapPin className="text-[#88D8B0]" /> 農家所在地
              </h3>
              <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">緯度</label>
                    <input type="number" step="0.00001" value={farmLat} onChange={(e) => setFarmLat(e.target.value)} placeholder="35.1150" className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">経度</label>
                    <input type="number" step="0.00001" value={farmLng} onChange={(e) => setFarmLng(e.target.value)} placeholder="139.1200" className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none" />
                  </div>
                </div>
              </div>
            </section>

            {/* 自分について */}
            <section>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-[#4F6F52]">
                <UserCircle className="text-[#88D8B0]" /> 自分について
              </h3>
              <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">呼び名</label>
                  <input value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">園主との関係</label>
                  <select value={relationWithHead} onChange={(e) => setRelationWithHead(e.target.value)} className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none">
                    <option value="">未回答</option>
                    <option>本人</option>
                    <option>夫/妻</option>
                    <option>親</option>
                    <option>子供</option>
                    <option>従業員/パート</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">就農について</label>
                  <select value={isFarmer === '' ? '' : isFarmer ? 'true' : 'false'} onChange={(e) => setIsFarmer(e.target.value === '' ? '' : e.target.value === 'true')} className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none">
                    <option value="">未回答</option>
                    <option value="true">就農済</option>
                    <option value="false">これからその予定</option>
                    <option value="false">予定なし</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">農園仕事開始年（西暦）</label>
                  <input type="number" value={farmStartYear} onChange={(e) => setFarmStartYear(e.target.value)} placeholder="例: 2015" className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none" />
                  {farmStartYear && (
                    <div className="text-left text-xs text-[#5F8D4E] font-bold mt-1 ml-1">
                      現在：{new Date().getFullYear() - parseInt(farmStartYear) + 1}年目
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">性別</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none">
                    <option value="">未回答</option>
                    <option>男性</option>
                    <option>女性</option>
                  </select>
                </div>
                {isFarmer === true && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 block mb-2">就農タイプ</label>
                      <select value={farmType} onChange={(e) => setFarmType(e.target.value)} className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none">
                        <option value="">未回答</option>
                        <option>親元就農</option>
                        <option>新規就農</option>
                        <option>その他</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 block mb-2">専業/兼業</label>
                      <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none">
                        <option value="">未回答</option>
                        <option>専業</option>
                        <option>兼業</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-[#4F6F52]">
                <Camera className="text-[#88D8B0]" /> 背景写真
              </h3>
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="aspect-video w-full bg-[#FAFAF5] flex items-center justify-center">
                  {imageUrl ? <img src={imageUrl} className="w-full h-full object-cover" /> : <Camera className="text-gray-300" size={48} />}
                </div>
                <label className="flex items-center justify-center gap-2 p-4 bg-white cursor-pointer font-bold text-gray-600 text-base hover:bg-gray-50 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#88D8B0]">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  写真を変更
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, setImageUrl)} />
                </label>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'crops' && (
          <CropsList
            initialData={cropsData}
            onDataChange={handleCropsChange}
          />
        )}

        {activeTab === 'community' && (
          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-[#4F6F52]">
                <Heart className="text-pink-400" /> 交流・助け合い
              </h3>
              <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">困っていること</label>
                  <textarea value={troubles} onChange={(e) => setTroubles(e.target.value)} placeholder="猪被害、人手不足など" className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none" rows="3" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">得意なこと</label>
                  <textarea value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="剪定、ドローン操作など" className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none" rows="3" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">貸せる機材</label>
                  <textarea value={lendables} onChange={(e) => setLendables(e.target.value)} placeholder="軽トラ、草刈機など" className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none" rows="3" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">趣味</label>
                  <textarea value={hobbies} onChange={(e) => setHobbies(e.target.value)} className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none" rows="3" />
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'sns' && (
          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-[#4F6F52]">
                <Globe className="text-[#88D8B0]" /> SNS・外部連携
              </h3>
              <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">WebサイトURL</label>
                  <input type="url" value={webUrl} onChange={(e) => setWebUrl(e.target.value)} placeholder="https://..." className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">ショップサイトURL</label>
                  <input type="url" value={shopUrl} onChange={(e) => setShopUrl(e.target.value)} placeholder="https://..." className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-2">公式LINE ID</label>
                    <input value={lineId} onChange={(e) => setLineId(e.target.value)} placeholder="@yugawara_farm" className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-2">Instagram ID</label>
                    <input value={instagramId} onChange={(e) => setInstagramId(e.target.value)} placeholder="insta_id" className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-2">Twitter(X) ID</label>
                    <input value={twitterId} onChange={(e) => setTwitterId(e.target.value)} placeholder="x_id" className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-2">Facebook ID</label>
                    <input value={facebookId} onChange={(e) => setFacebookId(e.target.value)} placeholder="fb_id" className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-2">Threads ID</label>
                    <input value={threadsId} onChange={(e) => setThreadsId(e.target.value)} placeholder="threads_id" className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-2">TikTok ID</label>
                    <input value={tiktokId} onChange={(e) => setTiktokId(e.target.value)} placeholder="tiktok_id" className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-2">note ID</label>
                    <input value={noteId} onChange={(e) => setNoteId(e.target.value)} placeholder="note_id" className="w-full p-3 bg-[#FAFAF5] rounded-xl border-none" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* 保存ボタン */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t shadow-lg">
        <button onClick={handleSave} disabled={isSaving} className="w-full bg-[#E2703A] hover:bg-[#D06030] text-white font-bold py-3 rounded-full">
          {isSaving ? '保存中...' : '保存＆反映'}
        </button>
      </div>

      {/* 保存メッセージ */}
      {saveMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20">
          <div className="bg-white rounded-2xl p-8 text-center">
            {saveMessage.type === 'loading' && <Loader2 className="animate-spin mx-auto mb-4" size={40} />}
            {saveMessage.type === 'success' && <CheckCircle2 className="mx-auto mb-4 text-green-500" size={40} />}
            {saveMessage.type === 'error' && <AlertCircle className="mx-auto mb-4 text-red-500" size={40} />}
            <p className="font-bold">{saveMessage.text}</p>
          </div>
        </div>
      )}

      {/* AI生成確認モーダル */}
      {aiModalData && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-lg animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black text-gray-800">✨ AI生成結果</h3>
            <div className="bg-[#FAFAF5] p-4 rounded-xl border border-[#E0E0E0]">
              <p className="text-sm font-bold text-gray-700 whitespace-pre-wrap">{aiModalData.text}</p>
            </div>
            <p className="text-xs text-gray-500">この内容で反映しますか？</p>
            <div className="flex gap-3">
              <button onClick={() => setAiModalData(null)} className="flex-1 py-2 px-4 rounded-lg font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                キャンセル
              </button>
              <button onClick={handleAiConfirm} disabled={isGenerating} className="flex-1 py-2 px-4 rounded-lg font-bold text-white bg-[#88D8B0] hover:bg-[#7BC5A0] transition-colors disabled:opacity-50">
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
