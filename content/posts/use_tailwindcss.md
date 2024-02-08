---
title: "Use_tailwindcss"
date: 2024-02-01T22:11:29+08:00
draft: false
---

## 安装

`hugo new theme acdiost-theme` 创建主题后进入 `cd themes/acdiost-theme` 目录

Install Tailwind CSS
Install tailwindcss via npm, and create your tailwind.config.js file.

```bash
npm install -D tailwindcss
npx tailwindcss init
```

Add the paths to all of your template files in your tailwind.config.js file.

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./layouts/**/*.{html,js}"],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Add the @tailwind directives for each of Tailwind’s layers to your main CSS file.

我将它添加在 `static/css/main.css` 中

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Run the CLI tool to scan your template files for classes and build your CSS.

```bash
npx tailwindcss -i ./static/css/main.css -o ./static/css/tailwind.acdiost.css --watch
```

Start using Tailwind in your HTML.
