# Pattern Gallery Toolkit

Turn shadcn-compatible component registries into searchable, static preview galleries.

This repository is a sanitized extraction of reusable tooling from a larger private application. It contains no application code, customer data, credentials, release infrastructure, or captured third-party components.

## What it does

- Scaffolds an isolated Next.js preview site for a component registry.
- Mounts authored component patterns as static routes.
- Builds a searchable catalog from pattern metadata.
- Publishes registry previews into a self-contained static gallery.
- Handles base paths and local assets for deployment below `/sites/<registry>`.

## Setup

```bash
corepack enable
pnpm install
pnpm test
pnpm typecheck
```

## Typical workflow

```bash
# Create a local preview site from an entry in registries.json
pnpm --filter registry-toolkit scaffold-registry -- @8bitcn

# Add a component or pattern to the generated site, then mount its routes
pnpm --filter registry-toolkit mount-patterns -- @8bitcn

# Build previews and publish them into the gallery
pnpm --filter registry-toolkit publish-gallery

# Run the gallery
pnpm gallery
```

Generated registry sites live under `packages/registry-toolkit/src/` and are intentionally gitignored. Components remain subject to the licenses of their upstream registries; this repository does not redistribute them.

## Structure

- `packages/registry-toolkit/` — scaffold, mounting, build, and publishing scripts.
- `packages/registry-toolkit/app-template/` — isolated Next.js site template.
- `apps/gallery/` — static, searchable gallery UI.

## License

The toolkit code is available under the MIT License. Registry metadata and any components you fetch remain governed by their respective owners and licenses.
