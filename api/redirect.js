async function kv(command, ...args) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  const res = await fetch(`${url}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify([command, ...args]),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).send("コードが指定されていません");
  try {
    const originalUrl = await kv("GET", `code:${code}`);
    if (!originalUrl) return res.redirect(302, "/?error=not_found");
    kv("GET", `meta:${code}`).then((metaStr) => {
      const meta = metaStr ? JSON.parse(metaStr) : { createdAt: Date.now(), clicks: 0 };
      meta.clicks = (meta.clicks || 0) + 1;
      return kv("SET", `meta:${code}`, JSON.stringify(meta));
    }).catch(() => {});
    return res.redirect(301, originalUrl);
  } catch (err) {
    return res.status(500).send("エラー: " + err.message);
  }
}
