---
title: "FreeIPA 完整部署指南：从零到一的集中认证方案"
date: 2026-04-18T21:04:35+08:00
draft: false
categories: ["技术"]
tags: ["freeipa", "ldap", "kerberos", "身份认证"]
---

## 前言

在构建 HPC 集群、Slurm 调度系统或内部技术平台时，**统一身份认证** 是绕不过的第一道坎。

- 不想自己拼 LDAP + Kerberos + DNS + CA？
- 希望一个工具解决账号管理、密钥分发、证书颁发？
- 需要开箱即用、生产就绪的方案？

那么 **FreeIPA** 就是你的答案。

本文基于真实部署经验，包含完整的命令流程、每一步的"为什么"、常见坑点和排查方法。读完这篇，你能独立部署一套可用的企业级身份认证系统。

---

## 一、为什么选择 FreeIPA？

### FreeIPA 的核心价值

FreeIPA 不是单一工具，而是一个"一体化身份管理平台"，它整合了以下组件：

| 组件 | 作用 | 为什么需要 |
|------|------|----------|
| 389-DS | LDAP 目录服务 | 集中存储用户、组、主机等目录信息，支持复杂查询和权限控制 |
| MIT Kerberos | 网络身份认证 | 提供无密码认证（票据制），比密码更安全，支持 SSO |
| BIND | DNS 服务 | FreeIPA 依赖 DNS 进行主机发现、服务定位（SRV 记录）和身份验证 |
| Dogtag | 证书颁发机构（CA） | 签发 HTTPS、客户端证书，支持 SSH 证书认证 |
| SSSD | 客户端认证守护进程 | 缓存认证信息，支持离线登录，减轻服务器压力 |

### 对比其他方案


| 方案                | 学习成本 | 维护难度 | 功能完整度 |
|---------------------|----------|----------|------------|
| 自建 LDAP           | ★★★★☆   | ★★★★★   | ★★★☆☆     |
| 自建 LDAP + K5      | ★★★★★   | ★★★★★   | ★★★★☆     |
| FreeIPA             | ★★☆☆☆   | ★★☆☆☆   | ★★★★★     |
| Active Directory    | ★☆☆☆☆   | ★★☆☆☆   | ★★★★★     |


**FreeIPA 的优势：**
- ✅ 一次初始化，开箱即用
- ✅ 开源免费，支持 Linux 生态
- ✅ 功能齐全（身份认证 + DNS + CA + 权限管理）
- ✅ Web UI 管理界面友好
- ✅ 与 RHEL/CentOS/Rocky 深度集成

---

## 二、环境说明与规划

### 测试环境拓扑

| 主机名 | IP | 角色 | 系统 |
|-------|----|----|------|
| c128.acdiost.internal | 192.168.100.128 | FreeIPA Server（DNS、Kerberos、LDAP） | Rocky Linux 9.7 |
| c129.acdiost.internal | 192.168.100.129 | 客户端（加入域） | Rocky Linux 9.7 |
| c130.acdiost.internal | 192.168.100.130 | 客户端（加入域） | Rocky Linux 9.7 |

### 前置检查

在开始部署前，请确保：

```bash
# 1. 所有主机时间同步（Kerberos 要求时间误差 < 5 分钟）
timedatectl status

# 2. 网络连通性
ping 192.168.100.128

# 3. 主机名正确设置（必须是 FQDN）
hostname -f

# 4. 无 DNS 冲突
getent hosts c128.acdiost.internal
```

**为什么要做这些检查？**
- Kerberos 使用时间戳防重放攻击，时间差会导致认证失败
- FreeIPA 依赖 DNS 进行服务发现，网络/DNS 问题是最常见的部署失败原因
- FQDN 必须正确，否则 Kerberos 票据和证书会验证失败

---

## 三、服务端部署（详细步骤）

### 第 1 步：设置主机名（关键）

```bash
hostnamectl set-hostname c128.acdiost.internal
```

**为什么这样做？**
- FreeIPA 使用主机名生成 Kerberos Realm 和 LDAP DN
- 主机名错误会导致证书、DNS 记录、Kerberos 配置全部混乱
- FQDN（完全限定域名）是必需的，短名称 + 域名分离会导致认证链接式地失败

**验证：**
```bash
hostname -f  # 必须输出：c128.acdiost.internal
```

---

### 第 2 步：配置 `/etc/hosts`

