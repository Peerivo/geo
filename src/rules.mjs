export const RULESET_VERSION = "0.1.0";
export const REPORT_SCHEMA_VERSION = "1.0.0";

export const RULES = {
  "GEO-HTTP-001": { severity: "error", title: "Page returns successful HTML", evidence: "primary" },
  "GEO-INDEX-001": { severity: "error", title: "Page is indexable", evidence: "primary" },
  "GEO-ROBOTS-001": { severity: "error", title: "Generic crawler is allowed", evidence: "primary" },
  "GEO-ROBOTS-002": { severity: "error", title: "OAI-SearchBot is allowed", evidence: "primary" },
  "GEO-ROBOTS-003": { severity: "error", title: "Googlebot is allowed", evidence: "primary" },
  "GEO-ROBOTS-004": { severity: "error", title: "Bingbot is allowed", evidence: "primary" },
  "GEO-META-001": { severity: "error", title: "Non-empty HTML title", evidence: "primary" },
  "GEO-META-002": { severity: "warning", title: "Meta description present", evidence: "peerivo" },
  "GEO-CANON-001": { severity: "warning", title: "Canonical URL declared", evidence: "peerivo" },
  "GEO-HTML-001": { severity: "warning", title: "Exactly one H1", evidence: "peerivo" },
  "GEO-HTML-002": { severity: "warning", title: "Meaningful text in fetched HTML", evidence: "primary" },
  "GEO-HTML-003": { severity: "warning", title: "Internal crawlable link present", evidence: "primary" },
  "GEO-I18N-001": { severity: "warning", title: "HTML language declared", evidence: "peerivo" },
  "GEO-SCHEMA-001": { severity: "error", title: "Present JSON-LD parses", evidence: "primary" },
  "GEO-SCHEMA-002": { severity: "info", title: "Structured data present", evidence: "primary" },
  "GEO-SITEMAP-001": { severity: "info", title: "Sitemap endpoint discovered", evidence: "primary" },
  "GEO-LLMS-001": { severity: "info", title: "llms.txt is optional", evidence: "primary" }
};

export function finding(id, status, message, details = {}) {
  const rule = RULES[id];
  if (!rule) throw new Error(`Unknown rule: ${id}`);
  return { id, title: rule.title, severity: rule.severity, evidence: rule.evidence, status, message, ...details };
}
