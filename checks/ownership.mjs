// Check 3, ownership (PROCESS-MECHANICS §8.3, §6; P7): a module job's diff touches only its module's
// paths and tests and its own job record. The one exception (mechanics §12.2): a module extracted
// from a legacy module may remove the moved code from that legacy module's files, and may rewire the
// legacy code that called it: an added line there is either part of an import (or re-export) from the
// job's own paths, or in a block of added lines that uses a name so imported. The legacy module's net
// change, over all its legacy modules together, is a removal. Every added legacy line is listed, for BOB's review at the layer close.
// A changed line that only removes tokens from the line it replaces (a dropped key, a lost import name) is a
// removal, not an addition (bio K140): it is listed as EDITED, neither judged nor counted as added.
// Usage: node checks/ownership.mjs <product-root> <module> <base-ref> [head-ref]
import { posix } from 'node:path';
import { readModules, git, pathMatches, report } from './lib.mjs';

// Static imports and re-exports (`import … from`, `export … from`, `import '…'`).
const STATEMENT = /(^|\n)([ \t]*)(import|export)(\s*[\w$*{}\s,]*?\s*from\s*|\s*)(['"])([^'"\n]+)\5/g;

// The local names an import clause binds: `X`, `* as ns`, `{ a, b as c }`.
export function boundNames(clause) {
  const names = [];
  const c = clause.replace(/\bfrom\s*$/, '').replace(/\btype\b/g, ' ');
  const braces = c.match(/\{([^}]*)\}/);
  if (braces) for (const part of braces[1].split(',')) { const w = part.trim().split(/\s+as\s+/).pop().trim(); if (w) names.push(w); }
  const ns = c.match(/\*\s*as\s+([\w$]+)/);
  if (ns) names.push(ns[1]);
  const def = c.replace(/\{[^}]*\}/, '').replace(/\*\s*as\s+[\w$]+/, '').split(',')[0].trim();
  if (/^[\w$]+$/.test(def)) names.push(def);
  return names;
}

// Every static import or re-export in `text`: kind, specifier, bound names, and its 1-based line span.
export function statementsOf(text) {
  const out = [];
  for (const m of text.matchAll(STATEMENT)) {
    const start = m.index + m[1].length;
    const first = text.slice(0, start).split('\n').length;
    const last = first + m[0].slice(m[1].length).split('\n').length - 1;
    out.push({ kind: m[3], spec: m[6], names: m[3] === 'import' ? boundNames(m[4]) : [], first, last });
  }
  return out;
}

// A line with no behaviour: blank, brackets and separators only, or a comment.
const STRUCTURAL = (t) => /^[\s{}()[\];,]*$/.test(t.replace(/\/\*.*?\*\//g, '').replace(/\/\/.*$/, '').replace(/^\s*(\/\*|\*).*$/, ''));

// Added and removed lines of `file` between the refs, grouped by diff hunk, and the number of removed lines.
function hunksOf(root, ref, head, file) {
  const diff = git(root, ['diff', '-U0', '--no-renames', '--relative', `${ref}...${head}`, '--', file]);
  const hunks = [];
  let cur = null, n = 0, removed = 0;
  for (const line of diff.split('\n')) {
    const h = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (h) { cur = { lines: [], gone: [] }; hunks.push(cur); n = Number(h[1]); continue; }
    if (!cur) continue;
    if (line.startsWith('+')) cur.lines.push({ n: n++, text: line.slice(1) });
    else if (line.startsWith('-')) { removed++; cur.gone.push(line.slice(1)); }
  }
  return { hunks: hunks.filter((x) => x.lines.length), removed };
}

// A line's tokens: identifiers and numbers, whole string literals, and single punctuation marks.
// A string literal is one token, so shortening a string is a change, not a removal.
const TOKEN = /[\w$]+|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\\n]|\\.)*`|\S/g;
export const tokensOf = (t) => t.match(TOKEN) || [];

// True when `after` is `before` with tokens deleted and none added or changed: its tokens are a
// subsequence of `before`'s (K140: a line that only drops an import name or a key is a removal).
export function onlyRemoves(before, after) {
  const b = tokensOf(before), a = tokensOf(after);
  let i = 0;
  for (const t of b) if (i < a.length && t === a[i]) i++;
  return i === a.length;
}

// Pairs each added line of a hunk with a removed line of the same hunk, in order, when the added line only
// removes from it (bio K140, SUITE G5). Returns the added lines that are such edits. A structural line (a lone
// bracket, a blank, a comment) is never paired: it is a subsequence of almost any line, and it stays counted as added.
export function removalEdits(hunk) {
  const edits = new Set();
  let j = 0;
  for (const l of hunk.lines) {
    if (STRUCTURAL(l.text)) continue;
    for (let k = j; k < hunk.gone.length; k++) {
      if (onlyRemoves(hunk.gone[k], l.text)) { edits.add(l); j = k + 1; break; }
    }
  }
  return edits;
}


// The lines a job added to one legacy file, judged against the job's own paths.
export function judgeLegacyFile(root, ref, head, file, own) {
  const failures = [], added = [], edited = [];
  const text = git(root, ['show', `${head}:./${file}`]);
  const isOwn = (spec) => {
    if (!spec.startsWith('.')) return false;
    const t = posix.normalize(posix.join(posix.dirname(file), spec));
    return own.some((p) => [t, `${t}.mjs`, `${t}.js`, `${t}/index.mjs`, `${t}/index.js`].some((c) => pathMatches(p, c)));
  };
  const stmts = statementsOf(text);
  const inStmt = (n) => stmts.find((x) => n >= x.first && n <= x.last);
  const ownNames = stmts.filter((s) => s.kind === 'import' && isOwn(s.spec)).flatMap((s) => s.names);
  const esc = (x) => x.replace(/\$/g, '\\$');
  const usesOwn = ownNames.length ? new RegExp(`(^|[^\\w$.]|\\.\\.\\.)(${ownNames.map(esc).join('|')})(?![\\w$])`) : null;
  const dynamicOwn = (t) => [...t.matchAll(/\bimport\s*\(\s*(['"])([^'"]+)\1/g)].some((m) => isOwn(m[2]));
  const { hunks, removed } = hunksOf(root, ref, head, file);
  let count = 0;
  for (const h of hunks) {
    const code = [];
    let uses = false;
    const edits = removalEdits(h);
    for (const l of h.lines) {
      // A changed line that only removes (a dropped key or import name) is a removal, never an addition (K140);
      // one that now names the module's own import (`this.#f(x)` becoming `f(x)`) is a rewire, still listed and judged.
      if (edits.has(l) && !((usesOwn && usesOwn.test(l.text)) || dynamicOwn(l.text))) { edited.push(`${file}:${l.n}  ${l.text.trim()}`); continue; }
      count++;
      added.push(`${file}:${l.n}  ${l.text.trim()}`);
      const s = inStmt(l.n);
      if (s) {
        if (!isOwn(s.spec)) failures.push(`${file}:${l.n}: adds to an import or re-export of ${s.spec}, which is not the module's own`);
        continue;
      }
      if (STRUCTURAL(l.text)) continue;
      code.push(l.n);
      if ((usesOwn && usesOwn.test(l.text)) || dynamicOwn(l.text)) uses = true;
    }
    if (code.length && !uses) failures.push(`${file}:${code[0]}-${code[code.length - 1]}: added lines that neither import from nor use the module's own paths`);
  }
  return { failures, added, edited, count, removed };
}

