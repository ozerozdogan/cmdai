#!/usr/bin/env node

const path = require("path");
const os = require("os");
const fs = require("fs");
const { spawnSync } = require("child_process");

function getConfigDir() {
  if (process.platform === "win32") {
    const base = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    return path.join(base, "cmdai");
  }
  return path.join(os.homedir(), ".config", "cmdai");
}

// Load config from system config dir (set via "cmdai setup")
require("dotenv").config({ path: path.join(getConfigDir(), ".env"), quiet: true });

const axios = require("axios");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
const MAX_INPUT_CHARS = Math.max(1, parseInt(process.env.MAX_INPUT_CHARS, 10) || 200);

function ask(question) {
  return new Promise((resolve) => {
    const readline = require("readline");
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (line) => {
      rl.close();
      resolve((line || "").trim());
    });
  });
}

function readStdin() {
  return ask("Request: ");
}

async function runSetup() {
  const configDir = getConfigDir();
  fs.mkdirSync(configDir, { recursive: true });
  const envPath = path.join(configDir, ".env");

  console.log("Configure cmdAI (config will be saved to " + envPath + ")\n");

  const key = await ask("OPENROUTER_API_KEY: ");
  if (!key) {
    console.error("OPENROUTER_API_KEY is required.");
    process.exit(1);
  }

  const model = await ask("OPENROUTER_MODEL (default openai/gpt-4o-mini, press Enter to skip): ");
  const modelLine = model === "" ? "" : "OPENROUTER_MODEL=" + model + "\n";

  const maxChars = await ask("MAX_INPUT_CHARS (default 200, press Enter to skip): ");
  const maxCharsLine =
    maxChars === "" ? "" : "MAX_INPUT_CHARS=" + (Math.max(1, parseInt(maxChars, 10)) || 200) + "\n";

  const content = "OPENROUTER_API_KEY=" + key + "\n" + modelLine + maxCharsLine;
  fs.writeFileSync(envPath, content, "utf8");
  console.log("\nConfig written to " + envPath);

  if (process.platform !== "win32") {
    const shell = process.env.SHELL || "";
    const rcPath = shell.includes("zsh")
      ? path.join(os.homedir(), ".zshrc")
      : path.join(os.homedir(), ".bashrc");
    const rcContent = fs.existsSync(rcPath) ? fs.readFileSync(rcPath, "utf8") : "";
    const alreadyHas = /# --- cmdAI: one-key run/.test(rcContent) || (/cmd\(\)\s*\{/.test(rcContent) && rcContent.includes("cmdai"));
    if (!alreadyHas) {
      const add = await ask("\nAdd 'cmd' wrapper to your shell config for one-key run? [Y/n]: ");
      if (add !== "n" && add !== "N") {
        const block =
          "\n# --- cmdAI: one-key run wrapper (added by cmdai setup)\n" +
          "cmd() {\n" +
          "  local c\n" +
          "  c=$(command cmdai \"$*\" 2>/dev/null)\n" +
          "  [ -z \"$c\" ] && return\n" +
          "  echo \"$c\"\n" +
          "  read -p \"Run? [Y/n] \" yn\n" +
          "  [[ \"$yn\" =~ ^[Nn] ]] && return\n" +
          "  eval \"$c\"\n" +
          "  history -s \"$c\"\n" +
          "}\n" +
          "# --- end cmdAI ---\n";
        fs.appendFileSync(rcPath, block, "utf8");
        console.log("Added to " + rcPath + ".");
        const activate = await ask("Start a new shell with 'cmd' available now? [Y/n]: ");
        if (activate !== "n" && activate !== "N") {
          const shell = process.env.SHELL || "/bin/bash";
          spawnSync(shell, ["-i"], { stdio: "inherit", shell: false });
        } else {
          console.log("Run: source " + rcPath + " (or open a new terminal).");
        }
      }
    }
  }
}

if (process.argv[2] === "setup" || process.argv[2] === "--setup") {
  runSetup()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err.message || err);
      process.exit(1);
    });
} else if (!OPENROUTER_API_KEY) {
  console.error("Error: OPENROUTER_API_KEY is not set.");
  console.error("Run: cmdai setup");
  process.exit(1);
} else {
  (async () => {
  let userInput = process.argv.slice(2).join(" ").trim();
  if (!userInput) {
    if (!process.stdin.isTTY) {
      console.error("Error: No arguments provided and stdin is not a TTY. Pass your request as arguments.");
      process.exit(1);
    }
    userInput = await readStdin();
  }
  if (!userInput) process.exit(1);

  if (userInput.length > MAX_INPUT_CHARS) {
    console.error(`Error: Input exceeds ${MAX_INPUT_CHARS} characters (got ${userInput.length}).`);
    process.exit(1);
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a terminal command generator. Return ONLY a single-line command. Do nothing else: no explanation, no markdown, no backticks, no extra lines. Never add commentary or multiple commands."
          },
          {
            role: "user",
            content: userInput
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 15000
      }
    );

    const raw = response.data?.choices?.[0]?.message?.content;
    if (!raw) {
      console.error("Error: No command in API response.", response.data);
      process.exit(1);
    }
    const command = raw.replace(/^`+|`+$/g, "").trim().split(/\r?\n/)[0].trim();

    let copied = false;
    try {
      const { default: clipboardy } = await import("clipboardy");
      clipboardy.writeSync(command);
      copied = true;
    } catch (_) {}
    if (!copied && process.platform === "win32") {
      spawnSync("clip", [], { input: command, windowsHide: true });
    }
    process.stdout.write(command + "\n");
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.response?.data || err.message;
    console.error("Error:", typeof msg === "object" ? JSON.stringify(msg, null, 2) : msg);
    process.exit(1);
  }
  })();
}
