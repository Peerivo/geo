import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
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
} from "./html.mjs";
import { isPathAllowed } from "./robots.mjs";
import { finding, REPORT_SCHEMA_VERSION, RULESET_VERSION } from "./rules.mjs";

const PRIVATE_V4 = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./
];

function isPrivateAddress(address) {
  if (isIP(address) === 4) return PRIVATE_V4.some((pattern) => pattern.test(address));
  if (isIP(address) !== 6) return false;
  const host = address.toLowerCase();
  if (host === "::1" || host === "::") return true;
  if (host.startsWith("fc") || host.startsWith("fd") || /^fe[89ab]/.test(host)) return true;
  if (host.startsWith("::ffff:")) return isPrivateAddress(host.slice("::ffff:".length));
  return false;
}

async function assertSafeTarget(url, allowPrivateNetwork) {
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only http:// and https:// URLs are supported");
  if (allowPrivateNetwork) return;
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    throw new Error("Private/local network targets are disabled by default");
  }
  if (isPrivateAddress(host)) throw new Error("Private/local network targets are disabled by default");
  if (!isIP(host)) {
    const addresses = await lookup(host, { all: true, verbatim: true });
    if (addresses.some(({ address }) => isPrivateAddress(address))) {
      throw new Error("Target resolves to a private/local network address");
    }
  }
}

async function fetchText(inputUrl, options = {}) {
  let url = inputUrl instanceof URL ? new URL(inputUrl.href) : new URL(inputUrl);
  const maxRedirects = options.maxRedirects ?? 5;
  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    await assertSafeTarget(url, options.allowPrivateNetwork === true);
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(options.timeoutMs ?? 15000),
      headers: {
        "user-agent": options.userAgent ?? "PeerivoGEO/0.1 (+https://github.com/Peerivo/geo)",
        accept: options.accept ?? "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.1"
      }
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return { response, text: await response.text() };
      if (redirectCount === maxRedirects) throw new Error(`Too many redirects (>${maxRedirects})`);
      url = new URL(location, url);
      continue;
    }
    return { response, text: await response.text() };
  }
  throw new Error("Redirect handling failed");
}

function noindexFromHeaders(response) {
  const value = response.headers.get("x-robots-tag") ?? "";
  return /(?:^|[,\s])noindex(?:$|[,\s])/i.test(value);
}

function noindexFromHtml(html) {
  const value = findMetaContent(html, "robots");
  return /(?:^|[,\s])noindex(?:$|[,\s])/i.test(value);
}

function validateJsonLd(html) {
  const blocks = jsonLdBlocks(html);
  const errors = [];
  for (let index = 0; index < blocks.length; index += 1) {
    try {
      JSON.parse(blocks[index]);
    } catch (error) {
      errors.push(`block ${index + 1}: ${error.message}`);
    }
  }
  return { blocks, errors };
}

async function auditRobots(targetUrl, findings, options) {
  const robotsUrl = new URL("/robots.txt", targetUrl);
  try {
    const { response, text } = await fetchText(robotsUrl, { ...options, accept: "text/plain,*/*;q=0.1" });
    if (response.status === 404 || response.status === 410) {
      for (const [id, agent] of [
        ["GEO-ROBOTS-001", "*"],
        ["GEO-ROBOTS-002", "OAI-SearchBot"],
        ["GEO-ROBOTS-003", "Googlebot"],
        ["GEO-ROBOTS-004", "Bingbot"]
      ]) findings.push(finding(id, "pass", `robots.txt is absent (${response.status}); ${agent} is not disallowed there.`));
      return { url: robotsUrl.href, status: response.status };
    }
    if (!response.ok) {
      for (const [id, agent] of [
        ["GEO-ROBOTS-001", "*"],
        ["GEO-ROBOTS-002", "OAI-SearchBot"],
        ["GEO-ROBOTS-003", "Googlebot"],
        ["GEO-ROBOTS-004", "Bingbot"]
      ]) findings.push(finding(id, "fail", `robots.txt returned ${response.status}; ${agent} crawl policy cannot be verified safely.`));
      return { url: robotsUrl.href, status: response.status };
    }

    for (const [id, agent] of [
      ["GEO-ROBOTS-001", "*"],
      ["GEO-ROBOTS-002", "OAI-SearchBot"],
      ["GEO-ROBOTS-003", "Googlebot"],
      ["GEO-ROBOTS-004", "Bingbot"]
    ]) {
      const allowed = isPathAllowed(text, agent, targetUrl.pathname || "/");
      findings.push(finding(id, allowed ? "pass" : "fail", allowed
        ? `${agent} is allowed to crawl ${targetUrl.pathname || "/"}.`
        : `${agent} is blocked from ${targetUrl.pathname || "/"} by robots.txt.`));
    }
    return { url: robotsUrl.href, status: response.status };
  } catch (error) {
    for (const [id, agent] of [
      ["GEO-ROBOTS-001", "*"],
      ["GEO-ROBOTS-002", "OAI-SearchBot"],
      ["GEO-ROBOTS-003", "Googlebot"],
      ["GEO-ROBOTS-004", "Bingbot"]
    ]) findings.push(finding(id, "fail", `robots.txt could not be fetched; ${agent} crawl policy is unknown: ${error.message}`));
    return { url: robotsUrl.href, status: null, error: error.message };
  }
}

