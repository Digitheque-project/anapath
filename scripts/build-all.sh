#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Build backend (back_anapath)"
cd "$ROOT/back_anapath"
npm run build

echo "==> Build frontend (front_anapath)"
cd "$ROOT/front_anapath"
npm run build

echo "==> Builds terminés avec succès"
