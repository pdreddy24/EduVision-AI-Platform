export function redisConnectionOptions(redisUrl = process.env.REDIS_URL) {
  const url = new URL(redisUrl || "redis://127.0.0.1:6379");
  const options = {
    host: url.hostname,
    port: Number(url.port || 6379),
    maxRetriesPerRequest: null,
  };
  if (url.username) options.username = decodeURIComponent(url.username);
  if (url.password) options.password = decodeURIComponent(url.password);
  if (url.protocol === "rediss:") options.tls = {};
  if (url.pathname && url.pathname !== "/") options.db = Number(url.pathname.slice(1));
  return options;
}
