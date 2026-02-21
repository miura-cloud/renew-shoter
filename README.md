# URL短縮 & QR作成ツール v2（完全自前）

広告なし・外部サービス依存なし・完全自己ホスト型のURL短縮ツールです。

## 技術スタック

| 役割 | 技術 |
|------|------|
| フロントエンド | React + Vite + Tailwind CSS |
| API | Vercel Serverless Functions |
| データストア | Vercel KV（Redis、無料枠あり） |
| QRコード画像 | api.qrserver.com |

---

## 🚀 Vercel へのデプロイ手順

### Step 1: GitHub にリポジトリを作成

```bash
cd url-shortener
git init
git add .
git commit -m "Initial commit"
```

GitHub で新しいリポジトリを作成し、push：

```bash
git remote add origin https://github.com/あなた/url-shortener.git
git push -u origin main
```

### Step 2: Vercel でプロジェクトをインポート

1. [vercel.com](https://vercel.com) にログイン
2. 「Add New Project」をクリック
3. 作成したリポジトリを選択
4. **まだ Deploy はしない**（KV の設定が先）

### Step 3: Vercel KV（データベース）を作成

1. Vercel ダッシュボードの「Storage」タブをクリック
2. 「Create Database」→「KV」を選択
3. 名前を入力（例: `url-shortener-kv`）→「Create」
4. 作成後、「Connect Project」でデプロイするプロジェクトと紐付ける
5. これで環境変数（`KV_REST_API_URL` など）が自動設定される

### Step 4: Deploy

1. 「Deploy」ボタンをクリック
2. ビルドが完了すると URL が発行される ✅
3. 以降は `git push` するだけで自動デプロイ

---

## ローカル開発

```bash
npm install

# Vercel CLI をインストール（初回のみ）
npm i -g vercel

# Vercel にログイン（初回のみ）
vercel login

# プロジェクトをリンク（初回のみ）
vercel link

# KVの環境変数をローカルに引っ張る
vercel env pull .env.local

# 開発サーバー起動（APIルートも動作する）
npm run dev
```

---

## ディレクトリ構成

```
url-shortener/
├── api/
│   ├── shorten.js     # POST: URL短縮・KVへの保存
│   ├── redirect.js    # GET: リダイレクト・クリック数集計
│   └── stats.js       # GET: クリック数・作成日時の取得
├── src/
│   ├── App.jsx        # メインUI（統計表示付き）
│   ├── main.jsx
│   └── index.css
├── public/
│   └── favicon.svg
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json        # /s/:code → /api/redirect のルーティング
└── .gitignore
```

---

## Vercel KV 無料枠

| 項目 | 無料枠 |
|------|--------|
| ストレージ | 256 MB |
| 月間リクエスト数 | 30,000 回 |
| データベース数 | 1 |

個人利用・小規模利用では無料枠で十分です。

---

## データ設計（Vercel KV）

| キー | 値 | 用途 |
|------|-----|------|
| `code:{code}` | 元のURL | リダイレクト |
| `url:{originalUrl}` | コード | 重複排除 |
| `meta:{code}` | JSON（作成日時・クリック数） | 統計 |
