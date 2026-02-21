const CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateCode() {
  let code = "";
  for (let i = 0; i < 7; i++) code += CHARS[Math.floor(Math.random() * CHARS.length)];
  return code;
}

// Upstash REST API: GETは /{command}/{key}、SETは /{command}/{key}/{value}
async function kvGet(key) {
  const base = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  const res = await fetch(`${base}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result; // null or string
}

async function kvSet(key, value) {
  const base = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  const res = await fetch(`${base}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

async function kvExists(key) {
  const val = await kvGet(key);
  return val !== null;
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

  try { new URL(url); } catch {
    return res.status(400).json({ error: "有効なURLを入力してください" });
  }

  try {
    const existingCode = await kvGet(`url:${url}`);
    if (existingCode) {
      return res.status(200).json({
        shortUrl: `https://${req.headers.host}/s/${existingCode}`,
        code: existingCode, reused: true,
      });
    }

    let code = null;
    for (let i = 0; i < 5; i++) {
      const c = generateCode();
      const exists = await kvExists(`code:${c}`);
      if (!exists) { code = c; break; }
    }
    if (!code) return res.status(500).json({ error: "コード生成失敗" });

    await Promise.all([
      kvSet(`code:${code}`, url),
      kvSet(`url:${url}`, code),
      kvSet(`meta:${code}`, JSON.stringify({ createdAt: Date.now(), clicks: 0 })),
    ]);

    return res.status(200).json({
      shortUrl: `https://${req.headers.host}/s/${code}`,
      code, reused: false,
    });
  } catch (err) {
    console.error("shorten error:", err);
    return res.status(500).json({ error: "エラー: " + err.message });
  }
}
