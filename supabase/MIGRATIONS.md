# Supabase マイグレーション自動化

`supabase/migrations/` にSQLファイルを追加して `main` ブランチにマージすると、
GitHub Actions (`.github/workflows/supabase-migrations.yml`) が自動的に
Supabase 本番データベースへ反映します。これにより、Supabase の SQL Editor
に毎回手動でコピー&ペーストする作業が不要になります。

## 初回セットアップ（GitHub Secrets 登録）

リポジトリの管理者が一度だけ、以下3つの Secret を GitHub に登録してください。

**登録場所:** リポジトリ → Settings → Secrets and variables → Actions → New repository secret

### 1. `SUPABASE_ACCESS_TOKEN`

Supabase の個人アクセストークン（CLI操作用）。

取得方法:
1. https://supabase.com/dashboard/account/tokens を開く
2. **Generate new token** をクリック
3. 生成されたトークンをコピーして GitHub Secret に登録

### 2. `SUPABASE_PROJECT_ID`

プロジェクトの Reference ID。

```
iqbbmeopgcightaeddxl
```

(Supabase ダッシュボード → Settings → General → Project ID と同じ値)

### 3. `SUPABASE_DB_PASSWORD`

データベースの接続パスワード。

取得・確認方法:
1. Supabase ダッシュボード → **Settings** → **Database**
2. **Database password** セクションでリセットまたは確認
3. GitHub Secret に登録

⚠️ 忘れている場合は「Reset database password」で再発行できますが、
再発行すると既存の直接DB接続もすべて新しいパスワードが必要になる点に注意してください。

---

## 使い方（今後の開発フロー）

1. 新しいテーブルやカラムが必要になったら、`supabase/migrations/` に
   タイムスタンプ付きの新しい `.sql` ファイルを追加する

   ```
   supabase/migrations/20260913120000_add_something.sql
   ```

2. `main` ブランチにマージ（PRマージ、またはpush）

3. GitHub Actions が自動的に `supabase db push` を実行し、本番DBに反映

4. Actions タブで実行結果を確認
   ```
   https://github.com/mikanya-dev/agrin-app/actions/workflows/supabase-migrations.yml
   ```

## 手動実行

Secrets登録前の動作確認や、緊急時は GitHub の **Actions** タブから
`Apply Supabase Migrations` ワークフローを選択し、**Run workflow** で
手動トリガーできます（`workflow_dispatch` 対応済み）。

## 既存テーブルとの関係

このリポジトリでは以下のマイグレーションが既に用意されています:

| ファイル | 内容 |
|---------|------|
| `20260826000001_create_farmers_tables.sql` | `farmers`, `farmer_line_users` |
| `20260913000001_create_push_notification_tables.sql` | `push_subscriptions`, `posts`, `push_logs` |

Secrets 登録後、最初に `main` へマージされたタイミングでこれら全てが
自動適用されます（`CREATE TABLE IF NOT EXISTS` を使っているため、
既に手動実行済みのテーブルがあっても安全に再実行できます）。
