# cmdAI

Natural language → shell command. Describe what you want; get the exact command. Run it or copy to clipboard. Powered by [OpenRouter](https://openrouter.ai).


## What is cmdAI?

You know what you want to do: find big files, check disk usage, list something, but not the exact command. **cmdAI** is a CLI tool that turns a short description into a single, copy-paste-ready shell command. No fluff, no markdown, no backticks: just the command, plus clipboard copy and optional one-key run.

| Before | After |
|--------|--------|
| *Searching for the right `find` syntax* | `cmdai find files larger than 100MB` → `find . -type f -size +100M` |
| *Looking up `du` and `sort` options* | `cmdai show disk usage sorted by size` → `du -sh * \| sort -hr` |
| *Checking how to kill a process by name* | `cmdai kill process named node` → `pkill -f node` |
| *Figuring out line count across files* | `cmdai count lines in all Python files` → `find . -name "*.py" -exec wc -l {} +` |
| *Recalling tar flags for a backup* | `cmdai compress this folder to tar.gz` → `tar -czvf archive.tar.gz .` |

## Installation

**Requirements:** Node.js 18+, [OpenRouter](https://openrouter.ai) API key.


### Option 1 - from GitHub (no clone)

```bash
npm install -g github:ozerozdogan/cmdai
```

### Option 2 - from a clone

```bash
git clone https://github.com/ozerozdogan/cmdai.git
cd cmdai
npm install -g .
```

After installing:

- Run `cmdai setup` once to configure your API key.

## Configuration

### Interactive setup (recommended)

```bash
cmdai setup
```

- You'll be prompted for your API key and optional settings.
- On Linux/macOS you'll also be asked whether to add the `cmdai` one-key run wrapper to your shell config.

**Env vars:**

- **OPENROUTER_API_KEY**: required ([get one](https://openrouter.ai))
- **OPENROUTER_MODEL**: optional, default: `openai/gpt-4o-mini` (sufficient for this use; very low cost per request)
- **MAX_INPUT_CHARS**: optional, default: `200` (max length for the request input)

**Config file location:**

| Platform | Path |
|----------|------|
| Linux / macOS | `~/.config/cmdai/.env` |
| Windows | `%APPDATA%\cmdai\.env` |

---

### Manual setup

If `cmdai setup` isn't available (e.g. headless/SSH), create the config yourself:

- **Linux / macOS:**

  ```bash
  mkdir -p ~/.config/cmdai
  nano ~/.config/cmdai/.env
  ```

- **Windows:** Create `%APPDATA%\cmdai` and add a `.env` file there.

- **Example `.env`:**

  ```env
  OPENROUTER_API_KEY=sk-or-v1-your-key-here
  OPENROUTER_MODEL=openai/gpt-4o-mini
  MAX_INPUT_CHARS=200
  ```

## Run with one key (Bash / Zsh)

- On **Linux and macOS**, `cmdai setup` asks whether to add a `cmdai` one-key run wrapper to your shell config (`~/.bashrc` or `~/.zshrc`).
- If you say yes, you can then run:

  ```bash
  cmdai list files bigger than 100mb
  # → find . -type f -size +100M
  # Run? [Y/n]   ← Enter to run, n to skip
  ```

- The generated command is also added to history, so **↑ + Enter** runs it again.
- To get only the command (no prompt, copy to clipboard): run `command cmdai ...` to call the CLI directly.
- If the wrapper isn't active, run `source ~/.bashrc` (or `source ~/.zshrc`) or open a new terminal.
- **Windows:** No shell wrapper; use `cmdai` directly. Output is copied to the clipboard.

---

### Manual install

If you skipped the prompt or use a different shell, add this to your rc file:

```bash
cmdai() {
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

## Cost

- The default model (`openai/gpt-4o-mini`) is more than enough for generating shell commands.
- At roughly **$0.00001 per request**, a **$5** credit on OpenRouter lasts a very long time (tens of thousands of queries).

## Usage

### With arguments (ideal for scripts and shell wrappers)

```bash
cmdai list files
cmdai disk usage
cmdai find large files
```

---

### Without arguments - interactive prompt (requires a TTY)

```bash
cmdai
# Request: find all .log files modified today
```
