// api/redirect.js
// GET /api/redirect?code=abc123
// → 301 リダイレクト or JSON（コードが存在しない場合はエラー）

import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("コードが指定されていません");
  }

  const originalUrl = await kv.get(`code:${code}`).catch(() => null);

  if (!originalUrl) {
    // 存在しないコードの場合はトップページへ
    return res.redirect(302, "/?error=not_found");
  }

  // クリック数をインクリメント（非同期で行い、レスポンス遅延を防ぐ）
  kv.get(`meta:${code}`)
    .then((metaStr) => {
      const meta = metaStr ? JSON.parse(metaStr) : { createdAt: Date.now(), clicks: 0 };
      meta.clicks = (meta.clicks || 0) + 1;
      return kv.set(`meta:${code}`, JSON.stringify(meta));
    })
    .catch(() => {}); // クリック集計は失敗してもリダイレクトに影響させない

  return res.redirect(301, originalUrl);
}