export function checkOwnership(root, moduleId, base, head = 'HEAD') {
  const state = readModules(root);
  const m = state.modules.find((x) => x.id === moduleId);
  if (!m) return { failures: [`${moduleId}: no such module in build/modules.json`], added: [], edited: [], summary: 'nothing checked' };
  // `from` names one legacy module or several (a module's code may sit in more than one monolith).
  const legacies = [].concat(m.from || []).map((id) => state.modules.find((x) => x.id === id)).filter(Boolean);
  const own = [...(m.paths || []), ...(m.tests || [])];
  const record = new RegExp(`^build/jobs/[A-Z]+\\d+[a-z]?/${moduleId.replace(/[-]/g, '\\-')}\\.md$`);
  const failures = [], added = [], edited = [];
  const tally = new Map(legacies.map((l) => [l.id, { added: 0, removed: 0 }]));
  // A job's checkout often has only the remote-tracking branch (found in the D1 dry run): fall back to origin/<base>.
  let ref = base;
  try { git(root, ['rev-parse', '--verify', '--quiet', `${base}^{commit}`]); } catch { ref = `origin/${base}`; }
  const lines = git(root, ['diff', '--numstat', '--no-renames', '--relative', `${ref}...${head}`]).split('\n').filter(Boolean);
  for (const line of lines) {
    const [a, r, file] = line.split('\t');
    if (own.some((p) => pathMatches(p, file)) || record.test(file)) continue;
    const legacy = legacies.find((l) => (l.paths || []).some((p) => pathMatches(p, file)));
    if (legacy) {
      const t = tally.get(legacy.id);
      t.removed += Number(r) || 0;
      if (a === '0') continue;
      const j = judgeLegacyFile(root, ref, head, file, m.paths || []);
      failures.push(...j.failures);
      added.push(...j.added);
      edited.push(...j.edited);
      t.added += j.count;
      continue;
    }
    failures.push(`${file}: outside ${moduleId}'s paths, tests and job record`);
  }
  // The net change is judged over all the legacy modules together: the moved code and its caller may sit
  // in different ones (D5: the catalogue loses the code, the store gains the rewired call).
  const sum = [...tally.values()].reduce((s, t) => ({ added: s.added + t.added, removed: s.removed + t.removed }), { added: 0, removed: 0 });
  if (sum.added && sum.added >= sum.removed) failures.push(`${[...tally.keys()].join(' + ')}: ${moduleId} adds ${sum.added} line(s) and removes ${sum.removed}; an extraction's net change to its legacy modules is a removal`);
  const tail = [...tally].map(([id, t]) => `; ${id}: ${t.added} line(s) added, ${t.removed} removed`).join('');
  return { failures, added, edited, summary: `${lines.length} files changed by ${moduleId} between ${base} and ${head}${tail}` };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [root, mod, base, head] = process.argv.slice(2);
  if (!root || !mod || !base) { console.error('usage: node checks/ownership.mjs <product-root> <module> <base-ref> [head-ref]'); process.exit(2); }
  const { failures, added, edited, summary } = checkOwnership(root, mod, base, head);
  for (const a of added) console.log(`ADDED ${a}`);
  for (const e of edited) console.log(`EDITED ${e}  (only removes from the line it replaces: a removal)`);
  process.exitCode = report('ownership', failures, summary);
}
