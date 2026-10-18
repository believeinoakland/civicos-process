// Check 5, words (bio rulings-active §5: K3366 "Words by key", K3810, K3268): measures that no module holds
// member-facing English and no test copies a sentence or hand-lists another module's ops, rows or words.
// Four arms, each failure reported as `<arm> <module> <file>:<line> [tag] <short excerpt>`:
//   inline       a member-facing English sentence in a module's own product source (tag `?`: a message given to a
//                custom `*Error` class, uncertain; `copy`: equals a words.json `en`; `table`: in a hand-written word
//                table; `stitched`: a `+` chain of literals and non-literals whose joined text is a sentence, see
//                stitchedChains). A string given to a built-in error constructor (BUILTIN_ERRORS) is developer text,
//                not a failure (BOB's ruling, P17; member-facing refusals are codes read by key, DEC-83); the summary
//                counts those as `dev <n>`.
//   testcopy     a test string equal to (2+ words), or a 25+ character substring of, a words.json `en` (K3810).
//   missingkey   a literal key given to word(/hasWord(/wordsOf( or listed in words-reads.json that words.json lacks.
//   handlist     a test array of 5+ strings that are op names, refusal codes or word keys (K3268). Tag `?` on
//                op names and refusal codes (whose owner module is not known to the check); word keys are certain.
// The words come from `docs/development/ux-substrate/screens/words.json` ({words: [{key, en}]}); op names from the
// product's op declarations (`<root>/bio-plane/src/op-declarations/index.mjs`, its `OPS`) or, failing that, from
// `build/ops.json` (a JSON array of names). Files read: tracked files of the module's `paths` / `tests` with a
// JS/TS extension; never generated files (a header saying GENERATED or "do not edit by hand", the manifest's
// "Generated artifacts" table), vendored code, node_modules, dist, fixtures, setup-words itself.
// Words B (bio K3930; words-B-design §10): `t(id, en, vars)` is a reading like word(): the literals given as its first and
// second arguments are never `inline` or `testcopy` findings. A callee whose last name is `t` is a `t` call. Fifth arm:
//   marker       a `t` call whose id or en is not a plain string literal (a template with no placeholder is plain), whose id
//                is not KEY_RE, whose id is used with two different en across the tree (each place after the first), or
//                that sits in a drawn-screen module (DRAWN_MODULES). `missingkey` still judges word/hasWord/wordsOf only.
//   unreviewed   only with `--release` (`checkWords(root, only, { release: true })`; run.mjs does not pass it): one failure per
//                row of `bio-plane/src/setup-words/words-unreviewed.json` ({unreviewed: [{id,en,module,file,line}]}),
//                the design stream's review list, which must be empty at a release cut.
// Usage: node checks/words.mjs <product-root> [module ...] [--release]
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readModules, trackedFiles, ownerIndex, notProduct, report } from './lib.mjs';

export const WORDS_JSON = 'docs/development/ux-substrate/screens/words.json';
export const READS_JSON = 'docs/development/ux-substrate/screens/words-reads.json';
const CODE_EXT = /\.(mjs|js|cjs|ts|tsx|jsx)$/;
const SKIP_DIR = /(^|\/)(node_modules|dist|vendor|vendored|fixtures?|testdata|generated|coverage|profiles|datasets?|scripts|\.git)\//;
const TABLE_FILE = /(^|\/)[^/]*(words|texts|messages|copy|strings|labels|glossary|vocabulary)[^/]*\.m?js$/i;
// Drawn screens are written first by the design and read their words only through word(); a `t` call there fails the
// check (bio K3930 (3); words-B-design §4).
export const DRAWN_MODULES = (id) => /^screens-/.test(id) || ['interface-shell', 'wizard-scripts', 'site', 'installer', 'installer-steps'].includes(id);
export const UNREVIEWED_JSON = 'bio-plane/src/setup-words/words-unreviewed.json'; // bio K3932
const OWN_WORDS_MODULES = new Set(['setup-words']); // the word list's own module: holds the English by definition
const OWN_DECL_MODULES = new Set(['op-declarations', 'op-capabilities']); // modules whose tests may list ops
const KEY_RE = /^[a-z][a-z0-9_-]*(\.[A-Za-z0-9_-]+)+$/;
const ERROR_CALLEE = /(^|\.)\w*Error$/;
const TITLE_CALLEE = /^(test|it|describe|suite|before|after)(\.\w+)?$/;
const BUILTIN_ERRORS = new Set(['Error', 'TypeError', 'RangeError', 'SyntaxError', 'ReferenceError', 'EvalError', 'URIError', 'AggregateError']);
const REGEX_PREV_KW = new Set(['return', 'typeof', 'case', 'in', 'of', 'delete', 'void', 'throw', 'new', 'else', 'do', 'yield', 'await']);

