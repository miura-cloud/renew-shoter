async function kvGet(key) {
  const base = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  const res = await fetch(`${base}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
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

export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).send("コードが指定されていません");
  try {
    const originalUrl = await kvGet(`code:${code}`);
    if (!originalUrl) return res.redirect(302, "/?error=not_found");
    // クリック数更新（非同期・失敗してもリダイレクトに影響しない）
    kvGet(`meta:${code}`).then((metaStr) => {
      const meta = metaStr ? JSON.parse(metaStr) : { createdAt: Date.now(), clicks: 0 };
      meta.clicks = (meta.clicks || 0) + 1;
      return kvSet(`meta:${code}`, JSON.stringify(meta));
    }).catch(() => {});
    return res.redirect(301, originalUrl);
  } catch (err) {
    return res.status(500).send("エラー: " + err.message);
  }
}
