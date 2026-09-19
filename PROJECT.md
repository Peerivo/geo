# Peerivo GEO — canonical project contract

## Product role

`Peerivo/geo` is the executable AEO/GEO and web-discovery layer for Peerivo. It converts approved discovery policy into deterministic checks, reports, and CI integrations that can be reused by public Peerivo projects.

The normative hierarchy is:

`Global Contract / Web Discovery Profile (Peerivo/constitution) -> Peerivo GEO rule catalog -> Project declaration -> Run report`.

GEO may implement and strengthen approved global rules. It must not silently weaken them.

## Goals

1. Detect technical conditions that prevent public Peerivo pages from being crawled, indexed, understood, or cited.
2. Keep rules versioned, evidence-linked, deterministic, and reviewable.
3. Produce a machine-readable report plus a concise human review artifact.
4. Separate hard eligibility failures from useful but non-guaranteed heuristics.
5. Integrate third-party rulebooks such as `aeogeo.site` as adapters rather than authorities.
6. Support gradual organization-wide rollout without creating a new merge bypass.

## Non-goals

- No ranking or citation guarantees.
- No mass generation of query-variant pages.
- No automatic content rewriting merely to satisfy a synthetic score.
- No fake freshness, mentions, reviews, statistics, authors, or expertise.
- No requirement for `llms.txt` as a Google visibility mechanism.
- No dependence on a single external vendor to decide whether a Peerivo build is valid.

## Profiles

Every consuming project will eventually declare one profile:

- `public_required`: public/indexable web surface; discovery gates apply.
- `public_limited`: only declared routes are intended for indexing/citation.
- `restricted`: public transport may exist, but the content is intentionally not indexable/citable.
- `not_applicable`: no public web surface.

M1 implements `public_required`. Other profiles are reserved by the schema and must not be treated as fully implemented until tests exist.

## Rule model

Each rule has:

- stable ID;
- title;
- severity: `error | warning | info`;
- automation level;
- scope/profile;
- evidence class: `primary | peerivo | external | empirical`;
- rationale;
- deterministic pass/fail logic where automated;
- remediation text;
- version lifecycle.

Blocking rules must be justified by platform eligibility, Peerivo security/governance, or an explicitly approved business requirement. Heuristics default to warnings.

## External rulebooks

`aeogeo.site` is a useful evidence-linked living rulebook and deterministic scanner. It is an optional adapter.

Rules:

- do not copy its current grade into the Peerivo gate;
- record its ruleset/version when used;
- do not silently auto-upgrade blocking rules;
- downgrade or ignore rules that conflict with higher-priority official guidance;
- promote an external rule to a Peerivo blocking rule only through a reviewed rule-version change;
- store any API key in Infisical and retrieve it through the approved CI identity path.

## Initial M1 checks

The first executable audit focuses on high-confidence public-page eligibility and parseability:

- target URL is HTTP(S);
- target returns a successful HTML response;
- page is not `noindex` by meta or `X-Robots-Tag`;
- `robots.txt` does not block the audited path for generic crawlers, Googlebot, Bingbot, or `OAI-SearchBot`;
- page has a non-empty title;
- H1/description/canonical/lang/main-content checks are warnings, not ranking claims;
- present JSON-LD must parse;
- page should expose meaningful text in the fetched HTML rather than only an empty client shell;
- sitemap presence is reported but is not an unconditional hard requirement.

## CI model

The repository exposes a composite GitHub Action and CLI. A caller may run the action against a preview or production URL and retain JSON/Markdown output as the Web Discovery Review Artifact.

The consuming project remains responsible for its normal build, tests, preview, visual/adaptive checks, security checks, and explicit merge approval. GEO is additive, not a replacement.

## Security

The auditor follows redirects but only accepts HTTP(S) targets. Private-network scanning is denied by default for explicit IP/localhost targets to reduce SSRF risk. A future local/preview mode may opt in explicitly.

Never put credentials into query strings, report output, or committed config.

## Versioning

- report schema: independently versioned;
- Peerivo rule catalog: independently versioned;
- external vendor/ruleset version: recorded separately;
- breaking report/rule behavior requires a reviewed version change.

## M1 exit criteria

- deterministic CLI audit works without third-party runtime dependencies;
- parser/robots behavior has tests;
- JSON and Markdown reports are stable enough for CI artifacts;
- GitHub Action wrapper exists;
- repository CI runs syntax checks and tests;
- no organization-wide rollout or global contract change is merged without explicit owner approval.
