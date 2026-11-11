#!/usr/bin/env bash
set -euo pipefail

root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
cd -- "$root"
bash scripts/check-hugo-version.sh

if [[ $(git branch --show-current) != master ]]; then
    echo 'Publish from the master source branch.' >&2
    exit 1
fi
if [[ -n $(git status --porcelain --untracked-files=normal) ]]; then
    echo 'Commit pending source and theme changes before publishing.' >&2
    exit 1
fi

git fetch origin master gh-pages
if [[ $(git rev-parse HEAD) != $(git rev-parse origin/master) ]]; then
    echo 'Push master and ensure it matches origin/master before publishing.' >&2
    exit 1
fi

publication=$(mktemp -d "${TMPDIR:-/tmp}/vduda-publish.XXXXXXXX")
worktree="$publication/worktree"
cleanup() {
    if [[ -d "$worktree" ]]; then
        git -C "$root" worktree remove --force "$worktree" || return
    fi
    rm -rf -- "$publication"
}
trap cleanup EXIT

# Build successfully before touching a checkout of the published branch.
hugo --destination "$publication/site"
test -s "$publication/site/index.html"
cmp static/CNAME "$publication/site/CNAME"
test -f "$publication/site/.nojekyll"

git worktree add --detach "$worktree" origin/gh-pages
# Only this disposable worktree is cleaned; never the source checkout or public/.
find "$worktree" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf -- {} +
cp -a "$publication/site/." "$worktree/"
git -C "$worktree" add --all
if git -C "$worktree" diff --cached --quiet; then
    echo 'The published site is already up to date.'
    exit 0
fi
source_commit=$(git rev-parse --short HEAD)
git -C "$worktree" commit -m "Publish site from master ($source_commit)"
# A concurrent publication causes a normal push rejection instead of lost history.
git -C "$worktree" push origin HEAD:gh-pages
