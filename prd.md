# Claude Code Prompt: OpenClaw Skill 安全扫描工具 MVP

## 你的任务

构建一个名为 `clawguard` 的 CLI 工具，用于对 OpenClaw skill 进行静态安全扫描。这是一个开源工具，目标是成为 OpenClaw 生态中第一个专注于 skill 安全的标准化检测方案。

## 背景知识

### OpenClaw Skill 是什么
OpenClaw 是一个开源的 AI Agent 框架（GitHub 24万+ stars），skill 是它的插件系统。每个 skill 是一个文件夹，核心文件是 `SKILL.md`，包含：
- **YAML frontmatter**：定义 name、description、metadata（包括 requires.env、requires.bins、install 等）
- **Markdown body**：给 AI agent 的自然语言指令，告诉 agent 如何使用工具完成任务
- **附加文件**：可能包含脚本（.sh、.py、.js）、配置文件、模板等

### 为什么需要安全扫描
OpenClaw 的 skill 社区（ClawHub）已有 2800+ 个 skill，任何人都可以发布。已知风险包括：
1. Skill 中的 prompt injection（在 markdown 指令中嵌入恶意指令）
2. 过度权限请求（要求不必要的 env vars 或 bins）
3. 可疑外部 URL 引用（指向恶意网站）
4. 元数据与实际行为不匹配（声明不用 shell 但指令中调用 shell）
5. 已知 CVE（如 CVE-2026-25253）
6. 敏感数据泄露模式（指令中包含将数据发送到外部的模式）

## 技术要求

### 语言与框架
- **语言**：TypeScript（与 OpenClaw 生态一致，OpenClaw 本身是 Node.js 项目）
- **运行方式**：CLI 工具，可通过 `npx clawguard scan <path>` 运行
- **输出格式**：终端彩色输出 + 可选 JSON 输出（`--json` flag）

### 项目结构
```
clawguard/
├── package.json
├── tsconfig.json
├── README.md            # 英文，面向国际社区
├── README.zh-CN.md      # 中文版
├── src/
│   ├── index.ts         # CLI 入口
│   ├── scanner.ts       # 核心扫描引擎
│   ├── parsers/
│   │   ├── skillmd.ts   # 解析 SKILL.md（frontmatter + body）
│   │   └── scripts.ts   # 解析附加脚本文件
│   ├── rules/
│   │   ├── index.ts     # 规则注册器
│   │   ├── prompt-injection.ts    # Prompt injection 检测
│   │   ├── permission-overreach.ts # 过度权限检测
│   │   ├── suspicious-urls.ts     # 可疑 URL 检测
│   │   ├── metadata-mismatch.ts   # 元数据不匹配检测
│   │   ├── data-exfiltration.ts   # 数据外泄模式检测
│   │   └── dangerous-commands.ts  # 危险命令检测
│   ├── reporter/
│   │   ├── terminal.ts  # 终端输出（彩色）
│   │   └── json.ts      # JSON 输出
│   └── types.ts         # 类型定义
├── tests/
│   ├── fixtures/        # 测试用的 skill 样本（安全的和恶意的）
│   │   ├── safe-skill/
│   │   │   └── SKILL.md
│   │   ├── malicious-injection/
│   │   │   └── SKILL.md
│   │   ├── data-exfil/
│   │   │   └── SKILL.md
│   │   └── overreach/
│   │       └── SKILL.md
│   └── rules/           # 每条规则的单元测试
└── .github/
    └── workflows/
        └── ci.yml       # GitHub Actions CI
```

### 检测规则详细设计

#### Rule 1: prompt-injection（严重度：CRITICAL）
检测 SKILL.md markdown body 中的 prompt injection 模式：
- 包含 "ignore previous instructions"、"disregard"、"forget your rules" 等覆盖指令
- 包含 "you are now"、"act as"、"pretend to be" 等角色切换指令
- 包含 base64 编码内容（可能隐藏恶意指令）
- 包含不可见 Unicode 字符（零宽字符等，用于隐藏文本）
- 在 markdown 注释 `<!-- -->` 中隐藏指令

#### Rule 2: permission-overreach（严重度：HIGH）
- skill 声明的 `requires.bins` 中包含高危工具（如 `rm`、`dd`、`chmod`、`chown`、`sudo`、`docker`）
- skill 声明的 `requires.env` 数量异常多（>5个）
- skill 请求与其 description 不相关的权限（如一个 "todo list" skill 请求 `SSH_KEY`）

#### Rule 3: suspicious-urls（严重度：HIGH）
- markdown body 或脚本中包含的 URL 指向已知恶意域名
- URL 使用 IP 地址而非域名
- URL 使用非标准端口
- URL 使用缩短服务（bit.ly、t.co 等）
- 包含 data: URI scheme

