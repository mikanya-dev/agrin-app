#!/usr/bin/env node

/**
 * Supabase テーブル作成スクリプト
 *
 * ローカルマシンで実行:
 *   node setup-supabase.js
 *
 * 必要: npm install pg dotenv
 */

require('dotenv').config()
const { Client } = require('pg')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Environment variables not set')
  console.error('   .env file: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required')
  process.exit(1)
}

// Supabase PostgreSQL 接続情報
const projectId = supabaseUrl.split('.')[0].replace('https://', '')
const dbUrl = `postgresql://postgres.${projectId}:[YOUR_DB_PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`

async function setupTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || dbUrl,
    ssl: { rejectUnauthorized: false }
  })

  try {
    console.log('🔧 Connecting to Supabase...')
    // Note: 本番環境ではDB_PASSWORDを設定する必要があります
    console.log('⚠️  パスワードが必要です。Supabase Dashboardで確認してください。\n')

    console.log('代わりに、以下を Supabase SQL Editor で実行してください:\n')
    console.log(getSQLScript())

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

function getSQLScript() {
  return `-- farmers テーブル（基本情報）
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

-- farmer_line_users テーブル（1農園 → 複数LINE ID）
CREATE TABLE IF NOT EXISTS farmer_line_users (
  id BIGSERIAL PRIMARY KEY,
  farmer_id BIGINT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  line_user_id TEXT NOT NULL UNIQUE,
  line_display_name TEXT,
  role TEXT DEFAULT 'owner',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_farmer_line_users_farmer_id ON farmer_line_users(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_line_users_line_user_id ON farmer_line_users(line_user_id);

-- RLS（Row Level Security）有効化
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_line_users ENABLE ROW LEVEL SECURITY;

-- RLS ポリシー（全員読み取り可）
CREATE POLICY "farmers_read_all" ON farmers FOR SELECT USING (true);
CREATE POLICY "farmer_line_users_read_all" ON farmer_line_users FOR SELECT USING (true);
`
}

setupTables()
