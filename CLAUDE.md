# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal blog built with Hugo (static site generator) using a custom theme called `acdiost-theme`. The blog is published to GitHub Pages at https://acdiost.github.io/. Content is written in Chinese (zh-Hans).

## Commands

### Creating New Posts
```bash
hugo new "posts/title.md"
```
Note: Posts are created with `draft: true` by default. Change to `draft: false` to publish.

### Local Development
```bash
hugo server -D
```
The `-D` flag includes draft posts. Access at http://localhost:1313/

### Building for Production
```bash
hugo
```
Generates static files to `./docs` directory (configured in config.toml as `publishDir`).

### Publishing Workflow
After building with `hugo`, sync to both remotes:
```bash
git add .
git commit -sm "add new post"
git push -u origin main      # Local git server
git push -u github main      # GitHub Pages
```

### Theme Development

#### Tailwind CSS
The theme uses Tailwind CSS. To rebuild styles:
```bash
cd themes/acdiost-theme
npx tailwindcss -i static/css/main.css -o static/css/tailwind.acdiost.css --watch
```

## Architecture

### Configuration
- **config.toml**: Main site config
  - `publishDir = './docs'` - Static files output to docs/ for GitHub Pages
  - `paginate = 7` - Show 7 posts per page
  - `theme = 'acdiost-theme'` - Custom theme

### Content Structure
- **content/posts/**: All blog posts (Markdown files)
  - Posts can be in Chinese or English
  - Front matter includes: title, date, draft status
  - Draft posts (draft: true) won't be published unless using `-D` flag

### Theme Architecture (themes/acdiost-theme/)

#### Layout System
- **layouts/_default/baseof.html**: Base template with header, content area, and footer
- **layouts/index.html**: Homepage template with post list and pagination
- **layouts/_default/list.html**: List pages (categories, sections)
- **layouts/_default/single.html**: Individual post pages
- **layouts/partials/**: Reusable components
  - head.html: Meta tags, external fonts (LXGW WenKai Lite), CSS/JS
  - header.html: Site navigation
  - footer.html: Site footer

#### Styling
- **Tailwind CSS**: Primary styling framework
  - Config: tailwind.config.js (scans layouts/**/*.{html,js})
  - Source: static/css/main.css (Tailwind directives)
  - Output: static/css/tailwind.acdiost.css (compiled CSS)
- **External Font**: LXGW WenKai Lite from jsDelivr CDN for Chinese characters
- **Color Scheme**: Yellow-themed (bg-yellow-50, text-[#EACD76])

#### JavaScript
- **static/js/hugo.acdiost.js**: Minimal JS for mobile menu toggle

### Publishing Flow
1. Write content in content/posts/
2. Test locally with `hugo server -D`
3. Change draft status to false
4. Build with `hugo` (outputs to docs/)
5. Commit and push to both remotes (origin and github)
6. GitHub Pages serves from docs/ directory

### Git Configuration
- **origin**: Local git server at http://192.168.31.200:5000/dawn/hugo-blog.git
- **github**: GitHub remote at git@github.com:acdiost/acdiost.github.io.git
- Both remotes should be kept in sync for publishing

## Important Notes

- Posts are located in content/posts/, not categorized by subdirectories
- The site publishes to the docs/ directory, not the typical public/ directory
- Always test with `hugo server -D` before building for production
- Remember to update draft status before building
- Theme modifications require rebuilding Tailwind CSS