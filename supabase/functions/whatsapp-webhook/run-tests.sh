#!/usr/bin/env bash
# Run the whatsapp-webhook test suite offline.
#
# No Docker, no database, no network: the handler is driven against the JSON
# fixtures with an in-memory database and a stubbed fetch.
#
# The function itself runs on Deno in production. Deno is not required here — the
# code under src/ deliberately uses only Web APIs that behave identically on Deno
# and Node 20 (crypto.subtle, TextEncoder, fetch, Request/Response), and MD5 is
# implemented in plain TypeScript rather than taken from either runtime. index.ts
# is the only Deno-specific file and is excluded from this build.
#
# Usage:  bash supabase/functions/whatsapp-webhook/run-tests.sh
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../../.." && pwd)"
BUILD="$(mktemp -d "${TMPDIR:-/tmp}/whatsapp-webhook-tests.XXXXXX")"
trap 'rm -rf "$BUILD"' EXIT

mkdir -p "$BUILD/src" "$BUILD/tests"
cp "$HERE"/src/*.ts "$BUILD/src/"
cp "$HERE"/tests/*.ts "$BUILD/tests/"
# Deno resolves explicit .ts specifiers; TypeScript for Node wants .js, which it
# maps back onto the .ts source. Rewrite on the way into the build only.
find "$BUILD" -name '*.ts' -exec sed -i.bak -E 's/(from "\.[^"]*)\.ts"/\1.js"/g' {} + \
  && find "$BUILD" -name '*.bak' -delete
# index.ts imports from jsr: and uses Deno globals; supabase-db.ts needs a live
# client. Neither is under test here.
rm -f "$BUILD/src/supabase-db.ts"

# Point the build at the repo's node_modules so @types/node and tsc resolve.
ln -s "$ROOT/node_modules" "$BUILD/node_modules"

cat > "$BUILD/package.json" <<'JSON'
{ "name": "whatsapp-webhook-tests", "private": true, "type": "module" }
JSON

cat > "$BUILD/tsconfig.json" <<'JSON'
{
  "compilerOptions": {
    "target": "es2022",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "strict": true,
    "skipLibCheck": true,
    "types": ["node"],
    "outDir": "./out",
    "rootDir": "."
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
JSON

echo "==> type-checking and compiling"
"$ROOT/node_modules/.bin/tsc" --project "$BUILD/tsconfig.json"
cp "$BUILD/package.json" "$BUILD/out/package.json"

echo "==> running tests (no network, no Docker)"
FIXTURES_DIR="$HERE/fixtures" node --test "$BUILD/out/tests/"
