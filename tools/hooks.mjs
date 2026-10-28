// The process's hooks (lane-process-redesign/DESIGN.md §2.5; Bob, K5326). Registered by each role's skill frontmatter
// (`proc shims`), so no settings file changes (bio K1702). Claude Code passes the event as JSON on stdin; this script
// always exits 0 and answers in JSON: a PreToolUse refusal as `permissionDecision: "deny"`, a Stop refusal as
// `decision: "block"`. The role's context is `.git/civicos-role.json` (written by `proc takeover` or `proc job start`).
//   node tools/hooks.mjs <bob|job> <pre|stop>
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { repo, readRole, unpushed, modules, parsePlan, parseRecord, status, jobPrompt, PLAN, recordPath, jobBranch, trancheBranch } from './proc.mjs';

const REMOTE = 'mcp__claude-code-remote__';
const FORCE = /\bgit\b[^|;&]*\bpush\b[^|;&]*(\s(-f|--force|--force-with-lease|--mirror|--delete|-d)\b|\s\+\S+|\s:\S)/;
const PUSH = /\bgit\b[^|;&]*\bpush\b([^|;&]*)/;
// Shell redirections (`2>&1`, `&>f`, `>f`, `>>f`, `2>f`, `<f`) are not refs: removed before the push is read.
const REDIRECT = /(\d*>>?&\d+-?|&>>?\s*[^\s|;&]+|\d*>>?\s*[^\s|;&]+|<+\s*[^\s|;&]+)/g;

// A session titled "<WORD> #n" is a job's only when the word names a module; a lane's successor (PROCESS-REDESIGN #3)
// is not (lane R12). When the module list cannot be read or is empty, every such title is judged a job's: the hook fails closed.
function isModule(m, ctx) {
  try { const all = modules(repo(join(ctx.root, ctx.product || '.'))); return !all.length || all.some((x) => x.id === m); } catch { return true; }
}