```bash
cat >> /etc/hosts << 'EOF'
192.168.100.128 c128.acdiost.internal c128
EOF
```

**为什么这样做？**
- 主机启动过程中 DNS 可能还未可用，`/etc/hosts` 作为引导配置
- **格式很重要**：长名在前（FQDN），短名在后
- 这样 `hostname -f` 才能返回完整的 FQDN

**常见错误：**
```bash
# ❌ 错误：短名在前
127.0.0.1 c128 c128.acdiost.internal

# ✅ 正确：长名在前
192.168.100.128 c128.acdiost.internal c128
```

---

### 第 3 步：安装 FreeIPA 包

```bash
dnf update -y
dnf install -y ipa-server ipa-server-dns
```

**为什么这样做？**
- `ipa-server`：FreeIPA 核心服务
- `ipa-server-dns`：内置 DNS 服务器（可选，但强烈推荐）
  - 作用：FreeIPA 需要 DNS 的 SRV 记录进行服务发现
  - 如果不用内置 DNS，需要手工配置外部 DNS（增加复杂度）

**包大小预期：** ~500MB，取决于系统已装包

---

### 第 4 步：运行初始化脚本（核心配置）

```bash
ipa-server-install --unattended \
--setup-dns \
--hostname=c128.acdiost.internal \
--ip-address=192.168.100.128 \
--domain=acdiost.internal \
--realm=ACDIOST.INTERNAL \
--ds-password='Ds_p@55w0rd' \
--admin-password='Admin_p@55w0rd' \
--forwarder=192.168.100.2 \
--forward-policy=only \
--auto-reverse \
--no-dnssec-validation \
--netbios-name=ACDIOST \
--mkhomedir \
--ntp-server=ntp1.ntsc.ac.cn \
--ntp-pool=0.cn.pool.ntp.org
```

**参数说明与为什么：**

| 参数 | 含义 | 为什么 |
|------|------|--------|
| `--setup-dns` | 配置内置 DNS 服务 | FreeIPA 自动管理 DNS 记录，避免手工维护 |
| `--hostname` | FQDN 主机名 | 必须与 `hostnamectl` 结果一致 |
| `--ip-address` | 服务器 IP | DNS 正向/反向记录的基础 |
| `--domain` | DNS 域名（小写） | LDAP DN 的后缀，用户邮箱 |
| `--realm` | Kerberos 领域（大写） | Kerberos 身份空间，通常为 DOMAIN 的大写 |
| `--ds-password` | Directory Server 密码 | LDAP 后端 root DN 密码，不常用但需要妥善保管 |
| `--admin-password` | Admin 用户密码 | Web UI 和命令行管理的密码 |
| `--forwarder` | 上游 DNS | 处理 FreeIPA 域外的 DNS 查询（如 google.com） |
| `--forward-policy=only` | DNS 转发策略 | 仅转发不在本域的查询，避免回环 |
| `--auto-reverse` | 自动配置反向 DNS | 创建 PTR 记录（IP → 主机名映射） |
| `--no-dnssec-validation` | 关闭 DNSSEC | 降低配置复杂度（生产建议启用） |
| `--mkhomedir` | 自动创建 home 目录 | 用户首次登录时自动 `mkdir /home/username` |
| `--ntp-server` / `--ntp-pool` | NTP 源 | 同步系统时间（Kerberos 关键依赖） |

**运行耗时：** 5-15 分钟，取决于网络和磁盘速度

---

### 第 5 步：验证安装成功

```bash
ipactl status
```

**成功标志：**
```
Directory Service: RUNNING
krb5kdc Service: RUNNING
kadmin Service: RUNNING
named Service: RUNNING
httpd Service: RUNNING
ipa-custodia Service: RUNNING
pki-tomcatd Service: RUNNING
ipa-otpd Service: RUNNING
ipa-dnskeysyncd Service: RUNNING
ipa: INFO: The ipactl command was successful
```

**各服务含义：**
- `Directory Service`：LDAP 目录数据库
- `krb5kdc`：Kerberos 票据签发服务
- `named`：DNS 服务
- `httpd`：Web UI（https://c128.acdiost.internal）
- 其他：PKI、OTP、DNS 同步等

---

## 四、常见部署错误与排查

### 错误 1：DNS 解析失败

**症状：**
```bash
ipa-server-install: ERROR: DNS resolution of c128.acdiost.internal failed
```

