// Check 6, fixtures (bio rulings K4990, K4993 (2), K4995, K4996; plan F9 §7 item 7): measures that no module's test
// hand-builds another module's answer or a stub of another module's interface, and that no test names a refusal code
// that no product source gives. DRAFT (bio K4993 (2)): not run by checks/run.mjs; its text binds only when Bob approves it (K1258).
// Candidates are found mechanically over the whole tree, so the list, not a sample, is the audit's coverage (K4996).
// Files read: tracked JS/TS files under a module's `tests` paths and under test-support's `paths` (the harness), never
// node_modules, dist, vendored code or generated files. Source = tracked files under the `paths` of every module but
// test-support. Three classes, each failure reported as `<class> <user module> <file>:<line> [tag] <excerpt> -> <provider>`:
//   answer    an object literal of another module's answer shape (tag = the shape): `ok` with `reason`, `detail`, `refusal`,
//             `error` or `failure_class` (refusal, `ok` written as true or false); `ok` with `done`, `final`, `outstanding` or `waiting_on` (owed);
//             an `extent` whose value opens `{ kind` (extent; not where the literal is the argument of a member call, an input). A literal that is an argument of an assert/expect call is an
//             expected value, not a hand-built answer, and is skipped. A literal whose `reason` code only the user module's
//             own source gives is the user's own shape and is skipped. Tag `invented <CODE>` when its code is in no source.
//   stub      (1) an identifier named *Stub, *Fake, *Double, fake*, stub* or double* (camel-case word), once per file and name, at
//             its first declaration, import or use (tag `decl`, `import`, `use`); (2) a function standing in for a service
//             of INTERFACE_NAMES (registerJob, readHeld, armJobs, owedLater, keepLater, deliver, partsOf, ...) that the user
//             module's own source does not define: `x.name = ...`, `name: <function>`, `name(...) {` in an object, or a
//             declaration `function name` / `const name` in the test (tag `stand-in`). A call of the real service is no stand-in.
//   code      a string literal shaped like a refusal code (UPPER_SNAKE with an underscore) given as a `reason`, `code`, `error`,
//             `failure_class`, `refusal` or `why` (key, or the other operand of a comparison or assertion) in a test, found
//             in no source file at all. Not reported again where it sits inside a flagged `answer` literal (that carries tag `invented`).
// Tightening (second pass): an `extent` literal is an answer only inside a stub or double's body or value, or given as the argument of a call
// of one, never as data passed in; a refusal/owed literal that is a direct argument of a member call or of a helper imported from another
// module (a real provider or the harness) is an input, not an answer (a Response.json, resolve/reject or stub call still builds one); names in
// PLATFORM_DOUBLE (FakeDate, fakeBinding, alarmDouble, and fake/stub/double or *Stub/*Fake/*Double of Date, Clock, Timers, Fetch, R2, DO, KV, Bucket,
// Binding, Alarm, Storage, Miniflare, Workerd, ...) are never stubs; a bare local `stub`/`fake`/`double` counts only where its value or its
// `stub.name =` assignments name another module's exported name (6+ characters; tag `spy standing in <name>`); a code literal that the file both
// feeds in (outside an assertion) and asserts (inside one) is pass-through data: not class `code`, and not an `invented` tag.
// Provider: for a code, the modules whose source holds it; for a stub name, the modules whose files declare it (an import
// resolves to the module owning the file; STAND_FOR maps jobRegistrarStub to registerJob); for a stand-in, the modules whose
// source defines the service. Shown as `-> <modules> (earlier|later|mixed)` against the user's position in build/modules.json
// (array order), or `-> ?` when none is found. `--list` also prints the modules the file imports.
// THE CONTRACT MARKER (bio K4995): a hand-built answer or stub is accepted, not reported, only where its provider is LATER in
// modules.json than its user and a test of that provider runs it. The user marks the hand-built value with a line comment on
// the line of the candidate or up to MARK_SPAN lines above it (the nearest marker above a candidate is the one that covers it):
//     // fixtures-contract: <provider-module> <contract-id>
// and a file under the provider's `tests` runs the contract against the provider's real code and says so with
//     // fixtures-run: <user-module> <contract-id>
// (<contract-id>: letters, digits, `.`, `-`, `_`; one id names one contract, which may cover many candidates). A marker whose
// provider is not later fails (tag `contract-not-later`: use the provider's published fixture, K4990), as does one the provider
// does not run (`contract-no-run`), one naming an unknown module (`contract-unknown-provider`), one covering no candidate
// (class `contract`, tag `idle`), and a `fixtures-run` no user marks (class `contract`, tag `orphan-run`). Class `code` is never accepted.
// Usage: node checks/fixtures.mjs <product-root> [module ...] [--list]
//   --list prints every candidate (accepted ones too) as `<class> <user> <file>:<line> <status> <tag> <provider> imports:<modules> <excerpt>`
//   for the reading workers, then the summary, and exits 0.
import { readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readModules, trackedFiles, ownerIndex, notProduct, report } from './lib.mjs';
import { scan } from './words.mjs';

