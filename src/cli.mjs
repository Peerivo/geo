#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { auditUrl, reportFails, reportMarkdown } from "./audit.mjs";

function usage() {
  console.log(`Peerivo GEO\n\nUsage:\n  peerivo-geo audit --url <https://...> [--json file] [--markdown file] [--fail-on error|warning|none] [--allow-private-network]\n`);
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const args = { command, failOn: "error", allowPrivateNetwork: false };
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (token === "--allow-private-network") args.allowPrivateNetwork = true;
    else if (["--url", "--json", "--markdown", "--fail-on"].includes(token)) {
      const value = rest[++index];
      if (!value) throw new Error(`${token} requires a value`);
      args[token.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
    } else throw new Error(`Unknown argument: ${token}`);
  }
  return args;
}

async function writeOutput(path, content) {
  const absolute = resolve(path);
  await mkdir(dirname(absolute), { recursive: true });
  await writeFile(absolute, content, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.command || args.command === "help" || args.command === "--help") return usage();
  if (args.command !== "audit") throw new Error(`Unknown command: ${args.command}`);
  if (!args.url) throw new Error("--url is required");
  if (!["error", "warning", "none"].includes(args.failOn)) throw new Error("--fail-on must be error, warning, or none");

  const report = await auditUrl(args.url, { allowPrivateNetwork: args.allowPrivateNetwork });
  const markdown = reportMarkdown(report);
  if (args.json) await writeOutput(args.json, `${JSON.stringify(report, null, 2)}\\n`);
  if (args.markdown) await writeOutput(args.markdown, markdown);
  process.stdout.write(markdown);
  if (reportFails(report, args.failOn)) process.exitCode = 2;
}

main().catch((error) => {
  console.error(`Peerivo GEO failed: ${error.message}`);
  process.exitCode = 1;
});