#### Rule 4: metadata-mismatch（严重度：MEDIUM）
- markdown body 中引用了 env var 但 frontmatter 中未声明
- markdown body 中调用了 CLI 工具但 frontmatter 中未在 bins 中声明
- frontmatter 声明了 bins 但 markdown body 中从未使用

#### Rule 5: data-exfiltration（严重度：CRITICAL）
- 指令模式匹配：读取敏感文件（~/.ssh、~/.aws、~/.env 等）+ 发送到外部
- 指令中包含 curl/wget POST 到外部 URL 的模式
- 指令中包含将文件内容编码后拼接到 URL 参数的模式

#### Rule 6: dangerous-commands（严重度：HIGH）
- 包含 `rm -rf /`、`mkfs`、`:(){ :|:& };:` 等破坏性命令
- 包含修改系统文件（/etc/、/usr/）的指令
- 包含下载并直接执行远程脚本的模式（`curl | sh`、`wget | bash`）

### CLI 接口设计

```bash
# 扫描单个 skill
clawguard scan ./my-skill/

# 扫描整个 skills 目录
clawguard scan ~/.openclaw/skills/

# JSON 输出（方便集成到 CI）
clawguard scan ./my-skill/ --json

# 只检查特定规则
clawguard scan ./my-skill/ --rules prompt-injection,data-exfiltration

# 设置最低报告严重度
clawguard scan ./my-skill/ --min-severity high

# 扫描并生成报告文件
clawguard scan ./my-skill/ --output report.json
```

### 输出格式示例

终端输出：
```
🦞 ClawGuard v0.1.0 - OpenClaw Skill Security Scanner

Scanning: ./my-skill/

  SKILL.md
  ✗ CRITICAL  prompt-injection    Line 45: Detected role-override pattern "you are now"
  ✗ HIGH      suspicious-urls     Line 23: URL uses IP address directly (192.168.1.1:8080)
  ✗ MEDIUM    metadata-mismatch   Env var GITHUB_TOKEN used in body but not declared in frontmatter
  ✓ PASS      permission-overreach
  ✓ PASS      data-exfiltration
  ✓ PASS      dangerous-commands

  helper.sh
  ✗ HIGH      dangerous-commands  Line 12: Detected curl-pipe-shell pattern

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Summary: 3 issues found (1 critical, 1 high, 1 medium)
  Status: FAIL ✗
```

### 依赖限制
尽量少用外部依赖，推荐：
- `commander` - CLI 参数解析
- `chalk` - 终端彩色输出
- `gray-matter` - 解析 YAML frontmatter
- `glob` - 文件匹配

### README 要求
README.md 应包含：
1. 一个醒目的 logo/banner（可以用 ASCII art 的龙虾 + 盾牌）
2. 一句话介绍：`Security scanner for OpenClaw skills. Protect your lobster. 🦞🛡️`
3. Quick start（npx 一行命令即可使用）
4. 支持的检测规则列表及说明
5. 如何贡献新规则
6. 与 GitHub Actions 集成的示例
7. License: MIT

### 测试要求
- 为每条规则编写测试，包含正向（应检出）和反向（不应误报）case
- 在 fixtures 中创建模拟的恶意 skill 和安全 skill
- 测试框架使用 vitest

## 风格要求
- 代码注释用英文
- commit message 风格：conventional commits
- 代码风格：严格 TypeScript，no any

## 优先级
1. 先把核心扫描引擎和 SKILL.md 解析器做好
2. 然后逐条实现检测规则，从 prompt-injection 和 data-exfiltration 开始
3. 最后做 CLI 接口和 reporter
4. 测试和 README 同步进行

## 最终目标
这个工具要能作为独立的 npm 包发布到 npm registry，也要能作为 GitHub Action 集成到 CI 流程中。名字 `clawguard` 要在 npm 上可用（请先检查）。


原始对话：
如果我以安全为切入口，比如提供skill安全保障，方案是一方面对简单项目用prompt进行检测避免注入，另一方面让skill一直运行在云端，一旦skill中某个网站指向的内容变为病毒可以及时发现，在这一步先进行商业化，在基于此推出openclaw安全发行版，您怎么看？您不要赞同我，要反对我8:21 AM

