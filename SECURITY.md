# 🔐 セキュリティポリシー

## 報告方法

セキュリティ脆弱性を発見した場合、**公開の Issue** として報告しないでください。

代わりに以下にメールでご連絡ください:
- **mikanya.yugawara@gmail.com**

件名: `[SECURITY] agrin-app vulnerability`

## セキュリティ対応

1. **受付確認**: 24時間以内にご返信します
2. **検証**: 脆弱性の深刻度を評価します
3. **修正**: 可能な限り速やかに対応します
4. **情報開示**: 修正後に詳細を公開します

## セキュリティベストプラクティス

### 実装済み

✅ **環境変数管理**
- APIキー（Gemini、Supabase等）は `.env.local` に隔離
- 本番環境では Netlify/GitHub の secret を使用

✅ **APIセキュリティ**
- Netlify Functions でサーバーサイドプロキシを実装
- Rate limiting で API abuse を防止
- 入力検証で XSS/SQL Injection を防止

✅ **データセキュリティ**
- HTTPS で全通信を暗号化
- Supabase RLS でデータアクセスを制限
- ファイルアップロードは形式・サイズをチェック

✅ **依存関係管理**
- Dependabot で自動アップデートをチェック
- 定期的に `npm audit` を実行
- セキュリティパッチは優先適用

### チェックリスト

- [ ] `.env.local` は `.gitignore` に追加
- [ ] 本番環境で Supabase のパスワード認証を有効化
- [ ] API キーをプロキシ経由で保護
- [ ] CORS/CSP ヘッダーを Netlify で設定
- [ ] 定期的に依存関係をアップデート
- [ ] ネットワークログで異常アクセスを監視

## 脆弱性報告済み

| 日付 | 脆弱性 | 状態 |
|------|------|------|
| - | - | - |

## 参考リンク

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase セキュリティ](https://supabase.com/docs/guides/security)
- [Netlify セキュリティ](https://docs.netlify.com/security/)
- [npm セキュリティアドバイザリ](https://www.npmjs.com/advisories)
