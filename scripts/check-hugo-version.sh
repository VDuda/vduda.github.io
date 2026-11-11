#!/usr/bin/env bash
set -euo pipefail

root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
required=$(<"$root/.hugo-version")
if ! command -v hugo >/dev/null 2>&1; then
    printf 'Hugo %s is required. See README.md for installation.\n' "$required" >&2
    exit 1
fi
actual=$(hugo version)
case "$actual" in
    "hugo v${required} "*|"hugo v${required}+"*|"hugo v${required}-"*) ;;
    *) printf 'Expected Hugo %s; found: %s\n' "$required" "$actual" >&2; exit 1 ;;
esac