**排查步骤：**
```bash
# 1. 检查 hosts 文件
cat /etc/hosts | grep c128

# 2. 测试本地 DNS
getent hosts c128.acdiost.internal

# 3. 查看 /etc/resolv.conf（如有必要）
cat /etc/resolv.conf

# 4. 手工添加 hosts 条目
echo "192.168.100.128 c128.acdiost.internal c128" >> /etc/hosts
```

**根本原因：** hosts 文件格式错误或主机名没有同步

---

### 错误 2：时间不同步

**症状：**
```
ipa-server-install: ERROR: NTP synchronization failed
```

**排查步骤：**
```bash
# 1. 检查 chronyd 状态
systemctl status chronyd

# 2. 查看时间源
chronyc sources

# 3. 手工同步时间
chronyc makestep
timedatectl status

# 4. 如果还是失败，卸载重来
systemctl stop chronyd
ntpdate pool.ntp.org
systemctl start chronyd
```

**根本原因：** NTP 源不可达或防火墙阻止 UDP 123 端口

**预防方案：** 在初始化前确保 `ntpdate` 能连接到上游 NTP 服务

---

### 错误 3：Kerberos 密钥文件冲突

**症状：**
```
ipa-server-install: ERROR: The Kerberos key table already exists
```

**解决方案：**
```bash
# 卸载并清理
ipa-server-install --uninstall
rm -f /etc/krb5.keytab
# 重新初始化
```

---

### 错误 4：LDAP 绑定失败

**症状：**
```
ipa-server-install: ERROR: Directory Server failed to start
```

**排查步骤：**
```bash
# 1. 查看 Directory Server 日志
journalctl -u dirsrv -n 50

# 2. 检查磁盘空间（LDAP 数据库磁盘占用较大）
df -h /var

# 3. 检查端口占用
ss -tlnp | grep 389

# 4. 查看 SELinux 是否阻止
getenforce
# 如非必要不要关闭 SELinux，而是调整策略
```

**根本原因：** 磁盘满、端口占用、SELinux 策略过严

---

## 五、验证 Kerberos 认证

FreeIPA 使用 Kerberos 进行无密码认证，这是核心功能。

### 获取 Kerberos 票据

```bash
# 以 admin 用户身份
kinit admin
# 提示输入密码，输入在 install 时设置的 admin-password
```

**为什么这样做？**
- `kinit` 从 Kerberos KDC（Key Distribution Center）获取 TGT（Ticket Granting Ticket）
- TGT 是后续认证的"通行证"，有效期通常 24 小时
- 后续任何服务认证都不需要重复输入密码，只需要有有效的 TGT

### 查看当前票据

```bash
klist
```

**成功输出示例：**
```
Ticket cache: KCM:0
Default principal: admin@ACDIOST.INTERNAL

Valid starting     Expires            Service principal
04/18/26 10:00:00 04/19/26 10:00:00  krbtgt/ACDIOST.INTERNAL@ACDIOST.INTERNAL
```

**字段说明：**
- `Default principal`：当前认证的用户
- `Valid starting / Expires`：票据有效期
- `Service principal`：票据用于访问的服务

### 销毁票据

```bash
kdestroy  # 登出

# 或列出所有会话并选择性删除
klist -l
```

---

## 六、DNS 验证

FreeIPA 内置的 DNS 必须正常工作，否则客户端无法加入域。

### 正向解析（主机名 → IP）

```bash
dig @localhost c128.acdiost.internal +short
# 应返回：192.168.100.128
```

**为什么这样做？**
- 客户端使用 SRV 记录发现 FreeIPA 服务器
- 正向解析是基础，确保域名能解析到 IP

**故障排查：**
```bash
# 查看 FreeIPA DNS 视图
ipa dnsrecord-find acdiost.internal c128

# 如果没有，手工添加
ipa dnsrecord-add acdiost.internal c128 --a-rec=192.168.100.128
```

### 反向解析（IP → 主机名）

```bash
dig -x 192.168.100.128 @localhost +short
# 应返回：c128.acdiost.internal.
```

**为什么这样做？**
- 反向 DNS 用于日志、审计、安全认证（如 SSH）
- 许多系统会验证反向 DNS，缺失会导致连接缓慢

