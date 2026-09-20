# IndexNow in Peerivo GEO

Peerivo GEO owns the reusable IndexNow integration for Peerivo public web projects. This is a GEO/web-discovery concern and has no dependency on Peerivo AI Constitution or IronGate.

## Protocol behavior

- Notify IndexNow when a public URL is created, materially updated, or deleted.
- Keep XML sitemaps as the comprehensive URL inventory; IndexNow is the freshness signal, not a sitemap replacement.
- A request may contain at most 10,000 URLs. GEO automatically chunks larger input.
- URLs are deduplicated within a run and must belong to the declared host.
- `200` means successful submission; `202` means received with key validation pending. Both are accepted outcomes.
- `429` and `5xx` responses are retried with bounded exponential backoff; protocol/configuration `4xx` errors fail immediately.
- By default GEO verifies the public key file before submitting.

Primary protocol documentation: https://www.indexnow.org/documentation  
Bing integration guidance: https://www.bing.com/indexnow/getstarted

## Key handling

The IndexNow key is loaded from an environment variable (default `INDEXNOW_KEY`) and is never accepted as a CLI argument. The source value should be managed through the approved Peerivo secret-management path (Infisical/OIDC-backed CI).

IndexNow ownership verification requires the key to be published as a UTF-8 text file on the same host. That public verification file is expected by the protocol; do not commit unrelated application secrets with it.

Default key location:

```text
https://<canonical-host>/<INDEXNOW_KEY>.txt
```

A different same-host location can be provided with `--key-location`.

## CLI

```bash
export INDEXNOW_KEY='...'
node src/cli.mjs indexnow \
  --host example.com \
  --url https://example.com/new-page \
  --url https://example.com/updated-page
```

For publisher/deployment pipelines, write changed URLs one per line:

```bash
node src/cli.mjs indexnow \
  --host example.com \
  --url-file changed-urls.txt
```

Use `--dry-run` to validate configuration without network access. Dry-run output redacts the key from the reported key location.

## Reusable GitHub Action

Consuming repositories can call:

```yaml
- uses: Peerivo/geo/.github/actions/indexnow@v1
  env:
    INDEXNOW_KEY: ${{ env.INDEXNOW_KEY }}
  with:
    host: example.com
    url-file: changed-urls.txt
```

The caller is responsible for loading `INDEXNOW_KEY` from the approved secret source before this step.

## Project contract

Every consuming project may commit a non-secret declaration conforming to `contracts/web-discovery.v1.schema.json`.

Example:

```json
{
  "version": "peerivo-geo/web-discovery/v1",
  "profile": "public_required",
  "canonicalHost": "example.com",
  "sitemap": {
    "url": "https://example.com/sitemap.xml",
    "required": true
  },
  "indexNow": {
    "enabled": true,
    "keyEnv": "INDEXNOW_KEY",
    "triggers": ["created", "updated", "deleted"]
  }
}
```

The contract contains configuration only. Never place the actual key in it.
