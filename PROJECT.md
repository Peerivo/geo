# Peerivo GEO — canonical project contract

## Product role

`Peerivo/geo` is the executable AEO/GEO and web-discovery layer for Peerivo. It converts reviewed discovery policy into deterministic checks, reports, freshness submissions, and CI integrations that can be reused by public Peerivo projects.

The normative hierarchy is:

`Peerivo GEO Web Discovery Contract -> Peerivo GEO rule catalog -> Project declaration -> Run report`.

GEO is the authority for Peerivo web-discovery integration rules. It must keep them versioned, evidence-linked, deterministic where possible, and reviewable.

The separate `Peerivo/constitution` project is dedicated to AI Constitution / IronGate. It has no authority or dependency relationship with GEO.

## Goals

1. Detect technical conditions that prevent public Peerivo pages from being crawled, indexed, understood, or cited.
2. Keep rules versioned, evidence-linked, deterministic, and reviewable.
3. Produce a machine-readable report plus a concise human review artifact.
4. Separate hard eligibility failures from useful but non-guaranteed heuristics.
5. Integrate third-party rulebooks such as `aeogeo.site` as adapters rather than authorities.
6. Provide a reusable IndexNow submission layer for created, materially updated, and deleted public URLs.
7. Support gradual organization-wide rollout without creating a new merge bypass.

## Non-goals

- No ranking or citation guarantees.
- No mass generation of query-variant pages.
- No automatic content rewriting merely to satisfy a synthetic score.
- No fake freshness, mentions, reviews, statistics, authors, or expertise.
- No requirement for `llms.txt` as a Google visibility mechanism.
- No dependence on a single external vendor to decide whether a Peerivo build is valid.
- No ownership of AI Constitution / IronGate policy.

## Profiles

Every consuming project will eventually declare one profile:

- `public_required`: public/indexable web surface; discovery gates apply.
- `public_limited`: only declared routes are intended for indexing/citation.
- `restricted`: public transport may exist, but the content is intentionally not indexable/citable.
- `not_applicable`: no public web surface.

M1 implements `public_required`. Other profiles are reserved by the schema and must not be treated as fully implemented until tests exist.

## Common Web Discovery Contract

`contracts/web-discovery.v1.schema.json` is the common non-secret integration contract for Peerivo services.

A consuming service declares:

- contract version;
- discovery profile;
- canonical host;
- sitemap configuration when applicable;
- whether IndexNow is enabled;
- the environment-variable name that contains the IndexNow key;
- optional same-host key location;
- IndexNow triggers (`created`, `updated`, `deleted`).

The contract must never contain the actual IndexNow key or application credentials.

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

## IndexNow submission model

GEO implements IndexNow as a freshness notification layer, not as an indexing guarantee and not as a sitemap replacement.

Required behavior:

- submit only public URLs belonging to the declared canonical host;
- submit created, materially updated, or deleted URLs;
- deduplicate URLs within a run;
- chunk submissions at no more than 10,000 URLs per request;
- verify the public key file on the same host by default;
- do not follow key-file redirects to a different host;
- accept protocol responses `200` and `202` as successful/accepted outcomes;
- retry bounded `429` and `5xx` failures with backoff;
- fail immediately on non-retryable protocol/configuration errors;
- load the key from an environment variable, never a CLI argument;
- redact the key from dry-run/report output.

Cross-run duplicate suppression is intentionally not a hidden GEO state machine: a later deployment may represent a real content update and may legitimately resubmit the same URL. Consuming publishers should emit URLs only when a relevant public change occurs.

## CI model

The repository exposes:

- a composite audit GitHub Action and CLI;
- a reusable IndexNow GitHub Action and CLI.

A caller may run the audit against a preview or production URL and retain JSON/Markdown output as the Web Discovery Review Artifact. After a production publication event, a caller may submit the changed production URLs through IndexNow.

The consuming project remains responsible for its normal build, tests, preview, visual/adaptive checks, security checks, and explicit merge approval. GEO is additive, not a replacement.

## Security

The auditor follows redirects but only accepts HTTP(S) targets. Private-network scanning is denied by default for explicit IP/localhost targets to reduce SSRF risk. A future local/preview mode may opt in explicitly.

IndexNow key-file verification only permits same-host redirects. The actual IndexNow key must not be written to repository configuration, command-line arguments, or report output.

Never put credentials into query strings, report output, or committed config.

## Versioning

- report schema: independently versioned;
- Web Discovery Contract: independently versioned;
- Peerivo rule catalog: independently versioned;
- external vendor/ruleset version: recorded separately;
- breaking report/rule/contract behavior requires a reviewed version change.

## M1 exit criteria

- deterministic CLI audit works without third-party runtime dependencies;
- parser/robots behavior has tests;
- JSON and Markdown reports are stable enough for CI artifacts;
- GitHub Action wrapper exists;
- IndexNow client, CLI integration, same-host validation, key-file verification, batching and retry behavior have tests;
- reusable IndexNow GitHub Action exists;
- common Web Discovery Contract v1 exists and contains no secrets;
- repository CI runs syntax checks and tests;
- no organization-wide rollout is merged without explicit owner approval.