**故障排查：**
```bash
# 检查反向 DNS 区域
ipa dnszone-find
# 应该包含 100.168.192.in-addr.arpa

# 手工添加 PTR 记录
ipa dnsrecord-add 100.168.192.in-addr.arpa 128 --ptr-rec=c128.acdiost.internal.
```

### 查询 SRV 记录

```bash
dig SRV _ldap._tcp.acdiost.internal @localhost
dig SRV _kerberos._tcp.acdiost.internal @localhost
```

**为什么这样做？**
- 客户端通过 SRV 记录自动发现 LDAP 和 Kerberos 服务
- 如果 SRV 记录缺失，客户端加入域会失败

---

## 七、防火墙配置

FreeIPA 需要多个端口开放。

```bash
# 一键开放所有 FreeIPA 相关服务
firewall-cmd --permanent --add-service={freeipa-ldap,freeipa-ldaps,kerberos,kpasswd,dns,http,https,ntp}
firewall-cmd --reload

# 验证
firewall-cmd --list-services
```

**关键端口说明：**

| 端口 | 协议 | 服务 | 用途 |
|------|------|------|------|
| 53 | UDP/TCP | DNS | 域名解析（客户端发现服务） |
| 88 | UDP/TCP | Kerberos | 票据颁发 |
| 389 | TCP | LDAP | 目录查询 |
| 443 | TCP | HTTPS | Web UI、LDAPS（加密 LDAP） |
| 464 | UDP/TCP | Kpasswd | 密码修改 |
| 123 | UDP | NTP | 时间同步 |

**为什么要开放这些端口？**
- 客户端通过这些端口与服务器通信
- 如果端口关闭，客户端加入域、认证、查询都会失败

---

## 八、客户端接入（详细步骤）

### 客户端机器前置准备（以 c129 为例）

```bash
# 1. 设置主机名
hostnamectl set-hostname c129.acdiost.internal

# 2. 配置 DNS（指向 FreeIPA 服务器）
nmcli con mod ens160 ipv4.method auto ipv4.dns "192.168.100.128" ipv4.ignore-auto-dns yes
nmcli con down ens160 && nmcli con up ens160

# 3. 验证 DNS 生效
nmcli dev show | grep DNS
# IP4.DNS[1]: 192.168.100.128

# 4. 测试 DNS 解析
dig c128.acdiost.internal
```

**为什么这样做？**
- 客户端必须能查询到 FreeIPA 服务器的 DNS 记录
- 如果 DNS 配置错误，后续所有步骤都会失败
- `ipv4.ignore-auto-dns yes` 防止 DHCP 自动覆盖 DNS 配置

### 安装客户端软件

```bash
dnf install -y ipa-client
```

### 加入 FreeIPA 域

```bash
ipa-client-install --unattended \
--hostname=c129.acdiost.internal \
--domain=acdiost.internal \
--realm=ACDIOST.INTERNAL \
--server=c128.acdiost.internal \
--principal=admin \
--password='Admin_p@55w0rd' \
--mkhomedir \
--enable-dns-updates \
--ntp-server=ntp1.ntsc.ac.cn \
--ntp-pool=0.cn.pool.ntp.org
```

**参数说明：**

| 参数 | 含义 | 为什么 |
|------|------|--------|
| `--hostname` | 客户端 FQDN | 注册到 FreeIPA 目录 |
| `--domain` / `--realm` | 必须与服务端一致 | 确保在同一个认证域内 |
| `--server` | FreeIPA 服务器 | 指定哪个 FreeIPA 服务器进行认证 |
| `--principal` / `--password` | 管理员凭证 | 用于在服务端创建主机记录 |
| `--mkhomedir` | 自动创建 home | 用户首次登录时自动 `mkdir` |
| `--enable-dns-updates` | DNS 自注册 | 客户端 IP 变更时自动更新 DNS |
| `--ntp-server / --ntp-pool` | NTP 配置 | 与服务器同步时间 |

**运行耗时：** 2-5 分钟

### 验证客户端加入成功

```bash
# 1. 查询本地 FreeIPA 用户
id admin
# uid=1600000000(admin) gid=1600000000(admins) groups=1600000000(admins)

# 2. 查看 SSSD 状态
systemctl status sssd

# 3. 查看 SSSD 缓存信息
sss_cache -u admin
sudo sss_debuglevel 7  # 增加日志级别用于排查

# 4. 检查 Kerberos 配置
cat /etc/krb5.conf | grep -A 5 "ACDIOST.INTERNAL"

# 5. 尝试 SSH 登录
ssh admin@c129
# 首次登录需要输入 FreeIPA 用户密码
```

