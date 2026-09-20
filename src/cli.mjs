#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { auditUrl, reportFails, reportMarkdown } from "./audit.mjs";
import { submitIndexNow } from "./indexnow.mjs";

function usage() {
  console.log(`Peerivo GEO

Usage:
  peerivo-geo audit --url <https://...> [--json file] [--markdown file] [--fail-on error|warning|none] [--allow-private-network]

  peerivo-geo indexnow --host <example.com> --url <https://example.com/...> [--url <...>] [--url-file changed-urls.txt]
    [--key-env INDEXNOW_KEY] [--key-location https://example.com/path/key.txt]
    [--batch-size 10000] [--max-attempts 4] [--dry-run] [--skip-key-verification]
`);
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const args = {
    command,
    failOn: "error",
    allowPrivateNetwork: false,
    urls: [],
    keyEnv: "INDEXNOW_KEY",
    batchSize: 10_000,
    maxAttempts: 4,
    dryRun: false,
    verifyKey: true,
  };

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (token === "--allow-private-network") args.allowPrivateNetwork = true;
    else if (token === "--dry-run") args.dryRun = true;
    else if (token === "--skip-key-verification") args.verifyKey = false;
    else if (token === "--url") {
      const value = rest[++index];
      if (!value) throw new Error("--url requires a value");
      args.urls.push(value);
    } else if ([
      "--json",
      "--markdown",
      "--fail-on",
      "--host",
      "--url-file",
      "--key-env",
      "--key-location",
      "--batch-size",
      "--max-attempts",
    ].includes(token)) {
      const value = rest[++index];
      if (!value) throw new Error(`${token} requires a value`);
      args[token.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
    } else throw new Error(`Unknown argument: ${token}`);
  }

  args.batchSize = Number(args.batchSize);
  args.maxAttempts = Number(args.maxAttempts);
  return args;
}

async function writeOutput(path, content) {
  const absolute = resolve(path);
  await mkdir(dirname(absolute), { recursive: true });
  await writeFile(absolute, content, "utf8");
}

async function readUrlFile(path) {
  const raw = await readFile(resolve(path), "utf8");
  return raw
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

async function runAudit(args) {
  if (args.urls.length !== 1) throw new Error("audit requires exactly one --url");
  if (!["error", "warning", "none"].includes(args.failOn)) throw new Error("--fail-on must be error, warning, or none");

  const report = await auditUrl(args.urls[0], { allowPrivateNetwork: args.allowPrivateNetwork });
  const markdown = reportMarkdown(report);
  if (args.json) await writeOutput(args.json, `${JSON.stringify(report, null, 2)}\n`);
  if (args.markdown) await writeOutput(args.markdown, markdown);
  process.stdout.write(markdown);
  if (reportFails(report, args.failOn)) process.exitCode = 2;
}

async function runIndexNow(args) {
  if (!args.host) throw new Error("indexnow requires --host");
  const fileUrls = args.urlFile ? await readUrlFile(args.urlFile) : [];
  const urls = [...args.urls, ...fileUrls];
  if (urls.length === 0) throw new Error("indexnow requires --url and/or --url-file");

  const key = process.env[args.keyEnv];
  if (!key) throw new Error(`IndexNow key is missing from environment variable ${args.keyEnv}`);

  const result = await submitIndexNow({
    host: args.host,
    urls,
    key,
    keyLocation: args.keyLocation,
    batchSize: args.batchSize,
    maxAttempts: args.maxAttempts,
    verifyKey: args.verifyKey,
    dryRun: args.dryRun,
  });

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.command || args.command === "help" || args.command === "--help") return usage();
  if (args.command === "audit") return runAudit(args);
  if (args.command === "indexnow") return runIndexNow(args);
  throw new Error(`Unknown command: ${args.command}`);
}

main().catch((error) => {
  console.error(`Peerivo GEO failed: ${error.message}`);
  process.exitCode = 1;
});