// ---- scanner: JS tokens with line numbers; comments dropped; strings and templates decoded ----------------------
export function scan(src) {
  const toks = [];
  let line = 1;
  const n = src.length;
  const ESC = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };
  function readEscape(i, out) { // src[i] === '\\'
    const c = src[i + 1];
    if (c === 'u') {
      if (src[i + 2] === '{') { const e = src.indexOf('}', i); out.push(String.fromCodePoint(parseInt(src.slice(i + 3, e), 16) || 63)); return e + 1; }
      out.push(String.fromCharCode(parseInt(src.slice(i + 2, i + 6), 16) || 63)); return i + 6;
    }
    if (c === 'x') { out.push(String.fromCharCode(parseInt(src.slice(i + 2, i + 4), 16) || 63)); return i + 4; }
    if (c === '\n') { line++; return i + 2; }
    out.push(ESC[c] ?? c); return i + 2;
  }
  function template(i, startLine) { // src[i] is the char after the opening backtick; returns index after closing backtick
    const out = []; let interp = false;
    while (i < n) {
      const c = src[i];
      if (c === '`') { toks.push({ t: 'str', v: out.join(''), line: startLine, tpl: true, interp }); return i + 1; }
      if (c === '\\') { i = readEscape(i, out); continue; }
      if (c === '$' && src[i + 1] === '{') {
        interp = true; out.push('{}');
        const saveLen = toks.length;
        i = code(i + 2, true);
        toks.length = saveLen; // the expression's tokens belong to no sentence
        continue;
      }
      if (c === '\n') line++;
      out.push(c); i++;
    }
    return i;
  }
  function code(i, nested) { // scans until the `}` closing a `${`, when nested; else to the end
    let depth = 0;
    while (i < n) {
      const c = src[i];
      if (c === '\n') { line++; i++; continue; }
      if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
      if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); const stop = e < 0 ? n : e + 2; for (let k = i; k < stop; k++) if (src[k] === '\n') line++; i = stop; continue; }
      if (c === '#' && src[i + 1] === '!' && i === 0) { while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '"' || c === "'") {
        const out = []; const startLine = line; i++;
        while (i < n && src[i] !== c && src[i] !== '\n') { if (src[i] === '\\') i = readEscape(i, out); else out.push(src[i++]); }
        i++; toks.push({ t: 'str', v: out.join(''), line: startLine }); continue;
      }
      if (c === '`') { i = template(i + 1, line); continue; }
      if (c === '/') {
        const prev = toks[toks.length - 1];
        const regexOk = !prev || (prev.t === 'p' && !')]}'.includes(prev.v)) || (prev.t === 'id' && REGEX_PREV_KW.has(prev.v));
        if (regexOk) { // a regex literal
          let inClass = false; i++;
          while (i < n && src[i] !== '\n') { const d = src[i]; if (d === '\\') { i += 2; continue; } if (d === '[') inClass = true; else if (d === ']') inClass = false; else if (d === '/' && !inClass) break; i++; }
          i++; while (/[a-z]/.test(src[i] || '')) i++;
          toks.push({ t: 're', v: '/', line }); continue;
        }
      }
      if (/[A-Za-z_$]/.test(c)) { let j = i + 1; while (j < n && /[\w$]/.test(src[j])) j++; toks.push({ t: 'id', v: src.slice(i, j), line }); i = j; continue; }
      if (/[0-9]/.test(c)) { let j = i + 1; while (j < n && /[\w.]/.test(src[j])) j++; toks.push({ t: 'num', v: src.slice(i, j), line }); i = j; continue; }
      if (c === '{') depth++;
      if (c === '}') { if (nested && depth === 0) return i + 1; depth--; }
      toks.push({ t: 'p', v: c, line }); i++;
    }
    return i;
  }
  code(0, false);
  return toks;
}

