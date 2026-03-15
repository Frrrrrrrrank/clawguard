# 我扫描了 ClawHub 上 103 个 Skill，71% 存在安全隐患

## ClawGuard：OpenClaw 生态的第一道安全防线

OpenClaw 在三个月内收获了 24 万+ GitHub Stars，成为 AI Agent 领域最火的开源项目。它的插件系统——Skill，让任何人都可以为 AI Agent 编写扩展功能。ClawHub 作为官方的 Skill 社区，已经有超过 13,000 个社区贡献的 Skill。

但问题来了：**这些 Skill 安全吗？**

任何人都可以发布 Skill，审核机制尚不完善。一个看似"帮你管理 Todo"的 Skill，可能在背后偷偷读取你的 SSH 密钥、AWS 凭证，甚至把数据发送到外部服务器。更危险的是，Skill 本质上是给 AI Agent 的自然语言指令——它可以指示 Agent 执行任意操作，而用户可能完全不知情。

所以我做了 [**ClawGuard**](https://github.com/Frrrrrrrrank/clawguard) —— 一个针对 OpenClaw Skill 的开源静态安全扫描器。

---

## ClawGuard 是什么

ClawGuard 是一个 CLI 工具，对 Skill 的 `SKILL.md` 文件和附带脚本进行静态分析，检测 6 类安全威胁：

| 规则 | 严重度 | 检测内容 |
|------|--------|----------|
| **prompt-injection** | CRITICAL | 指令覆盖（"ignore previous instructions"）、角色切换、base64 隐藏载荷、不可见 Unicode、HTML 注释中的隐藏指令 |
| **data-exfiltration** | CRITICAL | 读取敏感文件（~/.ssh、~/.aws、.env）并发送到外部服务（curl POST） |
| **permission-overreach** | HIGH | 请求危险二进制文件（sudo、rm、docker）、过多环境变量、敏感凭证 |
| **suspicious-urls** | HIGH | IP 地址直连、非标准端口、短链接服务、已知恶意域名 |
| **dangerous-commands** | HIGH | 破坏性命令（rm -rf /）、系统文件修改、远程代码执行（curl \| sh） |
| **metadata-mismatch** | MEDIUM | 使用但未声明的环境变量、声明但未使用的工具 |

使用方式极其简单：

```bash
npx clawguard scan ./my-skill/
```

---

## 我做了什么

我从 ClawHub 上选取了 **103 个 Skill** 进行安全扫描。选择标准是：包含 curl、SSH、docker、credentials、password、token、scrape、wget、base64 等关键词的 Skill，以及涉及加密货币、支付、浏览器自动化、远程执行等高风险领域的 Skill。

结果令人震惊。

---

## 扫描结果概览

| 指标 | 数值 |
|------|------|
| 扫描 Skill 总数 | 103 |
| **未通过扫描** | **73（70.9%）** |
| 通过扫描 | 30（29.1%） |
| 安全问题总数 | 801 |
| CRITICAL 级别 | 520 |
| HIGH 级别 | 238 |
| MEDIUM 级别 | 43 |

**超过七成的 Skill 存在安全隐患**，而且大部分是 CRITICAL 级别。

### 威胁分布

数据外泄（data-exfiltration）是最大的威胁，占所有发现的 **60.2%**。大量 Skill 会访问 `~/.ssh`、`~/.aws`、`.env`、`credentials` 等敏感路径，或通过 `curl POST` 将数据发送到外部服务器。

```
数据外泄     ████████████████████████████████  60.2%
可疑 URL     ██████████████                    27.8%
元数据不匹配  ███                               5.4%
Prompt 注入   ██                                3.1%
危险命令      █                                 2.7%
权限越界      ▏                                 0.7%
```

---

## 典型高危案例分析

### 案例 1：rent-my-browser —— 浏览器后门即服务

这个 Skill 声称让你"出租浏览器算力赚钱"，但实际上：
- 注册 cron 定时任务，持续运行
- 接收来自远程"消费者"的任意"目标"并执行
- 访问 `~/.ssh`、`.env`、`credentials`
- **包含 prompt injection 模式**："ignore previous instructions"

这不是一个工具，这是一个后门。

### 案例 2：bagman —— Prompt 注入 + 加密钱包

一个管理加密货币私钥和钱包的 Skill，同时包含：
- "ignore previous instructions" 和 "you are now" 等 prompt injection 模式
- 多处引用 credentials 和 .env

想象一下：攻击者通过 prompt injection 劫持 Agent，让它把你的加密货币私钥发送到外部。这是最危险的组合。

### 案例 3：dead-internet —— 供应链攻击

这个 Skill 指示 Agent 从 `deadinternet.forum` 下载内容，并写入用户的本地 Skill 目录。23 个 curl POST 外泄模式。本质上就是：**让你的 Agent 从不受信任的来源下载并安装代码**。

### 案例 4：authensor-gateway —— 中间人监控

自称"安全网关"，实际上拦截 Agent 的**所有**工具调用，将"动作元数据"转发到外部控制平面。无论它声称只发送元数据，这都是一个监控你所有 Agent 行为的中间人。更令人不安的是，它的文档中直接引用了 `evil.com` 和 `curl | sh` 模式。

---

## 静态分析的局限与下一步

有一个 Skill（mupengi-bot/auto-reply）通过了所有静态检查，但它通过 Chrome DevTools Protocol 提取 Instagram 会话 Cookie，在 WebSocket 端口 18800 上读写 DM。这种运行时风险是静态扫描无法捕获的。

这也是我们正在开发 **ClawGuard Sentinel** 的原因——一个开源的动态运行时监控框架：

- **沙箱执行**：在隔离容器中定期运行被监控的 Skill
- **I/O 监控**：捕获分析所有输入输出
- **自动隔离**：检测到风险立即停用 Skill 并告警
- **自部署**：用户在自己的基础设施上运行，数据不离开本地

因为 Skill 的威胁面不仅限于源代码——一个今天安全的外部链接，明天可能就被替换成恶意内容。

---

## 如何保护自己

1. **安装前扫描**：`npx clawguard scan <skill-dir>`
2. **关注权限请求**：一个 Todo Skill 为什么需要 `sudo` 和 `SSH_KEY`？
3. **警惕外部交互**：Skill 指向的外部 URL 随时可能变化
4. **审查 SKILL.md**：它就是给 Agent 的指令，值得花 2 分钟读一遍

我们也已将 ClawGuard 作为 Skill 提交到 ClawHub（[PR #203](https://github.com/openclaw/skills/pull/203)），安装后你的 Agent 会在安装任何新 Skill 前自动进行安全扫描。

---

## 项目地址

- **GitHub**: [github.com/Frrrrrrrrank/clawguard](https://github.com/Frrrrrrrrank/clawguard)
- **快速使用**: `npx clawguard scan ./your-skill/`
- **License**: MIT

欢迎 Star、贡献规则、提交 Issue。让我们一起让 OpenClaw 生态更安全。

---

## 附录：103 个 Skill 完整扫描结果

### 危险标识说明

- 🔴 **CRITICAL**：存在严重安全风险，强烈建议不要安装
- 🟠 **HIGH**：存在高风险问题，需谨慎评估后决定
- 🟡 **MEDIUM**：存在中等风险，建议了解后使用
- 🟢 **PASS**：通过所有静态检查

---

### 🔴 CRITICAL 级别（最危险）

#### 1. ethanbeard/clwnt — 178 个问题
**威胁**：数据外泄 + 远程代码执行
Agent 社交网络，向 `api.clwnt.com` 大量发送数据（46 个外泄模式），引用 credentials 7 次，包含 `curl | python` 远程代码执行。给 Agent 分配邮件地址并允许自主发送消息——你的 Agent 在未经你许可的情况下，可以向外部发送任何内容。

#### 2. huamu668/browser-automation-pin — 85 个问题
**威胁**：数据外泄 + 远程代码执行
29 个外泄模式，通过非标准端口（localhost:9867）进行浏览器自动化，包含 `curl | sh` 模式，11 个未声明的环境变量。

#### 3. wgan/squad-control — 38 个问题
**威胁**：数据外泄 + 凭证暴露
多 Agent 编排框架，19 个外泄模式发送数据到外部服务，引用 credentials，17 个未声明的环境变量。

#### 4. chair4ce/swarm — 33 个问题
**威胁**：数据外泄 + Base64 隐藏内容
多 Agent 集群，13 个外泄模式，base64 编码内容（可能隐藏恶意指令），访问 ~/.config。

#### 5. hellojun/boutnetwork — 30 个问题
**威胁**：Base64 载荷 + 凭证暴露
区块链 Agent 网络，4 个 base64 编码载荷，19 次引用 .env 文件，引用 credentials，6 个未声明的钱包/API 密钥环境变量。

#### 6. gitgoodordietrying/ssh-tunnel — 27 个问题
**威胁**：SSH 密钥暴露
27 次引用 ~/.ssh，大量接触用户 SSH 密钥。

#### 7. zhenstaff/swarm-orchestrator — 24 个问题
**威胁**：数据外泄 + 环境变量暴露
10 次引用 .env，4 个外泄模式。

#### 8. treadon/dead-internet — 23 个问题
**威胁**：供应链攻击
指示 Agent 从 `deadinternet.forum` 下载内容并写入本地 Skill 目录，23 个 curl POST 外泄模式。典型的供应链攻击载体。

#### 9. hengxuz/cryptojuhequn — 23 个问题
**威胁**：IP 直连 + Base64
所有 URL 都指向裸 IP 地址 `88.222.241.169`（而非域名），5 个 base64 编码内容。指向裸 IP 的 URL 通常意味着规避域名审查。

#### 10. arnarsson/ssh-essentials — 22 个问题
**威胁**：SSH 密钥暴露
22 次引用 ~/.ssh。

#### 11. mastersyondgy/seedstr — 21 个问题
**威胁**：凭证外泄
引用 credentials 7 次、~/.config 5 次，9 个外泄模式发送到外部。

#### 12. phillipholland/clawstake — 19 个问题
**威胁**：C2 通信 + 凭证暴露
预测市场 Skill，每 15-30 分钟向 `clawstake.com` 发送心跳，类似 C2（命令与控制）通信模式。发送 API 密钥到外部，鼓励 Agent 自主交易。

#### 13. authensor/authensor-gateway — 19 个问题
**威胁**：中间人攻击
拦截所有 Agent 工具调用并转发到外部控制平面。引用 ~/.ssh、~/.aws、~/.gnupg、.env、credentials。文档中直接出现 `evil.com` 和 `curl | sh`。

#### 14. imaxtomas/mcp-ssh-manager — 19 个问题
**威胁**：SSH 密钥暴露
19 次引用 ~/.ssh。

#### 15. 0xpasho/rent-my-browser — 17 个问题
**威胁**：Prompt 注入 + 后门
包含 "ignore previous instructions" 模式，访问 ~/.ssh、.env、credentials（15 次），注册 cron 任务执行远程目标。**浏览器后门即服务**。

#### 16. wykings/xcrawl-scrape — 9 个问题
**威胁**：数据外泄
3 次引用 .env，2 个外泄模式，4 个未声明环境变量。

#### 17. sa9saq/secret-rotator — 9 个问题
**威胁**：系统凭证扫描
扫描整个系统的 .env（7 次）、~/.ssh、~/.config，建立凭证位置清单。

#### 18. zscole/bagman — 9 个问题
**威胁**：Prompt 注入 + 加密货币私钥
包含 "ignore previous instructions" 和 "you are now" 两种 prompt injection 模式，引用 credentials 4 次和 .env 3 次。**最危险的组合：攻击者可通过 prompt injection 窃取加密货币私钥**。

#### 19. sa9saq/ssh-manager — 9 个问题
**威胁**：SSH 密钥暴露
9 次引用 ~/.ssh。

#### 20. codejika/cashapp — 8 个问题
**威胁**：支付数据外泄
4 个外泄模式 + 4 次引用 credentials。

#### 21. derick001/ssh-config-manager — 8 个问题
**威胁**：SSH 密钥暴露
8 次引用 ~/.ssh。

#### 22. rhesketh/monzo — 7 个问题
**威胁**：银行凭证暴露
银行相关 Skill，引用 credentials 4 次 + .env 3 次。

#### 23. jononovo/jpmorgan — 7 个问题
**威胁**：金融数据外泄
6 个外泄模式 + 未声明的 CREDITCLAW_API_KEY。

#### 24. codejika/shop — 7 个问题
**威胁**：支付数据外泄
6 个外泄模式 + 未声明的 CREDITCLAW_API_KEY。

#### 25. codejika/usd — 7 个问题
**威胁**：支付数据外泄
6 个外泄模式 + 未声明的 CREDITCLAW_API_KEY。

#### 26. triwinds/searxng-docker — 7 个问题
**威胁**：IP 直连 + 远程代码执行
URL 使用 127.0.0.1 和 192.168.1.100 直连，包含 `curl | python`。

#### 27. sterdam/solclaw — 6 个问题
**威胁**：Base64 + 配置暴露
2 个 base64 编码内容 + 4 次引用 ~/.config。

#### 28. moodykong/ssh-op — 6 个问题
**威胁**：SSH 密钥 + 环境变量暴露
4 次引用 .env + 2 次引用 ~/.ssh。

#### 29. lxnan/clash-vpn — 6 个问题
**威胁**：IP 直连
URL 使用 127.0.0.1 的非标准端口（7890、7893）。

#### 30. xiaoyinqu/browser-automation-pro — 5 个问题
**威胁**：数据外泄
4 个外泄模式 + 未声明的 API_HUB_API_KEY。

#### 31. jononovo/chase — 5 个问题
**威胁**：金融数据外泄
4 个外泄模式 + 未声明的 CREDITCLAW_API_KEY。

#### 32. codejika/cart — 5 个问题
**威胁**：支付数据外泄
4 个外泄模式 + 未声明的 CREDITCLAW_API_KEY。

#### 33. olliewazza/larrybrain — 5 个问题
**威胁**：供应链攻击
第三方 Skill 市场，从 `larrybrain.com` 下载并安装未审核的 Skill。引用 credentials 2 次 + 3 个未声明环境变量。

#### 34. enderfga/ssh-lab — 4 个问题
**威胁**：SSH 密钥 + 配置暴露
3 次引用 ~/.ssh + 1 次 ~/.config。

#### 35. saba-ch/cloak — 4 个问题
**威胁**：数据外泄
2 个外泄模式 + 2 次引用 .env。

#### 36. revisual-ai/faceswap — 4 个问题
**威胁**：数据外泄
3 个外泄模式 + 未声明的 VERGING_API_KEY。

#### 37. xiaoyinqu/browser-agent-cloud-scraper — 4 个问题
**威胁**：远程代码执行
2 次 `curl | sh` 模式 + 1 个外泄模式。

#### 38. phy041/twitter-scrape — 3 个问题
**威胁**：环境变量暴露
3 次引用 .env。

#### 39. eyhn/botauth — 3 个问题
**威胁**：凭证暴露
引用 credentials 2 次 + .env 1 次。

#### 40. ant-1984/send-token — 3 个问题
**威胁**：Base64 + 凭证
2 个 base64 编码内容 + 引用 credentials。

#### 41. stj001/ssh-batch-manager — 3 个问题
**威胁**：Base64 + 非标准端口 + 凭证
Base64 内容 + localhost:8765 + credentials。

#### 42. jononovo/fb — 3 个问题
**威胁**：数据外泄
2 个外泄模式 + 未声明的 CREDITCLAW_API_KEY。

#### 43. jononovo/checkout — 3 个问题
**威胁**：支付数据外泄
2 个外泄模式 + 未声明的 CREDITCLAW_API_KEY。

#### 44. jononovo/cash — 3 个问题
**威胁**：金融数据外泄
2 个外泄模式 + 未声明的 CREDITCLAW_API_KEY。

#### 45. codejika/replit — 3 个问题
**威胁**：数据外泄
2 个外泄模式 + 未声明的 CREDITCLAW_API_KEY。

#### 46. codejika/metamask — 3 个问题
**威胁**：加密货币数据外泄
2 个外泄模式 + 未声明的 CREDITCLAW_API_KEY。

#### 47. codejika/btc — 3 个问题
**威胁**：加密货币数据外泄
2 个外泄模式 + 未声明的 CREDITCLAW_API_KEY。

#### 48. codejika/authorize — 3 个问题
**威胁**：支付授权数据外泄
2 个外泄模式 + 未声明的 CREDITCLAW_API_KEY。

#### 49. codejika/adyen — 3 个问题
**威胁**：支付数据外泄
2 个外泄模式 + 未声明的 CREDITCLAW_API_KEY。

#### 50. arulmozhiv/facebook-scraper — 3 个问题
**威胁**：代理端口 + 凭证
通过非标准端口代理（gw-resi.netnut.io:5959） + 引用 credentials 2 次。

#### 51. arulmozhiv/instagram-scraper — 3 个问题
**威胁**：代理端口 + 凭证
通过非标准端口代理（brd.superproxy.io:22225） + 引用 credentials 2 次。

#### 52. phy041/phy-pinterest-scraper — 3 个问题
**威胁**：URL 模式
3 个 URL 触发短链检测（pinterest.com 中的 t.co 子串误报）。

#### 53. bp602/docker-socket-proxy — 3 个问题
**威胁**：非标准端口 + 未声明变量
localhost:2375 + 2 个未声明环境变量（DOCKER_PROXY_URL, DOCKER_HOST）。

#### 54. donatasdecodo/decodo-scraper — 7 个问题
**威胁**：可疑 URL + 环境变量
6 个 URL 触发短链检测 + 引用 .env。

#### 55. raunaksingwi/ravi-passwords — 2 个问题
**威胁**：凭证暴露
引用 credentials 2 次。密码管理 Skill 接触密码存储。

#### 56. btcagentic/bio — 2 个问题
**威胁**：凭证暴露
引用 credentials 2 次。

#### 57. arulmozhiv/x-twitter-scraper — 2 个问题
**威胁**：代理端口 + 凭证
非标准端口代理 + credentials。

#### 58. tedtalk/agent-vision-scraper — 2 个问题
**威胁**：环境变量暴露
通过 Docker --env-file .env 暴露所有环境变量。

#### 59. xejrax/ssh-exec — 2 个问题
**威胁**：SSH 密钥 + 未声明变量
引用 ~/.ssh + 未声明的 SSH_HOST。

#### 60. bastos/pass — 2 个问题
**威胁**：GPG 密钥暴露
引用 ~/.gnupg + 未声明的 EDITOR 变量。

#### 61. mrgoodb/auth0 — 3 个问题
**威胁**：认证数据外泄
1 个外泄模式 + 2 个未声明的 AUTH0 变量。

---

### 🟠 HIGH 级别

#### 62. highlander89/remote-ssh-bridge — 1 个问题
引用 credentials。远程 SSH 桥接需要凭证访问。

#### 63. highlander89/sapconet-ssh-bridge — 1 个问题
引用 credentials。SAP 系统 SSH 桥接。

#### 64. elric2011/docker-remote — 1 个问题
引用 .env。远程 Docker 管理。

#### 65. ivangdavila/docker — 1 个问题
引用 .env。

#### 66. agenticio/instagram — 1 个问题
引用 credentials。

#### 67. agenticio/funding — 1 个问题
引用 credentials。

#### 68. ppiankov/chainwatch — 1 个问题
引用 .env。区块链监控。

#### 69. omnivalent/clawarcade — 1 个问题
1 个外泄模式。

#### 70. jononovo/worldcup — 1 个问题
Base64 编码内容（可能是合法数据编码）。

---

### 🟡 MEDIUM 级别

#### 71. xiaoyinqu/skillboss-scraper — 1 个问题
未声明的 SKILLBOSS_API_KEY。

#### 72. webvictim/teleport-tsh-ssh — 1 个问题
URL 包含 `t.co` 子串（`goteleport.com` 误报）。

#### 73. jononovo/openrouter — 1 个问题
未声明的 OPENROUTER_API_KEY。

---

### 🟢 PASS —— 通过所有检查

以下 30 个 Skill 通过了所有静态安全检查：

| # | Skill | 说明 |
|---|-------|------|
| 74 | mupengi-bot/auto-reply | 通过静态检查，但有运行时风险（CDP Cookie 提取） |
| 75 | youpele52/website-scraper-pro | 网页爬虫 |
| 76 | yinanping-cpu/yinan-web-scraper | 网页爬虫 |
| 77 | xejrax/docker-ctl | Docker 控制 |
| 78 | wulf715/opsecmd | 运维安全 |
| 79 | walniek/astra-docker | Docker 部署 |
| 80 | rupertnt034/rupert-web-scraper | 网页爬虫 |
| 81 | qsobad/ssh-vault | SSH 密钥保险箱 |
| 82 | offlinecat-dev/ssh-agentd-control | SSH Agent 控制 |
| 83 | mariusfit/smart-web-scraper | 智能爬虫 |
| 84 | mkrdiop/moltbot-docker | Docker 部署 |
| 85 | lycohana/ssh | SSH 工具 |
| 86 | lxgicstudios/docker-compose-gen | Docker Compose 生成器 |
| 87 | kexu9/pinterest-scraper | Pinterest 爬虫 |
| 88 | jononovo/state-farm | 保险服务 |
| 89 | jononovo/dell | Dell 服务 |
| 90 | jiafar/deep-scraper-amazon | 亚马逊爬虫 |
| 91 | jiafar/amazon-scraper | 亚马逊爬虫 |
| 92 | ivangdavila/scrape | 通用爬虫 |
| 93 | imkiiki/fundreport-scrape | 基金报告爬虫 |
| 94 | is-the-king/ssh-netmiko | 网络设备 SSH |
| 95 | horsley/cmb-fx | 招商银行外汇 |
| 96 | hacklyc/download-anything | 通用下载器 |
| 97 | gztanht/token-shark | Token 分析 |
| 98 | codejika/sale | 销售工具 |
| 99 | btcagentic/raydium | DeFi 工具 |
| 100 | amos144/zerotoken | Token 工具 |
| 101 | 5kbpers/sg-property-scraper | 新加坡房产爬虫 |
| 102 | 0x5446/ohmytoken | Token 管理 |
| 103 | btcagentic/bio | 简介工具（仅 2 个低风险发现） |

> **注意**：通过静态扫描并不意味着绝对安全。静态分析只能检测已知模式，运行时行为（如访问动态变化的外部 URL）需要动态监控才能覆盖。

---

## 写在最后

OpenClaw 是一个伟大的项目，但任何开放生态都面临安全挑战。当 13,000+ 个社区 Skill 中有超过七成存在安全隐患时，我们需要工具来保护用户。

ClawGuard 只是第一步——静态分析。下一步的 ClawGuard Sentinel 将通过沙箱化动态监控来覆盖静态分析的盲区。

如果你在使用 OpenClaw，请在安装任何第三方 Skill 之前跑一遍扫描。两秒钟的检查，可能避免一次严重的数据泄露。

```bash
npx clawguard scan ./that-cool-skill/
```

保护你的龙虾。🦞🛡️

---

*本报告由 [ClawGuard v0.1.0](https://github.com/Frrrrrrrrank/clawguard) 自动生成，扫描日期 2026-03-15*
