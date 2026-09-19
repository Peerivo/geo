# Peerivo GEO

Deterministic web-discovery / AEO / GEO checks for Peerivo public projects.

The project intentionally separates **eligibility facts** from **AI-visibility heuristics**. It does not promise rankings or citations and it does not blindly convert third-party AEO advice into hard CI gates.

## Local usage

```bash
node src/cli.mjs audit --url https://example.com --json geo-report.json --markdown geo-report.md
```

Exit code is non-zero when the configured failure threshold is reached. Default: `error`.

```bash
node src/cli.mjs audit --url https://example.com --fail-on warning
node src/cli.mjs audit --url https://example.com --fail-on none
```

## GitHub Action

After an approved release/tag, a consuming repository can use:

```yaml
- uses: Peerivo/geo@v1
  with:
    url: ${{ steps.deploy.outputs.preview_url }}
    json-report: peerivo-geo.json
    markdown-report: peerivo-geo.md
```

Private-repository action sharing must be enabled for the Peerivo organization before relying on cross-repository use.

## Rule authority

1. Primary platform documentation and web standards.
2. Approved Peerivo global rules.
3. Third-party rulebooks such as aeogeo.site.
4. Experimental heuristics.

See `PROJECT.md` for the full contract.
