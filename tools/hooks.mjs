// neoProcess's hooks (PROTOCOL §9, JOB-LIFE §11, SESSIONS §1a; rulebook SES 1, 3, 6, 8). Registered by the one skill
// `neoprocess`, whose argument is the role; the hooks read the role from `.git/proc-role.json`, written by the start
// commands (`proc takeover`, `proc job start`, `proc lane start`; `proc process start` for the neoProcess lane), and refuse every act until one is recorded, so the role
// is set by the record and never by which skill was invoked. Claude Code passes the event as JSON on stdin; this script
// always exits 0 and answers in JSON: a PreToolUse refusal as `permissionDecision: "deny"` (a pre-approved act of the
// act table as `"allow"`, PERMISSIONS §8.6), a Stop refusal as
// `decision: "block"`. What it refuses is what must never happen (code, P16); what a goal sends a session back for is text.
//   node tools/hooks.mjs <pre|stop>
// Pushes: a job pushes only `job/<m>`, a lane only `tranche`, BOB `tranche` (its prepared files, P18); nobody pushes
// `main` or a `state/*` branch by hand (the tool writes the state branch by plumbing). JOB-LIFE §4's "any push to the
// tranche branch" is read as: a job's work reaches `tranche` only through the queue; BOB's hand merge of a job branch,
// `gh pr merge` and the merge tool are refused but for the call `proc merge` printed, so no push of BOB's can carry a job around the gate.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { repo, readRole, unpushed, status, addr, parsePlan, parseJob, stateRead, jobSession, laneSession, jobBranch, jobFiles, lanes, refusalsOf, TRANCHE } from './proc.mjs';
import { stepsReason, lastAssistantText } from './lib.mjs';   // P20: steps for Bob verified against their source (`proc steps`)