好，你让我反对，那我就直说。
这个方案有几个根本性的问题
第一，"用prompt检测注入"本身就是用锁去防撬锁的人。 Prompt injection的本质是攻击者利用模型无法可靠区分指令和数据这一缺陷。你用另一个prompt去检测，等于是用同样有这个缺陷的工具去防御这个缺陷。业界目前没有任何纯prompt方案能做到可靠防注入，这不是工程问题，是理论层面尚未解决的问题。如果你把这个作为安全卖点，一旦被绕过（几乎是必然的），你的品牌信誉会瞬间崩塌。安全产品最怕的就是给用户虚假的安全感。
第二，"skill在云端运行"直接违背了OpenClaw的核心价值主张。 OpenClaw之所以火，很大程度上就是因为它本地运行、数据不上云、用户完全掌控。你把skill搬到云端做安全监控，等于在对用户说"为了保护你的安全，请把你的数据和执行权交给我"。这跟OpenClaw社区的基因是冲突的。核心用户不会买单，而非核心用户根本不理解你在卖什么。
第三，你的商业化路径是倒着走的。 你想先卖安全服务，再推发行版。但问题是：谁是你安全服务的买家？个人用户不会为一个开源玩具的安全层付费。企业用户目前还没有大规模部署OpenClaw的场景，他们要的是端到端方案而不是一个安全插件。你相当于在一个还没成熟的生态上，做了一个更细分的产品，客户基数太小了。
第四，"网站内容变成病毒后及时发现"这个场景描述太模糊了。 你到底是在做URL信誉检测、动态沙箱分析、还是运行时行为监控？这三个方向各自都是成熟安全公司花了十几年深耕的领域。VirusTotal、CrowdStrike、Cloudflare已经在做这些事了。你一个小团队能比他们做得更好的理由是什么？如果只是简单地调用这些现有服务做个包装，那你的技术壁垒在哪里？
第五，安全作为切入口，获客成本极高。 安全是一个"不出事就觉得没价值，出了事就觉得你没用"的生意。你需要大量的信任建设——安全认证、审计报告、漏洞响应记录、行业背书。这些不是一个人或小团队短期能积累的。而且Cisco已经在公开点名OpenClaw的安全问题了，大厂很可能会自己下场做安全解决方案。
我认为更值得思考的问题
与其从安全切入，不如反过来想：OpenClaw生态里，什么东西用户真的愿意今天就付钱？安装服务已经有人在赚钱了（100-700元），但那太低端。腾讯和字节已经在做易用性层面的"发行版"了，你不太可能和他们拼资源。
你真正该问自己的是：你有什么独特的资源或能力，是这个生态里别人不具备的？是你对中国市场合规的理解？是你在某个垂直行业的经验？还是你能触达的特定用户群？从这个角度出发，比从"安全"这个宏大叙事出发更实际。但是SKEL运行的时候呢 它是 为以前有很多用户它们会从各种公开的地方下载SCALM但是它们加 时候并不一定保证 这个SKEL是安全的或者一直是安全的然后我这个方案的话它其实是把 SCEL运行在云上就是说它并不是用户的 SCEL而是一个用户从别人下载的SCEL而这个词要会一直保障它安全性 那么就给相当于他打了一个标志这种方式的话来实现 这个安全那麽所谓的安全作为切入 口虽然会不会成本极高但从另一个角度来讲其实现在社区最顶尖的那些人 可能最关注的也是安全这个问题8:23 AM我理解你的意思了——你不是要把用户自己的skill搬到云端，而是做一个经过安全审核的skill托管市场，类似于"App Store for OpenClaw skills"。用户不从野外下载未审核的skill，而是从你这里拉取经过持续安全监控的版本。

