# Peerivo GEO

Deterministic web-discovery / SEO / AEO / GEO checks, web-quality evidence, field-metric classification and freshness submission for Peerivo public projects.

The project intentionally separates **eligibility facts** from **AI-visibility heuristics**. It does not promise rankings or citations and it does not blindly convert third-party AEO advice into hard CI gates.

`Peerivo/geo` is self-contained. It is not governed by, and does not depend on, the separate AI Constitution / IronGate project.

## Audit usage

```bash
node src/cli.mjs audit --url https://example.com --json geo-report.json --markdown geo-report.md
```

Exit code is non-zero when the configured failure threshold is reached. Default: `error`.

```bash
node src/cli.mjs audit --url https://example.com --fail-on warning
node src/cli.mjs audit --url https://example.com --fail-on none
```

## IndexNow

GEO can submit URLs that were created, materially updated, or deleted:

```bash
export INDEXNOW_KEY='...'
node src/cli.mjs indexnow \
  --host example.com \
  --url https://example.com/new-page \
  --url https://example.com/updated-page
```

The implementation validates same-host ownership, verifies the public key file by default, deduplicates URLs, chunks requests at the IndexNow limit, accepts `200/202`, and retries bounded `429/5xx` responses.

See `docs/INDEXNOW.md`, `docs/METRICS.md`, and `contracts/web-discovery.v1.schema.json`.

## GitHub Actions

Audit action after an approved release/tag:

```yaml
- uses: Peerivo/geo@v1
  with:
    url: ${{ steps.deploy.outputs.preview_url }}
    json-report: peerivo-geo.json
    markdown-report: peerivo-geo.md
```

IndexNow action:

```yaml
- uses: Peerivo/geo/.github/actions/indexnow@v1
  env:
    INDEXNOW_KEY: ${{ env.INDEXNOW_KEY }}
  with:
    host: example.com
    url-file: changed-urls.txt
```

Private-repository action sharing must be enabled for the Peerivo organization before relying on cross-repository use.

## Rule authority

1. Primary platform documentation and web standards.
2. Reviewed Peerivo GEO rules and Web Discovery Contract.
3. Third-party rulebooks such as aeogeo.site.
4. Experimental heuristics.

See `PROJECT.md` for the full contract.
