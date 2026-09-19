# Evidence sources

Last reviewed: 2026-09-19

Peerivo GEO uses primary platform guidance as the highest external authority. Third-party AEO/GEO rulebooks remain advisory until a rule is independently reviewed and promoted into the Peerivo ruleset.

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