---

## 九、用户和权限管理

### 创建用户

```bash
# 基础创建
ipa user-add testuser \
--first=Test \
--last=User \
--password

# 完整创建（包含邮箱、电话等）
ipa user-add devops01 \
--first=Devops \
--last=Admin \
--email=devops01@acdiost.internal \
--phone=+86-10-1234-5678 \
--uid=2001 \
--gidnumber=2001 \
--login-shell=/bin/bash \
--homedir=/home/devops01 \
--password
```

**为什么这样做？**
- 在 FreeIPA 创建的用户会同步到所有客户端
- `--password` 交互式设置密码（推荐），或 `--password='xxx'` 非交互
- UID/GID 指定避免冲突，建议从 2000+ 开始（系统账户通常 < 1000）

### 创建系统用户（无登录权限）

```bash
# 如 Slurm、Prometheus 等服务账户
ipa user-add slurm \
--first=Slurm \
--last=Service \
--uid=202 \
--gidnumber=202 \
--noprivate \
--shell=/sbin/nologin \
--homedir=/var/lib/slurm
```

**为什么这样做？**
- `--noprivate`：不创建私有组
- `--shell=/sbin/nologin`：禁止交互式登录
- `--homedir=/var/lib/slurm`：放在服务目录而非 `/home`

### 创建用户组

```bash
ipa group-add engineers \
--gid=3000 \
--desc="Engineering team"

# 添加成员
ipa group-add-member engineers --users=testuser,devops01
```

### 查询用户

```bash
# 查询单个用户
ipa user-find testuser --all

# 列出所有用户
ipa user-find

# 查询某个组的成员
ipa group-show engineers
```

### 修改用户密码

```bash
# 管理员为用户重置密码
ipa passwd testuser

# 用户自己改密码
passwd
```

### 配置 SSH 公钥认证

```bash
# 添加公钥（不需要输入密码）
ipa user-mod testuser --sshpubkey="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIH6M/zLgBby4S0QzY2ipDVRkwE4136g7+0ovsPHySYMq testuser@localhost"

# 验证（在客户端上）
ssh testuser@c129  # 不需要输入密码
```

**为什么这样做？**
- SSH 公钥认证比密码更安全
- 配合 Kerberos，实现真正的无密码认证

### 配置密码策略

```bash
# 查看默认策略
ipa pwpolicy-find

# 修改密码过期时间（天数）
ipa user-mod testuser --password-expiration=$(date -d '+90 days' +%Y%m%d%H%M%SZ)
```

### 删除用户

```bash
ipa user-del testuser
```

---

## 十、常用命令参考

### 主机管理

```bash
# 查询主机
ipa host-find

# 查看特定主机
ipa host-show c129.acdiost.internal

# 删除主机记录（客户端卸载后）
ipa host-del c129.acdiost.internal
```

### DNS 管理

```bash
# 查询 DNS 记录
ipa dnsrecord-find acdiost.internal c129

# 添加 A 记录
ipa dnsrecord-add acdiost.internal c129 --a-rec=192.168.100.129

# 添加 PTR 记录（反向解析）
ipa dnsrecord-add 100.168.192.in-addr.arpa 129 --ptr-rec=c129.acdiost.internal.

# 删除 DNS 记录
ipa dnsrecord-del acdiost.internal c129 --a-rec=192.168.100.129
```

### Kerberos 管理

```bash
# 查询服务主体（Service Principal）
ipa service-find

# 添加服务主体（如自定义服务需要 Kerberos 认证）
ipa service-add HTTP/myapp.acdiost.internal

# 生成服务密钥
ipa-getkeytab -s c128.acdiost.internal -p HTTP/myapp.acdiost.internal -k /etc/myapp/krb5.keytab
```

### SSSD 缓存管理

```bash
# 清除用户缓存
sss_cache -u testuser

# 清除所有缓存
sss_cache -E

# 查看 SSSD 日志（实时）
journalctl -u sssd -f

# 增加 SSSD 日志级别
sss_debuglevel 7
```

### Web UI 管理

```bash
# 访问 Web UI
https://c128.acdiost.internal

# 用户名：admin
# 密码：Admin_p@55w0rd（安装时设置）
```

### 证书管理

