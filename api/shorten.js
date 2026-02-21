// api/shorten.js
// POST /api/shorten
// Body: { url: "https://..." }
// Returns: { shortUrl: "https://yourdomain.vercel.app/s/abc123", code: "abc123" }

import { kv } from "@vercel/kv";

const CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 7;
const MAX_RETRIES = 5;

// ランダムな英数字コードを生成
function generateCode() {
  let code = "";
  const array = new Uint8Array(CODE_LENGTH);
  // Node.js環境では crypto.getRandomValues は使えないため Math.random を使用
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;

  // bodyが文字列の場合はパース
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const { url } = body || {};

  if (!url) {
    return res.status(400).json({ error: "URLが指定されていません" });
  }

  // URLバリデーション
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("http/https のみ対応しています");
    }
  } catch (e) {
    return res.status(400).json({ error: "有効なURLを入力してください（http/https）" });
  }

  // 同じURLが既に登録されているか確認（重複排除）
  const existingCode = await kv.get(`url:${url}`).catch(() => null);
  if (existingCode) {
    const baseUrl = `https://${req.headers.host}`;
    return res.status(200).json({
      shortUrl: `${baseUrl}/s/${existingCode}`,
      code: existingCode,
      reused: true,
    });
  }

  // ユニークなコードを生成（衝突時はリトライ）
  let code = null;
  for (let i = 0; i < MAX_RETRIES; i++) {
    const candidate = generateCode();
    const exists = await kv.exists(`code:${candidate}`).catch(() => false);
    if (!exists) {
      code = candidate;
      break;
    }
  }

  if (!code) {
    return res.status(500).json({ error: "コードの生成に失敗しました。再試行してください。" });
  }

  // KVに保存
  // code:xxx → 元のURL（リダイレクト用）
  // url:xxx  → コード（重複排除用）
  // meta:xxx → メタ情報（作成日時・アクセス数）
  const now = Date.now();
  await Promise.all([
    kv.set(`code:${code}`, url),
    kv.set(`url:${url}`, code),
    kv.set(`meta:${code}`, JSON.stringify({ createdAt: now, clicks: 0 })),
  ]);

  const baseUrl = `https://${req.headers.host}`;
  return res.status(200).json({
    shortUrl: `${baseUrl}/s/${code}`,
    code,
    reused: false,
  });
}