const CODE_EXT = /\.(mjs|js|cjs|ts|tsx|jsx)$/;
const TEXT_EXT = /\.(mjs|js|cjs|ts|tsx|jsx|json|jsonc|html|css|sql|toml|yml|yaml)$/;
const SKIP_DIR = /(^|\/)(node_modules|dist|vendor|vendored|generated|coverage|\.git)\//;
const MAX_BYTES = 3 << 20;
export const MARK_SPAN = 8; // a contract marker covers its own line and this many lines below it
export const INTERFACE_NAMES = ['registerJob', 'readHeld', 'armJobs', 'owedLater', 'keepLater', 'deliver', 'partsOf',
  'deliverOwedRender', 'owedFetch', 'owedRun', 'homeOf', 'registerHolds', 'accountFor']; // the audit's seams (K4990, K4995)
export const STAND_FOR = { jobRegistrarStub: 'registerJob' }; // a named stub whose interface its name does not say
const STUB_WORD = /^(fake|stub|double)([A-Z0-9_]|$)|[a-z0-9_](Stub|Fake|Double)([A-Z0-9_]|$)|^(Stub|Fake|Double)([A-Z0-9_]|$)/;
// Platform doubles (bio K4996 tightening): stand-ins for the platform, not another module's interface; never reported as stubs.
export const PLATFORM_DOUBLE = /^(FakeDate|fakeBinding|alarmDouble|(fake|stub|double|mock)(Date|Clock|Timers?|Now|Fetch|R2|DO|Do|KV|Bucket|Binding|Bindings|Alarm|Storage|Miniflare|Workerd|Crypto|Random|Sleep)([A-Z0-9_]\w*)?|\w*([Dd]ate|[Cc]lock|[Ff]etch|R2|DO|KV|[Bb]ucket|[Bb]inding|[Aa]larm|[Mm]iniflare|[Ww]orkerd)(Stub|Fake|Double))$/;
const BARE_SPY = /^(stubs?|fakes?|doubles?)$/; // a local spy: counts only where it stands in for another module's exported name
const HAND_BUILDER = /(^|\.)(json|resolve|reject|resolves|rejects|mockResolvedValue|mockReturnValue)$|^Response$/;
const CODE_RE = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/;
const CODE_IN_TEXT = /\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g;
const CODE_KEYS = new Set(['reason', 'code', 'error', 'failure_class', 'refusal', 'why']);
const REFUSAL_KEYS = ['reason', 'detail', 'refusal', 'error', 'failure_class'];
const OWED_KEYS = ['done', 'final', 'outstanding', 'waiting_on'];
const EXPECT_CALLEE = /^(assert|expect)(\.|$)|\.(assert|deepEqual|deepStrictEqual|strictEqual|notStrictEqual|notDeepEqual|notDeepStrictEqual|equal|notEqual|match|doesNotMatch|rejects|doesNotReject|throws|doesNotThrow|ok|partialDeepStrictEqual|toEqual|toBe|toMatchObject)$/;
const CONTRACT_RE = /\/\/\s*fixtures-contract:\s*([\w.-]+)\s+([\w.-]+)/;
const RUN_RE = /\/\/\s*fixtures-run:\s*([\w.-]+)\s+([\w.-]+)/;
const OPEN = '([{', CLOSE = ')]}';
// the index of the last token of the value that starts at j (up to a top-level `,`, `;` or the closing bracket)
function valueEnd(toks, match, j) {
  while (j < toks.length) {
    const t = toks[j];
    if (t.t === 'p' && OPEN.includes(t.v)) { if (match[j] < 0) return j; j = match[j] + 1; continue; }
    if (t.t === 'p' && (CLOSE.includes(t.v) || t.v === ',' || t.v === ';')) return j - 1;
    j++;
  }
  return j - 1;
}
// the token range [a, b] of the function or value a name at k is bound to (`function n() {}`, `n = ..`, `n: ..`, `n() {}`), else null
function regionFrom(toks, match, k) {
  const p = toks[k - 1], nx = toks[k + 1];
  if (p && p.t === 'id' && (p.v === 'function' || p.v === 'class' || (p.v === 'async' && toks[k - 2] && toks[k - 2].v === 'function'))) {
    let j = k + 1; if (isP(toks[j], '(') && match[j] > 0) j = match[j] + 1;
    return isP(toks[j], '{') && match[j] > 0 ? [k, match[j]] : null;
  }
  if (isP(nx, '=') && !isP(toks[k + 2], '=')) return [k + 2, valueEnd(toks, match, k + 2)];
  if (isP(nx, ':')) return [k + 2, valueEnd(toks, match, k + 2)];
  if (isP(nx, '(') && match[k + 1] > 0 && isP(toks[match[k + 1] + 1], '{') && match[match[k + 1] + 1] > 0) return [k, match[match[k + 1] + 1]];
  return null;
}

