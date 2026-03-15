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

## 贡献新规则

每条规则是 `src/rules/` 下的独立模块，实现 `Rule` 接口即可。详见英文 README。

## 许可证

MIT
