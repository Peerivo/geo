# AGENTS.md — Peerivo GEO

## Mission

Peerivo GEO is the central deterministic web-discovery/AEO/GEO checker and discovery-submission layer for Peerivo public web products.

## Required context

Read `PROJECT.md`, `contracts/web-discovery.v1.schema.json`, and the relevant evidence source before making changes. GEO owns its web-discovery integration contract. The separate Peerivo AI Constitution / IronGate project is not an upstream dependency and must not be used as a catch-all source of project governance.

## Rules

- One task = one small branch = one PR.
- Never merge to `main` without explicit owner review/approval.
- Prefer deterministic checks. An LLM may explain a finding, but must not decide whether a deterministic gate passed.
- Primary platform documentation outranks third-party AEO/GEO advice.
- External living rulebooks may not silently change blocking CI behavior.
- Do not promise rankings, citations, traffic, or AI visibility.
- Never fabricate evidence, statistics, testimonials, sources, or crawler behavior.
- Secrets belong in Infisical/OIDC-backed CI, never in repository files.
- IndexNow keys are read from environment variables; never pass them as CLI arguments or write them into reports.
- Changes to blocking rules require a rule-version change, evidence reference, tests, and a review artifact.