// Adds `ctx` to each string token: { importPath, error, console, title, callee } from its enclosing call.
export function withContext(toks) {
  const stack = [];
  for (let k = 0; k < toks.length; k++) {
    const tk = toks[k];
    if (tk.t === 'p' && '([{'.includes(tk.v)) {
      let callee = null;
      if (tk.v === '(') {
        const p = toks[k - 1];
        if (p && p.t === 'id' && !['if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'typeof', 'await'].includes(p.v)) {
          callee = p.v; let j = k - 1;
          while (toks[j - 1] && toks[j - 1].t === 'p' && toks[j - 1].v === '.' && toks[j - 2] && toks[j - 2].t === 'id') { callee = `${toks[j - 2].v}.${callee}`; j -= 2; }
        }
      }
      stack.push({ open: tk.v, callee });
    } else if (tk.t === 'p' && ')]}'.includes(tk.v)) stack.pop();
    else if (tk.t === 'str') {
      const ctx = {};
      const p = toks[k - 1];
      if (p && p.t === 'id' && (p.v === 'from' || p.v === 'import')) ctx.importPath = true;
      for (let s = stack.length - 1; s >= 0; s--) {
        const f = stack[s];
        if (f.open === '{') break;
        if (f.open === '(' && f.callee) {
          ctx.callee = f.callee;
          if (ERROR_CALLEE.test(f.callee)) ctx.error = true;
          if (BUILTIN_ERRORS.has(f.callee.split('.').pop())) ctx.dev = true;
          if (/^console\./.test(f.callee)) ctx.console = true;
          if (f.callee === 'require' || f.callee === 'import') ctx.importPath = true;
          if (TITLE_CALLEE.test(f.callee) && toks[k - 1] && toks[k - 1].v === '(') ctx.title = true;
          break;
        }
      }
      tk.ctx = ctx;
    }
  }
  return toks;
}

// Stitched sentences: a `+` chain is the maximal run of operands joined by `+` at one bracket depth within one expression.
// Approximation: the chain is cut at `, ; = ? : & | < > !`, at `+=`, at the keywords in CHAIN_CUT, and at any bracket;
// a bracketed group, call or member access inside an operand makes that operand non-literal (one `{}`). An operand is a
// literal only when it is exactly one string token (a template literal counts as its text, `{}` for each ${}).
// A chain counts only when one literal piece has 3+ words of its own. Limits: operator precedence is not modelled (`a + b * 'x'` is one chain), `?:` branches and `||` alternatives each
// start a new chain, and a `+` that is arithmetic on numbers beside a literal reads as concatenation.
const CHAIN_CUT = new Set(['return', 'throw', 'case', 'yield', 'else', 'do', 'in', 'of', 'void', 'delete', 'await']);
export function stitchedChains(toks) {
  const out = [];
  const frames = [{ ops: [], cur: [] }];
  const flush = (f) => {
    const operands = [...f.ops, f.cur];
    if (f.ops.length && operands.every((o) => o.length)) {
      const lit = (o) => o.length === 1 && o[0].t === 'str';
      if (operands.some(lit) && operands.some((o) => !lit(o))) {
        let text = '';
        for (const o of operands) { if (lit(o)) text += o[0].v; else if (!text.endsWith('{}')) text += '{}'; }
        out.push({ line: operands[0][0].line, text, lits: operands.filter(lit).map((o) => o[0]) });
      }
    }
    f.ops = []; f.cur = [];
  };
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k], f = frames[frames.length - 1];
    if (t.t === 'p' && '([{'.includes(t.v)) { f.cur.push({ t: 'grp', line: t.line }); frames.push({ ops: [], cur: [] }); continue; }
    if (t.t === 'p' && ')]}'.includes(t.v)) { if (frames.length > 1) { flush(frames.pop()); } continue; }
    if (t.t === 'p' && t.v === '+') {
      const nx = toks[k + 1];
      if (nx && nx.t === 'p' && (nx.v === '=' || nx.v === '+')) { flush(f); k++; continue; } // += and ++
      if (!f.cur.length) continue; // unary
      f.ops.push(f.cur); f.cur = []; continue;
    }
    if ((t.t === 'p' && ',;=?:&|<>!'.includes(t.v)) || (t.t === 'id' && CHAIN_CUT.has(t.v))) { flush(f); continue; }
    f.cur.push(t);
  }
  while (frames.length) flush(frames.pop());
  return out;
}

