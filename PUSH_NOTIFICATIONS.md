# プッシュ通知機能 実装ガイド

## 📋 目次
1. [環境セットアップ](#環境セットアップ)
2. [Supabase 設定](#supabase-設定)
3. [Netlify 設定](#netlify-設定)
4. [テスト](#テスト)
5. [トラブルシューティング](#トラブルシューティング)

---

## 環境セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

このコマンドで以下がインストールされます：
- `web-push`: プッシュ通知送信ライブラリ

### 2. VAPID 鍵を生成

VAPID 鍵は、ブラウザとサーバー間の通信を認証するための公開鍵・秘密鍵ペアです。

```bash
npx web-push generate-vapid-keys
```

出力例：
```
Public Key: BIxxxx...
Private Key: xxxx...
```

---

## Supabase 設定

### 1. テーブルを作成

ローカルマシンで以下を実行：

```bash
node setup-push-notifications.js
```

このコマンドが SQL スクリプトを表示するので、以下の手順で実行：

1. [Supabase ダッシュボード](https://app.supabase.com) にログイン
2. **SQL Editor** をクリック
3. **New query** をクリック
4. 出力された SQL を全てコピーして貼り付け
5. **▶ 実行** ボタンをクリック

### 作成されるテーブル

| テーブル名 | 説明 |
|-----------|------|
| `push_subscriptions` | ブラウザの購読情報（エンドポイント、鍵） |
| `posts` | ユーザーに配信するお知らせ・投稿 |
| `push_logs` | 通知送信ログ・分析データ |

---

## Netlify 設定

### 1. VAPID 鍵を環境変数に設定

1. **Netlify ダッシュボード** → プロジェクト選択
2. **Site settings** → **Build & deploy** → **Environment**
3. **Add environment variables** をクリック
4. 以下を追加：

| キー | 値 |
|------|-----|
| `VAPID_PUBLIC_KEY` | 生成した公開鍵 |
| `VAPID_PRIVATE_KEY` | 生成した秘密鍵 |
| `VITE_VAPID_PUBLIC_KEY` | 生成した公開鍵（フロントエンド用） |
| `VITE_SUPABASE_URL` | Supabase プロジェクト URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon キー |

### 2. Supabase Secrets にも設定（オプション）

セキュリティ向上のため、Supabase Secrets にも設定することを推奨します：

1. Supabase ダッシュボード → **Project Settings** → **Secrets**
2. `VAPID_PRIVATE_KEY` を追加
3. `VAPID_PUBLIC_KEY` を追加

### 3. デプロイ

```bash
git push -u origin <branch-name>
```

GitHub Actions が自動で実行され、Netlify にデプロイされます。

---

## テスト

### ローカルでのテスト

1. **開発サーバーを起動**
   ```bash
   npm run dev
   ```

2. **http://localhost:3000** をブラウザで開く

3. **モーダルが表示されることを確認**
   - 初回ロード時に「お知らせを受け取る」モーダルが表示
   - 「許可する」をクリック

4. **通知許可を確認**
   - ブラウザの通知許可ポップアップが表示
   - 「許可」をクリック

5. **トークンが保存されたか確認**
   - Supabase ダッシュボード → **Table Editor** → `push_subscriptions`
   - 新しい行が追加されていることを確認

### 通知送信テスト

1. **Netlify Function をテスト**
   ```bash
   curl -X POST https://your-domain.netlify.app/.netlify/functions/send-push-notifications \
     -H "Content-Type: application/json" \
     -d '{
       "postId": 1,
       "title": "テスト通知",
       "body": "プッシュ通知が機能しています",
       "data": { "url": "/" }
     }'
   ```

2. **通知が届くことを確認**
   - ブラウザをバックグラウンドに送る
   - または別のタブを開いてブラウザを最小化
   - 数秒で通知が表示される

---

## API エンドポイント

### 通知送信

**POST** `/.netlify/functions/send-push-notifications`

リクエスト:
```json
{
  "postId": 1,
  "title": "新しい投稿があります",
  "body": "湯河原の新しい野菜が入荷しました",
  "data": {
    "url": "/farmers/123",
    "farmerName": "田中農園"
  }
}
```

レスポンス:
```json
{
  "success": true,
  "sent": 150,
  "failed": 5,
  "total": 155
}
```

---

## データベース スキーマ

### push_subscriptions テーブル

```sql
CREATE TABLE push_subscriptions (
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
```

### posts テーブル

```sql
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  farmer_id BIGINT REFERENCES farmers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### push_logs テーブル

```sql
CREATE TABLE push_logs (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
  total_sent INT DEFAULT 0,
  success_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT NOW()
);
```

---

## トラブルシューティング

### 通知が届かない

**原因 1: VAPID 鍵が設定されていない**
- ✅ Netlify 環境変数を確認
- ✅ Supabase Secrets を確認
- ✅ デプロイが完了しているか確認

**原因 2: 購読がない**
- ✅ `push_subscriptions` テーブルにデータがあるか確認
- ✅ `is_active` が `true` か確認
- ✅ ブラウザの通知許可設定を確認

**原因 3: Service Worker が登録されていない**
- ✅ ブラウザの DevTools → Application → Service Workers で確認
- ✅ コンソールにエラーがないか確認

### モーダルが表示されない

- ✅ `localStorage` に `pushModalShown` が保存されていないか確認
- ✅ DevTools → Storage → Local Storage で確認
- ✅ 削除して再度アクセス

### iPhone で通知が届かない

iOS Safari では、アプリがフォアグラウンドで開いている間のみ通知が届きます：

- ✅ アプリを前面に開いておく
- ✅ Android デバイスで テストする

---

## 監視・分析

### 通知送信状況の確認

1. Supabase ダッシュボード → **Table Editor** → `push_logs`
2. 以下を確認：
   - `total_sent`: 送信した購読者数
   - `success_count`: 成功した通知数
   - `failed_count`: 失敗した通知数

### 活動中の購読者数

```sql
SELECT COUNT(*) as active_subscriptions
FROM push_subscriptions
WHERE is_active = true;
```

---

## セキュリティに関する注意

⚠️ **VAPID 秘密鍵は絶対に公開しないでください**

- ✅ `.env` ファイルを `.gitignore` に追加（済み）
- ✅ Netlify Secret を使用（推奨）
- ✅ Supabase Secrets を使用（推奨）
- ❌ リポジトリにコミットしない
- ❌ チャットに貼り付けない

---

## 参考資料

- [Web Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [web-push npm](https://www.npmjs.com/package/web-push)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
