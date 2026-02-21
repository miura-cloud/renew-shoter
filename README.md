# URL短縮 & QR作成ツール（完全自前）

広告なし・外部サービス依存なし・完全自己ホスト型のURL短縮ツールです。

## 技術スタック

| 役割 | 技術 |
|------|------|
| フロントエンド | React + Vite + Tailwind CSS |
| API | Vercel Serverless Functions |
| データストア | Upstash KV（Redis、無料枠あり） |
| QRコード画像 | api.qrserver.com |

---

## 🚀 Vercel へのデプロイ手順

### Step 1: GitHub にリポジトリを作成して push

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/あなた/url-shortener.git
git push -u origin main
```

### Step 2: Vercel でプロジェクトをインポート

1. [vercel.com](https://vercel.com) にログイン
2. 「Add New Project」→ リポジトリを選択
3. ⚠️ まだ Deploy はしない（KV の設定が先）

### Step 3: Upstash KV を作成して接続

1. Vercel ダッシュボードの「Storage」タブをクリック
2. 「Create Database」→「KV」を選ぶ（※Upstashが提供するもの）
3. データベース名を入力（例: url-shortener-kv）
4. リージョンは「ap-northeast-1（Tokyo）」を選ぶ
5. 「Connect Project」でプロジェクトと紐付ける
6. UPSTASH_REDIS_REST_URL と UPSTASH_REDIS_REST_TOKEN が環境変数に自動設定される

### Step 4: Deploy

プロジェクト画面に戻り「Deploy」→ 完了 ✅

---

## Upstash 無料枠

| 項目 | 無料枠 |
|------|--------|
| ストレージ | 256 MB |
| 月間コマンド数 | 500,000 回 |
| データベース数 | 1 |