// ---- token helpers -----------------------------------------------------------------------------------------------
// match[k] = index of the bracket closing the one at k (or -1); parent[k] = index of the innermost bracket open at k.
function brackets(toks) {
  const match = new Int32Array(toks.length).fill(-1);
  const parent = new Int32Array(toks.length).fill(-1);
  const stack = [];
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    parent[k] = stack.length ? stack[stack.length - 1] : -1;
    if (t.t === 'p' && OPEN.includes(t.v)) stack.push(k);
    else if (t.t === 'p' && CLOSE.includes(t.v) && stack.length) { const o = stack.pop(); match[o] = k; parent[k] = stack.length ? stack[stack.length - 1] : -1; }
  }
  return { match, parent };
}
const isP = (t, v) => t && t.t === 'p' && t.v === v;
// the callee text of the call whose `(` is at k: `assert.deepEqual`, `run`; null when the paren only groups
function calleeOf(toks, k) {
  const prev = toks[k - 1];
  if (!prev || prev.t !== 'id') return null;
  let s = prev.v, j = k - 2;
  while (j >= 1 && isP(toks[j], '.') && toks[j - 1].t === 'id') { s = `${toks[j - 1].v}.${s}`; j -= 2; }
  if (/^(if|for|while|switch|catch|function|return|typeof|await|in|of)$/.test(s)) return null;
  return s;
}
function insideExpectation(toks, parent, k) {
  for (let p = parent[k]; p >= 0; p = parent[p]) {
    if (!isP(toks[p], '(')) continue;
    const callee = calleeOf(toks, p);
    if (callee) return EXPECT_CALLEE.test(callee);
  }
  return false;
}
// the top-level keys of the object literal opening at k, with the index of each key's value
function objectKeys(toks, match, k) {
  const end = match[k];
  const keys = new Map();
  let j = k + 1;
  while (j < end) {
    const t = toks[j];
    if (isP(t, ',')) { j++; continue; }
    if (isP(t, '.')) { // `...expr`: a spread is no key; skip its expression
      j += 3;
      while (j < end && !isP(toks[j], ',')) { const u = toks[j]; j = (u.t === 'p' && OPEN.includes(u.v) && match[j] > 0) ? match[j] + 1 : j + 1; }
      continue;
    }
    if (t.t === 'p' && OPEN.includes(t.v)) { j = (match[j] < 0 ? end : match[j]) + 1; continue; }
    if (t.t === 'id' || t.t === 'str' || t.t === 'num') {
      let name = t.v, at = j;
      if (t.v === 'async' && toks[j + 1] && toks[j + 1].t === 'id' && isP(toks[j + 2], '(')) { name = toks[j + 1].v; at = j + 1; j++; }
      const nx = toks[at + 1];
      if (isP(nx, ':')) { keys.set(name, at + 2); j = at + 2; }
      else if (isP(nx, ',') || at + 1 >= end) { keys.set(name, -1); j = at + 1; }
      else if (isP(nx, '(')) { keys.set(name, at + 1); j = at + 1; } // method shorthand
      else j = at + 1;
      // skip the value up to the next top-level comma
      while (j < end && !isP(toks[j], ',')) { const u = toks[j]; j = (u.t === 'p' && OPEN.includes(u.v) && match[j] > 0) ? match[j] + 1 : j + 1; }
      continue;
    }
    j++;
  }
  return keys;
}
const isObjectStart = (toks, k) => {
  const p = toks[k - 1];
  if (!p) return false;
  if (p.t === 'p') return '(,=:[?&|!'.includes(p.v) && !(p.v === '=' && false);
  return p.t === 'id' && (p.v === 'return' || p.v === 'yield');
};

