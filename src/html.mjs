function decodeBasicEntities(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

export function stripHtml(html) {
  return decodeBasicEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

export function firstTagText(html, tag) {
  const match = html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? stripHtml(match[1]) : "";
}

export function countTags(html, tag) {
  const matches = html.match(new RegExp(`<${tag}\\b[^>]*>`, "gi"));
  return matches?.length ?? 0;
}

export function parseAttributes(tag) {
  const attributes = {};
  const source = tag.replace(/^<[^\s>]+|\/?>(?:\s*)$/g, "");
  const regex = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of source.matchAll(regex)) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    attributes[name] = decodeBasicEntities(value.trim());
  }
  return attributes;
}

export function findTags(html, tag) {
  return html.match(new RegExp(`<${tag}\\b[^>]*>`, "gi")) ?? [];
}

export function findMetaContent(html, name) {
  for (const tag of findTags(html, "meta")) {
    const attrs = parseAttributes(tag);
    if ((attrs.name ?? "").toLowerCase() === name.toLowerCase()) return attrs.content ?? "";
  }
  return "";
}

export function findLinkHref(html, rel) {
  for (const tag of findTags(html, "link")) {
    const attrs = parseAttributes(tag);
    const rels = (attrs.rel ?? "").toLowerCase().split(/\s+/).filter(Boolean);
    if (rels.includes(rel.toLowerCase())) return attrs.href ?? "";
  }
  return "";
}

export function htmlLang(html) {
  const match = html.match(/<html\b[^>]*>/i);
  return match ? (parseAttributes(match[0]).lang ?? "") : "";
}

export function jsonLdBlocks(html) {
  const blocks = [];
  const regex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(regex)) {
    const attrs = parseAttributes(`<script ${match[1]}>`);
    if ((attrs.type ?? "").toLowerCase() === "application/ld+json") {
      blocks.push(match[2].trim());
    }
  }
  return blocks;
}

export function countInternalLinks(html, baseUrl) {
  let count = 0;
  const base = new URL(baseUrl);
  for (const tag of findTags(html, "a")) {
    const href = parseAttributes(tag).href;
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    try {
      const url = new URL(href, base);
      if ((url.protocol === "http:" || url.protocol === "https:") && url.origin === base.origin) count += 1;
    } catch {
      // Malformed links are handled by dedicated link check in a later milestone.
    }
  }
  return count;
}
