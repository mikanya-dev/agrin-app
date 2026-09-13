-- push_subscriptions テーブル（ブラウザのプッシュ通知購読情報）
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

-- posts テーブル（ユーザーに配信するお知らせ・投稿）
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

-- push_logs テーブル（通知送信ログ・分析用）
CREATE TABLE IF NOT EXISTS push_logs (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
  total_sent INT DEFAULT 0,
  success_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_farmer_id ON push_subscriptions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_is_active ON push_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_posts_farmer_id ON posts(farmer_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_logs_post_id ON push_logs(post_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_read_all" ON push_subscriptions;
CREATE POLICY "push_subscriptions_read_all" ON push_subscriptions FOR SELECT USING (true);

DROP POLICY IF EXISTS "posts_read_all" ON posts;
CREATE POLICY "posts_read_all" ON posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "push_logs_read_all" ON push_logs;
CREATE POLICY "push_logs_read_all" ON push_logs FOR SELECT USING (true);

COMMENT ON TABLE push_subscriptions IS '登録されたブラウザプッシュ通知の購読情報';
COMMENT ON TABLE posts IS 'ユーザーに配信するお知らせ・投稿';
COMMENT ON TABLE push_logs IS 'プッシュ通知送信のログと分析データ';
