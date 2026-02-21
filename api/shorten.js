import { redis } from "./_redis.js";

const CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateCode() {
  let code = "";
  for (let i = 0; i < 7; i++) code += CHARS[Math.floor(Math.random() * CHARS.length)];
  return code;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }

  const { url } = body || {};
  if (!url) return res.status(400).json({ error: "URLが指定されていません" });

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
  } catch {
    return res.status(400).json({ error: "有効なURLを入力してください（http/https）" });
  }

  try {
    const existingCode = await redis.get(`url:${url}`);
    if (existingCode) {
      return res.status(200).json({
        shortUrl: `https://${req.headers.host}/s/${existingCode}`,
        code: existingCode,
        reused: true,
      });
    }

    let code = null;
    for (let i = 0; i < 5; i++) {
      const candidate = generateCode();
      const exists = await redis.exists(`code:${candidate}`);
      if (!exists) { code = candidate; break; }
    }
    if (!code) return res.status(500).json({ error: "コードの生成に失敗しました" });

    await Promise.all([
      redis.set(`code:${code}`, url),
      redis.set(`url:${url}`, code),
      redis.set(`meta:${code}`, JSON.stringify({ createdAt: Date.now(), clicks: 0 })),
    ]);

    return res.status(200).json({
      shortUrl: `https://${req.headers.host}/s/${code}`,
      code,
      reused: false,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "エラー: " + err.message });
  }
}