async function auditSitemap(targetUrl, findings, options) {
  const sitemapUrl = new URL("/sitemap.xml", targetUrl);
  try {
    const { response } = await fetchText(sitemapUrl, { ...options, accept: "application/xml,text/xml,text/plain,*/*;q=0.1" });
    findings.push(finding("GEO-SITEMAP-001", response.ok ? "pass" : "skip",
      response.ok ? `Sitemap endpoint returned ${response.status}.` : `Default /sitemap.xml returned ${response.status}; sitemap may be declared elsewhere.`));
    return { url: sitemapUrl.href, status: response.status };
  } catch (error) {
    findings.push(finding("GEO-SITEMAP-001", "skip", `Default sitemap could not be fetched: ${error.message}`));
    return { url: sitemapUrl.href, status: null, error: error.message };
  }
}

export async function auditUrl(rawUrl, options = {}) {
  const startedAt = new Date().toISOString();
  const targetUrl = new URL(rawUrl);
  const findings = [];

  const page = await fetchText(targetUrl, options);
  const contentType = page.response.headers.get("content-type") ?? "";
  const isHtml = /text\/html|application\/xhtml\+xml/i.test(contentType) || /^\s*<!doctype html|^\s*<html/i.test(page.text);
  const pageOk = page.response.ok && isHtml;
  findings.push(finding("GEO-HTTP-001", pageOk ? "pass" : "fail",
    `Final response ${page.response.status}; content-type=${contentType || "unknown"}; final-url=${page.response.url}.`));

  const finalUrl = new URL(page.response.url || targetUrl.href);
  findings.push(finding("GEO-HTTPS-001", finalUrl.protocol === "https:" ? "pass" : "fail",
    finalUrl.protocol === "https:" ? "Final public URL uses HTTPS." : `Final public URL uses ${finalUrl.protocol} instead of HTTPS.`));

  if (!isHtml) {
    return makeReport(rawUrl, page.response.url || rawUrl, startedAt, findings, { status: page.response.status, contentType });
  }

  const noindexHeader = noindexFromHeaders(page.response);
  const noindexHtml = noindexFromHtml(page.text);
  findings.push(finding("GEO-INDEX-001", (!noindexHeader && !noindexHtml) ? "pass" : "fail",
    (!noindexHeader && !noindexHtml) ? "No noindex directive detected." : `noindex detected in ${[noindexHeader && "X-Robots-Tag", noindexHtml && "meta robots"].filter(Boolean).join(" and ")}.`));

  const title = firstTagText(page.text, "title");
  findings.push(finding("GEO-META-001", title ? "pass" : "fail", title ? `Title: ${title}` : "No non-empty <title> found."));

  const description = findMetaContent(page.text, "description");
  findings.push(finding("GEO-META-002", description ? "pass" : "fail", description ? "Meta description is present." : "Meta description is missing."));

  const viewport = findMetaContent(page.text, "viewport");
  findings.push(finding("GEO-META-003", viewport ? "pass" : "fail",
    viewport ? "Viewport metadata is present." : "Viewport metadata is missing; mobile rendering may be incorrect."));

  const canonical = findLinkHref(page.text, "canonical");
  findings.push(finding("GEO-CANON-001", canonical ? "pass" : "fail", canonical ? `Canonical: ${canonical}` : "Canonical link is not declared."));

  const h1Count = countTags(page.text, "h1");
  findings.push(finding("GEO-HTML-001", h1Count === 1 ? "pass" : "fail", `Found ${h1Count} H1 element(s).`));

  const visibleText = stripHtml(page.text);
  findings.push(finding("GEO-HTML-002", visibleText.length >= 160 ? "pass" : "fail",
    visibleText.length >= 160 ? `Fetched HTML contains ${visibleText.length} visible-text characters.` : `Fetched HTML contains only ${visibleText.length} visible-text characters; critical content may depend on client rendering.`));

  const internalLinks = countInternalLinks(page.text, page.response.url || targetUrl.href);
  findings.push(finding("GEO-HTML-003", internalLinks > 0 ? "pass" : "fail", `Found ${internalLinks} internal crawlable link(s).`));

  const imagesWithoutAlt = countImagesWithoutAlt(page.text);
  findings.push(finding("GEO-A11Y-001", imagesWithoutAlt === 0 ? "pass" : "fail",
    imagesWithoutAlt === 0 ? "No image without non-empty alt text was found." : `Found ${imagesWithoutAlt} image(s) without non-empty alt text.`));

  const lang = htmlLang(page.text);
  findings.push(finding("GEO-I18N-001", lang ? "pass" : "fail", lang ? `HTML language: ${lang}` : "The <html> element has no lang attribute."));

  const alternateLanguages = countAlternateLanguages(page.text);
  findings.push(finding("GEO-I18N-002", alternateLanguages > 0 ? "pass" : "skip",
    alternateLanguages > 0 ? `Found ${alternateLanguages} hreflang alternate link(s).` : "No hreflang alternate links found; this is expected for single-language pages."));

  const jsonLd = validateJsonLd(page.text);
  findings.push(finding("GEO-SCHEMA-001", jsonLd.errors.length === 0 ? "pass" : "fail",
    jsonLd.errors.length === 0 ? `${jsonLd.blocks.length} JSON-LD block(s) parsed successfully.` : `Invalid JSON-LD: ${jsonLd.errors.join("; ")}`));
  findings.push(finding("GEO-SCHEMA-002", jsonLd.blocks.length > 0 ? "pass" : "skip",
    jsonLd.blocks.length > 0 ? "Structured data is present." : "No JSON-LD found. Structured data is useful when it accurately models the page, but it is not a universal AI-search requirement."));

  const ogTitle = findMetaPropertyContent(page.text, "og:title");
  const ogDescription = findMetaPropertyContent(page.text, "og:description");
  findings.push(finding("GEO-SOCIAL-001", ogTitle && ogDescription ? "pass" : "fail",
    ogTitle && ogDescription ? "Open Graph title and description are present." : "Open Graph title and/or description is missing."));

  const csp = page.response.headers.get("content-security-policy");
  const referrerPolicy = page.response.headers.get("referrer-policy");
  const hsts = page.response.headers.get("strict-transport-security");
  findings.push(finding("GEO-SEC-001", csp ? "pass" : "fail", csp ? "Content-Security-Policy header is present." : "Content-Security-Policy header is missing."));
  findings.push(finding("GEO-SEC-002", referrerPolicy ? "pass" : "fail", referrerPolicy ? "Referrer-Policy header is present." : "Referrer-Policy header is missing."));
  findings.push(finding("GEO-SEC-003", finalUrl.protocol !== "https:" ? "skip" : (hsts ? "pass" : "fail"),
    finalUrl.protocol !== "https:" ? "HSTS is not evaluated on a non-HTTPS URL." : (hsts ? "Strict-Transport-Security header is present." : "Strict-Transport-Security header is missing.")));

  findings.push(finding("GEO-LLMS-001", "skip", "llms.txt is intentionally non-blocking; Google states it neither improves nor harms Google Search visibility."));
  const [robots, sitemap] = await Promise.all([
    auditRobots(finalUrl, findings, options),
    auditSitemap(finalUrl, findings, options)
  ]);

  return makeReport(rawUrl, finalUrl.href, startedAt, findings, {
    status: page.response.status,
    contentType,
    title,
    descriptionPresent: Boolean(description),
    viewportPresent: Boolean(viewport),
    canonical: canonical || null,
    h1Count,
    htmlLang: lang || null,
    alternateLanguages,
    visibleTextCharacters: visibleText.length,
    internalLinks,
    imagesWithoutAlt,
    jsonLdBlocks: jsonLd.blocks.length,
    openGraph: { titlePresent: Boolean(ogTitle), descriptionPresent: Boolean(ogDescription) },
    securityHeaders: { csp: Boolean(csp), referrerPolicy: Boolean(referrerPolicy), hsts: Boolean(hsts) },
    robots,
    sitemap
  });
}

