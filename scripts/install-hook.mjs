#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync } from "node:fs";
try { execFileSync("git", ["rev-parse", "--is-inside-work-tree"], { stdio: "ignore" }); }
catch { console.error("✗ Run this inside a git repository."); process.exit(1); }
execFileSync("git", ["config", "core.hooksPath", ".githooks"]);
try { if (existsSync(".githooks/pre-push")) chmodSync(".githooks/pre-push", 0o755); } catch {}
console.log("✓ pre-push hook installed (git core.hooksPath → .githooks). Pushes now refresh pm-sync.json.");
