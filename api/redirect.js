import { redis } from "./_redis.js";

export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).send("コードが指定されていません");

  try {
    const originalUrl = await redis.get(`code:${code}`);
    if (!originalUrl) return res.redirect(302, "/?error=not_found");

    // クリック数インクリメント（非同期）
    redis.get(`meta:${code}`).then((metaStr) => {
      const meta = metaStr ? JSON.parse(metaStr) : { createdAt: Date.now(), clicks: 0 };
      meta.clicks = (meta.clicks || 0) + 1;
      return redis.set(`meta:${code}`, JSON.stringify(meta));
    }).catch(() => {});

    return res.redirect(301, originalUrl);
  } catch (err) {
    return res.status(500).send("エラー: " + err.message);
  }
}
