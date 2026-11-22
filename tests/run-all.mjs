#!/usr/bin/env node
/**
 * One command for the whole test suite:  npm run test:all
 *
 *   unit      tsx --test tests/*.test.mts
 *   sql       schema.sql + seed.sql + RLS checks in an in-memory Postgres (PGlite)
 *   browser   production build in DEMO mode, then Playwright (Python) suites phase3..phase8
 *   supabase  dev server with PLACEHOLDER Supabase env vars: API validation, fail-loudly, no-secret-leak
 *
 * Flags:  --only=unit,sql,browser,supabase   --skip-build   (reuse an existing .next demo build)
 * Env:    TEST_PORT (3100)  TEST_PORT_SB (3200)  PYTHON  CHROME_PATH (default: Playwright's Chromium)
 * Needs:  Python 3 with `pip install playwright` + `playwright install chromium`.
 * Note:   the build step overwrites ./.next (stop `npm run dev` first).
 */
import { spawn, spawnSync } from "node:child_process";
import { createWriteStream, readdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split("=")[1];
const only = (arg("only") ?? "unit,sql,browser,supabase").split(",");
const skipBuild = process.argv.includes("--skip-build");
const PORT = process.env.TEST_PORT ?? "3100";
const PORT_SB = process.env.TEST_PORT_SB ?? "3200";
const nextBin = join("node_modules", "next", "dist", "bin", "next");
const demoEnv = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "", SUPABASE_SERVICE_ROLE_KEY: "", NEXT_PUBLIC_SITE_URL: "http://localhost:" + PORT };
const results = [];

const python = process.env.PYTHON ?? ["python3", "python"].find((p) => spawnSync(p, ["--version"]).status === 0);
function step(name, cmd, args, opts = {}) {
  console.log(`\n━━ ${name}`);
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32", ...opts });
  results.push([name, r.status === 0]);
  return r.status === 0;
}
async function waitFor(url, ms = 60000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try { await fetch(url); return true; } catch { await new Promise((r) => setTimeout(r, 500)); }
  }
  return false;
}
function serve(args, env, logFile) {
  const child = spawn(process.execPath, [nextBin, ...args], { env, stdio: ["ignore", "pipe", "pipe"] });
  if (logFile) { const log = createWriteStream(logFile); child.stdout.pipe(log); child.stderr.pipe(log); }
  return child;
}

if (only.includes("unit")) step("unit tests", "npx", ["tsx", "--test", ...readdirSync("tests").filter((f) => f.endsWith(".test.mts")).map((f) => `tests/${f}`)]);
if (only.includes("sql")) step("SQL / row-level-security tests", process.execPath, ["tests/sql/rls.test.mjs"]);

if (only.includes("browser")) {
  if (!python) { console.log("Python not found — skipping browser tests (set PYTHON)."); results.push(["browser tests", false]); }
  else {
    let ok = skipBuild || step("build (demo mode)", process.execPath, [nextBin, "build"], { env: demoEnv });
    if (ok) {
      const server = serve(["start", "-p", PORT], demoEnv);
      if (!(await waitFor(`http://localhost:${PORT}/`))) { console.log("server did not start"); results.push(["start server", false]); }
      else for (const n of [3, 4, 5, 6, 7, 8]) step(`browser: phase${n}`, python, [`tests/browser/phase${n}.py`], { env: { ...process.env, BASE_URL: `http://localhost:${PORT}` } });
      server.kill();
    } else results.push(["browser tests (build failed)", false]);
  }
}

if (only.includes("supabase") && python) {
  const dir = mkdtempSync(join(tmpdir(), "threadify-"));
  const log = join(dir, "dev.log");
  const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:9", NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-anon-key", SUPABASE_SERVICE_ROLE_KEY: "fake-service-role-key-DO-NOT-LEAK" };
  const server = serve(["dev", "-p", PORT_SB], env, log);
  if (!(await waitFor(`http://localhost:${PORT_SB}/api/orders/not-a-code`, 90000))) { console.log("dev server did not start"); results.push(["supabase-mode server", false]); }
  else step("browser: Supabase-mode API checks (placeholder keys, no real DB)", python, ["tests/browser/supabase_mode.py"], { env: { ...process.env, BASE_URL: `http://localhost:${PORT_SB}`, SERVER_LOG: log } });
  server.kill();
}

console.log("\n━━ Summary");
for (const [n, ok] of results) console.log(`${ok ? "PASS" : "FAIL"}  ${n}`);
process.exit(results.every(([, ok]) => ok) ? 0 : 1);
