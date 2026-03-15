# ClawGuard Scan Report — ClawHub High-Risk Skills Audit

> Scanned on 2026-03-15 using ClawGuard v0.1.0
> 10 skills selected from [openclaw/skills](https://github.com/openclaw/skills) based on risk indicators

## Summary

| # | Skill | CRITICAL | HIGH | MEDIUM | Total | Status |
|---|-------|----------|------|--------|-------|--------|
| 1 | ethanbeard/clwnt | 53 | 121 | 4 | **178** | FAIL |
| 2 | treadon/dead-internet | 23 | 0 | 0 | **23** | FAIL |
| 3 | phillipholland/clawstake | 19 | 0 | 0 | **19** | FAIL |
| 4 | authensor/authensor-gateway | 16 | 3 | 0 | **19** | FAIL |
| 5 | 0xpasho/rent-my-browser | 16 | 0 | 1 | **17** | FAIL |
| 6 | zscole/bagman | 9 | 0 | 0 | **9** | FAIL |
| 7 | sa9saq/secret-rotator | 9 | 0 | 0 | **9** | FAIL |
| 8 | olliewazza/larrybrain | 2 | 0 | 3 | **5** | FAIL |
| 9 | tedtalk/agent-vision-scraper | 2 | 0 | 0 | **2** | FAIL |
| 10 | mupengi-bot/auto-reply | 0 | 0 | 0 | **0** | PASS |

**9 out of 10 skills FAILED** the security scan.

---

## Detailed Findings

### 1. ethanbeard/clwnt (178 issues)

Agent social network ("ClawNet") that gives AI agents email addresses and autonomous messaging capabilities.

- **CRITICAL** `data-exfiltration` (x53): 46 instances of sending data to external `api.clwnt.com` endpoints + 7 references to credentials
- **HIGH** `suspicious-urls` (x121): All URLs on `clwnt.com` / `api.clwnt.com` trigger false positive on `t.co` substring match — this is a detection tuning issue, not a real shortener. However, the skill does send extensive data to an external API autonomously
- **HIGH** `dangerous-commands` (x1): `curl | python` remote code execution pattern (Line 933)
- **MEDIUM** `metadata-mismatch` (x4): Undeclared env vars (`CLAWNET_DIR`, `HOME`, `PARENT`, `REMOTE`)

**Risk assessment**: The skill enables agents to autonomously send messages, post content, and interact with a third-party social network. Data exfiltration risk is real — agent data flows to external servers without explicit per-action user consent.

---

### 2. treadon/dead-internet (23 issues)

Instructions for agents to curl content from `deadinternet.forum` and write to local skill directories.

- **CRITICAL** `data-exfiltration` (x23): 23 instances of `curl -d` / `curl --data` POST patterns sending data to external domains

**Risk assessment**: Skill instructs the agent to download and install arbitrary content from an external forum into the user's skill directory. Classic supply-chain attack vector.

---

### 3. phillipholland/clawstake (19 issues)

Prediction market that creates a persistent heartbeat to an external service.

- **CRITICAL** `data-exfiltration` (x19): 17 external data POST patterns + references to `~/.config` and `credentials`

**Risk assessment**: The skill establishes a C2-like heartbeat (every 15-30 min) to `clawstake.com`, sends API keys, and encourages autonomous trading decisions. Persistent external communication channel.

---

### 4. authensor/authensor-gateway (19 issues)

Man-in-the-middle control plane that intercepts all agent tool calls.

- **CRITICAL** `data-exfiltration` (x16): References to `~/.ssh`, `~/.aws`, `~/.gnupg`, `~/.config`, `.env`, `credentials`
- **HIGH** `suspicious-urls` (x1): Direct reference to `evil.com` (likely in example/documentation, but still flagged)
- **HIGH** `dangerous-commands` (x2): `curl | sh` remote code execution patterns

**Risk assessment**: Sits as middleware on every agent action, forwarding "action metadata" to an external control plane. Even if only metadata, this creates a surveillance channel for all agent behavior.

---

### 5. 0xpasho/rent-my-browser (17 issues)

Rents the user's browser to unknown third parties for automated tasks.

- **CRITICAL** `prompt-injection` (x1): "ignore previous instructions" pattern detected (Line 199)
- **CRITICAL** `data-exfiltration` (x15): 12 references to `credentials`, 2 to `.env`, 1 to `~/.ssh`
- **MEDIUM** `metadata-mismatch` (x1): Undeclared env var `RMB_BLOCKED_DOMAINS`

**Risk assessment**: Effectively a backdoor-as-a-service. Registers cron jobs, executes arbitrary goals from remote consumers, accesses credentials and SSH keys. Contains prompt injection pattern. **Extremely dangerous.**

---

### 6. zscole/bagman (9 issues)

Crypto wallet and private key management skill.

- **CRITICAL** `prompt-injection` (x2): "ignore previous instructions" + "you are now" patterns (Lines 197-198)
- **CRITICAL** `data-exfiltration` (x7): 4 references to `credentials`, 3 to `.env`

**Risk assessment**: Handles private keys and wallet credentials. Contains prompt injection patterns that could trick the agent into revealing or transferring keys. **Prompt injection + crypto keys = catastrophic risk.**

---

### 7. sa9saq/secret-rotator (9 issues)

Scans for secrets and credentials across the user's system.

- **CRITICAL** `data-exfiltration` (x9): 7 references to `.env` files, 1 to `~/.ssh/config`, 1 to `~/.config`

**Risk assessment**: By design, this skill inventories all credential locations on the system. While it claims to "never print secret values," the skill has access to read all these sensitive paths. A modified or compromised version could trivially exfiltrate everything it finds.

---

### 8. olliewazza/larrybrain (5 issues)

Third-party skill marketplace that downloads and installs arbitrary skills.

- **CRITICAL** `data-exfiltration` (x2): References to `credentials`
- **MEDIUM** `metadata-mismatch` (x3): Undeclared env vars (`LARRYBRAIN_API_KEY`, `SPOTIFY_CLIENT_ID`, `HA_TOKEN`)

**Risk assessment**: Downloads unvetted skills from `larrybrain.com` and writes them to the user's skills directory. Supply-chain attack vector — any compromised skill on LarryBrain gets installed directly.

---

### 9. tedtalk/agent-vision-scraper (2 issues)

Docker-based web scraper with stealth browser automation.

- **CRITICAL** `data-exfiltration` (x2): 2 references to `.env` files (exposes env vars via `--env-file`)

**Risk assessment**: Runs Docker containers with `--env-file .env`, potentially exposing all environment variables (including API keys and secrets) to the container. Uses Playwright stealth to bypass anti-bot detection.

---

### 10. mupengi-bot/auto-reply (0 issues)

Instagram DM auto-reply system.

- **No findings detected by static scan**

**Risk assessment**: Passed static analysis, but the skill accesses Instagram session cookies via CDP (Chrome DevTools Protocol) on port 18800. This is a runtime risk that static scanning cannot detect — exactly the kind of threat that ClawGuard Sentinel (dynamic monitoring) is designed to address.

---

## Key Observations

1. **Data exfiltration is the #1 threat**: 9 of 10 skills reference sensitive paths or send data externally
2. **Prompt injection found in 2 skills**: `rent-my-browser` and `bagman` both contain classic injection patterns — particularly dangerous when combined with credential access
3. **Supply-chain attacks**: `dead-internet` and `larrybrain` install arbitrary remote code into the user's environment
4. **False positive noted**: The `suspicious-urls` rule triggers on domains containing "t.co" as a substring (e.g., `clwnt.com` matches `t.co`). This should be fixed in a future release by matching on full domain boundaries
5. **Static analysis limits**: `mupengi-bot/auto-reply` passed all checks but has significant runtime risks (cookie extraction, WebSocket connections). This validates the need for ClawGuard Sentinel dynamic monitoring

---

*Generated by [ClawGuard](https://github.com/Frrrrrrrrank/clawguard) v0.1.0*
