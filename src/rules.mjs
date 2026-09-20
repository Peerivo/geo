export const RULESET_VERSION = "0.2.0";
export const REPORT_SCHEMA_VERSION = "1.1.0";

export const RULES = {
  "GEO-HTTP-001": { severity: "error", title: "Page returns successful HTML", evidence: "primary", metricClass: "crawl" },
  "GEO-HTTPS-001": { severity: "error", title: "Public page uses HTTPS", evidence: "primary", metricClass: "transport" },
  "GEO-INDEX-001": { severity: "error", title: "Page is indexable", evidence: "primary", metricClass: "indexability" },
  "GEO-ROBOTS-001": { severity: "error", title: "Generic crawler is allowed", evidence: "primary", metricClass: "crawl" },
  "GEO-ROBOTS-002": { severity: "error", title: "OAI-SearchBot is allowed", evidence: "primary", metricClass: "ai_discovery" },
  "GEO-ROBOTS-003": { severity: "error", title: "Googlebot is allowed", evidence: "primary", metricClass: "crawl" },
  "GEO-ROBOTS-004": { severity: "error", title: "Bingbot is allowed", evidence: "primary", metricClass: "crawl" },
  "GEO-META-001": { severity: "error", title: "Non-empty HTML title", evidence: "primary", metricClass: "metadata" },
  "GEO-META-002": { severity: "warning", title: "Meta description present", evidence: "peerivo", metricClass: "metadata" },
  "GEO-META-003": { severity: "warning", title: "Viewport metadata present", evidence: "primary", metricClass: "mobile" },
  "GEO-CANON-001": { severity: "warning", title: "Canonical URL declared", evidence: "peerivo", metricClass: "canonicalization" },
  "GEO-HTML-001": { severity: "warning", title: "Exactly one H1", evidence: "peerivo", metricClass: "content_structure" },
  "GEO-HTML-002": { severity: "warning", title: "Meaningful text in fetched HTML", evidence: "primary", metricClass: "rendering" },
  "GEO-HTML-003": { severity: "warning", title: "Internal crawlable link present", evidence: "primary", metricClass: "internal_links" },
  "GEO-A11Y-001": { severity: "warning", title: "Images expose non-empty alt text", evidence: "primary", metricClass: "accessibility" },
  "GEO-I18N-001": { severity: "warning", title: "HTML language declared", evidence: "peerivo", metricClass: "internationalization" },
  "GEO-I18N-002": { severity: "info", title: "Alternate language links observed", evidence: "primary", metricClass: "internationalization" },
  "GEO-SCHEMA-001": { severity: "error", title: "Present JSON-LD parses", evidence: "primary", metricClass: "structured_data" },
  "GEO-SCHEMA-002": { severity: "info", title: "Structured data present", evidence: "primary", metricClass: "structured_data" },
  "GEO-SOCIAL-001": { severity: "warning", title: "Open Graph title and description present", evidence: "peerivo", metricClass: "sharing" },
  "GEO-SITEMAP-001": { severity: "info", title: "Sitemap endpoint discovered", evidence: "primary", metricClass: "crawl" },
  "GEO-SEC-001": { severity: "warning", title: "Content-Security-Policy present", evidence: "primary", metricClass: "security" },
  "GEO-SEC-002": { severity: "warning", title: "Referrer-Policy present", evidence: "primary", metricClass: "security" },
  "GEO-SEC-003": { severity: "warning", title: "HSTS present on HTTPS", evidence: "primary", metricClass: "security" },
  "GEO-LLMS-001": { severity: "info", title: "llms.txt is optional", evidence: "primary", metricClass: "ai_discovery" }
};

export function finding(id, status, message, details = {}) {
  const rule = RULES[id];
  if (!rule) throw new Error(`Unknown rule: ${id}`);
  return { id, title: rule.title, severity: rule.severity, evidence: rule.evidence, metricClass: rule.metricClass, status, message, ...details };
}