这个思路比我之前理解的要清晰得多。
但我还是要反对你，只是换一个角度。
核心矛盾：skill的本质让"持续安全"极难兑现
OpenClaw的skill本质上就是一个SKILL.md文件加上一些配置，它告诉模型"你可以用哪些工具、怎么用"。问题在于，skill的危险性往往不在文件本身，而在于它指向的外部资源和它获得的系统权限的组合。一个skill今天调用的API是安全的，明天那个API的行为变了，你怎么检测？你要做的不是静态审核，是对skill运行时行为的持续监控。这不是一个skill市场能解决的问题，这是一个运行时沙箱的问题。你的方案滑向了一个比你想象中复杂得多的技术领域。
"社区顶尖的人最关注安全"——这恰恰是问题
你说得对，核心开发者确实关注安全。但这些人恰恰是最不可能为你的方案付费的人。他们有能力自己审计skill代码，他们信任自己的判断远超过信任第三方服务。他们关注安全，是想让整个生态变安全，而不是想买一个安全产品。真正需要安全保障的是不会看代码的普通用户，但这些用户又很难理解你在卖什么、为什么值钱。
更深层的问题：你的护城河在哪里
假设你做了这个skill安全市场，获得了一些初始用户。然后会发生什么？OpenClaw官方社区或者某个大厂完全可以做一个官方的skill审核机制——就像npm有了安全审计、Chrome Web Store有了review流程。一旦官方或大厂介入，你作为第三方的价值就大幅缩水。你建立信任需要很长时间，但别人夺走你的位置可能很快。
如果你一定要做这个方向
我不是说安全方向完全不能做，而是你需要把方案再往前推一步想清楚：
你真正能卖的不是"安全认证标签"，而是一个受控的skill执行环境——类似于Docker做了什么：不是告诉你哪个软件安全，而是让不安全的软件也跑不出沙箱。如果你能提供一个轻量级的skill沙箱运行时，让skill只能访问被授权的资源、所有外部调用都经过代理和过滤，这个东西比"审核过的skill市场"有技术壁垒得多。但这也意味着你要做的工程量远大于一个商业化MVP，更像是一个需要融资才能推进的项目。
所以回到最根本的问题：你现在是想快速验证一个能赚钱的小产品，还是想做一个需要投入半年以上才能形成壁垒的平台型产品？这两条路的打法完全不同。我想的方案是一个近代和动态相结合的方 静态的话就是对于一些比较 低微的一些SCAL比如说它本身裏面有一些代码然后有一些 M0RKS0N文件然后这些里面的话可能本身就是个静态资源 然后就对它进行一次静态审核但是有一些的话 是一个动态的比如说它的SCELL里面描述了去某个网站 点击某个按钮爬去某些内容那可能这种网站的内容今天可能是安全的 可能过了几天的话就不安全了在这种情况下对这种 部交互的思考的话那么魔小 可以让它在云端一个沙箱里面用一个比较简单的模型比如说 每几分钟跑一次或者持续的跑 然后一旦说是然后并且对他的输入输入进监控一旦他输出有问题的话 那么就进行 全频的广8:24 AM


我现在完全理解你的方案了。简单概括就是：
静态层： 对skill文件本身做一次性代码审计。动态层： 对涉及外部交互的skill，在云端沙箱里用廉价模型持续运行，监控输入输出，一旦异常就发出安全警报并标记该skill。
这个方案确实比我之前理解的要合理得多。但我还是要继续反对，因为有几个实操层面的硬伤。
动态监控的成本模型算不过来
你说每几分钟跑一次。我们算一下：假设你的市场上有1000个需要动态监控的skill，每个每5分钟跑一次，一天就是28.8万次执行。即使用最便宜的模型，每次调用加上沙箱运行的算力，一天的成本可能在几百到几千美元。而你的用户是OpenClaw的个人用户，他们愿意为"这个skill是安全的"每月付多少钱？可能10-20块钱？你需要多少付费用户才能覆盖监控成本？这个单位经济模型你还没有验证。
"输出有问题"这个判断本身就是最难的部分
你打算用什么标准判断一个skill的输出"有问题"？恶意代码有明确特征可以检测，但skill的危险往往是更隐蔽的——比如一个skill正常地爬取了网页内容，但那个网页里嵌入了一段精心构造的文本，会导致LLM在后续对话中泄露用户信息。这种攻击不是在skill的输出层面能看出来的，而是在模型接收这个输出之后的行为层面才会显现。你监控的是skill的输入输出，但真正的攻击面在模型那一侧。
你在和时间赛跑但方向可能错了
OpenClaw生态变化极快，项目刚三个多月就已经有了24万星、大厂介入、官方即将转入开源基金会。安全问题确实是真痛点，但解决路径很可能不是第三方市场，而是生态内部演化出来的标准。就像npm的安全审计不是外部公司做的，是npm自己内建的；Chrome扩展的安全审查不是第三方做的，是Google做的。你赌的是官方和大厂在安全方面动作慢，给你留出窗口期。但腾讯已经在做OpenClaw产品了，他们有最大的动机做安全，因为出了事是他们的品牌风险。
如果你非要做，我建议你换一个验证路径
与其从零搭建一个skill安全市场，不如先做一件更小更快的事：写一个开源的skill静态扫描工具。就像eslint之于JavaScript、bandit之于Python。让它能扫描SKILL.md文件，检测常见的危险模式——未授权的文件系统访问、可疑的URL引用、过宽的权限声明。把这个工具免费发布到OpenClaw社区里，先建立你在安全领域的声誉和影响力。
如果这个工具被社区广泛采用，你就有了几个东西：用户基数、社区信任、对skill安全模式的深度理解。到那个时候，你再推付费的动态监控服务或安全发行版，转化率会高得多，定价也有底气。
先免费建立安全领域的话语权，再商业化。 这比直接卖安全服务的路径更慢，但成功概率高得多。你觉得呢？