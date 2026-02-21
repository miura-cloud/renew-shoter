import { redis } from "./_redis.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "コードが必要です" });

  try {
    const [originalUrl, metaStr] = await Promise.all([
      redis.get(`code:${code}`),
      redis.get(`meta:${code}`),
    ]);
    if (!originalUrl) return res.status(404).json({ error: "存在しないコードです" });

    const meta = metaStr ? JSON.parse(metaStr) : { createdAt: null, clicks: 0 };
    return res.status(200).json({
      code,
      originalUrl,
      shortUrl: `https://${req.headers.host}/s/${code}`,
      clicks: meta.clicks || 0,
      createdAt: meta.createdAt ? new Date(meta.createdAt).toISOString() : null,
    });
  } catch (err) {
    return res.status(500).json({ error: "エラー: " + err.message });
  }
}
