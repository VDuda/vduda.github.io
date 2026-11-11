# Vlad Duda's website

This is a Hugo site published at <https://vlad-duda.com/>.

## Repository layout

- `master`: source Markdown, configuration, templates, and static assets.
- `gh-pages`: generated site served by GitHub Pages. Edit the source on `master`.
- `content/blog/`: blog posts. Front matter controls title, date, tags, and URL slug.
- `content/about.md` and `content/time.md`: standalone pages.
- `config.toml`: site settings and navigation.
- `themes/hugo-goa/`: Goa theme, pinned as a Git submodule.
- `layouts/_partials/`: site overrides for the head, footer, portrait, and navigation.
- `static/`: files copied directly into the published site, including `CNAME`.

The publishing flow is `master` (editable source) → Hugo build → `gh-pages` (published output) → GitHub Pages. Only these two branches participate. The older `goa`, `academic`, and `hugo-initio` branches are historical experiments and do not need updating or merging to publish this site.

| Files | Source or artifact? | Where they belong |
| --- | --- | --- |
| Markdown, configuration, templates, theme revision, original images, vendored Bootstrap CSS | Source inputs | Tracked on `master` |
| Generated HTML, CSS, images, RSS feeds, sitemap, redirects, `CNAME`, `.nojekyll` | Deployable build output | Tracked on `gh-pages`; an ignored local copy may live in `public/` |
| `resources/_gen/`, `.hugo_build.lock`, Python caches, `.DS_Store` | Temporary files | Ignored; never published |

`static/CNAME` and `static/.nojekyll` are source inputs that Hugo copies into the output. Similarly, vendored CSS is a source input even though upstream compiled it. The root `index.html` on `master` is an older standalone Konsul page, not Hugo's homepage template or a build input; it is retained as historical content.

## Setup

Install **Hugo 0.169.0** from the [official release](https://github.com/gohugoio/hugo/releases/tag/v0.169.0), verifying the archive against the release checksums. The standard binary is sufficient; this site does not require Node, npm, or the extended Hugo edition.

The version is pinned in `.hugo-version`; `config.toml` also declares the minimum supported version. Update both when upgrading.

```sh
git switch master
git submodule update --init themes/hugo-goa
bash scripts/check-hugo-version.sh
```

Keep submodule updates explicit and review their changes. `git submodule update --init` checks out the committed theme revision; do not use `--remote` for routine setup.

## Authoring and preview

Add Markdown posts under `content/blog/`. Use an RFC 3339 date with a timezone, such as `2026-11-11T10:00:00-05:00`. Existing URL slugs are deliberately preserved, including `genai-winnners`. Hugo aliases preserve older `/blog/prompt-engineering-deep-dive/` and `/time/time/` links. Old Goa demo posts left over in `gh-pages` are removed on the next clean publication.

When ready to generate or preview the site:

```sh
bash scripts/check-hugo-version.sh
hugo server --bind 127.0.0.1 --buildDrafts
```

The preview server is for local development. For a production build, run `hugo`; its output goes into the ignored `public/` directory. Do not commit generated output on `master`.

## Publishing

Commit the source changes, including the theme revision, and push `master` before publishing:

```sh
git add --all
git commit -m "Update website"
git push origin master
bash publish_to_ghpages.sh
```

The publisher checks the Hugo version and clean source state, fetches the remote branches, and requires local `master` to match `origin/master`. It builds into a temporary directory first. Only a successful build with `index.html`, the expected `CNAME`, and `.nojekyll` is copied into a disposable `gh-pages` worktree and committed. The normal push rejects concurrent publications instead of overwriting their history. Temporary worktrees are removed on exit.

GitHub Pages should continue serving the root of `gh-pages`; this change does not migrate hosting or change repository settings. Publishing requires Git push access to the repository.

## Browser dependencies

The site loads no JavaScript through its page templates. Hugo handles syntax highlighting during generation. jQuery, Bootstrap JavaScript, highlight.js, and obsolete Universal Analytics tagging are removed from the rendered pages.

Bootstrap **5.3.8 CSS** is stored locally at `static/css/bootstrap.min.css`, with its upstream MIT notice preserved. Google Fonts and Font Awesome **6.5.2 CSS/fonts** remain external; the Font Awesome stylesheet is integrity checked. Site CSS preserves the existing reading width and typography.

Theme updates may change markup, so review site overrides and preview before publishing. Configuration-only checks do not verify template rendering or visual appearance.

Run `python3 -m unittest discover -s tests -v` to check publishing in disposable local Git repositories using a fake Hugo command. The tests cover successful and repeated publication, failed builds, version mismatch, and concurrent publication; they do not build the real site or contact GitHub.
