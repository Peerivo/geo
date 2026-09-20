# Peerivo GEO metric model

Peerivo GEO separates **deterministic eligibility checks**, **field performance evidence**, **lab diagnostics**, and **search/AI visibility observations**. These are not collapsed into one synthetic GEO score.

## Required metric classes for public web surfaces

| Class | Examples | Default treatment |
| --- | --- | --- |
| Crawl/indexability | HTTP status, HTML, noindex, robots, sitemap | blocking for high-confidence eligibility failures |
| AI discovery | OAI-SearchBot reachability, Bing/Google crawler reachability | blocking only when the project intends public discovery |
| Canonical/metadata | title, description, canonical | title can block; heuristic metadata remains warning |
| Structured data | JSON-LD syntax and applicable Schema.org types | invalid present JSON-LD blocks; presence alone is not a ranking guarantee |
| Content/rendering | server-visible text, internal links, H1 | warnings unless a project strengthens them |
| Internationalization | html lang, hreflang where multilingual | language declaration warning; hreflang conditional |
| Accessibility basics | image alt coverage | warning; deeper WCAG audit belongs to an accessibility toolchain |
| Mobile | viewport and responsive review evidence | warning plus existing visual preview review |
| Transport/security | HTTPS, CSP, HSTS, Referrer-Policy | HTTPS blocks public-required; headers are web-quality warnings |
| Freshness | sitemap plus IndexNow create/update/delete events | required by project/global policy when applicable |
| Field performance | p75 LCP, INP, CLS from RUM/field source | evaluated separately; never inferred from raw HTML |
| Lab performance | Lighthouse-style performance/a11y/SEO/best-practices, TBT | diagnostic, non-authoritative for field CWV |
| Search performance | Search Console/Bing Webmaster evidence | observational; absence is a data gap, not success |
| AI citation/referral | Bing AI Performance, ChatGPT referral analytics where available | observational; citation counts are not treated as rankings |

## Core Web Vitals

For field data Peerivo uses the current good thresholds at the 75th percentile:

- LCP <= 2.5 s
- INP <= 200 ms
- CLS <= 0.1

`src/field-metrics.mjs` classifies field snapshots as `good`, `needs_improvement`, `poor`, or `unknown`.

INP is not a direct lab metric. Lab tools may use diagnostics such as Total Blocking Time, but GEO must not relabel those values as field INP.

## Evidence rules

A metric record must identify its source and measurement type. A missing connector or missing measurement is reported as a data gap, never as a pass. External vendor scores and third-party GEO heuristics may inform recommendations but cannot silently become blocking Global Contract rules.
