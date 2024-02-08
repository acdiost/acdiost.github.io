---
title: "为 Git 添加签名验证信息"
date: 2023-02-06T10:50:22+08:00
draft: false
---

有时候我们能在 GitHub 上看到有的项目在提交信息中有 Verified 的绿色签名验证框，在一些大型项目中，此签名信息是必须的，否则无法提交相关的代码在项目中。下面是在 Git Bash 中的配置操作：

```bash
gpg --full-generate-key

gpg (GnuPG) 2.2.23-unknown; Copyright (C) 2020 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Please select what kind of key you want:
   (1) RSA and RSA (default)
   (2) DSA and Elgamal
   (3) DSA (sign only)
   (4) RSA (sign only)
  (14) Existing key from card

Your selection? # 输入 Enter

RSA keys may be between 1024 and 4096 bits long.

What keysize do you want? (3072) 4096 # 输入 4096

Requested keysize is 4096 bits
Please specify how long the key should be valid.
         0 = key does not expire
      <n>  = key expires in n days
      <n>w = key expires in n weeks
      <n>m = key expires in n months
      <n>y = key expires in n years

Key is valid for? (0) # 输入 Enter

Key does not expire at all

Is this correct? (y/N) y # 输入 y

GnuPG needs to construct a user ID to identify your key. # 输入个人资料

Real name: acdiost
Email address: acdiost@email.com
Comment:
You selected this USER-ID:
    "acdiost <acdiost@email.com>"

Change (N)ame, (C)omment, (E)mail or (O)kay/(Q)uit? O # 输入 O

We need to generate a lot of random bytes. It is a good idea to perform
some other action (type on the keyboard, move the mouse, utilize the
disks) during the prime generation; this gives the random number
generator a better chance to gain enough entropy. # 在弹出窗口中设置密码

gpg --list-secret-keys --keyid-format=long # 列出 gpg key 信息

gpg: checking the trustdb
gpg: marginals needed: 3  completes needed: 1  trust model: pgp
gpg: depth: 0  valid:   1  signed:   0  trust: 0-, 0q, 0n, 0m, 0f, 1u
/c/Users/Dawn/.gnupg/pubring.kbx
--------------------------------
sec   rsa4096/73DFAAC188F713EE 2023-02-06 [SC] # 此处为 ID
      xxxxxxx
uid                 [ultimate] acdiost <acdiost@email.com>
ssb   rsa4096/BC06DE040749ABCA 2023-02-06 [E]

gpg --armor --export 73DFAAC188F713EE # 导出秘钥
```

将打印的秘钥复制至 [GitHub 的 GPG keys](https://github.com/settings/gpg/new) 中

---

在 git 中配置签名秘钥

```bash
git config --global user.signingkey 73DFAAC188F713EE
```

在项目中启用签名验证

```bash
git config commit.gpgsign true
```
