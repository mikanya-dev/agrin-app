# ⚡ クイックスタート (5分で動かす)

このドキュメントは、最短で環境を整備するためのガイドです。

## 🎯 目標

5分以内に `http://localhost:3000` で動作させる

---

## Step 1: インストール (1分)

```bash
cd agrin-app
npm install
```

## Step 2: 開発環境変数を設定 (1分)

`.env.local` を作成:

```bash
cat > .env.local <<'EOF'
# 開発用（ダミー値で OK）
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder-key
VITE_DEBUG=true
EOF
```

## Step 3: 開発サーバーを起動 (1分)

```bash
npm run dev
```

✅ ブラウザが自動で `http://localhost:3000` を開きます

---

## 🔌 実際のデータを使う場合

### Supabase を接続

1. [supabase.com](https://supabase.com) でプロジェクト作成
2. Project URL と Anon Key をコピー
3. `.env.local` を更新:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...
```

4. 開発サーバーを再起動:

```bash
npm run dev
```

---

## 📦 ビルド & デプロイ

### ローカルビルド

```bash
npm run build
npm run preview  # http://localhost:4173 でプレビュー
```

### Netlify にデプロイ

```bash
# 1. GitHub にプッシュ
git push origin main

# 2. Netlify でリポジトリを連携
#    https://netlify.com → "New site from Git"

# 3. 環境変数を設定
#    Build & deploy → Environment

# 4. デプロイ完了！
```

---

## 📚 詳細ガイド

完全なセットアップは [SETUP_GUIDE.md](./SETUP_GUIDE.md) を参照してください。

---

## 🆘 トラブル

### 開発サーバーが起動しない

```bash
# キャッシュをクリア
rm -rf node_modules .vite dist
npm install
npm run dev
```

### Supabase に接続できない

```bash
# ブラウザコンソール (F12) でエラーを確認
# .env.local の値が正しいか確認
cat .env.local
```

### ビルドエラー

```bash
npm run lint    # リント実行
npm run build   # ビルドテスト
```

---

## 🚀 次のステップ

1. ✅ [SETUP_GUIDE.md](./SETUP_GUIDE.md) で本格的なセットアップ
2. 📖 [README.md](./README.md) でプロジェクト構成を確認
3. 🔐 [SECURITY.md](./SECURITY.md) でセキュリティ要件を確認

---

楽しい開発を! 🎉
