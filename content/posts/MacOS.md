---
title: "MacOS"
date: 2024-11-16T22:37:34+08:00
draft: false 
---

记录一下新到的 MacOS 软件安装

#### Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> /Users/dawn/.zprofile

echo 'export HOMEBREW_PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple' >> ~/.zprofile

echo 'export HOMEBREW_API_DOMAIN=https://mirrors.tuna.tsinghua.edu.cn/homebrew-bottles/api' >> ~/.zprofile

echo 'export HOMEBREW_BOTTLE_DOMAIN=https://mirrors.tuna.tsinghua.edu.cn/homebrew-bottles' >> ~/.zprofile
```

#### Basic

```bash
brew install font-lxgw-wenkai
brew install tmux
brew install git
```

#### Oh my zsh

```bash
git clone --depth=1 https://github.com/ohmyzsh/ohmyzsh.git ~/.oh-my-zsh

cp ~/.oh-my-zsh/templates/zshrc.zsh-template ~/.zshrc

git clone --depth=1 https://github.com/zsh-users/zsh-autosuggestions.git ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions

git clone --depth=1 https://github.com/zsh-users/zsh-syntax-highlighting.git ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting
```

#### Podman

```bash
brew install podman
podman machine init
podman machine start
```

#### 输入法

```bash
brew install --cask squirrel

git clone --depth=1 git@github.com:acdiost/oh-my-rime.git ~/Library/Rime
```

#### Nodejs

```bash
brew install node@22
echo 'export PATH="/opt/homebrew/opt/node@22/bin:$PATH"' >> ~/.zprofile
```

#### Rust

```bash
brew install rust
```

#### Python

```bash
brew install python@3.13
pip3 config set global.index-url https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple/
```

#### Go

```bash
brew install go
echo "export GOPATH=$HOME/go" >> ~/.zprofile
echo "export GO111MODULE=on" >> ~/.zprofile
echo "export GOPROXY=https://goproxy.cn,direct" >> ~/.zprofile
```

#### Java

```bash
brew install java
echo 'export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"' >> ~/.zprofile

brew install maven
# 配置文件
/opt/homebrew/Cellar/maven/3.9.9/libexec/conf/settings.xml
```

#### Syncthing

使用 Syncthing 同步文件

```bash
brew install --cask syncthing
brew services start syncthing

http://127.0.0.1:8384
```

#### keepassxc

密码管理工具

```bash
brew install --cask keepassxc
```
