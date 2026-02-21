// api/stats.js
// GET /api/stats?code=abc123
// Returns: { code, originalUrl, clicks, createdAt }

import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "コードが必要です" });

  const [originalUrl, metaStr] = await Promise.all([
    kv.get(`code:${code}`).catch(() => null),
    kv.get(`meta:${code}`).catch(() => null),
  ]);

  if (!originalUrl) {
    return res.status(404).json({ error: "指定されたコードは存在しません" });
  }

  const meta = metaStr ? JSON.parse(metaStr) : { createdAt: null, clicks: 0 };

  return res.status(200).json({
    code,
    originalUrl,
    shortUrl: `https://${req.headers.host}/s/${code}`,
    clicks: meta.clicks || 0,
    createdAt: meta.createdAt ? new Date(meta.createdAt).toISOString() : null,
  });
}
