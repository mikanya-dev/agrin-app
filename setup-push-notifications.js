#!/usr/bin/env node

/**
 * プッシュ通知機能セットアップスクリプト
 *
 * ローカルマシンで実行:
 *   node setup-push-notifications.js
 *
 * 出力された SQL をコピーして Supabase SQL Editor で実行してください
 */

function getSQLScript() {
  return `-- プッシュ通知テーブル
-- ============================================

-- 1. push_subscriptions テーブル（ユーザーの購読情報）
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  farmer_id BIGINT REFERENCES farmers(id) ON DELETE SET NULL,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. posts テーブル（投稿・お知らせ）
CREATE TABLE IF NOT EXISTS posts (
  id BIGSERIAL PRIMARY KEY,
  farmer_id BIGINT REFERENCES farmers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. push_logs テーブル（通知送信ログ・分析用）
CREATE TABLE IF NOT EXISTS push_logs (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
  total_sent INT DEFAULT 0,
  success_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_farmer_id ON push_subscriptions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_is_active ON push_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_posts_farmer_id ON posts(farmer_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_logs_post_id ON push_logs(post_id);

-- RLS（Row Level Security）有効化
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_logs ENABLE ROW LEVEL SECURITY;

-- RLS ポリシー（読み取り可）
CREATE POLICY "push_subscriptions_read_all" ON push_subscriptions FOR SELECT USING (true);
CREATE POLICY "posts_read_all" ON posts FOR SELECT USING (true);
CREATE POLICY "push_logs_read_all" ON push_logs FOR SELECT USING (true);

-- コメント（ドキュメント）
COMMENT ON TABLE push_subscriptions IS '登録されたブラウザプッシュ通知の購読情報';
COMMENT ON TABLE posts IS 'ユーザーに配信するお知らせ・投稿';
COMMENT ON TABLE push_logs IS 'プッシュ通知送信のログと分析データ';
`
}

function printVapidKeyInfo() {
  return `
-- VAPID キー生成手順
-- ============================================

WebPush ライブラリで VAPID 鍵を生成：

  npm install -g web-push
  web-push generate-vapid-keys

出力例：
  Public Key: BIxxxx...
  Private Key: xxxx...

その後、Netlify Environment Variables に設定：

  1. Netlify ダッシュボード → Site settings → Build & deploy → Environment
  2. VAPID_PUBLIC_KEY=BIxxxx...
  3. VAPID_PRIVATE_KEY=xxxx...

同時に、Supabase Secrets にも保存（Edge Function から参照するため）
  `
}

console.log('🔧 プッシュ通知セットアップ\n')
console.log('=' .repeat(50))
console.log('\n📝 Supabase SQL Editor で以下を実行してください：\n')
console.log(getSQLScript())
console.log('=' .repeat(50))
console.log(printVapidKeyInfo())
console.log('=' .repeat(50))
console.log('\n✅ 手順：')
console.log('1. 上記 SQL を Supabase SQL Editor で実行')
console.log('2. VAPID 鍵を生成してNetlify環境変数に設定')
console.log('3. Service Worker ファイルを作成')
console.log('4. App.jsx に通知許可モーダルを追加')
console.log('\n')