function makeReport(requestedUrl, finalUrl, startedAt, findings, page) {
  const summary = { error: 0, warning: 0, info: 0, passed: 0, failed: 0, skipped: 0 };
  for (const item of findings) {
    if (item.status === "pass") summary.passed += 1;
    if (item.status === "fail") {
      summary.failed += 1;
      summary[item.severity] += 1;
    }
    if (item.status === "skip") summary.skipped += 1;
  }
  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    rulesetVersion: RULESET_VERSION,
    profile: "public_required",
    requestedUrl,
    finalUrl,
    startedAt,
    completedAt: new Date().toISOString(),
    summary,
    page,
    findings
  };
}

export function reportFails(report, threshold = "error") {
  if (threshold === "none") return false;
  if (threshold === "warning") return report.findings.some((item) => item.status === "fail" && ["error", "warning"].includes(item.severity));
  return report.findings.some((item) => item.status === "fail" && item.severity === "error");
}

export function reportMarkdown(report) {
  const lines = [
    "# Peerivo GEO — Web Discovery Review",
    "",
    `- Profile: \`${report.profile}\``,
    `- Ruleset: \`${report.rulesetVersion}\``,
    `- URL: ${report.finalUrl}`,
    `- Errors: ${report.summary.error}`,
    `- Warnings: ${report.summary.warning}`,
    `- Passed: ${report.summary.passed}`,
    `- Failed: ${report.summary.failed}`,
    "",
    "| Rule | Severity | Status | Finding |",
    "| --- | --- | --- | --- |"
  ];
  for (const item of report.findings) {
    const message = item.message.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
    lines.push(`| ${item.id} | ${item.severity} | ${item.status} | ${message} |`);
  }
  lines.push("");
  return lines.join("\n");
}
