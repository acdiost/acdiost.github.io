---
title: "为服务器添加 Cloudflare Wrap"
date: 2023-04-05T10:42:09+08:00
draft: flase
---

Cloudflare WARP 是 Cloud­flare 提供的一项基于 Wire­Guard 的网络流量安全及加速服务，能够让你通过连接到 Cloud­flare 的边缘节点实现隐私保护及链路优化。

很多我们需要访问的网站都需要使用原生 IP，比如：Disney+， ChatGPT, New Bing 等。

所谓原生 IP 就是指该网站的 IP 地址和其机房的 IP 地址是一致的

```bash
wget git.io/warp.sh
sudo bash warp.sh menu
```

选择：1、4、5；

1 - 安装 Cloudflare WARP 官方客户端

4 - 安装 WireGuard 相关组件

5 - 自动配置 WARP WireGuard IPv4 网络

如果有 ipv4 和 ipv6，则可选：1、4、7

1 - 安装 Cloudflare WARP 官方客户端

4 - 安装 WireGuard 相关组件

7 - 自动配置 WARP WireGuard 双栈全局网络