```bash
# 下载 FreeIPA CA 证书
curl -k -O https://c128.acdiost.internal/ipa/config/ca.crt

# 在客户端信任该证书
cp ca.crt /etc/pki/ca-trust/source/anchors/
update-ca-trust

# 查询 FreeIPA 签发的证书
ipa cert-find

# 撤销证书
ipa cert-revoke <serial_number>
```

### sudo 用户

```bash
# 添加 sudo 规则
ipa sudorule-add allow-all

# 允许所有命令
ipa sudorule-mod allow-all --cmdcat=all
# 允许在所有主机执行
ipa sudorule-mod allow-all --hostcat=all

# 添加用户到 sudo
ipa sudorule-add-user allow-all --users=dawn

# 取消所有命令，应该已经没有 Command category: all
ipa sudorule-mod allow-all --cmdcat=

# 改为指定命令
# 创建命令对象
ipa sudocmd-add /usr/bin/systemctl
# 把命令加到规则里
ipa sudorule-add-allow-command allow-all --sudocmds=/usr/bin/systemctl

# 再添加其他命令
ipa sudocmd-add /usr/bin/journalctl
ipa sudorule-add-allow-command allow-all --sudocmds=/usr/bin/journalctl

# 查看规则
ipa sudorule-show allow-all
```

---

## 十一、问题排查指南

### 问题 1：客户端 SSH 登录超时

**症状：**
```
ssh testuser@c129
# 长时间无响应，最终超时
```

**排查步骤：**
```bash
# 1. 检查 SSSD 状态
systemctl status sssd
journalctl -u sssd -n 100

# 2. 检查网络连接
ping c128.acdiost.internal

# 3. 检查 DNS 解析
dig +short c128.acdiost.internal

# 4. 检查 Kerberos 配置
cat /etc/krb5.conf

# 5. 尝试手工认证
kinit testuser
kinit -V testuser  # 详细输出
```

**常见原因和解决方案：**
- **网络/DNS 不通**：检查防火墙、DNS 配置
- **SSSD 未启动**：`systemctl start sssd`
- **SELinux 阻止**：`getenforce`，如需关闭 `setenforce 0`
- **Kerberos 配置错误**：确认 `[realm]` 和 `[domain_realm]` 正确

### 问题 2：用户查询失败（id 命令无法识别）

**症状：**
```bash
id testuser
# id: 'testuser': no such user
```

**排查步骤：**
```bash
# 1. 检查用户是否存在于 FreeIPA
ipa user-find testuser

# 2. 检查 SSSD 缓存
sss_cache -u testuser

# 3. 检查 NSS 配置
grep compat /etc/nsswitch.conf

# 4. 手工查询 LDAP
ldapsearch -x -h c128.acdiost.internal -b "cn=users,cn=accounts,dc=acdiost,dc=internal" uid=testuser
```

**常见原因和解决方案：**
- **用户不存在**：在 FreeIPA 服务器上创建用户
- **SSSD 未同步**：`systemctl restart sssd`
- **NSS 配置不对**：检查 `/etc/nsswitch.conf` 是否有 `sss` 项
- **LDAP 连接失败**：检查防火墙、网络、LDAP 服务状态

### 问题 3：密码修改后立即登录失败

**症状：**
```bash
ipa passwd testuser  # 重置密码
ssh testuser@c129   # 新密码登录失败
```

**排查步骤：**
```bash
# 1. 清除 Kerberos 票据（重要）
kdestroy -A

# 2. 清除 SSSD 缓存
sss_cache -u testuser

# 3. 等待 SSSD 同步（通常 30 秒内）
sleep 30

# 4. 重试登录
ssh testuser@c129
```

**根本原因：** SSSD 有密码缓存，修改后需要等待同步或手工清除缓存

### 问题 4：Kerberos 时间同步错误

**症状：**
```
kinit testuser
# KDC returned error string: SKEW(Clock skew too great)
```

**排查步骤：**
```bash
# 1. 检查系统时间
timedatectl status
date

# 2. 检查 NTP 源
chronyc sources
chronyc makestep  # 强制同步

# 3. 检查服务器和客户端时间差
ssh c128 'date'
date

# 4. 如果差异 > 5 分钟，手工同步
ntpdate -s pool.ntp.org
# 或
date --set="$(ssh c128 date)"
```

**根本原因：** NTP 配置不对或未启动，Kerberos 要求时间差 < 5 分钟

---

## 十二、备份与恢复

