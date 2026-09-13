-- 農家テーブル（基本情報）
CREATE TABLE IF NOT EXISTS farmers (
  id BIGSERIAL PRIMARY KEY,
  farm_name TEXT NOT NULL,
  prefecture TEXT,
  city TEXT,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- farmer_line_users テーブル（1農園 → 複数LINE ID、夫婦での運営に対応）
CREATE TABLE IF NOT EXISTS farmer_line_users (
  id BIGSERIAL PRIMARY KEY,
  farmer_id BIGINT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  line_user_id TEXT NOT NULL UNIQUE,
  line_display_name TEXT,
  role TEXT DEFAULT 'owner',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farmer_line_users_farmer_id ON farmer_line_users(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_line_users_line_user_id ON farmer_line_users(line_user_id);

ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_line_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "farmers_read_all" ON farmers;
CREATE POLICY "farmers_read_all" ON farmers FOR SELECT USING (true);

DROP POLICY IF EXISTS "farmer_line_users_read_all" ON farmer_line_users;
CREATE POLICY "farmer_line_users_read_all" ON farmer_line_users FOR SELECT USING (true);
