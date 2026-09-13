# プッシュ通知機能 実装手順（ローカルマシン実行用）

## 🚀 クイックスタート

**実行環境:** Windows PowerShell  
**実行場所:** `C:\work\agrin-app`

---

## ステップ 1: git リモートから最新コードを取得

```powershell
cd C:\work\agrin-app

# リモートから最新を取得
git fetch origin

# 最新ブランチに切り替え
git checkout claude/supabase-netlify-react-setup-0m9ann

# または既に同じブランチにいる場合：
git pull origin claude/supabase-netlify-react-setup-0m9ann
```

確認：
```powershell
git log --oneline -5
# "feat: Add Web Push notification feature..." が表示される
```

---

## ステップ 2: npm 依存関係のインストール

```powershell
npm install
```

これで `web-push` がインストールされます。

---

## ステップ 3: VAPID 鍵を生成

Web Push通知を使用するために必要な公開鍵・秘密鍵ペアを生成します。

```powershell
npx web-push generate-vapid-keys
```

**出力例：**
```
Public Key: BI7xxx...
Private Key: xxx...
```

**これを安全に保管してください（後で使用）**

---

## ステップ 4: Supabase にテーブルを作成

```powershell
# SQL スクリプトを表示
node setup-push-notifications.js
```

**コピーした SQL を実行：**

1. [Supabase ダッシュボード](https://app.supabase.com) にログイン
2. **SQL Editor** をクリック
3. **New query** をクリック
4. 上記で出力された SQL を全てコピーして貼り付け
5. **▶ 実行** ボタンをクリック

**確認：** Table Editor で以下が作成されたか確認
- `push_subscriptions` テーブル
- `posts` テーブル
- `push_logs` テーブル

---

## ステップ 5: .env ファイルに VAPID 公開鍵を追加

```powershell
# .env ファイルを編集
notepad .env
```

以下を追加（ステップ 3 で生成した公開鍵を使用）：

```
VITE_VAPID_PUBLIC_KEY=BI7xxx...
```

保存して終了。

---

## ステップ 6: ローカルで動作確認

```powershell
npm run dev
```

ブラウザが自動で開きます（http://localhost:3000）

### 確認項目：

1. **モーダルが表示される**
   - 初回ロード時に「お知らせを受け取る」モーダル表示

2. **通知許可を与える**
   - 「許可する」をクリック
   - ブラウザの通知許可ポップアップ → 「許可」

3. **トークンが保存されたか確認**
   - Supabase ダッシュボード → **Table Editor** → `push_subscriptions`
   - 新しい行が追加されているか確認

4. **Service Worker が登録されたか確認**
   - ブラウザの DevTools → **Application** → **Service Workers**
   - `sw.js` が表示されているか確認

---

## ステップ 7: 変更をプッシュ

```powershell
# リモートにプッシュ
git push -u origin claude/supabase-netlify-react-setup-0m9ann
```

GitHub Actions が自動で実行されます。

確認：
```powershell
# GitHub の Actions ページで確認
# https://github.com/mikanya-dev/agrin-app/actions
```

---

## ステップ 8: Netlify に環境変数を設定

1. **Netlify ダッシュボード** → プロジェクト選択
2. **Site settings** → **Build & deploy** → **Environment**
3. **Add environment variables** をクリック

以下を追加（ステップ 3 で生成した鍵を使用）：

| キー | 値 |
|------|-----|
| `VAPID_PUBLIC_KEY` | BI7xxx... |
| `VAPID_PRIVATE_KEY` | xxx... |
| `VITE_VAPID_PUBLIC_KEY` | BI7xxx... |

---

## ステップ 9: デプロイ完了待機

GitHub Actions が完了するまで待つ（約3-5分）

確認方法：
1. Netlify ダッシュボード → **Deploys**
2. 最新のデプロイが `Published` になっているか確認

---

## ステップ 10: 本番環境でテスト

1. **デプロイされたサイトにアクセス**
   ```
   https://yugaata-agri.netlify.app
   ```

2. **初回アクセスで モーダル表示確認**

3. **通知許可を与える**

4. **Supabase で購読情報を確認**
   - Table Editor → `push_subscriptions`

---

## 🧪 テスト方法

### ローカルテスト

```bash
npm run dev
```

然後、`http://localhost:3000` で以下をテスト：
- ✅ モーダル表示
- ✅ 通知許可フロー
- ✅ トークン保存
- ✅ Service Worker 登録

### 本番テスト（Android/Windows/Mac）

1. デプロイされたサイトにアクセス
2. 通知許可を与える
3. ブラウザをバックグラウンドに
4. Netlify Function をテスト呼び出し

#### テスト通知送信コマンド

```powershell
$headers = @{
    'Content-Type' = 'application/json'
}

$body = @{
    postId = 1
    title = "テスト通知"
    body = "プッシュ通知が機能しています"
    data = @{ url = "/" }
} | ConvertTo-Json

Invoke-WebRequest `
    -Uri "https://yugaata-agri.netlify.app/.netlify/functions/send-push-notifications" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

---

## ⚠️ 重要な注意

### VAPID 秘密鍵について

- ✅ ローカルの `.env` には公開鍵のみ保管
- ✅ Netlify では秘密鍵を設定
- ❌ Git にコミットしない
- ❌ チャットに貼り付けない

### iOS Safari の注意

iOS Safari ではアプリがフォアグラウンドで開いている間のみ通知が届きます：
- ✅ Android/Windows/Mac で テストすることを推奨
- ⚠️ iPhone では事前にユーザーに説明が必要

---

## 📚 参考ドキュメント

- [PUSH_NOTIFICATIONS.md](./PUSH_NOTIFICATIONS.md) - 詳細な実装ガイド
- [setup-push-notifications.js](./setup-push-notifications.js) - Supabase テーブル作成
- [src/lib/pushNotifications.js](./src/lib/pushNotifications.js) - クライアント側API
- [netlify/functions/send-push-notifications.js](./netlify/functions/send-push-notifications.js) - サーバー側API

---

## 🆘 トラブルシューティング

### "VAPID keys not configured" エラー

```
VAPID_PUBLIC_KEY と VAPID_PRIVATE_KEY が Netlify に設定されていません
→ ステップ 8 で環境変数を設定してください
```

### "Supabase credentials not configured"

```
VITE_SUPABASE_URL または VITE_SUPABASE_ANON_KEY が設定されていません
→ .env を確認して、ローカルで npm run dev を実行してください
```

### Service Worker が登録されない

```
DevTools → Application → Service Workers を確認
- エラーが表示されていないか確認
- コンソールのエラーメッセージを確認
- ローカルホストではHTTP可、本番ではHTTPS必須
```

---

## ✅ 完了チェックリスト

- [ ] ステップ 1-10 まで完了
- [ ] ローカルでモーダルが表示される
- [ ] Supabase にテーブルが作成されている
- [ ] Netlify に環境変数が設定されている
- [ ] デプロイが完了している
- [ ] 本番サイトでモーダルが表示される
- [ ] 通知許可フローが動作する
- [ ] `push_subscriptions` にデータが保存されている

---

**次のフェーズ:** 投稿画面との連携と通知送信ロジック

ご不明な点があれば、[PUSH_NOTIFICATIONS.md](./PUSH_NOTIFICATIONS.md) をご覧ください。
