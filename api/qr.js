// api/qr.js
// QRコード画像をサーバー経由で取得してブラウザに返すプロキシ
// これによりブラウザ側でblobダウンロードが可能になる

export default async function handler(req, res) {
  const { data, format = "png", size = "400" } = req.query;
  if (!data) return res.status(400).send("data parameter required");

  const apiFormat = format === "jpeg" ? "jpg" : format;
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&ecc=H&margin=10&format=${apiFormat}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("QR API error");

    const contentType = response.headers.get("content-type") || "image/png";
    const buffer = await response.arrayBuffer();

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="qrcode.${format}"`);
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.send(Buffer.from(buffer));
  } catch (err) {
    return res.status(500).send("QR生成エラー: " + err.message);
  }
}