// ---- the heuristics -------------------------------------------------------------------------------------------------
const SQL = /^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|PRAGMA|WITH|BEGIN|COMMIT|ROLLBACK|REPLACE)\b/;
const WORDISH = /^["'(\[]*(?:[A-Za-z][A-Za-z'’-]*|\{[A-Za-z0-9_]*\})[.,;:!?)"'\]]*$/;

// Is this string a member-facing English sentence? (Context exclusions are applied by the caller.)
export function isSentence(raw) {
  let s = raw;
  if (/<\/?[A-Za-z][^>]*>/.test(s)) s = s.replace(/<\/?[A-Za-z][^>]*>/g, ' ');
  s = s.replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
  if (s.length < 12) return false;
  if (/:\/\/|^\/|^\.\.?\//.test(s) || SQL.test(s)) return false;
  if (/[;{][^}]*:[^}]*;|[a-z-]+:\s*[^;]+;\s*[a-z-]+:/.test(s) && !/[.?!]$/.test(s)) return false; // CSS
  const toks = s.split(' ');
  const wordish = toks.filter((t) => WORDISH.test(t));
  if (wordish.length < 4 || wordish.length < toks.length * 0.7) return false;
  if (toks.some((t) => /[=<>|\\]|\w\.\w+\(|=>/.test(t))) return false; // code-like token
  if (toks.filter((t) => /^[A-Z]{2,}$/.test(t)).length >= 2 && /\b(JOIN|WHERE|FROM|SELECT|ORDER|GROUP|LIMIT|INTO|VALUES|AND|ON)\b/.test(s) && !/[.!]$/.test(s)) return false; // SQL
  if (toks.filter((t) => /^\{\}$|^\?$/.test(t)).length * 2 >= toks.length) return false; // mostly placeholders
  const first = toks[0].replace(/^["'(\[]+/, '');
  const capital = /^[A-Z]/.test(first) && !/^[A-Z0-9_]+$/.test(first.replace(/[^A-Za-z0-9_]/g, '')); // not a CONSTANT_CODE
  const endsPunct = /[.?!]["')\]]*$/.test(s);
  const placeholder = /\{[A-Za-z0-9_]*\}/.test(s);
  return capital || endsPunct || placeholder;
}

// An exact copy counts when it is a phrase: 3+ words, or 2 words and 18+ characters (not 'a person', not a name).
const isCopyLen = (v) => { const w = v.trim().split(/\s+/).length; return w >= 3 || (w === 2 && v.length >= 18); };

function excerpt(v) {
  const s = v.replace(/\s+/g, ' ').trim();
  return JSON.stringify(s.length > 70 ? s.slice(0, 67) + '...' : s);
}

// ---- product knowledge ------------------------------------------------------------------------------------------------
export function loadWords(root) {
  const p = join(root, WORDS_JSON);
  if (!existsSync(p)) return { keys: new Set(), ens: new Map(), blob: '', codes: new Set() };
  const rows = JSON.parse(readFileSync(p, 'utf8')).words || [];
  const keys = new Set(), ens = new Map(), codes = new Set();
  for (const r of rows) {
    keys.add(r.key);
    if (typeof r.en === 'string') ens.set(r.en, r.key);
    const m = /^refusal\.([A-Za-z0-9_]+)$/.exec(r.key);
    if (m) codes.add(m[1]);
  }
  const blob = '\n' + [...ens.keys()].join('\n') + '\n';
  return { keys, ens, blob, codes };
}

// op name -> owning module id (or null when the declarations give no owner). From `build/ops.json` (an array of names,
// or an object name -> owner) and the product's op declarations: `OPS` names every op, `OP_FAMILIES[family].{kinds,acts,
// proposals,reads,extra}` name the family's ops, and the family key is the owning module.
export async function loadOpNames(root) {
  const names = new Map();
  const j = join(root, 'build/ops.json');
  if (existsSync(j)) {
    const d = JSON.parse(readFileSync(j, 'utf8'));
    if (Array.isArray(d)) for (const x of d) names.set(x, null); else for (const [k, v] of Object.entries(d)) names.set(k, v);
  }
  const decl = join(root, 'bio-plane/src/op-declarations/index.mjs');
  if (existsSync(decl)) {
    try {
      const m = await import(pathToFileURL(decl).href);
      for (const k of Object.keys(m.OPS || {})) if (!names.has(k)) names.set(k, null);
      const list = (v) => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.keys(v) : []);
      for (const [fam, v] of Object.entries(m.OP_FAMILIES || {})) {
        for (const fld of ['kinds', 'acts', 'proposals', 'reads', 'extra']) for (const o of list(v?.[fld])) if (typeof o === 'string' && !names.get(o)) names.set(o, v.owner || fam);
      }
    } catch { /* declarations unreadable: the ops arm degrades */ }
  }
  return names;
}

// The design's own list of inline strings no member reads (words-reads.json `unkeyed`), per module, placeholders normalised.
export function loadUnkeyed(root) {
  const p = join(root, READS_JSON);
  const out = new Map();
  if (!existsSync(p)) return out;
  let j; try { j = JSON.parse(readFileSync(p, 'utf8')); } catch { return out; }
  for (const [id, e] of Object.entries(j.modules || {})) {
    if ((e.unkeyed || []).length) out.set(id, '\n' + e.unkeyed.map((u) => String(u.text).replace(/\$?\{[^}]*\}/g, '{}')).join('\n') + '\n');
  }
  return out;
}

function generatedFromManifest(root) {
  const p = join(root, 'build/manifest.md');
  const files = new Set();
  if (!existsSync(p)) return { files };
  const text = readFileSync(p, 'utf8');
  const at = text.indexOf('## Generated artifacts');
  if (at < 0) return { files };
  const rest = text.slice(at + 5), end = rest.search(/\n## /);
  for (const row of (end < 0 ? rest : rest.slice(0, end)).split('\n')) {
    if (!row.startsWith('|')) continue;
    const first = row.split('|')[1] || '';
    for (const m of first.matchAll(/`([^`]+)`/g)) { const f = m[1]; if (/\.(mjs|js)$/.test(f) && f.includes('/')) files.add(f); }
  }
  return { files };
}

function isGeneratedText(src) {
  const head = src.slice(0, 1200);
  return /\bGENERATED\b|generated (by|from)\b|do not edit( it)? by hand|DO NOT EDIT/i.test(head);
}

function walk(root, rel) {
  const abs = join(root, rel);
  if (!existsSync(abs)) return [];
  const st = statSync(abs);
  if (st.isFile()) return [rel];
  const out = [];
  for (const e of readdirSync(abs, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    out.push(...walk(root, rel === '.' ? e.name : join(rel, e.name)));
  }
  return out;
}

function listFiles(root) {
  try { return trackedFiles(root); } catch { return walk(root, '.'); }
}

// ---- the check --------------------------------------------------------------------------------------------------------
export async function checkWords(root, only = [], { release = false } = {}) {
  const state = readModules(root);
  const words = loadWords(root);
  const ops = await loadOpNames(root);
  const owner = ownerIndex(state);
  const outside = notProduct(state);
  const gen = generatedFromManifest(root);
  const unkeyed = loadUnkeyed(root);
  const files = listFiles(root);
  const failures = [];
  const counts = {}; // module -> arm -> n
  const bump = (m, arm, tag) => { const c = (counts[m] ??= { inline: 0, testcopy: 0, missingkey: 0, handlist: 0, marker: 0, unreviewed: 0, q: 0 }); c[arm]++; if (tag === '?') c.q++; };
  const items = []; // the failures with their full literal, for tools that analyse them
  const add = (arm, m, file, line, tag, text, raw) => { items.push({ arm, module: m, file, line, tag, raw: raw ?? text }); failures.push(`${arm} ${m} ${file}:${line} ${tag ? `[${tag}] ` : ''}${text}`); bump(m, arm, tag); };
  let literals = 0;
  const tIds = new Map(); // t id -> { en, where } of its first use
  const tReads = new Set(); // the string tokens given as a t call's id and en
  let dev = 0; // sentences given to built-in error constructors: developer text, not failures
  const ownLits = new Map(); // module -> Set of string values in its own product source (a code is its own when its source names it)
  const lists = []; // handlist candidates, judged once every module's own source has been read
  const modsSeen = new Set();

  for (const f of files) {
    if (!CODE_EXT.test(f) || SKIP_DIR.test(f) || outside(f)) continue;
    const o = owner(f);
    if (!o) continue;
    const m = state.modules.find((x) => x.id === o.module);
    if (only.length && !only.includes(m.id)) continue;
    const isTest = o.role === 'tests';
    if (!isTest && OWN_WORDS_MODULES.has(m.id)) continue;
    let src;
    try { src = readFileSync(join(root, f), 'utf8'); } catch { continue; }
    if (!isTest && (gen.files.has(f) || isGeneratedText(src))) { const set = ownLits.get(m.id) ?? ownLits.set(m.id, new Set()).get(m.id); for (const t of scan(src)) if (t.t === 'str') set.add(t.v); continue; }
    if (isGeneratedText(src)) continue;
    modsSeen.add(m.id);
    const toks = withContext(scan(src));
    const strs = toks.filter((t) => t.t === 'str');
    literals += strs.length;
    if (!isTest) { const set = ownLits.get(m.id) ?? ownLits.set(m.id, new Set()).get(m.id); for (const t of strs) set.add(t.v); }

    // missingkey: literal keys given to word/hasWord/wordsOf
    for (let k = 0; k < toks.length - 3; k++) {
      const t = toks[k];
      if (t.t === 'id' && (t.v === 'word' || t.v === 'hasWord' || t.v === 'wordsOf') && toks[k + 1].v === '(' && toks[k + 1].t === 'p') {
        const a = toks[k + 2];
        if (a.t === 'str' && !a.interp && KEY_RE.test(a.v) && words.keys.size && !words.keys.has(a.v)) {
          const next = toks[k + 3];
          const sameLine = toks.filter((x) => x.line === a.line && x.t === 'id').map((x) => x.v);
          const negated = (toks[k - 1] && toks[k - 1].v === '!') || sameLine.some((x) => ['false', 'throws', 'notOk', 'rejects', 'UNKNOWN_WORD', 'WORD_ROWS'].includes(x)) || /no[._ -]?such|nonesuch|nonexist|not[._-]a[._-]key|unknown|\bzz\b/i.test(a.v); // a test of the refusal itself
          if (next && (next.v === ')' || next.v === ',') && !negated) add('missingkey', m.id, f, a.line, '', a.v);
        }
      }
    }

    // marker: t(id, en, vars) calls
    const plain = (x) => x && x.t === 'str' && !x.interp;
    const endsArg = (x) => x && x.t === 'p' && (x.v === ',' || x.v === ')');
    // A bare `t(` is the reading only where the file brings `t` in under that name (an import, or a destructuring of `require(` or `await import(`, naming it; not `x as t`): bio's tests
    // use a local `t` for other things. A member call `.t(` is not judged (a method of some other object).
    let hasT = false;
    for (let k = 0; k < toks.length && !hasT; k++) {
      if (toks[k].t === 'id' && toks[k].v === 'import') { for (let j = k + 1; j < toks.length && toks[j].v !== 'from' && toks[j].v !== ';' && j < k + 60; j++) if (toks[j].t === 'id' && toks[j].v === 't' && !['as', ':'].includes(toks[j - 1].v)) hasT = true; }
      else if (toks[k].t === 'p' && toks[k].v === '{' && toks[k - 1] && ['const', 'let', 'var'].includes(toks[k - 1].v)) { let j = k + 1; let named = false; while (j < toks.length && toks[j].v !== '}' && j < k + 60) { if (toks[j].t === 'id' && toks[j].v === 't' && !['as', ':'].includes(toks[j - 1].v)) named = true; j++; } if (named && toks[j + 1] && toks[j + 1].v === '=' && toks[j + 2] && (toks[j + 2].v === 'require' || (toks[j + 2].v === 'await' && toks[j + 3] && toks[j + 3].v === 'import'))) hasT = true; }
    }
    for (let k = 0; hasT && k < toks.length - 1; k++) {
      const t = toks[k];
      if (toks[k - 1] && toks[k - 1].t === 'p' && toks[k - 1].v === '.') continue;
      if (!(t.t === 'id' && t.v === 't' && toks[k + 1].t === 'p' && toks[k + 1].v === '(')) continue;
      if (toks[k - 1] && toks[k - 1].t === 'id' && ['function', 'async'].includes(toks[k - 1].v)) continue; // a definition
      const a = toks[k + 2], b = toks[k + 4];
      const idOk = plain(a) && endsArg(toks[k + 3]), enOk = idOk && toks[k + 3].v === ',' && plain(b) && endsArg(toks[k + 5]);
      if (idOk) tReads.add(a);
      if (enOk) tReads.add(b);
      if (DRAWN_MODULES(m.id)) add('marker', m.id, f, t.line, '', 't call in a drawn-screen module (read by word())');
      if (!idOk) { add('marker', m.id, f, t.line, '', 't id is not a plain string literal'); continue; }
      if (!KEY_RE.test(a.v)) add('marker', m.id, f, a.line, '', `t id ${excerpt(a.v)} is not <module>.<area>.<name>`);
      if (!enOk) { add('marker', m.id, f, t.line, '', `t(${excerpt(a.v)}, en): en is not a plain string literal`); continue; }
      const prev = tIds.get(a.v);
      if (!prev) tIds.set(a.v, { en: b.v, where: `${f}:${a.line}` });
      else if (prev.en !== b.v) add('marker', m.id, f, a.line, '', `t id ${excerpt(a.v)} has a different en than at ${prev.where}`);
    }

    if (isTest) {
      // testcopy
      for (const s of strs) {
        if (s.ctx.importPath || s.ctx.title || s.ctx.console) continue;
        const last = (s.ctx.callee || '').split('.').pop();
        if (tReads.has(s) || /^(word|hasWord|wordsOf)$/.test(last) || (hasT && last === 't')) continue;
        const v = s.v;
        if (s.interp) { // static chunks between placeholders
          for (const chunk of v.split('{}')) if (chunk.length >= 25 && !chunk.includes('\n') && words.blob.includes(chunk)) { add('testcopy', m.id, f, s.line, '', excerpt(chunk)); break; }
          continue;
        }
        if (words.ens.has(v) && isCopyLen(v)) add('testcopy', m.id, f, s.line, '', excerpt(v));
        else if (v.length >= 25 && !v.includes('\n') && words.blob.includes(v)) add('testcopy', m.id, f, s.line, 'part', excerpt(v));
      }
      // handlist: array literals of 5+ strings
      if (!OWN_DECL_MODULES.has(m.id) && !OWN_WORDS_MODULES.has(m.id)) {
        for (let k = 0; k < toks.length; k++) {
          if (toks[k].t !== 'p' || toks[k].v !== '[') continue;
          const items = []; let j = k + 1, ok = true;
          while (j < toks.length) {
            const x = toks[j];
            if (x.t === 'str' && !x.interp) items.push(x.v);
            else { ok = false; break; }
            const y = toks[j + 1];
            if (y && y.t === 'p' && y.v === ',') { j += 2; if (toks[j] && toks[j].t === 'p' && toks[j].v === ']') break; continue; }
            if (y && y.t === 'p' && y.v === ']') break;
            ok = false; break;
          }
          if (!ok || items.length < 5) continue;
          lists.push({ m: m.id, f, line: toks[k].line, items });
        }
      }
    } else {
      // inline
      const table = TABLE_FILE.test(f);
      const stitched = new Set();
      for (const ch of stitchedChains(toks)) {
        if (!isSentence(ch.text) || !ch.lits.some((l) => l.v.trim().split(/\s+/).filter(Boolean).length >= 3)) continue; // scaffolding between placeholders is not a sentence
        if (ch.lits.some((l) => l.ctx.importPath || l.ctx.console || l.ctx.title)) continue;
        for (const l of ch.lits) stitched.add(l);
        if (ch.lits.some((l) => l.ctx.dev)) { dev++; continue; }
        add('inline', m.id, f, ch.line, 'stitched', excerpt(ch.text), ch.text);
      }
      for (const s of strs) {
        const c = s.ctx;
        if (stitched.has(s) || tReads.has(s) || c.importPath || c.console || c.title) continue;
        const v = s.v;
        const isCopy = !s.interp && words.ens.has(v) && isCopyLen(v);
        if (!isCopy && !isSentence(v)) continue;
        if (c.dev) { dev++; continue; }
        const dec = v.trim().length >= 10 && (unkeyed.get(m.id) || '').includes(v.trim().replace(/\$?\{[^}]*\}/g, '{}'));
        const tag = isCopy ? 'copy' : table ? 'table' : dec ? 'unkeyed' : c.error ? '?' : '';
        add('inline', m.id, f, s.line, tag, excerpt(v), v);
      }
    }
  }

  // handlist: an array of 5+ strings, 80%+ of them one kind (ops, codes, keys), the kind's items named by no source of the test's own module
  for (const { m, f, line, items } of lists) {
    const own = ownLits.get(m) ?? new Set();
    const kinds = { ops: (x) => ops.has(x), codes: (x) => words.codes.has(x), keys: (x) => words.keys.has(x) };
    for (const [kind, is] of Object.entries(kinds)) {
      const hit = items.filter(is);
      const foreign = hit.filter((x) => (kind === 'ops' && ops.get(x) ? ops.get(x) !== m : !own.has(x)));
      if (hit.length >= items.length * 0.8 && foreign.length >= 5) {
        add('handlist', m, f, line, kind === 'keys' ? '' : '?', `${kind}: ${foreign.slice(0, 3).join(', ')}, ... (${foreign.length} of ${items.length} not the module's own)`);
        break;
      }
    }
  }

  // missingkey: words-reads.json (the design's list of the keys each module reads), global and per-module files
  const checkReads = (rel, text, scopeModule) => {
    let j; try { j = JSON.parse(text); } catch { return; }
    const lines = text.split('\n');
    const lineOf = (key) => { const i = lines.findIndex((l) => l.includes(`"${key}"`)); return i < 0 ? 1 : i + 1; };
    const entries = j.modules ? Object.entries(j.modules) : [[scopeModule, j]];
    for (const [id, e] of entries) {
      if (!id || (only.length && !only.includes(id))) continue;
      if (!state.modules.some((x) => x.id === id)) continue;
      modsSeen.add(id);
      for (const key of e.reads || []) {
        if (key === '*' || !words.keys.size || words.keys.has(key)) continue;
        add('missingkey', id, rel, lineOf(key), '', key);
      }
    }
  };
  if (existsSync(join(root, READS_JSON))) checkReads(READS_JSON, readFileSync(join(root, READS_JSON), 'utf8'));
  for (const f of files) if (basename(f) === 'words-reads.json' && f !== READS_JSON && !SKIP_DIR.test(f)) {
    const o = state.modules.find((x) => (x.paths || []).some((p) => (p.endsWith('/') ? f.startsWith(p) : p === f)));
    if (o) checkReads(f, readFileSync(join(root, f), 'utf8'), o.id);
  }

  if (release && existsSync(join(root, UNREVIEWED_JSON))) {
    let u = []; try { u = JSON.parse(readFileSync(join(root, UNREVIEWED_JSON), 'utf8')).unreviewed || []; } catch { /* unreadable: no rows */ }
    for (const r of u) if (!only.length || only.includes(r.module)) add('unreviewed', r.module, r.file, r.line, '', r.id);
  }
  failures.sort();
  const tot = { inline: 0, testcopy: 0, missingkey: 0, handlist: 0, marker: 0, unreviewed: 0, q: 0 };
  for (const c of Object.values(counts)) for (const k of Object.keys(tot)) tot[k] += c[k];
  const summary = `${modsSeen.size} modules, ${literals} string literals read, ${words.keys.size} words; inline ${tot.inline}, testcopy ${tot.testcopy}, missingkey ${tot.missingkey}, handlist ${tot.handlist} (${tot.q} tagged ?), marker ${tot.marker}${release ? `, unreviewed ${tot.unreviewed}` : ''}, dev ${dev}`;
  return { failures, summary, counts, totals: { ...tot, dev }, items };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const args = process.argv.slice(2);
  const { failures, summary } = await checkWords(args.find((a) => !a.startsWith('--')) || '.', args.filter((a) => !a.startsWith('--')).slice(1), { release: args.includes('--release') });
  process.exitCode = report('words', failures, summary);
}
