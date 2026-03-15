```
   _____ _                  _____                     _
  / ____| |                / ____|                   | |
 | |    | | __ ___      __| |  __ _   _  __ _ _ __ __| |
 | |    | |/ _` \ \ /\ / /| | |_ | | | |/ _` | '__/ _` |
 | |____| | (_| |\ V  V / | |__| | |_| | (_| | | | (_| |
  \_____|_|\__,_| \_/\_/   \_____|\__,_|\__,_|_|  \__,_|
```

# ClawGuard 🦞🛡️

> OpenClaw Skill 安全扫描器。保护你的龙虾。

ClawGuard 是一个针对 [OpenClaw](https://github.com/openclaw) skill 的静态安全扫描工具。它分析 `SKILL.md` 文件及关联脚本，在威胁到达你的系统之前检测潜在安全问题。

## 快速开始

```bash
npx clawguard scan ./my-skill/
```

## 安装

```bash
npm install -g clawguard
```

## 使用方法

```bash
# 扫描单个 skill
clawguard scan ./my-skill/

# 扫描整个 skills 目录
clawguard scan ~/.openclaw/skills/

# JSON 输出（方便 CI 集成）
clawguard scan ./my-skill/ --json

# 只检查特定规则
clawguard scan ./my-skill/ --rules prompt-injection,data-exfiltration

# 设置最低报告严重度
clawguard scan ./my-skill/ --min-severity high

# 输出报告到文件
clawguard scan ./my-skill/ --output report.json
```

## 检测规则

| 规则 | 严重度 | 说明 |
|------|--------|------|
| `prompt-injection` | CRITICAL | 检测指令覆盖模式、角色切换、base64 载荷、不可见 Unicode、隐藏 HTML 注释 |
| `data-exfiltration` | CRITICAL | 检测读取敏感文件并发送到外部服务的模式 |
| `permission-overreach` | HIGH | 标记危险二进制文件（sudo、rm、docker）、过多环境变量、敏感凭证 |
| `suspicious-urls` | HIGH | 识别 IP 地址 URL、非标准端口、短链接服务、已知恶意域名 |
| `dangerous-commands` | HIGH | 捕获破坏性命令（rm -rf /）、系统文件修改、远程代码执行（curl \| sh） |
| `metadata-mismatch` | MEDIUM | 发现使用但未声明的环境变量、声明但未使用的二进制工具 |

## 路线图

### 动态运行时监控（即将推出）

静态扫描只能检测代码中可见的威胁，但有些 skill 会指示 AI 访问外部网站、点击按钮或获取远程内容。这些外部资源随时可能变化——今天安全的链接，下周可能就被替换成恶意内容。

我们正在构建 **ClawGuard Sentinel**，一个开源的、用户可自行部署的框架，为涉及外部交互的 skill 提供**持续运行时监控**：

- **沙箱执行** — 每个被监控的 skill 定期在隔离环境（容器）中运行，由轻量级 LLM 驱动
- **输入输出监控** — 捕获并分析 skill 执行的所有输入输出，检测异常行为（意外重定向、注入脚本、凭证窃取模式等）
- **自动隔离** — 一旦检测到风险，立即标记并停用该 skill，同时向用户发出警报
- **自部署 & 开源** — 用户在自己的基础设施上部署，数据不离开用户环境

这解决了静态分析的根本局限：**skill 的威胁面不仅限于源代码，还延伸到它引用的每一个外部资源**。一个写着"访问 example.com 并点击下载"的 skill，其安全性取决于那个页面*此刻*是否安全。

> 状态：设计中。欢迎贡献和反馈——提交 issue 参与讨论。

## 贡献新规则

每条规则是 `src/rules/` 下的独立模块，实现 `Rule` 接口即可。详见英文 README。

## 许可证

MIT
