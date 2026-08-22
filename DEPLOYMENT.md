# 🚀 デプロイメントガイド

このガイドは、agrin-app を本番環境にデプロイするための手順です。

---

## 📋 デプロイ前チェックリスト

- [ ] ローカルでテスト完了 (`npm run dev` ✅)
- [ ] ビルドが成功 (`npm run build` ✅)
- [ ] すべてのテストが通過 (`npm run lint` ✅)
- [ ] Supabase プロジェクトが作成済み
- [ ] Netlify アカウントが作成済み
- [ ] GitHub リポジトリが公開済み

---

## 🌐 Netlify へのデプロイ

### パターン A: GitHub を経由したデプロイ（推奨）

#### 1. GitHub にプッシュ

```bash
git add .
git commit -m "chore: production ready"
git push origin main
```

#### 2. Netlify にサインアップ

1. https://netlify.com にアクセス
2. 「Sign up」 → 「GitHub」
3. GitHub 認可を許可

#### 3. 新しいサイトを作成

1. "New site from Git" をクリック
2. GitHub を選択
3. `agrin-app` リポジトリを検索・選択

#### 4. ビルド設定

以下が自動設定されます:

```
Build command: npm run build
Publish directory: dist
```

✅ そのまま「Deploy」をクリック

#### 5. 環境変数を設定

Netlify UI → Site settings → Build & deploy → Environment

以下を追加:

| キー | 値 | 備考 |
|------|-----|------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase Anon Key |
| `GEMINI_API_KEY` | `AIzaSy...` | Gemini API Key（サーバーサイド） |

#### 6. デプロイ確認

```bash
# ローカルでビルド再テスト
npm run build
npm run preview
```

Netlify が自動でサイトを作成し、以下のような URL を割り当てます:

```
https://agrin-app-xxxxx.netlify.app
```

---

### パターン B: CLI を使用したデプロイ

#### 1. Netlify CLI をインストール

```bash
npm install -g netlify-cli
```

#### 2. ログイン

```bash
netlify login
```

#### 3. サイトをリンク

```bash
netlify link
```

#### 4. デプロイ

```bash
npm run build
netlify deploy --prod --dir=dist
```

---

## 🔐 本番環境のセキュリティ設定

### 1. HTTPS の確認

✅ Netlify では自動で HTTPS が有効

```bash
# ブラウザで確認
# https://your-domain.netlify.app
```

### 2. セキュリティヘッダーの確認

Netlify UI → Deploys → Site details → Security

以下が適用されていることを確認:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`

これらは `netlify.toml` に記載済みです。

### 3. 環境変数の検証

```bash
# 本番環境で環境変数が正しく読み込まれているか確認
# ブラウザコンソール (F12) で確認

# .env.local は本番環境で不要（削除）
rm .env.local
```

### 4. API キーの保護

- ✅ Gemini キーは Netlify Functions で隠蔽
- ✅ Supabase のキーは Row-Level Security (RLS) で保護
- ✅ API 呼び出しはプロキシ経由

---

## 📊 本番環境でのモニタリング

### Netlify ダッシュボード

1. https://app.netlify.com にログイン
2. サイトを選択
3. 以下を確認:
   - **Deploys**: デプロイの成功/失敗
   - **Analytics**: アクセス数、パフォーマンス
   - **Functions**: Netlify Functions の実行ログ

### エラーモニタリング

```bash
# ブラウザコンソールで以下を確認
console.error()
console.warn()

# ネットワークエラーは DevTools → Network タブで確認
```

### パフォーマンス確認

```bash
# Lighthouse でスコアを確認（DevTools → Lighthouse）
# 目標: Performance 80以上
```

---

## 🔄 継続的デプロイメント (CI/CD)

GitHub Actions で自動テスト・デプロイが設定済みです。

### 動作確認

1. GitHub → Actions
2. `Build & Deploy to Netlify` を確認
3. `main` ブランチへのプッシュで自動デプロイ

### CI/CD パイプライン

```mermaid
Push to main
    ↓
GitHub Actions: npm install
    ↓
    ├─ npm run lint
    ├─ npm run build
    └─ npm audit
    ↓
Deploy to Netlify
    ↓
✅ Live on https://your-domain.netlify.app
```

---

## 🔧 トラブルシューティング

### ビルドが失敗する

```bash
# 1. ローカルでビルドをテスト
npm run build

# 2. エラーメッセージをコピー
# 3. Netlify の Build log で確認
#    Netlify UI → Deploys → Deploy log
```

### 環境変数が読み込まれない

```bash
# 1. Netlify UI で環境変数が設定されているか確認
# 2. サイト再デプロイ
#    Netlify UI → Deploy settings → Trigger deploy

# 3. キャッシュをクリア
#    Netlify UI → Deploys → Clear cache and redeploy
```

### CORS エラーが出る

```bash
# netlify.toml の [[headers]] セクションを確認
cat netlify.toml | grep -A 10 "headers"

# 問題があれば netlify.toml を更新してプッシュ
git add netlify.toml
git commit -m "fix: CORS headers"
git push origin main
```

---

## 📈 デプロイ後のチェック

デプロイ完了後、以下を確認してください:

```bash
# 1. サイトが開くか
curl https://your-domain.netlify.app

# 2. API が呼ばれているか (DevTools → Network)

# 3. コンソールエラーがないか (DevTools → Console)

# 4. Supabase のデータが取得できるか

# 5. Gemini API が呼ばれているか (Netlify Functions ログで確認)
```

---

## 🎯 デプロイ後のベストプラクティス

### 定期的なメンテナンス

```bash
# 依存関係を定期更新
npm outdated           # 最新バージョン確認
npm update             # マイナーバージョン更新
npm audit fix          # セキュリティパッチ

# 変更をコミット
git add package*.json
git commit -m "chore: update dependencies"
git push origin main   # 自動デプロイ
```

### ログ監視

```bash
# Netlify Functions のログを監視
netlify logs --functions

# エラーが発生した場合、以下を確認
# 1. Netlify Build log
# 2. ブラウザコンソール
# 3. Supabase ダッシュボード
```

### セキュリティ監査

- [ ] 定期的に `npm audit` を実行
- [ ] Dependabot で自動更新を有効化
- [ ] 3ヶ月ごとにセキュリティレビュー

---

## 📞 サポート

デプロイ時にトラブルが発生した場合:

1. [Netlify ドキュメント](https://docs.netlify.com)
2. [GitHub Actions ドキュメント](https://docs.github.com/actions)
3. [Supabase サポート](https://supabase.com/docs)

---

Happy deploying! 🚀
