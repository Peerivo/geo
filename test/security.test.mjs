import test from "node:test";
import assert from "node:assert/strict";
import { auditUrl } from "../src/audit.mjs";

test("rejects explicit private-network targets by default", async () => {
  await assert.rejects(() => auditUrl("http://127.0.0.1:18765"), /Private\/local network targets are disabled/);
});
