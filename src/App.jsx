import { useState, useEffect } from "react";
import {
  Link2, Copy, Check, Download, QrCode,
  AlertCircle, BarChart2, ExternalLink, RefreshCw
} from "lucide-react";

export default function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null); // { shortUrl, code, reused }
  const [stats, setStats] = useState(null);   // { clicks, createdAt }
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // URLエラーをリアルタイムでクリア
  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    if (error) setError("");
  };

  const isValidUrl = (str) => {
    try {
      const p = new URL(str);
      return p.protocol === "http:" || p.protocol === "https:";
    } catch { return false; }
  };

  const generateShortUrl = async () => {
    if (!url.trim()) return;
    if (!isValidUrl(url)) {
      setError("有効なURLを入力してください（例: https://example.com）");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setStats(null);

    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "生成に失敗しました");

      setResult(data);
      fetchStats(data.code);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (code) => {
    try {
      const res = await fetch(`/api/stats?code=${code}`);
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch {}
  };

  const refreshStats = () => {
    if (result?.code) fetchStats(result.code);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result.shortUrl);
    } catch {
      const el = document.createElement("textarea");
      el.value = result.shortUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrImageUrl = result
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(result.shortUrl)}&ecc=H&margin=10`
    : "";

  const downloadQR = () => {
    const a = document.createElement("a");
    a.href = qrImageUrl + "&format=png";
    a.download = `qrcode-${result.code}.png`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  const handleReset = () => {
    setUrl("");
    setResult(null);
    setStats(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-xl p-2.5">
                <Link2 className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-white text-lg font-bold tracking-tight">URL短縮 & QR作成</h1>
                <p className="text-blue-100 text-xs mt-0.5">広告なし・外部依存なし・完全自前</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">

            {/* Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                元のURLを入力
              </label>
              <input
                type="url"
                placeholder="https://example.com/very/long/url..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-sm placeholder-gray-300"
                value={url}
                onChange={handleUrlChange}
                onKeyDown={(e) => e.key === "Enter" && generateShortUrl()}
                disabled={loading}
              />
              <div className="flex gap-2">
                <button
                  onClick={generateShortUrl}
                  disabled={loading || !url.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm shadow-md"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      生成中...
                    </span>
                  ) : "✨ 短縮URL & QRを生成"}
                </button>
                {(result || url) && (
                  <button
                    onClick={handleReset}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
                  >
                    リセット
                  </button>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="space-y-4 border-t pt-4">

                {/* Reused notice */}
                {result.reused && (
                  <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    ℹ️ このURLは以前に登録済みのため、同じ短縮URLを返しています
                  </div>
                )}

                {/* Short URL */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    短縮URL
                  </p>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2">
                    <a
                      href={result.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-blue-700 font-semibold text-sm break-all flex-1 hover:underline"
                    >
                      {result.shortUrl}
                    </a>
                    <div className="flex gap-1 flex-shrink-0">
                      <a
                        href={result.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                        title="新しいタブで開く"
                      >
                        <ExternalLink size={15} className="text-blue-400" />
                      </a>
                      <button
                        onClick={copyToClipboard}
                        className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                        title="コピー"
                      >
                        {copied
                          ? <Check size={15} className="text-green-500" />
                          : <Copy size={15} className="text-blue-500" />
                        }
                      </button>
                    </div>
                  </div>
                  {copied && (
                    <p className="text-xs text-green-600 mt-1 text-right">✓ コピーしました</p>
                  )}
                </div>

                {/* Stats */}
                {stats && (
                  <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BarChart2 size={15} className="text-indigo-400" />
                      <span>クリック数:</span>
                      <span className="font-bold text-indigo-600 text-base">{stats.clicks.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {stats.createdAt && (
                        <span className="text-xs text-gray-400">
                          {new Date(stats.createdAt).toLocaleDateString("ja-JP")} 作成
                        </span>
                      )}
                      <button
                        onClick={refreshStats}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                        title="更新"
                      >
                        <RefreshCw size={13} className="text-gray-400" />
                      </button>
                    </div>
                  </div>
                )}

                {/* QR Code */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    QRコード
                  </p>
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-white border-2 border-gray-100 rounded-2xl p-3 shadow-sm">
                      <img
                        src={qrImageUrl}
                        alt="QR Code"
                        width={200}
                        height={200}
                        className="rounded-lg"
                      />
                    </div>
                    <button
                      onClick={downloadQR}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors border border-gray-200 hover:border-blue-300 bg-white px-5 py-2.5 rounded-xl"
                    >
                      <Download size={14} />
                      QRコードをPNGで保存
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Badge */}
        <p className="text-center text-xs text-blue-300/60">
          広告なし • 外部サービス依存なし • Powered by Vercel KV
        </p>
      </div>
    </div>
  );
}
