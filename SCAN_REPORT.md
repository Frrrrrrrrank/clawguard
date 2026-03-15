# ClawGuard Scan Report — ClawHub Security Audit

> Scanned on 2026-03-15 using ClawGuard v0.1.0
> 103 skills audited from [openclaw/skills](https://github.com/openclaw/skills)

## Executive Summary

| Metric | Value |
|--------|-------|
| **Skills scanned** | 103 |
| **Skills FAILED** | 73 (70.9%) |
| **Skills PASSED** | 30 (29.1%) |
| **Total issues** | 801 |
| **CRITICAL issues** | 520 |
| **HIGH issues** | 238 |
| **MEDIUM issues** | 43 |

**The #1 threat is data exfiltration** — skills referencing sensitive paths (~/.ssh, ~/.aws, .env, credentials) and sending data to external services via curl POST.

---

## Top 20 Most Dangerous Skills

| # | Skill | C | H | M | Total | Primary Threat |
|---|-------|---|---|---|-------|---------------|
| 1 | ethanbeard/clwnt | 53 | 121 | 4 | **178** | Mass data exfil to external API, remote code exec |
| 2 | huamu668/browser-automation-pin | 29 | 45 | 11 | **85** | 29 exfil patterns, curl\|sh, non-standard ports |
| 3 | wgan/squad-control | 21 | 0 | 17 | **38** | 19 exfil patterns, 17 undeclared env vars |
| 4 | chair4ce/swarm | 15 | 18 | 0 | **33** | 13 exfil patterns, base64 content |
| 5 | hellojun/boutnetwork | 24 | 0 | 6 | **30** | Base64 payloads, 19 .env refs, credentials |
| 6 | gitgoodordietrying/ssh-tunnel | 27 | 0 | 0 | **27** | 27 references to ~/.ssh |
| 7 | zhenstaff/swarm-orchestrator | 14 | 10 | 0 | **24** | 10 .env refs, 4 exfil patterns |
| 8 | treadon/dead-internet | 23 | 0 | 0 | **23** | 23 curl POST exfil patterns |
| 9 | hengxuz/cryptojuhequn | 5 | 18 | 0 | **23** | IP-based URLs (88.222.241.169), base64 |
| 10 | arnarsson/ssh-essentials | 22 | 0 | 0 | **22** | 22 references to ~/.ssh |
| 11 | mastersyondgy/seedstr | 21 | 0 | 0 | **21** | Credentials, ~/.config, 9 exfil patterns |
| 12 | phillipholland/clawstake | 19 | 0 | 0 | **19** | C2-like heartbeat, credentials |
| 13 | authensor/authensor-gateway | 16 | 3 | 0 | **19** | MITM on all agent actions, refs evil.com |
| 14 | imaxtomas/mcp-ssh-manager | 19 | 0 | 0 | **19** | 19 references to ~/.ssh |
| 15 | 0xpasho/rent-my-browser | 16 | 0 | 1 | **17** | Prompt injection + ~/.ssh + credentials |
| 16 | zscole/bagman | 9 | 0 | 0 | **9** | Prompt injection + crypto private keys |
| 17 | sa9saq/secret-rotator | 9 | 0 | 0 | **9** | Inventories all credential locations |
| 18 | sa9saq/ssh-manager | 9 | 0 | 0 | **9** | 9 references to ~/.ssh |
| 19 | wykings/xcrawl-scrape | 5 | 0 | 4 | **9** | .env refs, exfil patterns |
| 20 | codejika/cashapp | 8 | 0 | 0 | **8** | 4 exfil patterns + credentials |

---

## Threat Distribution

### By Rule

| Rule | Findings | % |
|------|----------|---|
| `data-exfiltration` | 482 | 60.2% |
| `suspicious-urls` | 223 | 27.8% |
| `prompt-injection` | 25 | 3.1% |
| `metadata-mismatch` | 43 | 5.4% |
| `dangerous-commands` | 22 | 2.7% |
| `permission-overreach` | 6 | 0.7% |

### By Category

| Category | Skills Affected | Examples |
|----------|----------------|----------|
| **Sensitive file access** | 35+ | ~/.ssh, ~/.aws, .env, credentials |
| **External data sending** | 25+ | curl POST to third-party APIs |
| **SSH key exposure** | 12 | Skills that read/manage SSH keys |
| **Crypto/financial** | 10+ | Private keys, wallets, payment APIs |
| **Supply chain** | 3 | Downloads & installs remote code |
| **Prompt injection** | 3 | "ignore previous instructions", role switching |
| **IP-based URLs** | 3 | Direct IP addresses instead of domains |
| **Remote code exec** | 4 | curl\|sh, curl\|python patterns |

---

## Detailed Findings — Batch 1 (Initial 10)

### 1. ethanbeard/clwnt (178 issues)
Agent social network enabling autonomous messaging to external `api.clwnt.com`.
- **CRITICAL** `data-exfiltration` (x53): 46 external POST patterns + 7 credential references
- **HIGH** `suspicious-urls` (x121): URLs on `clwnt.com` (false positive on `t.co` substring — noted for fix)
- **HIGH** `dangerous-commands` (x1): `curl | python` remote code execution

### 2. treadon/dead-internet (23 issues)
Downloads content from `deadinternet.forum` and writes to local skill directories.
- **CRITICAL** `data-exfiltration` (x23): curl POST to external domains — supply chain attack vector

### 3. phillipholland/clawstake (19 issues)
Prediction market with persistent C2-like heartbeat to `clawstake.com`.
- **CRITICAL** `data-exfiltration` (x19): External POST + `~/.config` + credentials

### 4. authensor/authensor-gateway (19 issues)
Man-in-the-middle intercepting all agent tool calls.
- **CRITICAL** `data-exfiltration` (x16): ~/.ssh, ~/.aws, ~/.gnupg, .env, credentials
- **HIGH** `suspicious-urls`: References `evil.com`
- **HIGH** `dangerous-commands` (x2): `curl | sh`

### 5. 0xpasho/rent-my-browser (17 issues)
Rents user's browser to unknown third parties.
- **CRITICAL** `prompt-injection`: "ignore previous instructions"
- **CRITICAL** `data-exfiltration` (x15): credentials, .env, ~/.ssh

### 6. zscole/bagman (9 issues)
Crypto wallet/private key management with prompt injection.
- **CRITICAL** `prompt-injection` (x2): "ignore previous instructions" + "you are now"
- **CRITICAL** `data-exfiltration` (x7): credentials, .env

### 7. sa9saq/secret-rotator (9 issues)
System-wide credential inventory scanner.
- **CRITICAL** `data-exfiltration` (x9): .env (x7), ~/.ssh, ~/.config

### 8. olliewazza/larrybrain (5 issues)
Third-party skill marketplace — installs unvetted remote skills.
- **CRITICAL** `data-exfiltration` (x2): credentials
- **MEDIUM** `metadata-mismatch` (x3): undeclared env vars

### 9. tedtalk/agent-vision-scraper (2 issues)
Docker scraper exposing env vars via `--env-file .env`.
- **CRITICAL** `data-exfiltration` (x2): .env references

### 10. mupengi-bot/auto-reply (0 issues)
Instagram auto-reply — **passed static scan** but has runtime risks (CDP cookie extraction).

---

## Detailed Findings — Batch 2 (90 additional skills)

### 11. huamu668/browser-automation-pin (85 issues)
Browser automation with PIN-based login workflows.
- **CRITICAL** `data-exfiltration` (x29): Massive external POST patterns
- **HIGH** `suspicious-urls` (x45): Non-standard port localhost:9867
- **HIGH** `dangerous-commands`: curl | sh
- **MEDIUM** `metadata-mismatch` (x11): Many undeclared env vars

### 12. wgan/squad-control (38 issues)
Multi-agent squad orchestration framework.
- **CRITICAL** `data-exfiltration` (x21): 19 exfil patterns + credentials
- **MEDIUM** `metadata-mismatch` (x17): 17 undeclared env vars

### 13. chair4ce/swarm (33 issues)
Multi-agent swarm with local API server.
- **CRITICAL** `data-exfiltration` (x14): 13 POST patterns + ~/.config
- **HIGH** `suspicious-urls` (x18): Non-standard port localhost:9999
- **CRITICAL** `prompt-injection`: base64 encoded content

### 14. hellojun/boutnetwork (30 issues)
Blockchain agent network.
- **CRITICAL** `prompt-injection` (x4): base64 payloads
- **CRITICAL** `data-exfiltration` (x20): 19 .env refs + credentials
- **MEDIUM** `metadata-mismatch` (x6): Wallet/API key env vars undeclared

### 15. gitgoodordietrying/ssh-tunnel (27 issues)
- **CRITICAL** `data-exfiltration` (x27): All ~/.ssh references

### 16. zhenstaff/swarm-orchestrator (24 issues)
- **CRITICAL** `data-exfiltration` (x14): .env (x10) + 4 exfil patterns
- **HIGH** `suspicious-urls` (x10): localhost:3000

### 17. hengxuz/cryptojuhequn (23 issues)
Crypto community skill pointing to bare IP address.
- **CRITICAL** `prompt-injection` (x5): base64 encoded content
- **HIGH** `suspicious-urls` (x18): All URLs use IP `88.222.241.169` directly

### 18. mastersyondgy/seedstr (21 issues)
- **CRITICAL** `data-exfiltration` (x21): credentials (x7), ~/.config (x5), 9 exfil patterns

### 19. arnarsson/ssh-essentials (22 issues)
- **CRITICAL** `data-exfiltration` (x22): All ~/.ssh references

### 20. imaxtomas/mcp-ssh-manager (19 issues)
- **CRITICAL** `data-exfiltration` (x19): All ~/.ssh references

### 21–30. codejika/* series (multiple payment/commerce skills)
`codejika/shop`, `codejika/usd`, `codejika/cart`, `codejika/btc`, `codejika/metamask`, `codejika/authorize`, `codejika/adyen`, `codejika/replit`, `codejika/cashapp` — all share the same pattern:
- **CRITICAL** `data-exfiltration` (x2–8): curl POST + credentials
- **MEDIUM** `metadata-mismatch`: Undeclared `CREDITCLAW_API_KEY`
- **Note**: These appear to be from the same author with a consistent payment integration pattern

### 31–35. jononovo/* series (financial/commerce skills)
`jononovo/jpmorgan`, `jononovo/chase`, `jononovo/fb`, `jononovo/checkout`, `jononovo/cash` — similar pattern:
- **CRITICAL** `data-exfiltration` (x2–6): curl POST patterns
- **MEDIUM** `metadata-mismatch`: Undeclared `CREDITCLAW_API_KEY`

### 36–40. Other notable findings

| Skill | Issues | Key Risk |
|-------|--------|----------|
| sa9saq/ssh-manager | 9 | 9 ~/.ssh references |
| derick001/ssh-config-manager | 8 | 8 ~/.ssh references |
| rhesketh/monzo | 7 | Banking credentials + .env |
| moodykong/ssh-op | 6 | .env + ~/.ssh |
| sterdam/solclaw | 6 | Base64 + ~/.config |
| xiaoyinqu/browser-automation-pro | 5 | 4 exfil patterns |
| saba-ch/cloak | 4 | Exfil + .env |
| enderfga/ssh-lab | 4 | ~/.ssh + ~/.config |
| revisual-ai/faceswap | 4 | 3 exfil patterns |
| phy041/twitter-scrape | 3 | .env references |
| eyhn/botauth | 3 | Credentials + .env |
| ant-1984/send-token | 3 | Base64 + credentials |
| arulmozhiv/facebook-scraper | 3 | Proxy on non-standard port + credentials |
| arulmozhiv/instagram-scraper | 3 | Proxy on non-standard port + credentials |
| xiaoyinqu/browser-agent-cloud-scraper | 4 | curl\|sh + exfil |

---

## Passed Skills (30 total)

The following skills passed all static checks:

`mupengi-bot/auto-reply`, `youpele52/website-scraper-pro`, `yinanping-cpu/yinan-web-scraper`, `xejrax/docker-ctl`, `wulf715/opsecmd`, `walniek/astra-docker`, `rupertnt034/rupert-web-scraper`, `qsobad/ssh-vault`, `offlinecat-dev/ssh-agentd-control`, `mariusfit/smart-web-scraper`, `mkrdiop/moltbot-docker`, `lycohana/ssh`, `lxgicstudios/docker-compose-gen`, `kexu9/pinterest-scraper`, `jononovo/state-farm`, `jononovo/dell`, `jiafar/deep-scraper-amazon`, `jiafar/amazon-scraper`, `ivangdavila/scrape`, `imkiiki/fundreport-scrape`, `is-the-king/ssh-netmiko`, `horsley/cmb-fx`, `hacklyc/download-anything`, `gztanht/token-shark`, `codejika/sale`, `btcagentic/raydium`, `amos144/zerotoken`, `5kbpers/sg-property-scraper`, `0x5446/ohmytoken`, `jononovo/worldcup`*

*\* `jononovo/worldcup` passed main rules but contains base64 (1 finding — may be false positive for legitimate encoded data)*

---

## Known False Positives & Improvement Areas

1. **`suspicious-urls` substring matching**: `clwnt.com` triggers `t.co` shortener detection. Fix: match on full domain boundaries
2. **`data-exfiltration` sensitivity**: `.env` references in documentation context (e.g., "create a `.env` file") trigger false positives. Fix: distinguish between instructional references and operational access
3. **localhost URLs**: Many skills use `localhost:PORT` for local services — these are flagged but are generally safe. Consider adding a `--allow-localhost` flag
4. **base64 in legitimate contexts**: Some skills use base64 for image data or encoding examples. Need contextual analysis

## Conclusions

1. **70.9% of audited skills failed** the security scan — the ClawHub ecosystem has significant security gaps
2. **Data exfiltration is the dominant threat** (60.2% of all findings), primarily through sensitive file access and external POST patterns
3. **SSH key exposure is endemic** — 12 skills reference ~/.ssh extensively
4. **Payment/crypto skills cluster** — `codejika/*` and `jononovo/*` series share patterns suggesting template-based skill generation with consistent security concerns
5. **3 skills contain prompt injection** — `rent-my-browser`, `bagman`, and the `dead-internet` family are the most dangerous combination of social engineering + data access
6. **Static analysis has clear limits** — `mupengi-bot/auto-reply` passed all checks but has runtime cookie extraction risks, validating the need for ClawGuard Sentinel dynamic monitoring

---

*Generated by [ClawGuard](https://github.com/Frrrrrrrrank/clawguard) v0.1.0*
