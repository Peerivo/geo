import test from "node:test";
import assert from "node:assert/strict";
import { isPathAllowed, parseRobots } from "../src/robots.mjs";

test("specific agent overrides wildcard group", () => {
  const robots = `User-agent: *\nDisallow: /private\n\nUser-agent: OAI-SearchBot\nAllow: /private\n`;
  assert.equal(isPathAllowed(robots, "Googlebot", "/private/page"), false);
  assert.equal(isPathAllowed(robots, "OAI-SearchBot", "/private/page"), true);
});

test("longest matching rule wins and allow wins ties", () => {
  const robots = `User-agent: *\nDisallow: /docs\nAllow: /docs/public\n`;
  assert.equal(isPathAllowed(robots, "Bingbot", "/docs/private"), false);
  assert.equal(isPathAllowed(robots, "Bingbot", "/docs/public/page"), true);
});

test("multiple user-agent lines form one group", () => {
  const parsed = parseRobots(`User-agent: Googlebot\nUser-agent: Bingbot\nDisallow: /x\n`);
  assert.deepEqual(parsed[0].agents, ["googlebot", "bingbot"]);
  assert.equal(isPathAllowed(`User-agent: Googlebot\nUser-agent: Bingbot\nDisallow: /x\n`, "Bingbot", "/x"), false);
});
