# acdiost.github.io

基于 [Hugo](https://gohugo.io/) 搭建的个人博客仓库，使用自定义主题 `acdiost-theme`，产物输出到 `docs/` 并用于 GitHub Pages 发布。

## 项目概览

- 站点地址：[https://acdiost.github.io/](https://acdiost.github.io/)
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

### 1. 启动本地预览

```bash
hugo server -D
```

默认访问地址为 [http://localhost:1313](http://localhost:1313)。

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
hugo
```

构建产物会输出到 `docs/`。

## 样式开发

主题样式源文件位于：

```text
themes/acdiost-theme/static/css/main.css
```

如果需要重新编译 Tailwind 输出文件，可在主题目录执行：

```bash
cd themes/acdiost-theme
npx tailwindcss -i static/css/main.css -o static/css/tailwind.acdiost.css --watch
```

## 写作与发布流程

1. 使用 `hugo new "posts/title.md"` 创建文章草稿。
2. 在 `content/posts/` 下编辑正文与 front matter。
3. 运行 `hugo server -D` 本地检查页面效果、链接、分页和移动端菜单。
4. 运行 `hugo` 生成最新的 `docs/` 内容。
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

- `baseURL = "https://acdiost.github.io/"`
- `languageCode = "zh-Hans"`
- `theme = "acdiost-theme"`
- `publishDir = "./docs"`
- 分页大小：`7`

## 说明

- `docs/` 是构建产物，通常不直接手改。
- 主题模板位于 `themes/acdiost-theme/layouts/`。
- 文章分类与标签在 `config.toml` 中通过 taxonomies 配置。