// The product's repository, "owner/name" in lower case, from its origin; null when it cannot be read.
function productRepo(ctx) {
  try { return execFileSync('git', ['-C', join(ctx.root, ctx.product || '.'), 'remote', 'get-url', 'origin'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().replace(/\.git$/, '').split(/[/:]/).slice(-2).join('/').toLowerCase(); } catch { return null; }
}

// The reason a tool call is refused, or null. `ctx` = { role, tranche, module, session, plan (text), root }.
export function preReason(role, input, ctx) {
  const tool = input.tool_name || '', ti = input.tool_input || {};
  if (tool === 'Bash') {
    const c = String(ti.command || '').replace(REDIRECT, ' ');
    if (FORCE.test(c)) return 'a force push, mirror or remote delete is never done (standing safety rule)';
    const push = c.match(PUSH);
    if (push && /(^|\s|:)(refs\/heads\/)?main(\s|$)/.test(push[1])) return 'nothing is pushed to main: the tranche reaches main only by its close PR (mechanics §4, §5.7)';
    if (role === 'job' && push && ctx.tranche) {
      const mine = jobBranch(ctx.tranche, ctx.module);
      const refs = push[1].trim().split(/\s+/).filter((w) => w && !w.startsWith('-') && w !== 'origin');
      if (refs.some((r) => !r.split(':').pop().replace(/^refs\/heads\//, '').startsWith(mine))) return `a job pushes only its own branch, ${mine}`;
    }
    if (role === 'bob' && /\bgit\b[^|;&]*\bmerge\b[^|;&]*\bjob\//.test(c)) return 'a job is merged only by `node tools/proc.mjs merge --module <m>`, which runs every gate (mechanics §5.5)';
    return null;
  }
  if (role === 'job' && [`${REMOTE}create_session`, `${REMOTE}create_trigger`, `${REMOTE}fire_trigger`, `${REMOTE}send_later`].includes(tool)) return 'a job starts no session and arms no timer (mechanics §5.11)';
  if (role === 'bob') {
    if (tool === `${REMOTE}fire_trigger`) return 'never fire a routine to reach a session: send a message (DESIGN §2.3)';
    if (tool === `${REMOTE}create_trigger` && ti.persistent_session_id !== ctx.session) return 'BOB arms only its own backstop; a job is reached by send_message, never by a routine (DESIGN §2.3, §2.7)';
    const m = /^[A-Z][A-Z0-9-]* #\d+$/.test(ti.title || '') && !/^BOB /.test(ti.title) ? ti.title.split(' #')[0].toLowerCase() : null;
    if (tool === `${REMOTE}create_session` && m && isModule(m, ctx)) {
      const p = parsePlan(ctx.plan);
      if (!p.owed.includes(`start ${m}`)) return `no start is owed for ${m}: run \`proc layer start\` or \`proc job route\` first, and use the call it prints`;
      if (ti.source_revision !== jobBranch(ctx.tranche, m)) return `${m}'s session starts on ${jobBranch(ctx.tranche, m)}`;
      if (ti.prompt !== jobPrompt(m, ctx.tranche, { product: ctx.product })) return 'use the prompt `proc` printed, unchanged';
    }
    // Only the product's own PRs wait for the close; a process-repository PR is BOB's to merge (bio K5137), so a
    // certified process fix can land mid-round (bio K5345). A PR whose repository is not named is judged the product's.
    if (/merge_pull_request$/.test(tool) && parsePlan(ctx.plan).state !== 'CLOSING' && !(ti.owner && ti.repo && productRepo(ctx) && `${ti.owner}/${ti.repo}`.toLowerCase() !== productRepo(ctx))) return 'a product PR is merged only at the tranche close, once the plan reads CLOSING (mechanics §5.7)';
  }
  return null;
}

// The reason a turn may not end, or null.
export function stopReason(role, ctx) {
  if (!ctx.tranche) return role === 'job' ? 'run `node tools/proc.mjs job start …` first (your START names the command)' : 'run `node tools/proc.mjs takeover …` first';
  const R = repo(join(ctx.root, ctx.product || '.'));
  const why = unpushed(R);
  if (role === 'job') {
    const rec = parseRecord(R.read(recordPath(ctx.tranche, ctx.module)));
    if (rec?.state === 'WORKING') why.push('your record reads WORKING: finish the step, or set the wait you end on (`proc job state --set "WAITING: …"`), or run `proc job complete`');
  } else {
    const st = status({ product: join(ctx.root, ctx.product || '.'), tranche: ctx.tranche });
    why.push(...st.gate.filter((g) => g.startsWith('owed: ')));
    // P19, bio K5722: no job live and a layer of the open round still OPEN is work BOB must start, unless it records a wait only Bob can clear.
    const p = parsePlan(ctx.plan);
    if (!why.length && p.state === 'OPEN' && !p.jobs.length && !p.waiting && p.layers.some((l) => l.state === 'OPEN')) why.push('a layer is open and no job is live: start the next layer now (P19, bio K5722), or record the one act only Bob can take with proc bob waiting');
  }
  return why.length ? why.join('; ') : null;
}

function main() {
  const [role, ev] = process.argv.slice(2);
  let input = {}; try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { /* empty */ }
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const r = readRole(root) || {};
  const ctx = { ...r, root, plan: r.tranche ? (() => { try { return readFileSync(join(root, r.product || '.', PLAN), 'utf8'); } catch { return ''; } })() : '' };
  if (ev === 'pre') {
    const why = preReason(role, input, ctx);
    if (why) console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: `PROCESS: ${why}` } }));
    return;
  }
  if (ev === 'stop') {
    let why = null; try { why = stopReason(role, ctx); } catch (e) { why = `the stop check failed (${e.message}); fix the cause`; }
    // The same refusal three times in a row lets the turn end, so a cause the session cannot clear never loops.
    const f = join(root, '.git', 'civicos-stop.json');
    const last = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {};
    const n = why && last.why === why ? last.n + 1 : 1;
    try { writeFileSync(f, JSON.stringify({ why, n })); } catch { /* not a git checkout */ }
    if (why && n <= 3) console.log(JSON.stringify({ decision: 'block', reason: `PROCESS: ${why}` }));
  }
}
if (import.meta.url === `file://${process.argv[1]}`) main();
