# Vlad Duda's website

This is a Hugo site published at <https://vlad-duda.com/>.

## Repository layout

- `master`: source Markdown, configuration, templates, and static assets.
- `gh-pages`: generated site served by GitHub Pages. Edit the source on `master`.
- `content/blog/`: blog posts. Front matter controls title, date, tags, and URL slug.
- `content/about.md` and `content/time.md`: standalone pages.
- `config.toml`: site settings and navigation.
- `themes/hugo-goa/`: Goa theme, pinned as a Git submodule.
- `layouts/`: editorial homepage, article, archive, topic, and 404 templates; shared navigation and footer live in `layouts/_partials/`.
- `static/`: files copied directly into the published site, including `CNAME`.

The publishing flow is `master` (editable source) → Hugo build → `gh-pages` (published output) → GitHub Pages. Only these two branches participate. The older `goa`, `academic`, and `hugo-initio` branches are historical experiments and do not need updating or merging to publish this site.

| Files | Source or artifact? | Where they belong |
| --- | --- | --- |
| Markdown, configuration, templates, theme revision, original images, reading data | Source inputs | Tracked on `master` |
| Generated HTML, CSS, images, RSS feeds, sitemap, redirects, `CNAME`, `.nojekyll` | Deployable build output | Tracked on `gh-pages`; an ignored local copy may live in `public/` |
| `resources/_gen/`, `.hugo_build.lock`, Python caches, `.DS_Store` | Temporary files | Ignored; never published |

`static/CNAME` and `static/.nojekyll` are source inputs that Hugo copies into the output. The root `index.html` on `master` is an older standalone Konsul page, not Hugo's homepage template or a build input; it is retained as historical content.

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

## Design and navigation

The site uses a minimal editorial layout with local Georgia/system fonts, an original portrait, a warm background, and a muted green accent. All page styles are in `static/css/main.css`. No external fonts, icon libraries, Bootstrap, or analytics are loaded. A small local script provides optional text-size preferences and reading-list filters; all content remains readable without JavaScript. The Hugo development server adds its local live-reload script during preview only.

- Main navigation: Home, Writing, Reading, About, with an active-page indicator.
- Homepage: introduction with a responsive 180×180 portrait and contact links, reading stats, the standalone time essay, and the three latest posts at the bottom.
- Writing archive: all blog essays, plus the time essay and topic browsing.
- Articles: breadcrumbs, a link back to all writing above and below the text, and titled older/newer essay links.
- Topic pages, About, and the 404 page share the same navigation and footer.
- Footer: LinkedIn, GitHub, X.com, email, reading list, and RSS. Add a `menu.resources` entry for booking when a working replacement for `meet.duda.wtf` is available.

The Goa submodule still supplies default static assets such as favicons; the site owns its page layouts. Keep its version pinned and review asset changes when upgrading.

Run `python3 -m unittest discover -s tests -v` to check publishing in disposable local Git repositories using a fake Hugo command. The tests cover successful and repeated publication, failed builds, version mismatch, concurrent publication, and reading-import validation and statistics; they do not build the real site or contact GitHub.

## Reading library

The Reading tab renders `data/reading.json`, a versioned snapshot of the existing public Google Sheet. Visitors receive HTML; they do not load Google Sheets. The original sheet remains linked for reference and editing.

The page leads with yearly and category bar diagrams, followed by five recent reads. Each chart includes text labels and numeric values rather than relying on color. The year selector updates the category diagram, recent rankings, and archive scope. Rankings use newest reading year first, then highest personal score within that year; repeat titles appear only once in the five-book overview. Dates show only the recorded reading year, since the sheet does not provide completion days.

The complete reading log is collapsed by default and organized into a separate disclosure for each year. Search and category filters reveal matching years, and books can be ordered by score or title within each year. Resetting filters collapses the years again. Native disclosures, static charts, and the initial recent-five list work without JavaScript.

After editing the sheet, update the snapshot, inspect the diff, build, and publish normally:

```sh
python3 scripts/sync-reading-list.py
hugo --panicOnWarning
```

The importer derives counts from book rows, ignoring the spreadsheet's separate summary columns. It preserves repeated entries and the sheet's categories, years, and personal scores; it does not correct book metadata. Homepage and Reading-page statistics use the same snapshot. Sheet edits appear on the site after a snapshot refresh and publication, not immediately.

## Readability and accessibility

Article text starts at 21px with the usual 16px browser default. Navigation and secondary text are at least 16px; decorative eyebrow labels are at least 14px. Text sizes use relative units and respect browser font defaults and zoom. The Text size selector offers 100%, 125%, 150%, and 200%; this preference is stored locally in the visitor's browser under `vduda:text-size`. No tracking data is sent.

The design targets WCAG 2.2 AA, with semantic landmarks, heading hierarchy, visible keyboard focus, a working skip link, larger controls, reduced-motion support, and reflow on narrow screens. Automated axe checks and manual browser keyboard/reflow checks support this work; they do not constitute legal certification or replace testing with assistive technologies and disabled readers. Accessibility problems can be reported through the footer email link.

The homepage bookshelf summary shows average books per year over completed calendar years, excluding the current partial year. Its top three categories are ranked by entry count; repeat entries count in both metrics. The full Reading page retains its broader category and yearly breakdowns.
