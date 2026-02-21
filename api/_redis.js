// Upstash Redis REST API を REDIS_URL から直接呼び出すヘルパー
// REDIS_URL 形式: rediss://default:TOKEN@HOST.upstash.io:PORT

function getConfig() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL が設定されていません");
  const match = url.match(/rediss?:\/\/[^:]+:([^@]+)@([^:]+)/);
  if (!match) throw new Error("REDIS_URL の形式が正しくありません: " + url);
  const [, token, host] = match;
  return { restUrl: `https://${host}`, token };
}

export async function redisCommand(...args) {
  const { restUrl, token } = getConfig();
  const res = await fetch(`${restUrl}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

export const redis = {
  get: (key) => redisCommand("GET", key),
  set: (key, value) => redisCommand("SET", key, value),
  exists: (key) => redisCommand("EXISTS", key),
};
