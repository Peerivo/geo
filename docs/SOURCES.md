# Evidence sources

Last reviewed: 2026-09-20

Peerivo GEO uses primary platform guidance as the highest external authority. Third-party AEO/GEO rulebooks remain advisory until a rule is independently reviewed and promoted into the Peerivo ruleset.

## IndexNow

- Protocol documentation: https://www.indexnow.org/documentation
  - Submit URLs that were added, updated, or deleted.
  - Keys are 8-128 characters and use letters, digits, and hyphens.
  - Ownership is verified by a UTF-8 key file on the same host.
  - Batch requests may contain up to 10,000 URLs.
  - `200` is success; `202` is accepted with key validation pending; `400/403/422` are protocol/configuration errors; `429` is rate limiting.
- Bing IndexNow setup: https://www.bing.com/indexnow/getstarted
  - Microsoft recommends IndexNow for real-time URL notification.
  - IndexNow does not guarantee crawl or indexing.
- Bing sitemap guidance: https://blogs.bing.com/webmaster/July-2025/Keeping-Content-Discoverable-with-Sitemaps-in-AI-Powered-Search
  - Sitemaps remain the comprehensive coverage mechanism; IndexNow complements them with URL-level freshness notifications.

## Google Search

- Generative AI optimization guide: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
  - SEO fundamentals continue to apply to generative AI search.
  - Valuable, original, people-first content is preferred over scaled query-variant content.
  - No special AI markup is required.
  - `llms.txt` is not used by Google Search for ranking/visibility.
  - Structured data remains useful for normal Search features but is not a special AI-search requirement.
- Search documentation updates: https://developers.google.com/search/updates
  - FAQ rich results were removed in 2026.
  - Google clarified `llms.txt` has no positive or negative effect on Google Search visibility.
- Structured data: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- Localized versions / hreflang: https://developers.google.com/search/docs/specialty/international/localized-versions

## OpenAI

- Publishers and Developers FAQ: https://help.openai.com/en/articles/12627856-publishers-and-developers-faq
  - Public sites can appear in ChatGPT search.
  - `OAI-SearchBot` must not be blocked if content should be discoverable and summarized/cited.
  - `noindex` is the control for excluding a page from surfaced search results when appropriate.
  - ChatGPT referrals can be measured via `utm_source=chatgpt.com`.

## Microsoft / Bing

- Bing Webmaster Guidelines: https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a
  - Core SEO/crawl/index quality also supports Bing/Copilot grounding and citation eligibility.
  - Sitemaps, internal links, canonicalization, accurate structured data and IndexNow improve discovery/freshness.
  - Prompt-injection-style content intended to manipulate AI systems is explicitly discouraged.
- AI Performance: https://www.bing.com/webmasters/help/ai-performance-9f8e7d6c
  - Reports citations, cited pages and grounding queries.
  - Citation counts are not rankings, authority scores or complete logs.

## External rulebook under evaluation

- aeogeo.site: https://aeogeo.site/
- First run / MCP tools: https://aeogeo.site/docs/first-run/
- MCP endpoint: https://mcp.aeogeo.site

Current documented model: free `scan_url`; keyed `lint_html`, `lint_text`, `audit_schema`, `fetch_rules`, `search_rules`, `get_changelog`. Peerivo must record the external ruleset/version and must not let a live external update silently change blocking CI behavior.

## Core Web Vitals

- Web Vitals: https://web.dev/articles/vitals
  - current Core Web Vitals are LCP, INP and CLS;
  - good field thresholds are LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1 at the 75th percentile.
- INP: https://web.dev/articles/inp
  - INP is a field responsiveness metric; lab diagnostics such as Total Blocking Time may help diagnose responsiveness but are not field INP.

## Schema.org

- Releases: https://schema.org/docs/releases.html
  - schema vocabulary evolves independently of search-engine feature support; GEO tracks releases but only promotes applicable mechanisms through reviewed rules.