### 备份 FreeIPA 配置和数据

```bash
ipa-backup
# 自动生成 /var/lib/ipa/backup/ipa-full-YYYY-MM-DD-HH-MM-SS.tar.gz
```

**备份内容：**
- LDAP 数据库
- Kerberos 密钥
- PKI 证书
- DNS 区域数据
- 配置文件

### 恢复备份

```bash
# 1. 列出可用备份
ls -la /var/lib/ipa/backup/

# 2. 恢复（会停止 FreeIPA 服务）
ipa-restore /var/lib/ipa/backup/ipa-full-YYYY-MM-DD-HH-MM-SS.tar.gz

# 3. 验证恢复
ipactl status
```

**为什么需要备份？**
- FreeIPA 包含重要的密钥、证书、用户数据
- 磁盘损坏、意外删除需要快速恢复
- 定期备份（推荐每周一次）到离线存储

---

## 十三、生产部署建议

### 高可用架构

```
┌─────────────────────┐         ┌─────────────────────┐
│ FreeIPA Server 1    │──────── │ FreeIPA Server 2    │
│ c128.acdiost...     │ LDAP 复 │ c131.acdiost...     │
│ DNS, LDAP, K5, CA   │ 制连接   │ DNS, LDAP, K5, CA   │
└─────────────────────┘         └─────────────────────┘
          │                              │
    ┌─────┴──────────────────────────────┴─────┐
    │                                          │
┌───▼────────┐ ┌──────────┐ ┌──────────────┐
│ Client 1   │ │ Client 2 │ │ Client N     │
└────────────┘ └──────────┘ └──────────────┘
```

**关键点：**
- FreeIPA 支持 Master-Replica 架构，实现 LDAP 数据同步(https://www.freeipa.org/page/V4/Replica_Setup)
- 域名配置为负载均衡地址（如 `ipa.acdiost.internal` 指向两个 IP）
- 每个副本独立运行 DNS、Kerberos，提高可用性

### 安全加固

```bash
# 1. 启用 SSH 证书认证而非密码
ipa user-mod testuser --sshpubkey="..."

# 2. 定期备份
0 2 * * 0 /usr/sbin/ipa-backup
```

### 性能优化

- **LDAP 缓存**：SSSD 默认缓存 1-2 小时，可根据用户变更频率调整
- **DNS 缓存**：增加 DNS 缓存时间（如 3600 秒）
- **连接池**：FreeIPA 自动管理，无需手工配置

---

## 十四、卸载与清理

### 完全卸载客户端

```bash
ipa-client-install --uninstall
```

### 卸载服务器

```bash
# 警告：该操作会删除所有数据
ipa-server-install --uninstall

# 清理残余文件（谨慎操作）
rm -rf /etc/ipa /var/lib/ipa
```

---

## 总结

### FreeIPA 部署核心要点

| 要点 | 关键操作 | 如果出错 |
|------|--------|--------|
| **1. 主机名** | `hostnamectl set-hostname [FQDN]` | 所有认证都会失败 |
| **2. DNS** | 配置为 FreeIPA 服务器 IP | 客户端无法加入域 |
| **3. 时间** | `ntpdate` 或 `chronyc makestep` | Kerberos 认证超时 |
| **4. 防火墙** | 开放 53/88/389/443 等端口 | 网络连接超时 |
| **5. SSSD** | `systemctl status sssd` | 用户查询失败 |

### 最佳实践

✅ **必须做**
- 备份 FreeIPA 配置
- 监控服务状态和日志
- 定期更新系统和 FreeIPA 包
- 定期测试灾备恢复流程
- 记录 admin 密码、DS 密码，存放在安全位置

❌ **不要做**
- 直接修改 LDAP 数据库（应使用 `ipa` 命令）
- 在 `/etc/hosts` 而非 DNS 中管理主机记录
- 关闭 SELinux（而是调整策略）
- 使用弱密码或共享凭证
- 跳过时间同步步骤

---

## 参考资源

- **官方文档**：https://www.freeipa.org/page/Documentation.html

---

**最后的话：** 

FreeIPA 的学习曲线不陡峭，但细节众多。本文覆盖了 90% 的常见场景。当遇到新问题时，记住这个排查顺序：**DNS → 网络 → SSSD → LDAP → Kerberos**。大多数情况下，问题就在这个链路的某个环节。

祝你部署顺利！🚀
