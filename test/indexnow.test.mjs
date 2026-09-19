import test from "node:test";
import assert from "node:assert/strict";
import {
  buildKeyLocation,
  chunkUrls,
  normalizeUrls,
  submitIndexNow,
  validateIndexNowKey,
  verifyKeyFile,
} from "../src/indexnow.mjs";

test("validates IndexNow key format", () => {
  assert.equal(validateIndexNowKey("Abcd-1234"), "Abcd-1234");
  assert.throws(() => validateIndexNowKey("short"), /8-128/);
  assert.throws(() => validateIndexNowKey("bad_key_value"), /8-128/);
});

test("normalizes and deduplicates same-host URLs", () => {
  assert.deepEqual(normalizeUrls("example.com", [
    "https://example.com/a#one",
    "https://example.com/a#two",
    "https://example.com/b",
  ]), ["https://example.com/a", "https://example.com/b"]);
  assert.throws(() => normalizeUrls("example.com", ["https://other.example/a"]), /host mismatch/);
});

test("key location defaults to same host and rejects cross-host locations", () => {
  assert.equal(
    buildKeyLocation("example.com", "Abcd-1234"),
    "https://example.com/Abcd-1234.txt",
  );
  assert.throws(
    () => buildKeyLocation("example.com", "Abcd-1234", "https://cdn.example/key.txt"),
    /same host/,
  );
});

test("chunks requests at configured size", () => {
  assert.deepEqual(chunkUrls(["a", "b", "c"], 2), [["a", "b"], ["c"]]);
  assert.throws(() => chunkUrls(["a"], 10001), /1 to 10000/);
});

test("verifies public key file content", async () => {
  const result = await verifyKeyFile({
    host: "example.com",
    key: "Abcd-1234",
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      url: "https://example.com/Abcd-1234.txt",
      headers: { get: () => null },
      text: async () => "Abcd-1234\n",
    }),
  });
  assert.equal(result.ok, true);
});

test("rejects cross-host key-file redirects before following them", async () => {
  let calls = 0;
  await assert.rejects(() => verifyKeyFile({
    host: "example.com",
    key: "Abcd-1234",
    fetchImpl: async () => {
      calls += 1;
      return {
        ok: false,
        status: 302,
        url: "https://example.com/Abcd-1234.txt",
        headers: { get: (name) => name === "location" ? "http://127.0.0.1/key.txt" : null },
        text: async () => "",
      };
    },
  }), /same host/);
  assert.equal(calls, 1);
});

test("submits a deduplicated batch and treats 202 as accepted", async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    if (!options.method || options.method === "GET") {
      return {
        ok: true,
        status: 200,
        url: "https://example.com/Abcd-1234.txt",
        headers: { get: () => null },
        text: async () => "Abcd-1234",
      };
    }
    return { status: 202, headers: { get: () => null }, text: async () => "" };
  };

  const result = await submitIndexNow({
    host: "example.com",
    key: "Abcd-1234",
    urls: ["https://example.com/a", "https://example.com/a", "https://example.com/b"],
    fetchImpl,
  });

  assert.equal(result.urls, 2);
  assert.equal(result.batches[0].status, 202);
  const payload = JSON.parse(calls[1].options.body);
  assert.deepEqual(payload.urlList, ["https://example.com/a", "https://example.com/b"]);
});

test("retries 429 and 5xx but not protocol errors", async () => {
  let posts = 0;
  const waits = [];
  const fetchImpl = async (_url, options = {}) => {
    if (!options.method || options.method === "GET") {
      return {
        ok: true,
        status: 200,
        url: "https://example.com/Abcd-1234.txt",
        headers: { get: () => null },
        text: async () => "Abcd-1234",
      };
    }
    posts += 1;
    if (posts === 1) return { status: 429, headers: { get: () => null }, text: async () => "" };
    if (posts === 2) return { status: 503, headers: { get: () => null }, text: async () => "" };
    return { status: 200, headers: { get: () => null }, text: async () => "" };
  };

  const result = await submitIndexNow({
    host: "example.com",
    key: "Abcd-1234",
    urls: ["https://example.com/a"],
    fetchImpl,
    baseDelayMs: 1,
    sleepImpl: async (ms) => waits.push(ms),
  });
  assert.equal(result.batches[0].attempts, 3);
  assert.deepEqual(waits, [1, 2]);
});

test("dry-run never performs network access and redacts key from keyLocation", async () => {
  let called = false;
  const result = await submitIndexNow({
    host: "example.com",
    key: "Abcd-1234",
    urls: ["https://example.com/a"],
    dryRun: true,
    fetchImpl: async () => { called = true; throw new Error("must not be called"); },
  });
  assert.equal(called, false);
  assert.equal(result.dryRun, true);
  assert.match(result.keyLocation, /<redacted>/);
  assert.doesNotMatch(result.keyLocation, /Abcd-1234/);
});
