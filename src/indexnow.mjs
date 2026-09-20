const DEFAULT_ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URLS_PER_REQUEST = 10_000;
const DEFAULT_MAX_ATTEMPTS = 4;
const DEFAULT_BASE_DELAY_MS = 500;

function assertHttpUrl(value, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid absolute URL`);
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`${label} must use http or https`);
  }
  return url;
}

export function validateIndexNowKey(key) {
  if (typeof key !== "string" || !/^[A-Za-z0-9-]{8,128}$/.test(key)) {
    throw new Error("IndexNow key must be 8-128 characters using only A-Z, a-z, 0-9, and hyphen");
  }
  return key;
}

export function normalizeHost(host) {
  if (typeof host !== "string" || host.trim() === "") throw new Error("host is required");
  const raw = host.includes("://") ? host : `https://${host}`;
  const url = assertHttpUrl(raw, "host");
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("host must identify only one origin host, without path, query, credentials, or fragment");
  }
  return url.host.toLowerCase();
}

export function normalizeUrls(host, urls) {
  const normalizedHost = normalizeHost(host);
  if (!Array.isArray(urls) || urls.length === 0) throw new Error("At least one URL is required");

  const seen = new Set();
  const result = [];
  for (const value of urls) {
    const url = assertHttpUrl(value, "submitted URL");
    if (url.host.toLowerCase() !== normalizedHost) {
      throw new Error(`URL host mismatch: ${url.host} does not equal ${normalizedHost}`);
    }
    url.hash = "";
    const normalized = url.toString();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return result;
}

export function buildKeyLocation(host, key, keyLocation) {
  const normalizedHost = normalizeHost(host);
  validateIndexNowKey(key);
  const location = keyLocation
    ? assertHttpUrl(keyLocation, "keyLocation")
    : new URL(`https://${normalizedHost}/${key}.txt`);
  if (location.host.toLowerCase() !== normalizedHost) {
    throw new Error("keyLocation must be on the same host as submitted URLs");
  }
  return location.toString();
}

export function chunkUrls(urls, size = MAX_URLS_PER_REQUEST) {
  if (!Number.isInteger(size) || size < 1 || size > MAX_URLS_PER_REQUEST) {
    throw new Error(`batch size must be an integer from 1 to ${MAX_URLS_PER_REQUEST}`);
  }
  const chunks = [];
  for (let index = 0; index < urls.length; index += size) chunks.push(urls.slice(index, index + size));
  return chunks;
}

function retryAfterMs(response) {
  const header = response.headers?.get?.("retry-after");
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const date = Date.parse(header);
  if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  return null;
}

function isRetryable(status) {
  return status === 429 || status >= 500;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function verifyKeyFile({ host, key, keyLocation, fetchImpl = fetch, maxRedirects = 5 }) {
  const normalizedHost = normalizeHost(host);
  const location = buildKeyLocation(normalizedHost, key, keyLocation);
  let current = location;

  for (let redirect = 0; redirect <= maxRedirects; redirect += 1) {
    const response = await fetchImpl(current, {
      method: "GET",
      redirect: "manual",
      headers: { accept: "text/plain" },
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const target = response.headers?.get?.("location");
      if (!target) throw new Error("IndexNow key file redirect is missing Location header");
      const next = assertHttpUrl(new URL(target, current).toString(), "key file redirect URL");
      if (next.host.toLowerCase() !== normalizedHost) {
        throw new Error("IndexNow key file redirect must remain on the same host");
      }
      current = next.toString();
      continue;
    }

    if (!response.ok) throw new Error(`IndexNow key file verification failed with HTTP ${response.status}`);
    const finalUrl = assertHttpUrl(response.url || current, "key file response URL");
    if (finalUrl.host.toLowerCase() !== normalizedHost) {
      throw new Error("IndexNow key file response must remain on the same host");
    }

    const body = (await response.text()).trim();
    if (body !== key) throw new Error("IndexNow key file content does not match configured key");
    return { ok: true, keyLocation: location };
  }

  throw new Error(`IndexNow key file exceeded ${maxRedirects} redirects`);
}

export async function submitIndexNow({
  host,
  urls,
  key,
  keyLocation,
  endpoint = DEFAULT_ENDPOINT,
  batchSize = MAX_URLS_PER_REQUEST,
  verifyKey = true,
  dryRun = false,
  fetchImpl = fetch,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  baseDelayMs = DEFAULT_BASE_DELAY_MS,
  sleepImpl = sleep,
}) {
  const normalizedHost = normalizeHost(host);
  const normalizedUrls = normalizeUrls(normalizedHost, urls);
  validateIndexNowKey(key);
  const normalizedKeyLocation = buildKeyLocation(normalizedHost, key, keyLocation);
  const endpointUrl = assertHttpUrl(endpoint, "endpoint").toString();

  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 10) {
    throw new Error("maxAttempts must be an integer from 1 to 10");
  }
  if (!Number.isFinite(baseDelayMs) || baseDelayMs < 0) throw new Error("baseDelayMs must be >= 0");

  if (verifyKey && !dryRun) {
    await verifyKeyFile({ host: normalizedHost, key, keyLocation: normalizedKeyLocation, fetchImpl });
  }

  const batches = chunkUrls(normalizedUrls, batchSize);
  if (dryRun) {
    return {
      dryRun: true,
      host: normalizedHost,
      urls: normalizedUrls.length,
      batches: batches.map((batch) => batch.length),
      endpoint: endpointUrl,
      keyLocation: normalizedKeyLocation.replace(key, "<redacted>"),
    };
  }

  const results = [];
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
    const urlList = batches[batchIndex];
    let attempt = 0;
    let response;
    while (attempt < maxAttempts) {
      attempt += 1;
      response = await fetchImpl(endpointUrl, {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host: normalizedHost,
          key,
          keyLocation: normalizedKeyLocation,
          urlList,
        }),
      });

      if ([200, 202].includes(response.status)) break;
      if (!isRetryable(response.status) || attempt >= maxAttempts) {
        const detail = await response.text().catch(() => "");
        const suffix = detail ? `: ${detail.slice(0, 300)}` : "";
        throw new Error(`IndexNow submission failed with HTTP ${response.status}${suffix}`);
      }

      const waitMs = retryAfterMs(response) ?? baseDelayMs * 2 ** (attempt - 1);
      await sleepImpl(waitMs);
    }

    results.push({
      batch: batchIndex + 1,
      urls: urlList.length,
      status: response.status,
      attempts: attempt,
    });
  }

  return {
    dryRun: false,
    host: normalizedHost,
    urls: normalizedUrls.length,
    batches: results,
  };
}

export const INDEXNOW_LIMITS = Object.freeze({
  maxUrlsPerRequest: MAX_URLS_PER_REQUEST,
  defaultEndpoint: DEFAULT_ENDPOINT,
});
