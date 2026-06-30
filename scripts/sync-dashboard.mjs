#!/usr/bin/env node
/**
 * sync-dashboard.mjs — write this project's git/gh status to pm-sync.json.
 *
 * Usage:
 *   npm run sync                     # auto-detects project code from repo
 *   npm run sync -- --code "SWTM-W"  # set/override the dashboard project code
 *
 * Output: pm-sync.json — a small per-project file you Import into the dashboard.
 * Importing MERGES into the matching project (matched by repo, then code), so it
 * never disturbs your other projects. Requires git; gh CLI is optional (issues).
 * It only writes the deterministic Git fields — tasks/phases stay yours.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { basename } from "node:path";

const args = process.argv.slice(2);
const arg = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const OUT = arg("--out", "pm-sync.json");
let CODE = arg("--code", process.env.PROJECT_CODE || null);

const sh = (c, a) => { try { return execFileSync(c, a, { encoding: "utf8" }).trim(); } catch { return null; } };
const slug = (r) => {
  if (!r) return "";
  const m = String(r).match(/github\.com[/:]+([^/\s]+\/[^/\s#?]+)/i);
  return (m ? m[1] : String(r)).replace(/\.git$/, "").replace(/^https?:\/\//, "");
};

const sha = sh("git", ["log", "-1", "--format=%h"]);
if (!sha) { console.error("✗ Not a git repo, or no commits yet."); process.exit(1); }
const subject = sh("git", ["log", "-1", "--format=%s"]) || "";
const date = sh("git", ["log", "-1", "--format=%cI"]) || new Date().toISOString();
const repo = slug(sh("git", ["remote", "get-url", "origin"]));

let openIssues = null;
if (sh("gh", ["--version"])) {
  const n = sh("gh", ["issue", "list", "--state", "open", "--limit", "1000", "--json", "number", "--jq", "length"]);
  if (n !== null && n !== "") openIssues = Number(n);
  else console.warn("• gh present but couldn't read issues — leaving the count unchanged.");
} else {
  console.warn("• gh CLI not found — skipping open-issue count (install: https://cli.github.com).");
}

let prev = {};
if (existsSync(OUT)) { try { prev = JSON.parse(readFileSync(OUT, "utf8")); } catch { /* ignore */ } }
if (!CODE) CODE = prev.code || (repo ? repo.split("/").pop() : null) || basename(process.cwd());

const out = {
  type: "pm-sync",
  code: CODE,
  name: prev.name || CODE,
  repo: repo || prev.repo || "",
  lastCommit: `${sha} · ${subject}`,
  lastCommitDate: date,
  openIssues: openIssues !== null ? openIssues : (prev.openIssues != null ? prev.openIssues : null),
  lastSync: new Date().toISOString()
};
writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");

console.log(`✓ Wrote ${OUT} for "${out.code}"`);
console.log(`  last commit : ${out.lastCommit}`);
console.log(`  open issues : ${out.openIssues != null ? out.openIssues : "(none yet / gh off)"}`);
console.log(`  repo        : ${out.repo || "(no origin remote)"}`);
console.log(`\nNext → in the dashboard click Import → ${OUT} (it merges into the matching project).`);
