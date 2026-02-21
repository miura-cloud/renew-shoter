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
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "コードが必要です" });
  try {
    const [originalUrl, metaStr] = await Promise.all([
      kv("GET", `code:${code}`),
      kv("GET", `meta:${code}`),
    ]);
    if (!originalUrl) return res.status(404).json({ error: "存在しないコードです" });
    const meta = metaStr ? JSON.parse(metaStr) : { createdAt: null, clicks: 0 };
    return res.status(200).json({
      code, originalUrl,
      shortUrl: `https://${req.headers.host}/s/${code}`,
      clicks: meta.clicks || 0,
      createdAt: meta.createdAt ? new Date(meta.createdAt).toISOString() : null,
    });
  } catch (err) {
    return res.status(500).json({ error: "エラー: " + err.message });
  }
}
