# acdiost.github.io

基于 [Hugo](https://gohugo.io/) 搭建的个人博客仓库，使用自定义主题 `acdiost-theme`，产物输出到 `docs/` 并用于 GitHub Pages 发布。

## 项目概览

- 站点地址：[https://www.acdiost.com/](https://www.acdiost.com/)
- 静态站点生成器：Hugo
- 主题目录：`themes/acdiost-theme`
- 发布目录：`docs/`
- 主要内容目录：`content/posts`

## 目录结构

```text
.
├── config.toml                  # Hugo 站点配置
├── content/posts/               # 博客文章与页面
├── docs/                        # 生成后的静态站点，用于 GitHub Pages
└── themes/acdiost-theme/        # 自定义主题
    ├── layouts/                 # 页面模板
    ├── static/css/              # 主题样式与 Tailwind 输入/输出
    └── static/js/               # 主题脚本
```

## 本地开发

开发基准版本为 Hugo `0.167.0`、Node.js `22.16.0`，记录在 `.tool-versions` 中；Hugo 至少需要 `0.167.0`。使用版本管理器时可按该文件安装对应版本。

首次使用时，在仓库根目录安装主题依赖：

```bash
npm ci --prefix themes/acdiost-theme
```

### 1. 启动本地预览

```bash
npm run dev
```

默认访问地址为 [http://localhost:1313](http://localhost:1313)。

该命令等同于 `hugo server -D --renderToMemory`，包含草稿并在内存中生成预览，避免将草稿输出到 `docs/`。

### 2. 新建文章

```bash
hugo new "posts/title.md"
```

创建后请补全 front matter，至少包含：

```toml
title = "文章标题"
date = 2026-04-19T12:00:00+08:00
draft = true
```

### 3. 生产构建

```bash
npm run build
```

该命令先编译、压缩主题 CSS，再运行 `hugo --minify` 压缩页面。构建产物会输出到 `docs/`，并通过 `[build.cleanDestinationDir]` 自动清理不再生成的旧文件。自定义域名配置由 `static/CNAME` 复制到发布目录，`baseURL` 使用同一主域名。

## 样式开发

主题样式源文件位于：

```text
themes/acdiost-theme/static/css/main.css
```

如果需要重新编译 Tailwind 输出文件，可在仓库根目录执行：

```bash
npm run dev:css
```

仅编译一次并压缩 CSS：

```bash
npm run build:css
```

这些命令均在仓库根目录运行；`tailwind.acdiost.css` 是生成文件，应通过以上命令更新。

## 文章目录与描述

正文含四个及以上二至四级标题的文章会自动显示可折叠目录。可在 front matter 中设置 `toc: false` 关闭，或 `toc: true` 在有目录条目时强制显示。

建议为文章填写简洁的 `description`，用于页面元数据；未填写时使用正文摘要并限制为 160 字符。

## 写作与发布流程

1. 使用 `hugo new "posts/title.md"` 创建文章草稿。
2. 在 `content/posts/` 下编辑正文与 front matter。
3. 运行 `npm run dev` 本地检查页面效果、链接、分页和移动端菜单；调整样式时另开终端运行 `npm run dev:css`。
4. 运行 `npm run build` 生成最新的主题 CSS 和 `docs/` 内容。
5. 提交源码和 `docs/` 后推送到远端。

示例：

```bash
git add .
git commit -m "add new post"
git push origin main
```

如果仓库配置了多个远端，再按需要推送到对应远端。

```bash
git push -u origin main
git push -u github main
```

## 当前配置

`config.toml` 当前关键配置如下：

- `baseURL = "https://www.acdiost.com/"`
- `locale = "zh-Hans"`
- `theme = "acdiost-theme"`
- `publishDir = "./docs"`
- 分页大小：`7`

## 说明

- `docs/` 是构建产物，通常不直接手改。
- 主题模板位于 `themes/acdiost-theme/layouts/`。
- 文章分类与标签在 `config.toml` 中通过 taxonomies 配置。
