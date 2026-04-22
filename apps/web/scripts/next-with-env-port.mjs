import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootEnvPath = resolve(scriptDir, "../../..", ".env");
const command = process.argv[2];

if (!["dev", "start"].includes(command)) {
  console.error("Usage: node scripts/next-with-env-port.mjs <dev|start>");
  process.exit(1);
}

if (existsSync(rootEnvPath)) {
  const envFile = readFileSync(rootEnvPath, "utf8");

  for (const line of envFile.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();

    if (key && process.env[key] === undefined) {
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  }
}

const port = process.env.WEB_PORT || "5000";

if (!/^\d+$/.test(port)) {
  console.error(`WEB_PORT must be a number. Received: ${port}`);
  process.exit(1);
}

const nextCommand = process.platform === "win32" ? "next.cmd" : "next";
const child = spawn(nextCommand, [command, "-p", port], {
  env: process.env,
  shell: false,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  }

  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});