const REMOTE = 'mcp__claude-code-remote__', GH = 'mcp__github__';
const FORCE = /\bgit\b[^|;&]*\bpush\b[^|;&]*(\s(-f|--force|--force-with-lease|--mirror|--delete|-d)\b|\s\+\S+|\s:\S)/;
const PUSH = /\bgit\b[^|;&]*\bpush\b([^|;&]*)/;
const REDIRECT = /(\d*>>?&\d+-?|&>>?\s*[^\s|;&]+|\d*>>?\s*[^\s|;&]+|<+\s*[^\s|;&]+)/g;
// A hand merge, tag, branch, reset, rebase or pull request from a state branch (PROTOCOL §7d).
const STATE_REF = /\bgit\b[^|;&]*\b(merge|tag|branch|checkout|switch|worktree|rebase|cherry-pick|reset|pull)\b[^|;&]*\bstate\//;
const LONG = /(?:^|[\s;&|(])node\s+(?:\S+\/)?proc\.mjs\s+(job\s+complete|layer\s+close)\b/;
const START_CMD = /(?:^|[\s;&|(])node\s+(?:\S+\/)?proc\.mjs\s+(takeover|job\s+start|lane\s+start|process\s+start)\b/;
const WRITES = /\bgit\b[^|;&]*\b(push|commit|merge|rebase|reset|tag|branch|checkout|switch)\b|(?:^|[\s;&|(])(rm|mv|cp|tee|sed\s+-i|gh)\b|(?<![<>])>(?!>)|>>/;
const GH_CLI = /(?:^|[\s;&|(])gh\s+pr\s+(merge|ready|review|edit|close|reopen|create)\b/;
const NAME = /^[A-Z][A-Z0-9-]* #\d+$/;

// P20, rulebook SES 3: a document of a reading set is read whole; a Read with an offset or limit, or a shell cut in the
// same pipeline as one, stops before its end and is refused. A search is not judged here.
export const SET_DOC = /(?:^|[\s/'"=])(PROCESS-DESIGN\.md|\.claude\/rules\/[\w-]+\.md|rulebooks\/[\w-]+\.md|build\/(?:layers|lanes|manifest)\.md|build\/requirements\/[\w.-]+\.md|build\/lanes\/[\w-]+\/(?:charter|decisions)\.md|build\/plan\/current\.md)(?=$|[\s'"|;&)])/;
const CUT = /(?:^|[\s|;&(])(?:head|tail)\b|\bsed\s+(?:-\w*\s+)*-n\b|\bcut\s+(?:-\w+\s+)*-c/;
export function partialReadReason(tool, ti) {
  const why = (f) => `${f} is in a reading set and is read whole (P20; a read that stops before the end is a scan): read it with no offset or limit, or \`cat\` it; a set too large to read whole is BLOCKED: reading (SESSIONS §6)`;
  if (tool === 'Read' && (ti.offset != null || ti.limit != null)) { const m = String(ti.file_path || '').match(SET_DOC); if (m) return why(m[1]); }
  if (tool === 'Bash') for (const pipe of String(ti.command || '').split(/;|&&|\|\||\n/)) { if (CUT.test(pipe)) { const m = pipe.match(SET_DOC); if (m) return why(m[1]); } }
  return null;
}
const refs = (push) => push[1].trim().split(/\s+/).filter((w) => w && !w.startsWith('-') && w !== 'origin').map((r) => r.split(':').pop().replace(/^refs\/heads\//, ''));
const R_of = (ctx) => repo(join(ctx.root, ctx.product || '.'));
// The one branch a role pushes: a job its job branch, the neoProcess lane the branch its start recorded, every other `tranche`.
const ownBranch = (role, ctx) => (role === 'job' ? jobBranch(ctx.module) : role === 'process' ? ctx.branch : TRANCHE);
const WHO = { job: 'a job', lane: 'a lane', bob: 'BOB', root: 'ROOT', process: 'the neoProcess lane' };
const unpushedReason = (ctx, what) => { const u = unpushed(R_of(ctx)); return u.length ? `${what} only once your record and work are pushed (PROTOCOL §2, §7b): ${u.join('; ')}` : null; };

// The reason a tool call is refused, or null. `ctx` is the role file's record plus `root`; `role` null until one is recorded.
export function preReason(role, input, ctx) {
  const tool = input.tool_name || '', ti = input.tool_input || {};
  const partial = partialReadReason(tool, ti); if (partial) return partial;
  const c = tool === 'Bash' ? String(ti.command || '').replace(REDIRECT, ' ') : '';
  if (!role) {
    if (tool === 'Bash' && START_CMD.test(String(ti.command || ''))) return null;
    if (['Write', 'Edit', 'NotebookEdit', 'Agent'].includes(tool) || tool.startsWith('mcp__') || (tool === 'Bash' && WRITES.test(String(ti.command || '')))) return 'no role is recorded for this session: read your set, then run your start command (`proc takeover`, `proc job start`, `proc lane start`, or `proc process start` for the neoProcess lane) before any act (SESSIONS §1a)';
    return null;
  }
  if (tool === 'Bash') {
    if (FORCE.test(c)) return 'a force push, mirror or remote delete is never done by hand (standing safety rule; the tool alone deletes a state branch or a merged job branch)';
    if (STATE_REF.test(c)) return 'nothing merges, tags, branches, resets or pulls from a state branch: it is thrown away whole (PROTOCOL §7d)';
    const lp = c.match(LONG);
    if (lp && ti.run_in_background !== true) return `\`proc ${lp[1].replace(/\s+/g, ' ')}\` runs for minutes and a message reaches you only between tool calls (P13; rulebook SES 6): run it with run_in_background true, then end your turn or do other work until its completion notice arrives`;
    if (GH_CLI.test(c)) return 'a pull request is opened, marked ready, reviewed and merged only as `proc` prints the call (JOB-LIFE §11); the queue merges';
    if (/\bgit\b[^|;&]*\bmerge\b[^|;&]*\bjob\//.test(c)) return 'a job branch is merged only by the queue, after `proc merge` (JOB-LIFE §6)';
    const push = c.match(PUSH);
    if (push) {
      const to = refs(push);
      if (to.some((r) => r === 'main')) return 'nothing is pushed to main: the tranche reaches main only by its close PR (P12)';
      if (to.some((r) => r.startsWith('state/'))) return 'the state branch is written only by the tool (PROTOCOL §7d)';
      const own = ownBranch(role, ctx);
      if (!own || to.some((r) => r !== own)) return `${WHO[role] ?? role} pushes only ${own ?? 'the branch its start recorded'} (JOB-LIFE §11)`;
    }
    return null;
  }
  if (tool === 'Agent' && ti.run_in_background !== true) return 'a worker is never waited on in the foreground (P13; rulebook SES 6): start it with run_in_background true and end your turn; its completion wakes you';
  if (tool === `${REMOTE}send_message`) {
    const u = unpushedReason(ctx, 'a message is sent'); if (u) return u;
    if (role !== 'bob' && role !== 'process') {   // the process repository has no BOB: the neoProcess lane's message is data to its reader
      let bob; try { bob = addr({ product: join(ctx.root, ctx.product || '.'), bob: true }); } catch (e) { return `BOB's address could not be read from the state branch (${e.message})`; }
      if (ti.session_id !== bob) return `a ${role} sends every message to BOB's address, read from git now (\`proc addr --bob\` → ${bob}), never to a lane or another job (PROTOCOL §1)`;
    }
    return null;
  }
  if (role !== 'bob') {
    if ([`${REMOTE}create_session`, `${REMOTE}create_trigger`, `${REMOTE}fire_trigger`, `${REMOTE}send_later`].includes(tool)) return `a ${role} starts no session and arms no timer (rulebook SES 1)`;
    // the neoProcess lane opens and merges its own pull request to the process repository's main (no BOB there); it never reviews one
    if (role === 'process' && [`${GH}merge_pull_request`, `${GH}create_pull_request`].includes(tool)) return null;
    if ([`${GH}merge_pull_request`, `${GH}enable_pr_auto_merge`, `${GH}pull_request_review_write`, `${GH}create_pull_request`].includes(tool)) return `a ${role} never opens, reviews or merges a pull request: BOB and the queue do (JOB-LIFE §11)`;
    if (role === 'job' && [`${GH}update_pull_request`, `${GH}add_issue_comment`].includes(tool)) {
      let j = null; try { j = parseJob(stateRead(R_of(ctx), `jobs/${ctx.module}.md`) || ''); } catch { /* read below */ }
      if (!j) return 'your job line could not be read from the state branch';
      if (tool === `${GH}add_issue_comment` && !(j.owed.includes('comment') && Number(ti.issue_number) === j.pr)) return `a job comments on its own PR (#${j.pr}) only the report \`proc job complete\` printed, while that comment is owed (JOB-LIFE §3)`;
      if (tool === `${GH}update_pull_request` && !(j.owed.includes('ready') && Number(ti.pullNumber) === j.pr && ti.draft === false && Object.keys(ti).every((k) => ['owner', 'repo', 'pullNumber', 'draft'].includes(k)))) return `a job marks its own PR (#${j.pr}) ready for review only as \`proc job complete\` printed, while that act is owed; nothing else on the PR is its to change (JOB-LIFE §11)`;
    }
    return null;
  }
  // BOB
  if (tool === `${REMOTE}fire_trigger`) return 'never fire a routine to reach a session: send a message (PROTOCOL §6)';
  if (tool === `${REMOTE}create_trigger` && ti.persistent_session_id !== ctx.session) return 'BOB arms only its own backstop; a job or a lane is reached by send_message, never by a routine (PROTOCOL §7)';
  if (tool === `${GH}merge_pull_request`) {
    const R = R_of(ctx); let state = null; try { state = parsePlan(stateRead(R, 'plan.md') || '').state; } catch { /* unread */ }
    // the close PR (rulebook INT 9): the merge tool's input names no base, so the one merge at CLOSING is the one whose
    // expected head is the tranche's tip, as `tranche close` printed it; a job branch's head is never that tip (DRYRUN §4.20)
    if (state === 'CLOSING') {
      // a refusal still OPEN is routed first: its metrics row rides the close PR, since nothing is pushed to the tranche
      // once main holds it (BOB #3's R-BOB-3-1 was left unrouted; DRYRUN §4.21)
      let open = []; try { open = refusalsOf(R).filter((x) => x.status === 'OPEN').map((x) => x.id); } catch { /* none */ }
      if (open.length) return `route the open refusal(s) first (\`proc refused routed\`): ${open.join(', ')}; the row rides the close PR, and nothing is pushed to the tranche after it merges (DRYRUN §4.21)`;
      R.fetch(TRANCHE); let tip = null; try { tip = R.g(['rev-parse', `origin/${TRANCHE}`]); } catch { /* none */ }
      if (tip && ti.merge_method === 'merge' && /^[0-9a-f]{7,40}$/.test(String(ti.expectedHeadSha || '')) && tip.startsWith(String(ti.expectedHeadSha))) return null;
    }
    let job = null; try { job = jobFiles(R).map((p) => parseJob(stateRead(R, p) || '')).find((j) => j && j.pr === Number(ti.pullNumber)); } catch { /* unread */ }
    if (job && /^merging /.test(job.merge || '') && ti.merge_method === 'merge') return null;
    return 'a job\'s PR is merged only as `proc merge` printed it (the gate green on its tip, the tip holding the tranche; JOB-LIFE §6); the one other merge BOB makes is the close PR to main, once the plan reads CLOSING, as `tranche close` printed it with expectedHeadSha the tranche\'s tip (rulebook INT 9)';
  }
  if (tool === `${REMOTE}create_session`) {
    const title = String(ti.title || '');
    if (!NAME.test(title) || /^BOB /.test(title)) return 'BOB starts only jobs and lanes, each titled as `proc` printed it (rulebook SES 1)';
    const R = R_of(ctx), id = title.split(' #')[0];
    let plan; try { plan = parsePlan(stateRead(R, 'plan.md') || ''); } catch (e) { return `the plan could not be read from the state branch (${e.message})`; }
    if (lanes(R).some((l) => l.id === id && l.status === 'OPEN')) {   // a closed lane's id is no lane (R-BOB-1-4)
      if (!plan.owed.includes(`start lane ${id}`)) return `no start is owed for lane ${id}: run \`proc lane open\`, \`proc lane route\` or \`proc ask ask\` first, and use the call it prints`;
      const want = laneSession(R, id, Number(title.split('#')[1]));
      if (ti.prompt !== want.prompt || ti.source_revision !== want.source_revision) return `use the create_session \`proc\` printed for ${title}, unchanged (the goal, the standing lines, the branch ${want.source_revision})`;
      return null;
    }
    const m = id.toLowerCase(), j = parseJob(stateRead(R, `jobs/${m}.md`) || '');
    if (!j || !plan.owed.includes(`start ${m}`)) return `no start is owed for ${m}: run \`proc layer start\` or \`proc job route\` first, and use the call it prints`;
    const want = jobSession(R, m, title, j.model || 'opus');
    if (ti.prompt !== want.prompt || ti.source_revision !== want.source_revision) return `use the create_session \`proc\` printed for ${title}, unchanged (the goal, the standing lines, the branch ${want.source_revision})`;
  }
  return null;
}

// The reason a tool call is pre-approved, or null (PERMISSIONS §8.6): a PreToolUse `allow` skips the permission prompt,
// never past a deny or ask rule, so only what the act table gives every role is answered here, and only when every part
// of the command is one: the tool's own commands, the checks, the tests, a read of git, a push to the role's own branch
// (preReason has already refused every other push), with `cd` and read-only filters between them. A substitution, a
// redirect to a file or anything else falls through to the rules and the mode. Asked only once preReason found nothing.
const QUIET = /\s+(?:\d?>&\d|\d?>\s*\/dev\/null)(?=$|[\s;&|])/g;
const ALLOW_PART = [
  /^node\s+(?:\S+\/)?(?:tools\/proc|checks\/run)\.mjs(?:\s|$)/,
  /^node\s+--test(?:\s|$)/,
  /^git\s+(?:-C\s+\S+\s+)?(?:status|log|diff|show|fetch|rev-parse|ls-files|ls-remote|cat-file|merge-base|blame|describe|shortlog)(?:\s|$)/,
  /^git\s+(?:-C\s+\S+\s+)?branch(?:\s+(?:-a|-r|-v|-vv|--list|--show-current|--contains\s+\S+|--merged(?:\s+\S+)?))*$/,
  /^git\s+(?:-C\s+\S+\s+)?remote(?:\s+-v)?$/,
  /^cd\s+\S+$/,
  /^(?:head|tail|grep|wc)(?:\s+[^\s]+)*$/,
];
export function allowReason(role, input, ctx) {
  if (!role || input.tool_name !== 'Bash') return null;
  const c = String(input.tool_input?.command || '').replace(QUIET, '');
  if (/[`<>]|\$\(|\n|(?<!&)&(?!&)|--output\b/.test(c)) return null;
  const parts = c.split(/&&|\|\||;|\|/).map((x) => x.trim()).filter(Boolean);
  if (!parts.length) return null;
  const own = ownBranch(role, ctx);
  for (const part of parts) {
    if (ALLOW_PART.some((re) => re.test(part))) continue;
    const push = part.match(/^git\s+(?:-C\s+\S+\s+)?push((?:\s+(?:-u|--set-upstream|-q|--quiet))*\s+origin\s+\S+)$/);
    if (push && own && !FORCE.test(part) && refs(push).length && refs(push).every((r) => r === own)) continue;
    return null;
  }
  return `the act table gives every ${role === 'bob' ? 'BOB' : role === 'process' ? 'neoProcess lane' : role} this act (PERMISSIONS §8.6)`;
}

// The reason a turn may not end, or null: no role yet; a job's record WORKING; anything `proc status` gates for the role.
export function stopReason(role, ctx) {
  if (!role) return 'run your start command first (`proc takeover`, `proc job start`, `proc lane start`, or `proc process start` for the neoProcess lane): the role is recorded by it (SESSIONS §1a)';
  if (role === 'process') return null;   // the process repository has no state branch, so no gate of `proc status` to read
  const R = R_of(ctx), st = status({ product: R.dir });
  const why = [...st.gate];
  if (role === 'job') {
    const j = st.jobs.find((x) => x.module === ctx.module);
    if (j?.state === 'WORKING') why.push('your record reads WORKING: finish the step, or set the wait you end on (`proc job state --set "WAITING: …"`), or run `proc job complete` (JOB-LIFE §11)');
  }
  return why.length ? why.join('; ') : null;
}
// P13, rulebook SES 5: BOB past 40 % of its window, a job or a lane past half, ends a turn only with its refresh recorded
// (BOB #2 of N1 ran to 67 % while BOB's own threshold was text: DRYRUN §4.17). The context is the last assistant turn's
// input (fresh, cache read and cache write) in the transcript; the window is the model's, 1,000,000 unless
// NEO_CONTEXT_WINDOW says otherwise. BOB's refresh is its handoff (`proc handoff` marks it for its session); a job's or a
// lane's is the wait `BLOCKED: context`, which BOB's queue lists as UNBLOCK and answers by `proc job route` / `lane route`.
export const THRESHOLD = { bob: 0.4, job: 0.5, lane: 0.5, process: 0.5 };
export const WINDOW = Number(process.env.NEO_CONTEXT_WINDOW) || 1_000_000;
export function contextUsed(input) {
  if (typeof input?.transcript_path !== 'string') return null;
  let lines; try { lines = readFileSync(input.transcript_path, 'utf8').split('\n'); } catch { return null; }
  for (let i = lines.length - 1; i >= 0; i--) {
    let r; try { r = JSON.parse(lines[i]); } catch { continue; }
    const u = r?.message?.usage;
    if (u && !r.isSidechain && (r.type === 'assistant' || r.message.role === 'assistant')) return (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
  }
  return null;
}
export function contextReason(role, used, ctx, window = WINDOW) {
  if (!(role in THRESHOLD) || !(used > THRESHOLD[role] * window)) return null;
  const pct = Math.round((100 * used) / window), limit = Math.round(100 * THRESHOLD[role]), at = `you are at ${pct} % of your window, past ${limit} % (P13; rulebook SES 5)`;
  if (role === 'bob' || role === 'process') {
    const f = join(ctx.root, '.git', 'proc-handoff.json');
    if (existsSync(f) && JSON.parse(readFileSync(f, 'utf8')).session === ctx.session) return null;
    if (role === 'process') return `${at}: refresh now: write lane-neoprocess/HANDOFF.md (its From line naming you) and the START file with the prompt Bob pastes, commit, push, run \`proc process handoff\`, then take no further act`;
    return `${at}: refresh now: run \`proc handoff --next "<the next step>"\` at a clean point and send ROOT the START line it prints, then take no further act`;
  }
  const R = R_of(ctx);
  const line = role === 'job' ? parseJob(stateRead(R, `jobs/${ctx.module}.md`) || '')?.state : stateRead(R, `lanes/${ctx.lane}.md`)?.match(/· (BLOCKED: .*)$/m)?.[1];
  if (/^BLOCKED: context/.test(line || '')) return null;
  return `${at}: record it, \`proc ${role === 'job' ? 'job' : 'lane'} state --set "BLOCKED: context (${pct} %)"\`, push, and send BOB one line; BOB starts your successor, which continues from git`;
}
export function refusalCount(last, why) { return why ? (last?.why ? (last.n || 0) + 1 : 1) : 0; }
// Bob, 29 Oct: "you should not be stopping to involve me in these details"; a session told to keep going keeps going.
// A BOB's or a lane's turn that ends on words waiting for Bob is refused: decide it (DES 1, GOV 2), or route it by
// `proc ask route --bob --users --canon-silent` and go on with the queue. Code, not resolve (P16).
const ASKING_BOB = /\b(waiting (on|for) (you|your (word|answer|reply|decision|go-ahead))|tell me when|let me know (when|if|whether|which)|reply ["“]?[a-z]["”]? or|answer ["“]?[a-z]["”]? or|do you want me to|would you like me to|should I\b|shall I\b|please (reply|answer|decide|confirm|choose|pick)|your call\b|up to you\b|once you (confirm|decide|answer|approve)|if you (approve|agree|prefer)\b)/i;
export function askingBobReason(text) {
  const m = String(text || '').match(ASKING_BOB);
  return m ? `this turn ends waiting on Bob ("${m[0]}"): decide it and report it done (DES 1, GOV 2), or route it with \`proc ask route --bob --users --canon-silent\` and go on with the queue; a session never ends a turn waiting on Bob (Bob, 29 Oct; P17, P19)` : null;
}

function main() {
  const ev = process.argv[2];
  let input = {}; try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { /* empty */ }
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const r = readRole(root) || {}, role = r.role || null, ctx = { ...r, root };
  if (ev === 'pre') {
    let why = null; try { why = preReason(role, input, ctx); } catch (e) { why = `the check failed (${e.message}); fix the cause`; }
    if (why) { console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: `PROCESS: ${why}` } })); return; }
    let ok = null; try { ok = allowReason(role, input, ctx); } catch { /* falls through to the rules */ }
    if (ok) console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow', permissionDecisionReason: `PROCESS: ${ok}` } }));
    return;
  }
  if (ev === 'stop') {
    let why = null; try { why = stopReason(role, ctx); } catch (e) { why = `the stop check failed (${e.message}); fix the cause`; }
    if (!why && role === 'bob') { try { why = stepsReason(lastAssistantText(input), join(root, r.product || '.')); } catch (e) { why = `the steps check failed (${e.message}); fix the cause`; } }
    if (!why && (role === 'bob' || role === 'lane' || role === 'process')) { try { why = askingBobReason(lastAssistantText(input)); } catch { /* no text */ } }
    if (!why && role) { try { why = contextReason(role, contextUsed(input), ctx); } catch (e) { why = `the context check failed (${e.message}); fix the cause`; } }
    // The same refusal three times in a row lets the turn end, so a cause the session cannot clear never loops.
    const f = join(root, '.git', 'proc-stop.json');
    const last = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {};
    const n = refusalCount(last, why);
    try { writeFileSync(f, JSON.stringify({ why, n })); } catch { /* not a git checkout */ }
    if (why && n <= 3) console.log(JSON.stringify({ decision: 'block', reason: `PROCESS: ${why}` }));
  }
}
if (import.meta.url === `file://${process.argv[1]}`) main();
