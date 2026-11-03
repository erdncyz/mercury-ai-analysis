#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

version="$(node -p "require('./package.json').version")"
tag="v${version}"
stage="$(mktemp -d)"
bundle="${stage}/mercury-ai-analysis"

npm run build
mkdir -p "$bundle/bin" "$bundle/dist"
cp -R dist/. "$bundle/dist/"
npx --yes esbuild server/serve.mjs \
  --bundle \
  --platform=node \
  --format=esm \
  --outfile="$bundle/server.mjs"
cp bin/mercury-ai-analysis "$bundle/bin/mercury-ai-analysis"
chmod +x "$bundle/bin/mercury-ai-analysis"
printf '%s\n' "$tag" > "$bundle/.release-version"

archive="${ROOT}/mercury-ai-analysis.tar.gz"
tar -czf "$archive" -C "$stage" mercury-ai-analysis
shasum -a 256 "$archive" | awk '{print $1 "  mercury-ai-analysis.tar.gz"}' > "${archive}.sha256"
rm -rf "$stage"

echo "Packaged ${tag}"
echo "$archive"
echo "${archive}.sha256"
