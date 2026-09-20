import test from "node:test";
import assert from "node:assert/strict";
import { reportFails, reportMarkdown } from "../src/audit.mjs";

test("failure threshold distinguishes errors and warnings", () => {
  const report = { findings: [
    { id: "A", severity: "warning", status: "fail", message: "warn" },
    { id: "B", severity: "info", status: "skip", message: "info" }
  ], profile: "public_required", rulesetVersion: "x", finalUrl: "https://example.com", summary: { error: 0, warning: 1, passed: 0, failed: 1 } };
  assert.equal(reportFails(report, "error"), false);
  assert.equal(reportFails(report, "warning"), true);
  assert.match(reportMarkdown(report), /Web Discovery Review/);
});
