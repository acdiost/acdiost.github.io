# Repository Guidelines

## Project Structure & Module Organization
- `content/posts/`: Blog post source files (`.md`) with front matter.
- `themes/acdiost-theme/`: Custom Hugo theme (layouts, partials, CSS, JS).
- `themes/acdiost-theme/layouts/`: Hugo templates (`_default/`, `partials/`, `index.html`).
- `themes/acdiost-theme/static/`: Theme assets (`css/`, `js/`, `images/`).
- `docs/`: Generated static site output for GitHub Pages (`publishDir` in `config.toml`). Treat as build output, not hand-edited source.
- `config.toml`: Site configuration (theme, base URL, pagination, publish directory).

## Build, Test, and Development Commands
- `hugo new "posts/title.md"`: Create a new post draft.
- `hugo server -D`: Run local dev server including drafts at `http://localhost:1313`.
- `hugo`: Build production site into `docs/`.
- `cd themes/acdiost-theme && npx tailwindcss -i static/css/main.css -o static/css/tailwind.acdiost.css --watch`: Rebuild theme CSS during styling work.

## Coding Style & Naming Conventions
- Markdown posts: keep front matter complete (`title`, `date`, `draft`), then concise sectioned content.
- Templates (`.html`): use consistent 2-space indentation and keep partials focused (header/footer/head).
- CSS: edit `themes/acdiost-theme/static/css/main.css`; generated output goes to `tailwind.acdiost.css`.
- Prefer clear, stable file names for new posts (kebab-case for English slugs; Chinese titles are acceptable if intended).

## Testing Guidelines
- No automated test suite is configured in this repository.
- Required validation before push:
1. `hugo server -D` for visual/content review (links, pagination, mobile menu).
2. `hugo` to confirm clean production build and regenerated `docs/`.
- For theme/UI changes, verify pages: home, post detail, list/archive, and 404.

## Commit & Pull Request Guidelines
- Existing history favors short, imperative commit messages (for example: `add post`, `fix url error`).
- Keep commit scope narrow (content-only vs theme-only when possible).
- PRs should include:
1. Summary of changes and affected paths (for example, `content/posts/...`, `themes/acdiost-theme/...`).
2. Linked issue (if any) and screenshots/GIFs for visual theme/layout changes.
3. Confirmation that `hugo server -D` and `hugo` were run successfully.

## Publishing Notes
- This site is published from `docs/` to GitHub Pages.
- Typical release flow: build with `hugo`, commit source + `docs/`, then push to configured remotes.
