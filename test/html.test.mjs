import test from "node:test";
import assert from "node:assert/strict";
import {
  countAlternateLanguages,
  countImagesWithoutAlt,
  countInternalLinks,
  countTags,
  findLinkHref,
  findMetaContent,
  findMetaPropertyContent,
  firstTagText,
  htmlLang,
  jsonLdBlocks,
  stripHtml
} from "../src/html.mjs";

test("extracts page metadata and visible text", () => {
  const html = `<!doctype html><html lang="ru"><head><title> Peerivo GEO </title><meta name="description" content="Audit"><link rel="canonical" href="https://peerivo.net/geo"></head><body><h1>Title</h1><a href="/docs">Docs</a><script>hidden()</script><p>Hello &amp; world</p></body></html>`;
  assert.equal(firstTagText(html, "title"), "Peerivo GEO");
  assert.equal(findMetaContent(html, "description"), "Audit");
  assert.equal(findLinkHref(html, "canonical"), "https://peerivo.net/geo");
  assert.equal(htmlLang(html), "ru");
  assert.equal(countTags(html, "h1"), 1);
  assert.equal(countInternalLinks(html, "https://peerivo.net/geo"), 1);
  assert.match(stripHtml(html), /Hello & world/);
  assert.doesNotMatch(stripHtml(html), /hidden/);
});

test("extracts JSON-LD blocks", () => {
  const html = `<script type="application/ld+json">{"@type":"Organization"}</script><script type="text/javascript">x()</script>`;
  assert.deepEqual(jsonLdBlocks(html), ['{"@type":"Organization"}']);
});

test("extracts web-quality metadata", () => {
  const html = `<html><head><meta property="og:title" content="T"><link rel="alternate" hreflang="ru" href="/ru"></head><body><img src="/a.png"><img src="/b.png" alt="B"></body></html>`;
  assert.equal(findMetaPropertyContent(html, "og:title"), "T");
  assert.equal(countAlternateLanguages(html), 1);
  assert.equal(countImagesWithoutAlt(html), 1);
});
