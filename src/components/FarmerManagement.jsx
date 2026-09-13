import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Save, AlertCircle, MapPin, Leaf, Check, Edit2, Plus, Trash2,
  Users2, ImageIcon, Smile, Building2, Loader2, X, Copy, Share2
} from 'lucide-react';

const FarmerManagement = ({ lineId, onSaveSuccess }) => {
  const [farmers, setFarmers] = useState([]);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    farm_name: '',
    location: '',
    crops: '',
    description: '',
    icon_emoji: '🌾',
    image_url: '',
    latitude: '',
    longitude: '',
    sales_channels: [],
  });

  const [membersList, setMembersList] = useState([]);
  const [newMemberLineId, setNewMemberLineId] = useState('');

  useEffect(() => {
    fetchFarmers();
  }, [lineId]);

  const fetchFarmers = async () => {
    try {
      setLoading(true);
      // primary_line_id または line_user_ids に含まれる農園を取得
      const { data, error: fetchError } = await supabase
        .from('farmers')
        .select('*')
        .or(`primary_line_id.eq.${lineId},line_user_ids.cs."{${lineId}}"`)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError('農家情報の取得に失敗しました: ' + fetchError.message);
      } else {
        setFarmers(data || []);
        if (data && data.length > 0) {
          setSelectedFarmer(data[0]);
          fetchMembers(data[0].id);
        }
      }
      setLoading(false);
    } catch (err) {
      setError('エラーが発生しました: ' + err.message);
      setLoading(false);
    }
  };

  const fetchMembers = async (farmerId) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('farmer_members')
        .select('*')
        .eq('farmer_id', farmerId);

      if (!fetchError && data) {
        setMembersList(data);
      }
    } catch (err) {
      console.warn('メンバー取得エラー:', err);
    }
  };

  const handleSelectFarmer = (farmer) => {
    setSelectedFarmer(farmer);
    setIsEditing(false);
    setFormData({
      farm_name: farmer.farm_name,
      location: farmer.location,
      crops: farmer.crops,
      description: farmer.description || '',
      icon_emoji: farmer.icon_emoji || '🌾',
      image_url: farmer.image_url || '',
      latitude: farmer.latitude || '',
      longitude: farmer.longitude || '',
      sales_channels: farmer.sales_channels || [],
    });
    fetchMembers(farmer.id);
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedFarmer(null);
    setFormData({
      farm_name: '',
      location: '',
      crops: '',
      description: '',
      icon_emoji: '🌾',
      image_url: '',
      latitude: '',
      longitude: '',
      sales_channels: [],
    });
    setMembersList([]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!formData.farm_name.trim()) {
      setError('農園名を入力してください');
      return;
    }
    if (!formData.location.trim()) {
      setError('所在地を入力してください');
      return;
    }
    if (!formData.crops.trim()) {
      setError('作物を入力してください');
      return;
    }

    try {
      setLoading(true);

      if (isCreating) {
        // 新規作成
        const { data, error: insertError } = await supabase
          .from('farmers')
          .insert([{
            farm_name: formData.farm_name,
            location: formData.location,
            crops: formData.crops,
            description: formData.description,
            icon_emoji: formData.icon_emoji,
            image_url: formData.image_url,
            latitude: formData.latitude ? parseFloat(formData.latitude) : null,
            longitude: formData.longitude ? parseFloat(formData.longitude) : null,
            sales_channels: formData.sales_channels,
            primary_line_id: lineId,
            line_user_ids: [lineId],
          }])
          .select();

        if (insertError) {
          setError('農家情報の作成に失敗しました: ' + insertError.message);
          setLoading(false);
          return;
        }

        setSuccess('農家情報を作成しました！');
        setTimeout(() => {
          setSuccess('');
          setIsCreating(false);
          fetchFarmers();
        }, 2000);
      } else if (selectedFarmer) {
        // 更新
        const { error: updateError } = await supabase
          .from('farmers')
          .update({
            farm_name: formData.farm_name,
            location: formData.location,
            crops: formData.crops,
            description: formData.description,
            icon_emoji: formData.icon_emoji,
            image_url: formData.image_url,
            latitude: formData.latitude ? parseFloat(formData.latitude) : null,
            longitude: formData.longitude ? parseFloat(formData.longitude) : null,
            sales_channels: formData.sales_channels,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedFarmer.id);

        if (updateError) {
          setError('農家情報の更新に失敗しました: ' + updateError.message);
          setLoading(false);
          return;
        }

        setSuccess('農家情報を更新しました！');
        setTimeout(() => {
          setSuccess('');
          setIsEditing(false);
          fetchFarmers();
        }, 2000);
      }

      setLoading(false);
    } catch (err) {
      setError('保存処理に失敗しました: ' + err.message);
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberLineId.trim() || !selectedFarmer) {
      setError('LINE ID を入力してください');
      return;
    }

    try {
      setLoading(true);

      // ユーザーが存在するか確認
      const { data: userExists } = await supabase
        .from('users')
        .select('id')
        .eq('line_id', newMemberLineId)
        .single();

      if (!userExists) {
        setError('その LINE ID は登録されていません');
        setLoading(false);
        return;
      }

      // メンバーを追加
      const { error: insertError } = await supabase
        .from('farmer_members')
        .insert([{
          farmer_id: selectedFarmer.id,
          line_id: newMemberLineId,
          role: 'member',
        }])
        .select();

      if (insertError) {
        setError('メンバーの追加に失敗しました: ' + insertError.message);
        setLoading(false);
        return;
      }

      // farmers テーブルの line_user_ids を更新
      const updatedIds = [...(selectedFarmer.line_user_ids || []), newMemberLineId];
      await supabase
        .from('farmers')
        .update({ line_user_ids: updatedIds })
        .eq('id', selectedFarmer.id);

      setSuccess('メンバーを追加しました！');
      setNewMemberLineId('');
      fetchMembers(selectedFarmer.id);
      setTimeout(() => setSuccess(''), 2000);
      setLoading(false);
    } catch (err) {
      setError('メンバー追加エラー: ' + err.message);
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId, memberLineId) => {
    if (!window.confirm(`${memberLineId} をメンバーから削除しますか？`)) return;

    try {
      setLoading(true);

      // メンバーを削除
      await supabase
        .from('farmer_members')
        .delete()
        .eq('id', memberId);

      // farmers テーブルの line_user_ids を更新
      const updatedIds = selectedFarmer.line_user_ids.filter(id => id !== memberLineId);
      await supabase
        .from('farmers')
        .update({ line_user_ids: updatedIds })
        .eq('id', selectedFarmer.id);

      setSuccess('メンバーを削除しました！');
      fetchMembers(selectedFarmer.id);
      setTimeout(() => setSuccess(''), 2000);
      setLoading(false);
    } catch (err) {
      setError('メンバー削除エラー: ' + err.message);
      setLoading(false);
    }
  };

  const handleDeleteFarmer = async () => {
    if (!window.confirm('この農園を削除しますか？この操作は取り消せません。')) return;

    try {
      setLoading(true);

      const { error: deleteError } = await supabase
        .from('farmers')
        .delete()
        .eq('id', selectedFarmer.id);

      if (deleteError) {
        setError('削除に失敗しました: ' + deleteError.message);
        setLoading(false);
        return;
      }

      setSuccess('農園を削除しました！');
      setTimeout(() => {
        setSuccess('');
        fetchFarmers();
      }, 2000);
      setLoading(false);
    } catch (err) {
      setError('削除処理に失敗しました: ' + err.message);
      setLoading(false);
    }
  };

  if (loading && farmers.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-lg p-8 flex justify-center items-center min-h-64">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto" />
          <p className="text-gray-600 font-bold">農家情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* エラー・成功メッセージ */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 font-bold">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex gap-3 animate-pulse">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700 font-bold">{success}</p>
        </div>
      )}

      {/* 農園一覧・新規作成 */}
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-green-600" />
            農園管理
          </h2>
          <button
            onClick={handleCreateNew}
            className="bg-green-500 hover:bg-green-600 text-white rounded-full font-bold py-2 px-4 flex items-center gap-2 transition-colors"
          >
            <Plus size={18} />
            新規作成
          </button>
        </div>

        {/* 農園リスト */}
        {farmers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {farmers.map(farmer => (
              <button
                key={farmer.id}
                onClick={() => handleSelectFarmer(farmer)}
                className={`p-4 rounded-2xl text-left transition-all ${
                  selectedFarmer?.id === farmer.id
                    ? 'bg-green-100 border-2 border-green-500 shadow-lg'
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{farmer.icon_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-lg text-gray-800 truncate">{farmer.farm_name}</h3>
                    <p className="text-sm text-gray-600 font-bold">{farmer.location}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {farmer.crops.split('、').slice(0, 2).map((crop, idx) => (
                        <span key={idx} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                          {crop.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 font-bold">
            農園がありません。新規作成してください。
          </div>
        )}
      </div>

      {/* 編集フォーム */}
      {(isEditing || isCreating) && (
        <div className="bg-white rounded-3xl shadow-lg p-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-gray-800">
              {isCreating ? '新規農園作成' : '農園情報編集'}
            </h3>
            <button
              onClick={() => { setIsEditing(false); setIsCreating(false); }}
              className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* 基本情報 */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-700">基本情報</h4>

            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">
                農園名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="farm_name"
                value={formData.farm_name}
                onChange={handleChange}
                placeholder="例: 山田農園"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">
                所在地 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="例: 神奈川県湯河原町"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">
                主な作物 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="crops"
                value={formData.crops}
                onChange={handleChange}
                placeholder="例: トマト、キュウリ、ナス（カンマ区切り）"
                rows="3"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 font-bold resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">
                農園の説明
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="農園についての詳しい説明を入力してください"
                rows="4"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 font-bold resize-none"
              />
            </div>
          </div>

          {/* アイコン・画像 */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-bold text-gray-700">表示設定</h4>

            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">
                農園アイコン（絵文字）
              </label>
              <input
                type="text"
                name="icon_emoji"
                value={formData.icon_emoji}
                onChange={handleChange}
                maxLength="2"
                placeholder="🌾"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 font-bold text-2xl"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">
                農園画像 URL
              </label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 font-bold"
              />
              {formData.image_url && (
                <img src={formData.image_url} alt="プレビュー" className="mt-2 w-full h-40 object-cover rounded-lg" />
              )}
            </div>
          </div>

          {/* 位置情報 */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-bold text-gray-700 flex items-center gap-2">
              <MapPin size={18} /> 位置情報
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">
                  緯度
                </label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  step="0.0001"
                  placeholder="35.1459"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">
                  経度
                </label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  step="0.0001"
                  placeholder="139.1022"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 font-bold"
                />
              </div>
            </div>
          </div>

          {/* 保存ボタン */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-bold py-4 px-6 shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save size={20} />
                保存する
              </>
            )}
          </button>
        </div>
      )}

      {/* 詳細表示・メンバー管理 */}
      {selectedFarmer && !isEditing && !isCreating && (
        <div className="bg-white rounded-3xl shadow-lg p-6 space-y-6">
          {/* ヘッダー */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{selectedFarmer.icon_emoji}</span>
              <div>
                <h2 className="text-3xl font-black text-gray-800">{selectedFarmer.farm_name}</h2>
                <p className="text-gray-600 font-bold flex items-center gap-1">
                  <MapPin size={16} /> {selectedFarmer.location}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="p-3 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200 transition-colors"
              >
                <Edit2 size={20} />
              </button>
              <button
                onClick={handleDeleteFarmer}
                className="p-3 bg-red-100 rounded-full text-red-600 hover:bg-red-200 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>

          {/* 説明 */}
          {selectedFarmer.description && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
              <p className="text-gray-700 font-bold whitespace-pre-wrap">{selectedFarmer.description}</p>
            </div>
          )}

          {/* 画像 */}
          {selectedFarmer.image_url && (
            <img src={selectedFarmer.image_url} alt="農園" className="w-full h-48 object-cover rounded-2xl" />
          )}

          {/* 作物情報 */}
          <div className="border-t pt-4">
            <h3 className="font-bold text-gray-700 mb-3">主な作物</h3>
            <div className="flex flex-wrap gap-2">
              {selectedFarmer.crops.split('、').map((crop, idx) => (
                <span key={idx} className="bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-full text-sm">
                  {crop.trim()}
                </span>
              ))}
            </div>
          </div>

          {/* 位置情報 */}
          {selectedFarmer.latitude && selectedFarmer.longitude && (
            <div className="border-t pt-4">
              <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                <MapPin size={18} /> GPS 位置情報
              </h3>
              <p className="text-sm text-gray-600 font-bold">
                緯度: {selectedFarmer.latitude} / 経度: {selectedFarmer.longitude}
              </p>
            </div>
          )}

          {/* メンバー管理 */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <Users2 size={18} /> 農園メンバー ({membersList.length + 1})
            </h3>

            {/* メイン管理者 */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-green-600">メイン管理者</p>
                  <p className="text-sm font-black text-gray-800">{selectedFarmer.primary_line_id}</p>
                </div>
                <span className="bg-green-200 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                  管理者
                </span>
              </div>
            </div>

            {/* その他メンバー */}
            {membersList.length > 0 ? (
              <div className="space-y-2">
                {membersList.map(member => (
                  <div key={member.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-gray-800">{member.line_id}</p>
                      <p className="text-xs text-gray-500 font-bold">参加: {new Date(member.joined_at).toLocaleDateString('ja-JP')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {member.role}
                      </span>
                      <button
                        onClick={() => handleRemoveMember(member.id, member.line_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 font-bold">追加メンバーはまだいません</p>
            )}

            {/* メンバー追加 */}
            <div className="border-t pt-4 space-y-3">
              <label className="block text-sm font-bold text-gray-700">
                LINE ID を入力してメンバーを追加
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMemberLineId}
                  onChange={(e) => setNewMemberLineId(e.target.value)}
                  placeholder="例: U123456789..."
                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 font-bold"
                />
                <button
                  onClick={handleAddMember}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Plus size={18} />
                  追加
                </button>
              </div>
            </div>
          </div>

          {/* タイムスタンプ */}
          <div className="text-xs text-gray-400 font-bold text-right border-t pt-4">
            作成: {new Date(selectedFarmer.created_at).toLocaleString('ja-JP')}
            <br />
            更新: {new Date(selectedFarmer.updated_at).toLocaleString('ja-JP')}
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerManagement;
