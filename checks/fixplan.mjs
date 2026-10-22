// The fixplan check (PROCESS-MECHANICS §8; P7, P15, P19; bio K4426, K4597): a running fix-round plan carries, for every
// cause, the four fields K4426 requires, and defers nothing to "after the deploy" without a researched cause.
// K4597 (1)-(2): "check after the deploy", "explained by", "unknown" or "for Bob after the walk" are allowed only with a
// diagnosis file that records a reproduction at the platform's shape; no START is posted while this check fails.
// Usage: node checks/fixplan.mjs <product-root>
//
// Which plans: every `build/plan/fix-round-*.md` (that directory only, never archive/) whose first `**Status**` line
// holds the words IN FORCE or DRAFT in capitals. A plan with neither (closed, "In force" of an old round) is not read.
// Where it runs: checks/run.mjs adds the arm only when such a plan exists.
//
// Heuristics (simple on purpose; a failure names what is missing, BOB answers it in the plan):
//  - A cause is a heading `### G<n>[a-z] ·` or a bullet `- **G<n>[a-z] · ...**`. A heading that holds cause bullets
//    (`### G12 ·`, `### G14-G25 ·`) is a group: it is not a cause itself, and the field markers in its own introduction
//    (the text before its first bullet) count for every cause under it.
//  - A heading's text runs to the next heading; a bullet's to the next bullet, blank line or heading.
//  - (1) cause stated: a `file.ext:<line>` reference. If the text says "Cause ... unknown / probable / circumstantial"
//    it needs, as well, a reference to a `diagnosis-*.md` that exists under build/plan/ and records a reproduction
//    attempt (the word "reproduc"). A reference to a missing or unreproduced file is reported by name.
//  - (2) missed: "(2)" or the word "missed". (3) failing-first: "(3)", "failing-first" or "failing first" or the word "red".
//  - (4) platform check: "(4)" with a bold L, P or N marker (`**L**`, `**P:**`, `**N.**`), or a bold marker anywhere.
//  - Deferrals: a data row of a table whose header says "after the deploy" or "at the re-walk", and any other non-heading
//    line with "check (happens) after the deploy / at the re-walk" or "explained by", must name a cause (a file:line, or the
//    word "cause") and a valid diagnosis file, in the line itself or (for a line inside a cause) in that cause.
//  - Not planned: a line "for BOB to bring to Bob ... not planned" (or "BOB brings ... not planned") fails unless some
//    G-entry says it "measures ... now".
// Each failure: `<file>:<line> <G id>: <what is missing>`; the id is the enclosing cause, else the section number, else "-".
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const PLAN_DIR = 'build/plan';
const FILE_LINE = /[A-Za-z][\w./-]*[A-Za-z]:\d+/;
const DIAG = /diagnosis-[\w.-]+\.md/g;
const UNCERTAIN = /\bcause\b[^.:\n]{0,12}[,:]?\s*\**\s*(unknown|probable|circumstantial)/i;
const HEAD_CAUSE = /^###\s+(G\d+[a-z]?)\s+·/;
const HEAD_ANY = /^#{1,6}\s/;
const BULLET_CAUSE = /^- \*\*(G\d+[a-z]?)\s+·/;
const DEFER = /\bchecks?\s+(?:happens?\s+)?(?:after the deploy|at the re-?walk)|explained by/i;
const DEFER_HEAD = /after the deploy|at the re-?walk/i;
const NOT_PLANNED = /(?:for BOB to bring to Bob|BOB brings)[^\n]*not planned/i;

export function fixPlans(root) {
  const dir = join(root, PLAN_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => /^fix-round-.*\.md$/.test(f)).sort().filter((f) => {
    const status = readFileSync(join(dir, f), 'utf8').split('\n').find((l) => l.startsWith('**Status**')) || '';
    return /IN FORCE|DRAFT/.test(status);
  }).map((f) => `${PLAN_DIR}/${f}`);
}

// A diagnosis reference's fault, or null: it must exist under build/plan/ and record a reproduction attempt.
function diagFault(root, name) {
  const p = join(root, PLAN_DIR, name);
  if (!existsSync(p)) return `${name} does not exist under ${PLAN_DIR}/`;
  if (!/reproduc/i.test(readFileSync(p, 'utf8'))) return `${name} records no reproduction attempt`;
  return null;
}
const diagRefs = (text) => [...new Set(text.match(DIAG) || [])];
const validDiag = (root, text) => diagRefs(text).some((n) => !diagFault(root, n));

