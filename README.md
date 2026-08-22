# 🌾 農家プラットフォーム

湯河原産直連携プラットフォーム - **Supabase + Netlify** で構築したモダン React アプリ

## ✨ 特徴

- **React 18** + **Vite** - 高速開発・ビルド
- **Supabase** - エンタープライズグレードのバックエンド
- **Netlify** - シームレスなデプロイ & エッジ処理
- **セキュアな API プロキシ層** - クライアント側 APIキー露出なし
- **Tailwind CSS** - ユーティリティファースト UI
- **LINE LIFF 対応** - モバイルアプリ統合

## 🚀 クイックスタート

```bash
# インストール
npm install

# 開発サーバー起動 (localhost:3000)
npm run dev

# 本番ビルド
npm run build
```

## 🔑 環境設定

`.env.local` ファイルを作成し、以下を設定:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...
VITE_AI_PROXY_URL=https://your-domain.netlify.app/.netlify/functions/callGemini
```

[詳細な設定手順は .env.example を参照](/.env.example)

## 🔐 セキュリティ

✅ **実装済み:**
- APIキーの保護（環境変数 + Netlify Functions プロキシ）
- CORS / CSRF 対策
- Rate Limiting (API プロキシ層)
- 入力検証（ファイルアップロード等）
- XSS対策（React自動エスケープ + CSP ヘッダー）
- HTTPS 強制

## 📂 プロジェクト構成

```
src/
├── main.jsx          # エントリーポイント
├── App.jsx           # ルートコンポーネント
├── lib/
│   ├── supabase.js   # Supabase 設定
│   └── apiProxy.js   # API プロキシ層
└── styles/
    ├── index.css     # グローバル
    └── App.css       # アプリケーション
    
netlify/functions/
└── callGemini.js     # Gemini API プロキシ関数
```

## 📚 詳細ドキュメント

- [セットアップガイド](#-クイックスタート)
- [Supabase ドキュメント](https://supabase.com/docs)
- [Netlify ドキュメント](https://docs.netlify.com)

## 📄 ライセンス

MIT License