// ---- the check -----------------------------------------------------------------------------------------------------
export function checkFixtures(root, only = []) {
  const state = readModules(root);
  const owner = ownerIndex(state);
  const outside = notProduct(state);
  const order = new Map(state.modules.map((m, i) => [m.id, i]));
  const files = trackedFiles(root);
  const fileSet = new Set(files);
  const read = (f) => { try { return readFileSync(join(root, f), 'utf8'); } catch { return ''; } };

  // 1. product source: refusal codes and interface definitions by module
  const codeMods = new Map(); // code -> Set(module)
  const defMods = new Map(); // interface name -> Set(module)
  const exportMods = new Map(); // exported name (6+ characters) -> Set(module) of product source
  const defRes = INTERFACE_NAMES.map((n) => [n, new RegExp(`(?:function\\*?\\s+${n}\\b|(?:const|let|var|class)\\s+${n}\\b|(?<![.\\w])${n}\\s*[:=](?!=)\\s*(?:async\\b|function\\b|\\()|^\\s*(?:async\\s+)?${n}\\s*\\([^)]*\\)\\s*\\{)`, 'm')]);
  for (const f of files) {
    if (!TEXT_EXT.test(f) || SKIP_DIR.test(f) || outside(f)) continue;
    const o = owner(f);
    if (!o || o.role !== 'code' || o.module === 'test-support') continue;
    const text = read(f);
    if (text.length > MAX_BYTES) continue;
    for (const c of text.match(CODE_IN_TEXT) || []) { let s = codeMods.get(c); if (!s) codeMods.set(c, (s = new Set())); s.add(o.module); }
    if (CODE_EXT.test(f)) {
      const names = [...text.matchAll(/export\s+(?:async\s+)?(?:function\*?|const|let|class)\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]);
      for (const m of text.matchAll(/export\s*\{([^}]*)\}/g)) for (const part of m[1].split(',')) { const nm = part.split(/\s+as\s+/).pop().trim(); if (nm) names.push(nm); }
      for (const nm of names) if (nm.length >= 6) { let st = exportMods.get(nm); if (!st) exportMods.set(nm, (st = new Set())); st.add(o.module); }
    }
    if (CODE_EXT.test(f)) for (const [n, re] of defRes) if (text.includes(n) && re.test(text)) { let s = defMods.get(n); if (!s) defMods.set(n, (s = new Set())); s.add(o.module); }
  }

  // 2. the test files
  const testFiles = [];
  for (const f of files) {
    if (!CODE_EXT.test(f) || SKIP_DIR.test(f) || outside(f)) continue;
    const o = owner(f);
    if (!o) continue;
    if (o.role === 'tests' || o.module === 'test-support') testFiles.push({ f, module: o.module });
  }
  const fileOwnerModule = (f) => { const o = owner(f); return o ? o.module : null; };
  const resolveImport = (from, spec) => {
    if (!spec.startsWith('.')) return null;
    const base = posix.normalize(posix.join(posix.dirname(from), spec));
    for (const c of [base, `${base}.mjs`, `${base}.js`, `${base}.ts`, `${base}/index.mjs`, `${base}/index.js`]) if (fileSet.has(c)) return c;
    return null;
  };

  const parsed = []; // { f, module, src, lines, toks, match, parent, imports: Map(name -> module), importMods: Set }
  const declMods = new Map(); // name (stub-like) -> Set(module) declaring it anywhere in the scanned files
  const contracts = []; // { user, file, line, provider, id }
  const runs = []; // { provider, file, line, user, id }
  for (const { f, module } of testFiles) {
    const src = read(f);
    if (src.length > MAX_BYTES) continue;
    let toks;
    try { toks = scan(src); } catch { continue; }
    const { match, parent } = brackets(toks);
    const lines = src.split('\n');
    const imports = new Map(); const importMods = new Set();
    const importMod = (spec) => { const r = resolveImport(f, spec); const m = r ? fileOwnerModule(r) : null; if (m && m !== module) importMods.add(m); return m; };
    for (let k = 0; k < toks.length; k++) {
      const t = toks[k];
      if (t.t === 'id' && t.v === 'from' && toks[k + 1] && toks[k + 1].t === 'str') {
        const m = importMod(toks[k + 1].v);
        // the names between `import` and `from`
        for (let j = k - 1; j >= 0 && !(toks[j].t === 'id' && toks[j].v === 'import'); j--) if (toks[j].t === 'id' && m) imports.set(toks[j].v, m);
      } else if (t.t === 'id' && (t.v === 'import' || t.v === 'require') && isP(toks[k + 1], '(') && toks[k + 2] && toks[k + 2].t === 'str') importMod(toks[k + 2].v);
      else if (t.t === 'id' && t.v === 'import' && toks[k + 1] && toks[k + 1].t === 'str') importMod(toks[k + 1].v);
      if (t.t === 'id' && STUB_WORD.test(t.v)) {
        const p = toks[k - 1];
        const decl = (p && p.t === 'id' && /^(function|const|let|var|class)$/.test(p.v)) || (isP(toks[k + 1], ':') && p && p.t === 'p' && '{,'.includes(p.v));
        if (decl) { let s = declMods.get(t.v); if (!s) declMods.set(t.v, (s = new Set())); s.add(module); }
      }
    }
    lines.forEach((ln, i) => {
      let m = CONTRACT_RE.exec(ln); if (m) contracts.push({ user: module, file: f, line: i + 1, provider: m[1], id: m[2] });
      m = RUN_RE.exec(ln); if (m) runs.push({ provider: module, file: f, line: i + 1, user: m[1], id: m[2] });
    });
    parsed.push({ f, module, src, lines, toks, match, parent, imports, importMods });
  }

  // 3. candidates
  const cands = []; // { cls, user, file, line, tag, text, providers: [], imports: [], note }
  const excerpt = (lines, line) => { const s = (lines[line - 1] || '').trim().replace(/\s+/g, ' '); return s.length > 100 ? `${s.slice(0, 97)}...` : s; };
  const mkProviders = (set, user) => [...(set || [])].filter((m) => m !== user).sort((a, b) => (order.get(a) ?? 1e9) - (order.get(b) ?? 1e9));
  for (const pf of parsed) {
    const { f, module: user, lines, toks, match, parent, imports, importMods } = pf;
    if (only.length && !only.includes(user)) continue;
    const imp = [...importMods].sort();
    const add = (cls, line, tag, providers, extra = {}) => cands.push({ cls, user, file: f, line, tag, text: excerpt(lines, line), providers, imports: imp, ...extra });
    // regions of stubs and doubles (their bodies and values), and where each refusal-code literal sits (assertion or not)
    const regions = [];
    for (let k = 0; k < toks.length; k++) {
      const t = toks[k];
      if (t.t !== 'id') continue;
      const named = STUB_WORD.test(t.v) && !PLATFORM_DOUBLE.test(t.v);
      const iface = INTERFACE_NAMES.includes(t.v) && !(defMods.get(t.v) || new Set()).has(user);
      if (!named && !iface) continue;
      const r = regionFrom(toks, match, k);
      if (r) regions.push(r);
    }
    const inRegion = (k) => regions.some(([a, b]) => k >= a && k <= b);
    const calledStub = (k) => { // inside the arguments of a call of a stub, double or listed seam: answered by one
      for (let q = parent[k]; q >= 0; q = parent[q]) if (isP(toks[q], '(')) { const c = calleeOf(toks, q); if (c && c.split('.').some((x) => (STUB_WORD.test(x) && !PLATFORM_DOUBLE.test(x)) || INTERFACE_NAMES.includes(x))) return true; }
      return false;
    };
    const occ = new Map(); // code literal -> { inside, outside }
    for (let k = 0; k < toks.length; k++) {
      const t = toks[k];
      if (t.t !== 'str' || !CODE_RE.test(t.v)) continue;
      const o = occ.get(t.v) || { inside: 0, outside: 0 };
      if (insideExpectation(toks, parent, k)) o.inside++; else o.outside++;
      occ.set(t.v, o);
    }
    const passThrough = (code) => { const o = occ.get(code); return !!o && o.inside >= 1 && o.outside >= 1; }; // fed in, and its coming out asserted
    // answer
    const flagged = []; // [from, to] token ranges of flagged literals
    for (let k = 0; k < toks.length; k++) {
      if (!isP(toks[k], '{') || match[k] < 0 || !isObjectStart(toks, k)) continue;
      if (flagged.some(([a, b]) => k > a && k < b)) continue;
      const keys = objectKeys(toks, match, k);
      if (!keys.size) continue;
      let shape = null;
      const okLit = keys.has('ok') && keys.get('ok') > 0 && toks[keys.get('ok')].t === 'id' && /^(true|false)$/.test(toks[keys.get('ok')].v); // `ok` written as true or false
      if (okLit && REFUSAL_KEYS.some((x) => keys.has(x))) shape = 'refusal';
      else if (okLit && OWED_KEYS.some((x) => keys.has(x))) shape = 'owed';
      else if (keys.has('extent')) { const v = keys.get('extent'); if (v > 0 && isP(toks[v], '{') && toks[v + 1] && (toks[v + 1].v === 'kind') && isP(toks[v + 2], ':')) shape = 'extent'; }
      if (!shape) continue;
      if (shape === 'extent' && !(inRegion(k) || calledStub(k))) continue; // extent data passed in, not an answer: only inside a stub or double, or given to one
      if (shape !== 'extent' && parent[k] >= 0 && isP(toks[parent[k]], '(')) { // a direct argument of a call
        const c = calleeOf(toks, parent[k]);
        const stubby = c && (c.split('.').some((x) => (STUB_WORD.test(x) && !PLATFORM_DOUBLE.test(x)) || INTERFACE_NAMES.includes(x)) || HAND_BUILDER.test(c));
        if (c && !stubby && (c.includes('.') || (imports.has(c) && imports.get(c) !== user))) continue; // an input handed to the real provider or a harness helper
      }
      if (insideExpectation(toks, parent, k)) continue;
      // the code it names, and whom it belongs to
      let code = null;
      for (const name of ['reason', 'code', 'error']) { const v = keys.get(name); if (v > 0 && toks[v] && toks[v].t === 'str' && CODE_RE.test(toks[v].v)) { code = toks[v].v; break; } }
      if (!code) for (let j = k + 1; j < match[k]; j++) if (toks[j].t === 'str' && CODE_RE.test(toks[j].v) && isP(toks[j - 1], ':') && CODE_KEYS.has(toks[j - 2] && toks[j - 2].v)) { code = toks[j].v; break; }
      let providers = [], tag = shape;
      if (code) {
        const owners = codeMods.get(code);
        if (owners && owners.has(user)) continue; // the user's own shape
        if (!owners) { if (passThrough(code)) tag = shape; else tag = `${shape} invented ${code}`; } else providers = mkProviders(owners, user);
      }
      flagged.push([k, match[k]]);
      add('answer', toks[k].line, tag, providers, { invented: !!code && !codeMods.get(code) && !passThrough(code) });
    }
    // stub: named doubles, once per file and name
    const seen = new Set();
    for (let k = 0; k < toks.length; k++) {
      const t = toks[k];
      if (t.t !== 'id') continue;
      if (STUB_WORD.test(t.v) && !PLATFORM_DOUBLE.test(t.v) && !seen.has(t.v)) {
        if (isP(toks[k - 1], '.') ) continue; // a member of something else
        const p = toks[k - 1];
        const decl = (p && p.t === 'id' && /^(function|const|let|var|class)$/.test(p.v)) || (isP(toks[k + 1], ':') && p && p.t === 'p' && '{,'.includes(p.v));
        if (BARE_SPY.test(t.v)) { // a local spy: only where it stands in for another module's exported name
          if (!decl) continue;
          const touched = new Set();
          const r = regionFrom(toks, match, k);
          if (r) for (let j = r[0]; j <= r[1]; j++) if (toks[j].t === 'id' && ((isP(toks[j + 1], ':') && toks[j - 1] && toks[j - 1].t === 'p' && '{,'.includes(toks[j - 1].v)) || (isP(toks[j - 1], '.') && isP(toks[j + 1], '=')))) touched.add(toks[j].v);
          for (let j = 0; j < toks.length; j++) if (toks[j].t === 'id' && toks[j].v === t.v && isP(toks[j + 1], '.') && toks[j + 2] && toks[j + 2].t === 'id' && isP(toks[j + 3], '=')) touched.add(toks[j + 2].v);
          const hit = [...touched].find((nm) => mkProviders(exportMods.get(nm), user).length);
          if (!hit) continue;
          seen.add(t.v);
          add('stub', t.line, `spy standing in ${hit}`, mkProviders(exportMods.get(hit), user));
          continue;
        }
        seen.add(t.v);
        let tag = decl ? 'decl' : imports.has(t.v) ? 'import' : 'use';
        let provSet;
        if (STAND_FOR[t.v]) provSet = defMods.get(STAND_FOR[t.v]);
        if (!provSet && imports.has(t.v) && imports.get(t.v) !== user) provSet = new Set([imports.get(t.v)]);
        if (!provSet && !decl) provSet = declMods.get(t.v);
        if (!provSet) { // the interface the name stands for, by its name without the Stub/Fake/Double word
          const bare = t.v.replace(/^(fake|stub|double)(?=[A-Z0-9_])/, '').replace(/(Stub|Fake|Double)$/, '');
          const cand = bare ? bare[0].toLowerCase() + bare.slice(1) : '';
          provSet = defMods.get(cand);
        }
        add('stub', t.line, tag, mkProviders(provSet, user));
      }
      // stub: a function standing in for an interface the user does not define
      if (INTERFACE_NAMES.includes(t.v) && !(defMods.get(t.v) || new Set()).has(user)) {
        const p = toks[k - 1], nx = toks[k + 1];
        let stand = false;
        if (isP(p, '.')) stand = isP(nx, '=') && !isP(toks[k + 2], '=');
        else if (p && p.t === 'id' && /^(function|const|let|var)$/.test(p.v)) stand = true;
        else if (p && p.t === 'id' && p.v === 'async' && toks[k - 2] && toks[k - 2].v === 'function') stand = true;
        else if (isP(nx, ':') && p && p.t === 'p' && '{,'.includes(p.v)) {
          const v = toks[k + 2]; stand = !!v && ((v.t === 'id' && (v.v === 'async' || v.v === 'function')) || isP(v, '(') || (v.t === 'id' && isP(toks[k + 3], '=') && isP(toks[k + 4], '>')));
        } else if (isP(nx, '(') && p && p.t === 'p' && '{,'.includes(p.v) && match[k + 1] > 0 && isP(toks[match[k + 1] + 1], '{') && parent[k] >= 0 && isP(toks[parent[k]], '{')) stand = true;
        else if (isP(p, '=') ) stand = false;
        if (stand) add('stub', t.line, `stand-in ${t.v}`, mkProviders(defMods.get(t.v), user));
      }
    }
    // code: a refusal-shaped literal no source gives
    for (let k = 0; k < toks.length; k++) {
      const t = toks[k];
      if (t.t !== 'str' || !CODE_RE.test(t.v) || codeMods.has(t.v)) continue;
      let at = false;
      for (let j = k - 1; j >= 0 && j >= k - 6; j--) { const u = toks[j]; if (u.t === 'p' && ';{}'.includes(u.v)) break; if (u.t === 'id' && CODE_KEYS.has(u.v)) { at = true; break; } }
      if (!at) for (let j = k + 1; j < toks.length && j <= k + 5; j++) { const u = toks[j]; if (u.t === 'p' && ';{}'.includes(u.v)) break; if (u.t === 'id' && CODE_KEYS.has(u.v) && isP(toks[j - 1], '.')) { at = true; break; } }
      if (!at) continue;
      if (passThrough(t.v)) continue; // fed in and asserted to come out: the test's own pass-through data
      if (cands.some((c) => c.cls === 'answer' && c.file === f && c.line === t.line && c.invented)) continue; // carried by the answer's tag
      if (flagged.some(([a, b]) => k > a && k < b)) continue;
      add('code', t.line, '', []);
    }
  }

  // 4. contracts: acceptance and the markers' own failures
  const contractUsed = new Set();
  const runKey = (provider, user, id) => `${provider}\0${user}\0${id}`;
  const runSet = new Set(runs.map((r) => runKey(r.provider, r.user, r.id)));
  for (const c of cands) {
    c.status = 'fail'; c.relation = relationOf(c, order);
    if (c.cls === 'code') continue;
    const mk = contracts.filter((x) => x.file === c.file && x.line <= c.line && c.line <= x.line + MARK_SPAN).sort((a, b) => b.line - a.line)[0]; // the nearest marker above
    if (!mk) continue;
    contractUsed.add(mk);
    if (!order.has(mk.provider)) { c.tag = `${c.tag} contract-unknown-provider`.trim(); continue; }
    if (!(order.get(mk.provider) > order.get(c.user))) { c.tag = `${c.tag} contract-not-later`.trim(); c.providers = [mk.provider]; c.relation = relationOf(c, order); continue; }
    if (!runSet.has(runKey(mk.provider, c.user, mk.id))) { c.tag = `${c.tag} contract-no-run`.trim(); c.providers = [mk.provider]; c.relation = relationOf(c, order); continue; }
    c.status = 'accepted'; c.providers = [mk.provider]; c.relation = 'later'; c.contract = mk.id;
  }
  const extra = []; // class contract: markers that hold nothing
  for (const mk of contracts) if (!contractUsed.has(mk) && (!only.length || only.includes(mk.user))) extra.push({ cls: 'contract', user: mk.user, file: mk.file, line: mk.line, tag: 'idle', text: `fixtures-contract: ${mk.provider} ${mk.id}`, providers: [mk.provider], imports: [], status: 'fail', relation: '' });
  const marked = new Set(contracts.map((c) => runKey(c.provider, c.user, c.id)));
  for (const r of runs) if (!marked.has(runKey(r.provider, r.user, r.id)) && (!only.length || only.includes(r.user) || only.includes(r.provider))) extra.push({ cls: 'contract', user: r.user, file: r.file, line: r.line, tag: 'orphan-run', text: `fixtures-run: ${r.user} ${r.id}`, providers: [r.provider], imports: [], status: 'fail', relation: '' });
  const all = [...cands, ...extra].sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line));

  const fmtProv = (c) => (c.providers.length ? `${c.providers.join(',')} (${c.relation})` : '?');
  const failing = all.filter((c) => c.status === 'fail');
  const failures = failing.map((c) => `${c.cls} ${c.user} ${c.file}:${c.line} ${c.tag ? `[${c.tag}] ` : ''}${c.text} -> ${fmtProv(c)}`).sort();
  const listing = all.map((c) => `${c.cls} ${c.user} ${c.file}:${c.line} ${c.status === 'accepted' ? `accepted(${c.contract})` : 'fail'} ${c.tag ? `[${c.tag}] ` : ''}-> ${fmtProv(c)} imports:${c.imports.join(',') || '-'} | ${c.text}`);
  const n = (cls) => failing.filter((c) => c.cls === cls).length;
  const byUser = {};
  for (const c of failing) { const u = (byUser[c.user] ??= { answer: 0, stub: 0, code: 0, contract: 0, total: 0 }); u[c.cls]++; u.total++; }
  const invented = failing.filter((c) => c.invented).length;
  const accepted = all.filter((c) => c.status === 'accepted').length;
  const summary = `${parsed.length} test files read, ${state.modules.length} modules; answer ${n('answer')} (${invented} with an invented code), stub ${n('stub')}, code ${n('code')}, contract ${n('contract')}, accepted ${accepted}`;
  return { failures, summary, listing, byUser, items: all, totals: { answer: n('answer'), stub: n('stub'), code: n('code'), contract: n('contract'), accepted, invented } };
}

function relationOf(c, order) {
  if (!c.providers.length) return '?';
  const me = order.get(c.user);
  const rel = c.providers.map((p) => (order.get(p) > me ? 'later' : 'earlier'));
  return rel.every((r) => r === rel[0]) ? rel[0] : 'mixed';
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const args = process.argv.slice(2);
  const pos = args.filter((a) => !a.startsWith('--'));
  const r = checkFixtures(pos[0] || '.', pos.slice(1));
  if (args.includes('--list')) {
    for (const l of r.listing) console.log(l);
    console.log(`fixtures: ${r.summary}; ${r.failures.length} failure${r.failures.length === 1 ? '' : 's'}`);
    process.exitCode = 0;
  } else process.exitCode = report('fixtures', r.failures, r.summary);
}