// Splits a plan into causes (with their group's introduction) and the headings that number its sections.
export function parseCauses(lines) {
  const causes = [];
  const sectionAt = new Array(lines.length).fill('-');
  let group = null, sec = '-';
  const headings = [];
  lines.forEach((l, i) => { if (HEAD_ANY.test(l)) headings.push(i); });
  const endOfSection = (i) => { const n = headings.find((h) => h > i); return n === undefined ? lines.length : n; };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (HEAD_ANY.test(l)) {
      group = null;
      sec = (l.match(/^#{1,6}\s+(?:(\d+[a-z]?)\b|(G\d+[a-z]?(?:-G\d+)?)\s+·|(K\d+)\s+·)/) || []).slice(1).find(Boolean) || '-';
      const end = endOfSection(i);
      const hasBullets = lines.slice(i + 1, end).some((x) => BULLET_CAUSE.test(x));
      const m = l.match(HEAD_CAUSE);
      if (hasBullets) {
        const first = lines.slice(i + 1, end).findIndex((x) => BULLET_CAUSE.test(x));
        group = { intro: lines.slice(i, i + 1 + first).join('\n') };
      } else if (m) {
        causes.push({ id: m[1], line: i + 1, text: lines.slice(i, end).join('\n'), intro: '', from: i, to: end });
      }
    } else if (BULLET_CAUSE.test(l)) {
      let end = i + 1;
      while (end < lines.length && lines[end].trim() !== '' && !/^- /.test(lines[end]) && !HEAD_ANY.test(lines[end])) end++;
      causes.push({ id: l.match(BULLET_CAUSE)[1], line: i + 1, text: lines.slice(i, end).join('\n'), intro: group ? group.intro : '', from: i, to: end });
    }
    sectionAt[i] = sec;
  }
  return { causes, sectionAt };
}

function causeFaults(root, c) {
  const out = [];
  const own = c.text, all = `${c.intro}\n${c.text}`;
  const uncertain = UNCERTAIN.test(own);
  if (!FILE_LINE.test(own) && !uncertain) out.push('no cause stated (a file:line, or "unknown"/"probable"/"circumstantial" with a diagnosis file)');
  if (uncertain) {
    const refs = diagRefs(own);
    if (!refs.length) out.push('cause is unknown/probable/circumstantial and names no diagnosis-*.md file');
    else for (const r of refs) { const f = diagFault(root, r); if (f) out.push(`cause is unknown/probable/circumstantial: ${f}`); }
  }
  if (!/\bmissed\b|\(2\)/i.test(all)) out.push('no "missed": why the tests missed it');
  if (!/failing[- ]first|\(3\)|\bred\b/i.test(all)) out.push('no failing-first test');
  if (!/\*\*[LPN]\b/.test(all)) out.push('no platform check marker (L, P or N)');
  return out;
}

export function checkFixplan(root) {
  const plans = fixPlans(root);
  const failures = [];
  let causes = 0;
  for (const rel of plans) {
    const lines = readFileSync(join(root, rel), 'utf8').split('\n');
    const { causes: cs, sectionAt } = parseCauses(lines);
    causes += cs.length;
    const fail = (i, id, what) => failures.push(`${rel}:${i + 1} ${id}: ${what}`);
    for (const c of cs) for (const m of causeFaults(root, c)) fail(c.line - 1, c.id, m);
    const causeAt = (i) => cs.find((c) => i >= c.from && i < c.to);
    // Deferrals: table data rows under a deferring header, and deferring lines elsewhere.
    let deferTable = false;
    lines.forEach((l, i) => {
      const inTable = l.startsWith('|');
      if (!inTable) deferTable = false;
      if (HEAD_ANY.test(l)) return;
      let deferred = false;
      if (inTable) {
        if (/^\|[\s|:-]+\|?$/.test(l)) return; // separator row
        const header = !lines[i - 1]?.startsWith('|');
        if (header) { deferTable = DEFER_HEAD.test(l); return; }
        deferred = deferTable || DEFER.test(l);
      } else deferred = DEFER.test(l);
      if (!deferred) return;
      const c = causeAt(i);
      const scope = c ? `${l}\n${c.text}` : l;
      const id = c ? c.id : sectionAt[i];
      const named = FILE_LINE.test(scope) || /\bcause\b/i.test(scope);
      if (!named || !validDiag(root, scope)) fail(i, id, 'a check "after the deploy"/"at the re-walk"/"explained by" without a named cause and a diagnosis-*.md file that records a reproduction');
    });
    // "Not planned": needs a G-entry that measures it now.
    const measures = cs.some((c) => /\bmeasures?\b[^.\n]*\bnow\b/i.test(c.text));
    lines.forEach((l, i) => {
      if (NOT_PLANNED.test(l) && !measures) fail(i, causeAt(i)?.id || sectionAt[i], '"for BOB to bring to Bob ... not planned" with no G-entry that measures it now');
    });
  }
  return { failures, summary: plans.length ? `${plans.length} fix-round plan${plans.length === 1 ? '' : 's'}, ${causes} cause${causes === 1 ? '' : 's'}` : 'no fix-round plan in force or in draft: nothing to check' };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { report } = await import('./lib.mjs');
  const { failures, summary } = checkFixplan(process.argv[2] || '.');
  process.exitCode = report('fixplan', failures, summary);
}
