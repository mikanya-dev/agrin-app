# 🚀 セットアップガイド

このガイドは、agrin-app を完全に機能する環境に設定するための手順です。

## 📋 前提条件

- Node.js 18以上
- npm または yarn
- GitHub アカウント
- Supabase アカウント
- Netlify アカウント
- テキストエディタ（VS Code 推奨）

---

## ステップ 1: ローカル開発環境のセットアップ

### 1.1 リポジトリをクローン

```bash
git clone https://github.com/your-org/agrin-app.git
cd agrin-app
```

### 1.2 依存関係をインストール

```bash
npm install
```

### 1.3 開発サーバーを起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開き、セットアップ画面が表示されれば成功です。

---

## ステップ 2: Supabase のセットアップ

### 2.1 Supabase プロジェクト作成

1. https://supabase.com にアクセス
2. 「Create a new project」をクリック
3. 以下を入力:
   - **Organization**: 新規 or 既存を選択
   - **Project name**: `agrin-app` など
   - **Database Password**: 強力なパスワードを設定
   - **Region**: `Tokyo (ap-southeast-1)` 推奨

4. プロジェクトが作成されるまで約1分待機

### 2.2 API 認証情報を取得

1. プロジェクトの Settings → API をクリック
2. 以下をコピー:
   - **Project URL**: `https://xxx.supabase.co`
   - **Anon Public Key**: `eyJhbGc...` で始まる長い文字列

### 2.3 環境変数を設定

`.env.local` ファイルを作成:

```bash
touch .env.local
```

以下を入力（取得した値で置き換え）:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.4 ローカルでテスト

```bash
npm run dev
```

ブラウザコンソール (F12 → Console) に以下のメッセージが出れば接続成功:

```
✅ Supabase connected
```

---

## ステップ 3: Gemini API のセットアップ

### 3.1 Gemini API キーを取得

1. https://makersuite.google.com/app/apikey にアクセス
2. 「Create API key」をクリック
3. 新しいキーをコピー

### 3.2 開発環境に設定（開発用のみ）

```env
# .env.local に追加（開発環境のみ使用）
VITE_GEMINI_API_KEY=your-gemini-api-key
```

**⚠️ 注意**: 本番環境では使用しません。

---

## ステップ 4: Netlify へのデプロイ

### 4.1 GitHub リポジトリをプッシュ

```bash
git add .
git commit -m "Initial setup: Supabase + Netlify configuration"
git push -u origin claude/supabase-netlify-react-setup-0m9ann
```

### 4.2 Netlify にサインアップ

1. https://netlify.com にアクセス
2. GitHub でログイン
3. 「New site from Git」をクリック

### 4.3 GitHub リポジトリを連携

1. GitHub アカウントを選択
2. `agrin-app` リポジトリを検索・選択
3. 以下を設定:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### 4.4 環境変数を設定

Netlify の Site settings → Build & deploy → Environment で以下を設定:

| キー | 値 |
|------|-----|
| `VITE_SUPABASE_URL` | Supabase の Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase の Anon Key |
| `GEMINI_API_KEY` | Gemini API キー（サーバーサイド） |

### 4.5 デプロイ確認

Netlify UI で自動デプロイが開始されます。

✅ デプロイ完了後、割り当てられたドメイン（例: `https://agrin-app-xxx.netlify.app`）にアクセスして動作確認

---

## ステップ 5: Supabase のデータベーススキーマを初期化

### 5.1 Supabase コンソールで SQL を実行

1. Supabase コンソール → SQL Editor をクリック
2. 以下を実行:

```sql
-- 農家テーブル
CREATE TABLE farmers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 商品テーブル
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  farmer_id INTEGER REFERENCES farmers(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI キャッシュテーブル
CREATE TABLE ai_cache (
  key VARCHAR(255) PRIMARY KEY,
  text TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS (Row-Level Security) を有効化
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;

-- 公開読み取り許可
CREATE POLICY "farmers_read_public" ON farmers
  FOR SELECT USING (true);

CREATE POLICY "products_read_public" ON products
  FOR SELECT USING (true);

CREATE POLICY "ai_cache_read_public" ON ai_cache
  FOR SELECT USING (true);
```

### 5.2 テストデータを挿入

```sql
INSERT INTO farmers (name, email) VALUES
  ('山田太郎', 'yamada@example.com'),
  ('鈴木花子', 'suzuki@example.com');

INSERT INTO products (farmer_id, name, description) VALUES
  (1, 'トマト', '新鮮な赤いトマト'),
  (2, 'きゅうり', 'シャキシャキのきゅうり');
```

---

## ステップ 6: GitHub Actions CI/CD を有効化

### 6.1 GitHub Secrets を設定

1. GitHub リポジトリ → Settings → Secrets and variables → Actions
2. 以下を追加:

| Secret | 値 |
|--------|-----|
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon Key |
| `NETLIFY_AUTH_TOKEN` | [Netlify で生成](https://app.netlify.com/user/applications#personal-access-tokens) |
| `NETLIFY_SITE_ID` | Site settings → Site ID からコピー |

### 6.2 GitHub Actions トリガー

```bash
git push origin claude/supabase-netlify-react-setup-0m9ann
```

GitHub → Actions でビルドが自動開始。完了するとプレビューデプロイが作成されます。

---

## ✅ セットアップ完了チェックリスト

- [ ] ローカル開発サーバーが起動 (`npm run dev` → localhost:3000)
- [ ] Supabase が接続 (ブラウザコンソールでエラーなし)
- [ ] Netlify にデプロイ完了
- [ ] 公開 URL でアクセス可能
- [ ] GitHub Actions が正常に動作
- [ ] Supabase のデータベーススキーマが初期化

---

## 🔧 トラブルシューティング

### ❌ `VITE_SUPABASE_URL is undefined`

**原因**: `.env.local` の設定がない

**解決**:
```bash
cp .env.example .env.local
# .env.local を編集して実際の値を入力
```

### ❌ Netlify デプロイが失敗

**原因**: 環境変数が Netlify に設定されていない

**解決**:
1. Netlify → Site settings → Build & deploy → Environment
2. 必要な環境変数を追加

### ❌ 403 エラーが出る

**原因**: CORS ヘッダーが不適切

**解決**:
```bash
# netlify.toml の [[headers]] セクションを確認
cat netlify.toml | grep -A 10 "headers"
```

---

## 📞 サポート

質問やトラブルがあれば:

1. GitHub Issues で報告
2. メール: mikanya.yugawara@gmail.com
3. [Supabase ドキュメント](https://supabase.com/docs)
4. [Netlify ドキュメント](https://docs.netlify.com)

Happy coding! 🚀
