# cmdAI

> Natural language → shell command. Describe what you want; get the exact command. Run it or copy to clipboard. Powered by [OpenRouter](https://openrouter.ai).

[![Node.js 18+](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

---

## Why cmdAI?

You know what you want to do: find big files, check disk usage, list something, but not the exact command. **cmdAI** is a CLI tool that turns a short description into a single, copy-paste-ready shell command. No fluff, no markdown, no backticks: just the command, plus clipboard copy and optional one-key run.

| Before | After |
|--------|--------|
| *Searching for the right `find` syntax* | `cmdai find files larger than 100MB` → `find . -type f -size +100M` |
| *Looking up `du` and `sort` options* | `cmdai show disk usage sorted by size` → `du -sh * \| sort -hr` |
| *Checking how to kill a process by name* | `cmdai kill process named node` → `pkill -f node` |
| *Figuring out line count across files* | `cmdai count lines in all Python files` → `find . -name "*.py" -exec wc -l {} +` |
| *Recalling tar flags for a backup* | `cmdai compress this folder to tar.gz` → `tar -czvf archive.tar.gz .` |

---

## Quick start

**Requirements:** Node.js 18+, [OpenRouter](https://openrouter.ai) API key.

```bash
npm install -g .
cmdai setup   # one-time: set your API key
cmdai list files in current directory
```

Output is printed and copied to the clipboard (Windows supported).

---

## Cost

The default model (`openai/gpt-4o-mini`) is more than enough for generating shell commands. At roughly **$0.00001 per request**, a **$5** credit on OpenRouter lasts a very long time (tens of thousands of queries).

---

## Installation

Global install (recommended so `cmdai` is on your PATH):

```bash
npm install -g .
```

Or from a clone:

```bash
git clone <repo-url>
cd cmd-ai
npm install -g .
```

---

## Configuration

Config is a single `.env` file per machine.

### Interactive setup (recommended)

```bash
cmdai setup
```

You’ll be prompted for your API key and optional settings. On Linux/macOS you'll also be asked whether to add the `cmd` wrapper to your shell config for one-key run.

- **OPENROUTER_API_KEY**: required ([get one](https://openrouter.ai))
- **OPENROUTER_MODEL**: optional, default: `openai/gpt-4o-mini` (sufficient for this use; very low cost per request)
- **MAX_INPUT_CHARS**: optional, default: `200`

Config is written to:

| Platform | Path |
|----------|------|
| Linux / macOS | `~/.config/cmd-ai/.env` |
| Windows | `%APPDATA%\cmd-ai\.env` |

### Manual setup

If `cmdai setup` isn’t available (e.g. headless/SSH), create the config yourself.

**Linux / macOS:**

```bash
mkdir -p ~/.config/cmd-ai
nano ~/.config/cmd-ai/.env
```

**Windows:** Create `%APPDATA%\cmd-ai` and add a `.env` file there.

**Example `.env`:**

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=openai/gpt-4o-mini
MAX_INPUT_CHARS=200
```

---

## Usage

**With arguments** (ideal for scripts and shell wrappers):

```bash
cmdai list files
cmdai disk usage
cmdai find large files
```

**Without arguments**: interactive prompt (requires a TTY):

```bash
cmdai
# Request: find all .log files modified today
```

Input is capped at **MAX_INPUT_CHARS** (default 200). The generated command is printed to stdout and copied to the clipboard when possible.

---

## Run with one key (Bash / Zsh)

On **Linux and macOS**, `cmdai setup` asks whether to add a `cmd` wrapper to your shell config (`~/.bashrc` or `~/.zshrc`). If you say yes, you can then run:

```bash
cmd list files bigger than 100mb
# → find . -type f -size +100M
# Run? [Y/n]   ← Enter to run, n to skip
```

The generated command is also added to history, so **↑ + Enter** runs it again. Open a new terminal or run `source ~/.bashrc` (or `source ~/.zshrc`) to activate.

**Manual install:** If you skipped the prompt or use a different shell, add this to your rc file:

```bash
cmd() {
  local c
  c=$(command cmdai "$*" 2>/dev/null)
  [ -z "$c" ] && return
  echo "$c"
  read -p "Run? [Y/n] " yn
  [[ "$yn" =~ ^[Nn] ]] && return
  eval "$c"
  history -s "$c"
}
```

> **⚠️ Security:** This runs AI-generated commands via `eval`. Always review the printed command before confirming.

**Windows:** No shell wrapper; use `cmdai` directly. Output is copied to the clipboard.

---

## Config reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | Yes | (none) | API key from [openrouter.ai](https://openrouter.ai) |
| `OPENROUTER_MODEL` | No | `openai/gpt-4o-mini` | OpenRouter model ID |
| `MAX_INPUT_CHARS` | No | `200` | Max length of the natural-language request |

---

## Notes

- **TTY:** With no arguments, `cmdai` reads from stdin and needs a TTY. With arguments (e.g. from the `cmd()` wrapper), no TTY is required.
- **Windows:** Install globally so `cmdai` is on PATH; clipboard copy is handled automatically.
