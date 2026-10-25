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
// Third pass: a bare spy's exported name must be compound (not one lower-case word such as `settings`); an answer literal inside the arguments of a
// plug-in registrar call (`register*`, `on*`, but not a listed seam) is the user's own code; a literal that is a direct argument of a function the user
// module imports from its OWN product source is an input; a code under a data key (`why`, `data`, `meta`, `payload`, `extra`, `fields`, `input`,
// `args`, `params`) is data, and `why` is no longer a code key.
// Fourth pass: a refusal/owed literal nested in an object or list that is itself the argument of such an input call is an input; a `why`-keyed
// `ok` literal (no `reason`) and a `code` in an object pushed into a list (`findings.push({ code })`) are the module's own data; a stub or double name
// imported from the user's own product source is its own double and skipped.
// K5044 (the T51 fixture audit's rules). (1) Skipped as not another module's answer: a platform double (a named stub whose value has a `fetch`
// member, i.e. a Durable Object or store double, with its `{ok, result}` wrapper and trap branches; fakeCtx, installRuntime, loadWorker; stubSdk,
// stubClaude; a `{head, get, put}` bucket; a `{calls, binding}` double; an IndexedDB double by name; the literals inside any `fetch` stand-in);
// a fault injection (a stand-in whose body only throws, never settles `new Promise(() => {})`, returns undefined, or returns a nameless
// `{ok:false}`); a delegating wrapper or spy (its body calls the same-named function of another object); a pass-through (an answer literal whose
// code the same test also asserts, as for codes; a raw `{ok:false, error: e.stack|e.message}`; a lower_snake `reason`, a provider's vocabulary);
// the user's own seam (a literal handed through `.transact(`, the user's own export or a local wrapper of it, or under a `check`/`validate`
// key); harness-own values (test-support's own tests, its generators `*gen.mjs`/corpus/seeded/make-*, an object naming `test-shell`, stub names
// imported from the user's own tests); a name clash (a local `function deliver` never handed in as a value; `double_`/`fake_`/`stub_` snake_case
// keys); an expected value held in a variable used only inside assertions. A template `PREFIX_${..}` in source gives every code with that prefix.
// (2) `// fixtures-generic: <CODE>` on the candidate's line or up to MARK_SPAN lines above accepts a code made up on purpose (an invented code, a
// sentinel; class code too); a code it does not name stays a finding; a marker that covers no candidate fails (class contract, tag `idle-generic`).
// (3a) A local builder (a test function whose body builds a refusal or owed literal whose reason/code/error is a parameter) is reported at EACH
// call site, tag `builder <name>` (+ `invented <CODE>`), provider resolved from the code argument; its own literal is then not reported.
// (3b) A scripted op table: an object literal key that is a product op name, with a value (function or object) that builds an `{ok: ..}` answer,
// is one answer finding per entry, tag `op-table <op>`, provider the module declaring the op (the user's own op: skipped). Op names are read from
// product source (not test-support): the top-level keys of `DECLARED_OPS = Object.freeze({..})`, and of the object a function named `<x>Ops`
// returns at its own top level (`answersOps(..) { return { rule: .., .. } }`); a value that holds a further op table is judged at its entries.
// (4) A `fixtures-contract` marker in a test-support (harness) file covers the whole value (declaration) that follows it, and every import of
// that value in other modules' tests; the provider's tests must carry `// fixtures-run: test-support <id>`, as for any contract.
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
// K5044 (1): further platform names (the Workers runtime, ctx and loader; the Agent SDK and CLI; the Durable Object and store doubles the ruling names)
// (the Durable Object and store doubles, such as stubOf, fakeStore, newStub, stubFor, dumbStub, bootstrapStub, acquireStub, stubStore, stubOver,
// are found by their value: a `fetch` member)
export const PLATFORM_NAMES = new Set(['fakeCtx', 'installRuntime', 'loadWorker', 'stubSdk', 'stubClaude']);
const PLATFORM_EXTRA = /^(fake|stub|double|mock)(Ctx|Context|Sdk|Cli|Claude|Runtime|Loader|Idb|IndexedDb|IndexedDB)([A-Z0-9_]\w*)?$|^(Idb|IDB|IndexedDb|IndexedDB)\w*(Stub|Fake|Double)$/;
const SNAKE_DATA = /^(fake|stub|double)_[a-z0-9_]*$/; // a snake_case data key (`double_speak_or_reversal`), no double
const IDB_NAME = /idb|indexeddb/i;
const GENERATOR_FILE = /(^|\/)([\w-]*gen|corpus|seeded|make-[\w-]+)\.m?js$/; // test-support's generators: their vocabulary is their own
const LOWER_SNAKE = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/; // an external provider's reason vocabulary (`overloaded_error`)
const CHECK_KEYS = new Set(['check', 'validate']); // the user's own seam: a literal under one of these keys
const GENERIC_RE = /\/\/\s*fixtures-generic:\s*([\w.-]+)/;
const TEMPLATE_PREFIX_RE = /([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_)\$\{/g; // `BAD_${name}`: a code the product builds
const BARE_SPY = /^(stubs?|fakes?|doubles?)$/; // a local spy: counts only where it stands in for another module's exported name
const HAND_BUILDER = /(^|\.)(json|resolve|reject|resolves|rejects|mockResolvedValue|mockReturnValue)$|^Response$/;
const CODE_RE = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/;
const CODE_IN_TEXT = /\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g;
const CODE_KEYS = new Set(['reason', 'code', 'error', 'failure_class', 'refusal']);
const DATA_KEYS = new Set(['why', 'data', 'meta', 'payload', 'extra', 'fields', 'input', 'args', 'params']); // an object under one of these is data, its `code` a field
const PLUGIN_CALLEE = /^(register[A-Z]\w*|on[A-Z]\w*)$/; // a plug-in registrar (`promotion.registerStep`, `onAlarm`): what is handed to it is the user's own code
const GENERIC_EXPORT = /^[a-z]+$/; // an exported name of one lower-case word (`settings`, `config`) is a common property name, not a seam
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

// ---- K5044 helpers: function bodies, fault injection, builders --------------------------------------------------
const arrowAt = (toks, j) => isP(toks[j], '=') && isP(toks[j + 1], '>');
// the inner token range [s, e] of the function whose text starts at a (`function f(..) {..}`, `async (..) => ..`, `x => ..`, `f(..) {..}`), else null
function fnBody(toks, match, a, b) {
  let j = a;
  if (toks[j] && toks[j].t === 'id' && toks[j].v === 'async' && !isP(toks[j + 1], '(')) j++;
  if (toks[j] && toks[j].t === 'id' && toks[j].v === 'function') { j++; if (toks[j] && toks[j].t === 'id') j++; }
  else if (toks[j] && toks[j].t === 'id' && !isP(toks[j + 1], '(')) { if (arrowAt(toks, j + 1)) return arrowBody(toks, match, j + 3, b); return null; }
  else if (toks[j] && toks[j].t === 'id' && isP(toks[j + 1], '(') && match[j + 1] > 0 && isP(toks[match[j + 1] + 1], '{')) j++; // method shorthand
  if (!isP(toks[j], '(') || match[j] < 0) return null;
  j = match[j] + 1;
  if (arrowAt(toks, j)) return arrowBody(toks, match, j + 2, b);
  return isP(toks[j], '{') && match[j] > 0 ? [j + 1, match[j] - 1] : null;
}
function arrowBody(toks, match, j, b) {
  if (isP(toks[j], '{') && match[j] > 0) return [j + 1, match[j] - 1];
  return [j, Math.max(j, b)];
}
// does the token range [s, e] read `new Promise(() => {})` (never settles)
function neverSettles(toks, s, e) {
  for (let j = s; j <= e; j++) if (toks[j].t === 'id' && toks[j].v === 'new' && toks[j + 1] && toks[j + 1].v === 'Promise' && isP(toks[j + 2], '(') && isP(toks[j + 3], '(') && isP(toks[j + 4], ')') && arrowAt(toks, j + 5) && isP(toks[j + 7], '{') && isP(toks[j + 8], '}')) return true;
  return false;
}
// a stand-in that is a fault: its body only throws, never settles, returns undefined, or returns a nameless `{ok:false}`
function isFaultFn(toks, match, parent, a, b, literalFault) {
  const body = fnBody(toks, match, a, b);
  if (!body) return false;
  const [s, e] = body;
  if (s > e) return true; // an empty body
  if (e === s && toks[s].t === 'id' && toks[s].v === 'undefined') return true;
  if (neverSettles(toks, s, e)) return true;
  let throws = false, valueReturn = false, anyReturn = false;
  for (let j = s; j <= e; j++) {
    const t = toks[j];
    if (t.t !== 'id') continue;
    if (t.v === 'throw') throws = true;
    if (t.v === 'return') { anyReturn = true; const n = toks[j + 1]; if (n && !(isP(n, ';') || isP(n, '}') || (n.t === 'id' && n.v === 'undefined'))) valueReturn = true; }
  }
  if (!isP(toks[s - 1], '{')) { // an expression body: a value, not a statement list
    return literalFault ? literalFault(s, e) : false;
  }
  if (throws && !valueReturn) return true;
  if (!valueReturn && !throws) return true; // nothing returned: undefined
  return literalFault ? literalFault(s, e) : false;
}
// the parameter names of the function whose parameter list opens at j, by position (a destructured parameter holds several names)
function paramNames(toks, match, j) {
  const out = [[]]; const end = match[j];
  for (let q = j + 1; q < end; q++) {
    const t = toks[q];
    if (isP(t, ',')) { out.push([]); continue; }
    if (t.t === 'p' && OPEN.includes(t.v) && match[q] > 0) { for (let r = q + 1; r < match[q]; r++) if (toks[r].t === 'id') out[out.length - 1].push(toks[r].v); q = match[q]; continue; }
    if (t.t === 'id') out[out.length - 1].push(t.v);
    if (isP(t, '=')) { while (q + 1 < end && !isP(toks[q + 1], ',')) { q++; const u = toks[q]; if (u.t === 'p' && OPEN.includes(u.v) && match[q] > 0) q = match[q]; } }
  }
  return out;
}
// where the function text of the declaration whose name is at k starts (`function` or `async` before the name, or the token after `=`)
function declFnStart(toks, k) {
  const p = toks[k - 1];
  if (p && p.t === 'id' && p.v === 'function') return toks[k - 2] && toks[k - 2].v === 'async' ? k - 2 : k - 1;
  return k + 2;
}
// the parameter list opening of the function declared with its name at k (`function f(`, `const f = (`, `const f = async x =>`), as { open, params } or null
function declParams(toks, match, k) {
  const p = toks[k - 1];
  if (!p || p.t !== 'id') return null;
  if (p.v === 'function' || (p.v === 'async' && toks[k - 2] && toks[k - 2].v === 'function')) return isP(toks[k + 1], '(') && match[k + 1] > 0 ? { open: k + 1, params: paramNames(toks, match, k + 1) } : null;
  if (!/^(const|let|var)$/.test(p.v) || !isP(toks[k + 1], '=')) return null;
  let j = k + 2;
  if (toks[j] && toks[j].t === 'id' && toks[j].v === 'async' && !arrowAt(toks, j + 1)) j++;
  if (toks[j] && toks[j].t === 'id' && toks[j].v === 'function') { j++; if (toks[j] && toks[j].t === 'id') j++; return isP(toks[j], '(') && match[j] > 0 ? { open: j, params: paramNames(toks, match, j) } : null; }
  if (isP(toks[j], '(') && match[j] > 0 && arrowAt(toks, match[j] + 1)) return { open: j, params: paramNames(toks, match, j) };
  if (toks[j] && toks[j].t === 'id' && arrowAt(toks, j + 1)) return { open: -1, params: [[toks[j].v]] };
  return null;
}

// K5044 (3b): the op names a product source declares. Method: the top-level keys of the object `DECLARED_OPS = Object.freeze({..})` holds,
// and the top-level keys of the object literal an ops-map function (a function or arrow named `<x>Ops`, e.g. `answersOps(a, url, body)`,
// not `...DeclaredOps`) returns, at its own body's top level (`return {..}` or `=> ({..})`), never keys of a nested arrow's reply.
function collectOps(text, module, opMods) {
  let toks;
  try { toks = scan(text); } catch { return; }
  const { match, parent } = brackets(toks);
  const add = (k) => { for (const name of objectKeys(toks, match, k).keys()) { let st = opMods.get(name); if (!st) opMods.set(name, (st = new Set())); st.add(module); } };
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    if (t.t !== 'id') continue;
    if (t.v === 'DECLARED_OPS' && isP(toks[k + 1], '=')) {
      for (let j = k + 2; j < k + 8 && j < toks.length; j++) if (isP(toks[j], '{')) { if (match[j] > 0) add(j); break; }
    } else if (/[a-z]Ops$/.test(t.v) && !/DeclaredOps$/.test(t.v) && !isP(toks[k - 1], '.')) {
      const dp = declParams(toks, match, k);
      if (!dp) continue;
      const body = fnBody(toks, match, declFnStart(toks, k), k + 2);
      if (!body) continue;
      const [s, e] = body;
      if (!isP(toks[s - 1], '{')) { if (isP(toks[s], '(') && isP(toks[s + 1], '{') && match[s + 1] > 0) add(s + 1); continue; }
      for (let j = s; j <= e; j++) if (toks[j].t === 'id' && toks[j].v === 'return' && isP(toks[j + 1], '{') && parent[j] === s - 1 && match[j + 1] > 0) add(j + 1);
    }
  }
}

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
  const prefixMods = new Map(); // K5044: PREFIX_ of a template `PREFIX_${..}` -> Set(module): matches any code with that prefix
  const opMods = new Map(); // K5044 (3b): op name -> Set(module) whose source declares it (DECLARED_OPS keys and the object an `...Ops` function returns)
  const ownersOf = (code) => { // the modules whose source gives a code, literally or by a template prefix
    let out = codeMods.get(code);
    for (const [pre, set] of prefixMods) if (code.startsWith(pre) && code.length > pre.length) { out = new Set([...(out || []), ...set]); }
    return out;
  };
  const defRes = INTERFACE_NAMES.map((n) => [n, new RegExp(`(?:function\\*?\\s+${n}\\b|(?:const|let|var|class)\\s+${n}\\b|(?<![.\\w])${n}\\s*[:=](?!=)\\s*(?:async\\b|function\\b|\\()|^\\s*(?:async\\s+)?${n}\\s*\\([^)]*\\)\\s*\\{)`, 'm')]);
  for (const f of files) {
    if (!TEXT_EXT.test(f) || SKIP_DIR.test(f) || outside(f)) continue;
    const o = owner(f);
    if (!o || o.role !== 'code' || o.module === 'test-support') continue;
    const text = read(f);
    if (text.length > MAX_BYTES) continue;
    for (const m of text.matchAll(TEMPLATE_PREFIX_RE)) if (m[1].length >= 4) { let s2 = prefixMods.get(m[1]); if (!s2) prefixMods.set(m[1], (s2 = new Set())); s2.add(o.module); }
    if (CODE_EXT.test(f) && /DECLARED_OPS|[a-z]Ops\b/.test(text)) collectOps(text, o.module, opMods);
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
    if (o.role === 'tests' || o.module === 'test-support') testFiles.push({ f, module: o.module, role: o.role });
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
  const generics = []; // { user, file, line, code } K5044 (2): `// fixtures-generic: CODE`
  for (const { f, module, role } of testFiles) {
    const src = read(f);
    if (src.length > MAX_BYTES) continue;
    let toks;
    try { toks = scan(src); } catch { continue; }
    const { match, parent } = brackets(toks);
    const lines = src.split('\n');
    const imports = new Map(); const importMods = new Set(); const importOwn = new Set(); // importOwn: names imported from the user's own product source
    const importFile = new Map(); const importTest = new Set(); // file each name is imported from; names imported from the user's own test files (K5044)
    let lastOwnSrc = false, lastFile = null, lastOwnTest = false;
    const importMod = (spec) => { const r = resolveImport(f, spec); const o = r ? owner(r) : null; const m = o ? o.module : null; lastFile = r; lastOwnTest = !!o && m === module && o.role === 'tests'; lastOwnSrc = !!o && m === module && o.role === 'code'; if (m && m !== module) importMods.add(m); return m; };
    for (let k = 0; k < toks.length; k++) {
      const t = toks[k];
      if (t.t === 'id' && t.v === 'from' && toks[k + 1] && toks[k + 1].t === 'str') {
        const m = importMod(toks[k + 1].v);
        // the names between `import` and `from`
        for (let j = k - 1; j >= 0 && !(toks[j].t === 'id' && toks[j].v === 'import'); j--) if (toks[j].t === 'id' && m) { imports.set(toks[j].v, m); importFile.set(toks[j].v, lastFile); if (lastOwnSrc) importOwn.add(toks[j].v); if (lastOwnTest) importTest.add(toks[j].v); }
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
      m = GENERIC_RE.exec(ln); if (m) generics.push({ user: module, file: f, line: i + 1, code: m[1] });
    });
    // K5044 (4): a marker in a harness file covers the whole value (declaration) that follows it, not only MARK_SPAN lines
    if (module === 'test-support' && role === 'code') for (const c of contracts) {
      if (c.file !== f || c.end) continue;
      let i = toks.findIndex((t) => t.line > c.line);
      if (i >= 0 && toks[i].t === 'id' && toks[i].v === 'export') i++;
      if (i >= 0 && toks[i] && toks[i].t === 'id' && /^(function|const|let|class|async)$/.test(toks[i].v)) {
        let nm = i + 1; if (toks[i].v === 'async') nm++;
        const r = toks[nm] ? regionFrom(toks, match, nm) : null;
        if (r) c.end = toks[r[1]].line;
      }
    }
    parsed.push({ f, module, role, src, lines, toks, match, parent, imports, importMods, importOwn, importFile, importTest });
  }

  // K5044 (1): a named stub whose value has a `fetch` member is a Durable Object / store double: the platform's, never another module's
  const fetchMember = (toks, a, b) => {
    for (let j = a; j <= b; j++) {
      const t = toks[j];
      if (t.t !== 'id' || t.v !== 'fetch') continue;
      const p = toks[j - 1], nx = toks[j + 1];
      if ((isP(nx, ':') && p && p.t === 'p' && '{,'.includes(p.v)) || (isP(nx, '(') && p && ((p.t === 'p' && '{,'.includes(p.v)) || (p.t === 'id' && p.v === 'async'))) || (isP(p, '.') && isP(nx, '=') && !isP(toks[j + 2], '='))) return true;
    }
    return false;
  };
  const platNames = new Set(PLATFORM_NAMES);
  for (const pf of parsed) {
    const { toks, match } = pf;
    for (let k = 0; k < toks.length; k++) {
      const t = toks[k];
      if (t.t !== 'id' || !STUB_WORD.test(t.v) || platNames.has(t.v)) continue;
      const r = regionFrom(toks, match, k);
      if (r && fetchMember(toks, r[0], r[1])) platNames.add(t.v);
    }
  }
  const isStubName = (v) => STUB_WORD.test(v) && !PLATFORM_DOUBLE.test(v) && !PLATFORM_EXTRA.test(v) && !SNAKE_DATA.test(v) && !platNames.has(v);
  const isPlatformName = (v) => PLATFORM_DOUBLE.test(v) || PLATFORM_EXTRA.test(v) || platNames.has(v) || IDB_NAME.test(v);

  // 3. candidates
  const cands = []; // { cls, user, file, line, tag, text, providers: [], imports: [], codes: [], note }
  const excerpt = (lines, line) => { const s = (lines[line - 1] || '').trim().replace(/\s+/g, ' '); return s.length > 100 ? `${s.slice(0, 97)}...` : s; };
  const mkProviders = (set, user) => [...(set || [])].filter((m) => m !== user).sort((a, b) => (order.get(a) ?? 1e9) - (order.get(b) ?? 1e9));
  const NAMELESS_KEYS = ['reason', 'code', 'failure_class', 'refusal'];
  for (const pf of parsed) {
    const { f, module: user, role, lines, toks, match, parent, imports, importMods, importOwn, importFile, importTest } = pf;
    if (only.length && !only.includes(user)) continue;
    if (user === 'test-support' && (role === 'tests' || GENERATOR_FILE.test(f))) continue; // K5044 harness-own: test-support's own tests, and its generators' vocabulary
    const imp = [...importMods].sort();
    const add = (cls, line, tag, providers, extra = {}) => cands.push({ cls, user, file: f, line, tag, text: excerpt(lines, line), providers, imports: imp, codes: [], ...extra });
    const keyCache = new Map();
    const keysOf = (k) => { let v = keyCache.get(k); if (!v) keyCache.set(k, (v = objectKeys(toks, match, k))); return v; };
    const codesIn = (a, b) => { const out = []; for (let j = a; j <= b; j++) if (toks[j].t === 'str' && CODE_RE.test(toks[j].v) && !out.includes(toks[j].v)) out.push(toks[j].v); return out; };
    const isNameless = (keys) => !NAMELESS_KEYS.some((x) => keys.has(x)) && !(keys.has('error') && keys.get('error') > 0 && toks[keys.get('error')].t === 'str' && CODE_RE.test(toks[keys.get('error')].v));
    // regions of stubs and doubles (their bodies and values), and where each refusal-code literal sits (assertion or not)
    const regions = [];
    const platRegions = []; // K5044 (1): platform doubles, whose literals are the platform's replies
    const faultNames = new Set(); // names of stand-ins that are fault injections
    const literalFault = (s, e) => { // a body that returns a nameless {ok:false} and no coded answer
      let nameless = 0, coded = 0;
      for (let j = s; j <= e; j++) if (isP(toks[j], '{') && match[j] > 0 && isObjectStart(toks, j)) { const ks = keysOf(j); if (ks.has('ok') && ks.get('ok') > 0 && /^(true|false)$/.test(toks[ks.get('ok')].v)) { if (toks[ks.get('ok')].v === 'false' && isNameless(ks)) nameless++; else coded++; } }
      return nameless > 0 && coded === 0;
    };
    const regionIsFault = (r) => {
      const [a, b] = r;
      if (isP(toks[a], '{') && match[a] === b) { // an object of stand-ins: every function member a fault
        const ks = keysOf(a); let fns = 0;
        for (const [, v] of ks) { if (v < 0) continue; const vb = isP(toks[v], '(') ? [v - 1, valueEnd(toks, match, v)] : [v, valueEnd(toks, match, v)]; const body = fnBody(toks, match, vb[0], vb[1]); if (!body) continue; fns++; if (!isFaultFn(toks, match, parent, vb[0], vb[1], literalFault)) return false; }
        return fns > 0;
      }
      return isFaultFn(toks, match, parent, a, b, literalFault);
    };
    const delegates = (name, r) => { for (let j = r[0]; j <= r[1]; j++) if (toks[j].t === 'id' && toks[j].v === name && isP(toks[j - 1], '.') && isP(toks[j + 1], '(')) return true; return false; }; // calls the same-named function of another object
    for (let k = 0; k < toks.length; k++) {
      const t = toks[k];
      if (t.t !== 'id') continue;
      const named = isStubName(t.v);
      const iface = INTERFACE_NAMES.includes(t.v) && !(defMods.get(t.v) || new Set()).has(user);
      const plat = isPlatformName(t.v) || (t.v === 'fetch' && fetchMember(toks, k, k));
      if (!named && !iface && !plat) continue;
      const r = regionFrom(toks, match, k);
      if (!r) continue;
      if (plat) platRegions.push(r);
      if (named || iface) { regions.push(r); if (regionIsFault(r)) { platRegions.push(r); faultNames.add(t.v); } }
    }
    for (let k = 0; k < toks.length; k++) { // doubles that are a shape: a bucket (head, get, put), a binding ({calls, binding}), an IndexedDB store
      if (!isP(toks[k], '{') || match[k] < 0 || !isObjectStart(toks, k)) continue;
      const ks = keysOf(k);
      if ((ks.has('head') && ks.has('get') && ks.has('put')) || (ks.has('calls') && ks.has('binding')) || ks.has('objectStore')) platRegions.push([k, match[k]]);
    }
    const inRegion = (k) => regions.some(([a, b]) => k >= a && k <= b);
    const inPlat = (k) => platRegions.some(([a, b]) => k >= a && k <= b);
    const calledStub = (k) => { // inside the arguments of a call of a stub, double or listed seam: answered by one
      for (let q = parent[k]; q >= 0; q = parent[q]) if (isP(toks[q], '(')) { const c = calleeOf(toks, q); if (c && c.split('.').some((x) => isStubName(x) || INTERFACE_NAMES.includes(x))) return true; }
      return false;
    };
    const pluginCall = (k) => { // inside the arguments of a call of a registrar such as registerStep or onAlarm
      for (let q = parent[k]; q >= 0; q = parent[q]) if (isP(toks[q], '(')) { const c = calleeOf(toks, q); const last = c && c.split('.').pop(); if (last && PLUGIN_CALLEE.test(last) && !INTERFACE_NAMES.includes(last)) return true; }
      return false;
    };
    const underCheckKey = (k) => { // a literal under a `check` / `validate` key: the user's own seam
      for (let p = parent[k]; p >= 0; p = parent[p]) {
        if (!isP(toks[p], '{') || !isObjectStart(toks, p)) continue;
        for (const [name, v] of keysOf(p)) if (CHECK_KEYS.has(name) && v > 0 && k >= v && k <= valueEnd(toks, match, v)) return true;
      }
      return false;
    };
    const objectish = (p) => p >= 0 && (isP(toks[p], '[') || (isP(toks[p], '{') && isObjectStart(toks, p)));
    const testShell = (k, e) => { // an object naming `test-shell` is a test's own shell
      const shell = (a, b) => { for (let j = a; j <= b; j++) if (toks[j].t === 'str' && /test-shell/.test(toks[j].v)) return true; return false; };
      if (shell(k, e)) return true;
      for (let p = parent[k]; objectish(p); p = parent[p]) if (shell(p, match[p])) return true;
      return false;
    };
    const expectedOnly = (k) => { // held in `const X = <literal>` and X used only inside assertions
      let o = k; while (objectish(parent[o])) o = parent[o];
      const p = toks[o - 1], q = toks[o - 2], r = toks[o - 3];
      if (!isP(p, '=') || !q || q.t !== 'id' || !r || r.t !== 'id' || !/^(const|let|var)$/.test(r.v)) return false;
      let uses = 0;
      for (let j = 0; j < toks.length; j++) if (j !== o - 2 && toks[j].t === 'id' && toks[j].v === q.v && !isP(toks[j - 1], '.')) { uses++; if (!insideExpectation(toks, parent, j)) return false; }
      return uses > 0;
    };
    const wrappers = new Set(); // local functions that call a function the user imports from its own source
    for (let k = 0; k < toks.length; k++) {
      const p = toks[k - 1];
      if (toks[k].t !== 'id' || !p || p.t !== 'id' || !/^(function|const|let|var)$/.test(p.v)) continue;
      const r = regionFrom(toks, match, k);
      if (r) for (let j = r[0]; j <= r[1]; j++) if (toks[j].t === 'id' && importOwn.has(toks[j].v) && isP(toks[j + 1], '(')) { wrappers.add(toks[k].v); break; }
    }
    const occ = new Map(); // code literal -> { inside, outside }
    for (let k = 0; k < toks.length; k++) {
      const t = toks[k];
      if (t.t !== 'str' || !CODE_RE.test(t.v)) continue;
      const o = occ.get(t.v) || { inside: 0, outside: 0 };
      if (insideExpectation(toks, parent, k)) o.inside++; else o.outside++;
      occ.set(t.v, o);
    }
    const passThrough = (code) => { const o = occ.get(code); return !!o && o.inside >= 1 && o.outside >= 1; }; // fed in, and its coming out asserted
    // the skips every hand-built answer shares (K5044 (1)); `noHost`: not the user's-own-function exemption (an extent, an op table)
    const commonSkip = (k, end, codes, noHost) => {
      if (inPlat(k) || testShell(k, end) || expectedOnly(k) || insideExpectation(toks, parent, k) || pluginCall(k) || underCheckKey(k)) return true;
      if (codes.length && codes.every(passThrough)) return true; // an answer whose code the same test asserts unchanged
      if (noHost) return false;
      for (let q = parent[k]; q >= 0; q = parent[q]) { // a callback handed to the user's own seam (`.transact(`, its own export or a local wrapper of it)
        if (!isP(toks[q], '(')) continue;
        const c = calleeOf(toks, q);
        if (c && (c.split('.').pop() === 'transact' || importOwn.has(c) || wrappers.has(c))) return true;
      }
      let host = parent[k]; // the call this literal is an argument of, directly or nested in an object or list that is
      while (host >= 0 && (isP(toks[host], '{') || isP(toks[host], '['))) host = parent[host];
      if (host >= 0 && isP(toks[host], '(')) {
        const c = calleeOf(toks, host);
        if (c && c.split('.').pop() === 'transact') return true; // the user's own transaction seam
        const stubby = c && (c.split('.').some((x) => isStubName(x) || INTERFACE_NAMES.includes(x)) || HAND_BUILDER.test(c));
        if (c && !stubby && (c.includes('.') || wrappers.has(c) || (imports.has(c) && (imports.get(c) !== user || importOwn.has(c))))) return true; // an input handed to the real provider, a harness helper or the module's own function under test (or a local wrapper of it)
      }
      return false;
    };
    const flagged = []; // [from, to] token ranges of flagged literals
    // K5044 (3b): scripted op tables: an object literal keyed by product op names whose values build answers
    for (let k = 0; k < toks.length; k++) {
      if (!isP(toks[k], '{') || match[k] < 0 || !isObjectStart(toks, k) || flagged.some(([a, b]) => k > a && k < b)) continue;
      for (const [name, v] of keysOf(k)) {
        if (v < 0 || !opMods.has(name) || opMods.get(name).has(user)) continue;
        const end = valueEnd(toks, match, v), kt = isP(toks[v - 1], ':') ? v - 2 : v - 1;
        if (flagged.some(([a, b]) => kt > a && kt < b)) continue;
        let builds = false;
        for (let j = v; j <= end && !builds; j++) if (isP(toks[j], '{') && match[j] > 0 && j < end && keysOf(j).has('ok')) builds = true;
        let inner = false; // a value that holds a further op table is judged at its own entries
        for (let j = v; j < end && !inner; j++) if (isP(toks[j], "{") && match[j] > 0 && j < end) for (const [nm, nv] of keysOf(j)) if (nv > 0 && opMods.has(nm)) { inner = true; break; }
        if (!builds || inner || commonSkip(kt, end, codesIn(v, end), true)) continue;
        flagged.push([kt, end + 1]);
        add('answer', toks[kt].line, `op-table ${name}`, mkProviders(opMods.get(name), user), { codes: codesIn(v, end) });
      }
    }
    // K5044 (3a): local builders: a function whose body builds a refusal or owed literal with its code a parameter
    const builders = new Map(); // name -> { idx: the code parameter's position, lits: Set(literal index), calls: [token index] }
    for (let k = 0; k < toks.length; k++) {
      if (toks[k].t !== 'id') continue;
      const dp = declParams(toks, match, k);
      if (!dp) continue;
      const r = regionFrom(toks, match, k);
      if (!r) continue;
      const flat = new Set(dp.params.flat());
      for (let j = r[0]; j <= r[1]; j++) {
        if (!isP(toks[j], '{') || match[j] < 0 || !isObjectStart(toks, j)) continue;
        const ks = keysOf(j);
        const okLit = ks.has('ok') && ks.get('ok') > 0 && /^(true|false)$/.test(toks[ks.get('ok')].v);
        if (!okLit || !(REFUSAL_KEYS.some((x) => ks.has(x)) || OWED_KEYS.some((x) => ks.has(x)))) continue;
        let pname = null;
        for (const key of ['reason', 'code', 'error']) {
          const v = ks.get(key);
          if (v === -1 && flat.has(key)) { pname = key; break; }
          if (v > 0 && toks[v].t === 'id' && valueEnd(toks, match, v) === v && flat.has(toks[v].v)) { pname = toks[v].v; break; }
        }
        if (!pname) continue;
        let b = builders.get(toks[k].v); if (!b) builders.set(toks[k].v, (b = { idx: dp.params.findIndex((a) => a.includes(pname)), lits: new Set(), calls: [] }));
        b.lits.add(j);
      }
    }
    for (let k = 0; k < toks.length; k++) {
      const b = toks[k].t === 'id' ? builders.get(toks[k].v) : null;
      if (!b || !isP(toks[k + 1], '(') || match[k + 1] < 0 || isP(toks[k - 1], '.') || declParams(toks, match, k)) continue;
      b.calls.push(k);
    }
    const builderLits = new Set();
    for (const b of builders.values()) if (b.calls.length) for (const j of b.lits) builderLits.add(j);
    // answer
    for (let k = 0; k < toks.length; k++) {
      if (!isP(toks[k], '{') || match[k] < 0 || !isObjectStart(toks, k)) continue;
      if (flagged.some(([a, b]) => k > a && k < b)) continue;
      if (builderLits.has(k)) continue; // reported at its builder's call sites
      const keys = keysOf(k);
      if (!keys.size) continue;
      let shape = null;
      const okLit = keys.has('ok') && keys.get('ok') > 0 && toks[keys.get('ok')].t === 'id' && /^(true|false)$/.test(toks[keys.get('ok')].v); // `ok` written as true or false
      if (okLit && REFUSAL_KEYS.some((x) => keys.has(x))) shape = 'refusal';
      else if (okLit && OWED_KEYS.some((x) => keys.has(x))) shape = 'owed';
      else if (keys.has('extent')) { const v = keys.get('extent'); if (v > 0 && isP(toks[v], '{') && toks[v + 1] && (toks[v + 1].v === 'kind') && isP(toks[v + 2], ':')) shape = 'extent'; }
      if (!shape) continue;
      if (shape === 'extent' && !(inRegion(k) || calledStub(k))) continue; // extent data passed in, not an answer: only inside a stub or double, or given to one
      if (shape !== 'extent' && keys.has('why') && !keys.has('reason')) continue; // `why` is not the refusal key of any module's answer: the module's own data
      if (shape === 'refusal') {
        const rv = keys.get('reason');
        if (rv > 0 && toks[rv].t === 'str' && LOWER_SNAKE.test(toks[rv].v)) continue; // an external provider's vocabulary (`overloaded_error`)
        const ev = keys.get('error');
        if (!keys.has('reason') && !keys.has('code') && ev > 0) { let raw = false; for (let j = ev; j <= valueEnd(toks, match, ev); j++) if (toks[j].t === 'id' && /^(stack|message)$/.test(toks[j].v)) raw = true; if (raw) continue; } // a raw platform error reply
        if (isNameless(keys) && (inRegion(k) || calledStub(k))) continue; // a fault injection's nameless refusal
      }
      // the code it names, and whom it belongs to
      let code = null;
      for (const name of ['reason', 'code', 'error']) { const v = keys.get(name); if (v > 0 && toks[v] && toks[v].t === 'str' && CODE_RE.test(toks[v].v)) { code = toks[v].v; break; } }
      if (!code) for (let j = k + 1; j < match[k]; j++) if (toks[j].t === 'str' && CODE_RE.test(toks[j].v) && isP(toks[j - 1], ':') && CODE_KEYS.has(toks[j - 2] && toks[j - 2].v)) { code = toks[j].v; break; }
      const codes = codesIn(k, match[k]);
      if (commonSkip(k, match[k], code ? [code] : [], shape === 'extent')) continue;
      let providers = [], tag = shape;
      if (code) {
        const owners = ownersOf(code);
        if (owners && owners.has(user)) continue; // the user's own shape
        if (!owners) tag = `${shape} invented ${code}`; else providers = mkProviders(owners, user);
      }
      flagged.push([k, match[k]]);
      add('answer', toks[k].line, tag, providers, { invented: !!code && !ownersOf(code), codes });
    }
    // answer: each call site of a local builder, with the code argument
    for (const [name, b] of builders) {
      for (const k of b.calls) {
        if (flagged.some(([a, z]) => k > a && k < z)) continue;
        const open = k + 1;
        const args = [[]];
        for (let j = open + 1; j < match[open]; j++) {
          const u = toks[j];
          if (isP(u, ',')) { args.push([]); continue; }
          args[args.length - 1].push(j);
          if (u.t === 'p' && OPEN.includes(u.v) && match[j] > 0) { for (let q = j + 1; q <= match[j]; q++) args[args.length - 1].push(q); j = match[j]; }
        }
        const arg = args[b.idx] || [];
        const code = arg.length === 1 && toks[arg[0]].t === 'str' && CODE_RE.test(toks[arg[0]].v) ? toks[arg[0]].v : null;
        if (arg.length === 1 && toks[arg[0]].t === 'str' && LOWER_SNAKE.test(toks[arg[0]].v)) continue;
        if (commonSkip(k, match[open], code ? [code] : [], false)) continue;
        let providers = [], tag = `builder ${name}`;
        if (code) {
          const owners = ownersOf(code);
          if (owners && owners.has(user)) continue;
          if (!owners) tag = `${tag} invented ${code}`; else providers = mkProviders(owners, user);
        }
        add('answer', toks[k].line, tag, providers, { invented: !!code && !ownersOf(code), codes: code ? [code] : [] });
      }
    }
    // stub: named doubles, once per file and name
    const seen = new Set();
    for (let k = 0; k < toks.length; k++) {
      const t = toks[k];
      if (t.t !== 'id') continue;
      if (isStubName(t.v) && !seen.has(t.v)) {
        if (importOwn.has(t.v) || importTest.has(t.v)) continue; // imported from the user's own product source or test files: its own double
        if (faultNames.has(t.v)) continue; // a fault injection: throws, never settles, answers nothing
        if (isP(toks[k - 1], '.') ) continue; // a member of something else
        const p = toks[k - 1];
        const decl = (p && p.t === 'id' && /^(function|const|let|var|class)$/.test(p.v)) || (isP(toks[k + 1], ':') && p && p.t === 'p' && '{,'.includes(p.v));
        if (BARE_SPY.test(t.v)) { // a local spy: only where it stands in for another module's exported name
          if (!decl) continue;
          const touched = new Map(); // name -> the token index of its definition
          const r = regionFrom(toks, match, k);
          if (r) for (let j = r[0]; j <= r[1]; j++) if (toks[j].t === 'id' && ((isP(toks[j + 1], ':') && toks[j - 1] && toks[j - 1].t === 'p' && '{,'.includes(toks[j - 1].v)) || (isP(toks[j - 1], '.') && isP(toks[j + 1], '=')))) touched.set(toks[j].v, j);
          for (let j = 0; j < toks.length; j++) if (toks[j].t === 'id' && toks[j].v === t.v && isP(toks[j + 1], '.') && toks[j + 2] && toks[j + 2].t === 'id' && isP(toks[j + 3], '=')) touched.set(toks[j + 2].v, j + 2);
          const hit = [...touched.keys()].find((nm) => { // not a delegating wrapper or a fault
            if (GENERIC_EXPORT.test(nm) || !mkProviders(exportMods.get(nm), user).length) return false;
            const rr = regionFrom(toks, match, touched.get(nm));
            return !(rr && (delegates(nm, rr) || regionIsFault(rr)));
          });
          if (!hit) continue;
          seen.add(t.v);
          add('stub', t.line, `spy standing in ${hit}`, mkProviders(exportMods.get(hit), user), { name: t.v });
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
        add('stub', t.line, tag, mkProviders(provSet, user), { name: t.v, srcFile: importFile.get(t.v) || null });
      }
      // stub: a function standing in for an interface the user does not define
      if (INTERFACE_NAMES.includes(t.v) && !(defMods.get(t.v) || new Set()).has(user)) {
        const p = toks[k - 1], nx = toks[k + 1];
        let stand = false, declForm = false;
        if (isP(p, '.')) stand = isP(nx, '=') && !isP(toks[k + 2], '=');
        else if (p && p.t === 'id' && /^(function|const|let|var)$/.test(p.v)) stand = declForm = true;
        else if (p && p.t === 'id' && p.v === 'async' && toks[k - 2] && toks[k - 2].v === 'function') stand = declForm = true;
        else if (isP(nx, ':') && p && p.t === 'p' && '{,'.includes(p.v)) {
          const v = toks[k + 2]; stand = !!v && ((v.t === 'id' && (v.v === 'async' || v.v === 'function')) || isP(v, '(') || (v.t === 'id' && isP(toks[k + 3], '=') && isP(toks[k + 4], '>')));
        } else if (isP(nx, '(') && p && p.t === 'p' && '{,'.includes(p.v) && match[k + 1] > 0 && isP(toks[match[k + 1] + 1], '{') && parent[k] >= 0 && isP(toks[parent[k]], '{')) stand = true;
        else if (isP(p, '=') ) stand = false;
        if (stand) { // K5044 (1): a delegating wrapper, a fault injection, or a local helper that only shares the name is no stand-in
          const r = regionFrom(toks, match, k);
          if (r && (delegates(t.v, r) || regionIsFault(r))) stand = false;
          if (stand && declForm) {
            let handed = false;
            for (let j = 0; j < toks.length && !handed; j++) if (j !== k && toks[j].t === 'id' && toks[j].v === t.v && !isP(toks[j + 1], '(') && !isP(toks[j + 1], ':') && !isP(toks[j - 1], '.') && !(toks[j - 1] && toks[j - 1].t === 'id' && /^(function|const|let|var)$/.test(toks[j - 1].v))) handed = true;
            if (!handed) stand = false;
          }
        }
        if (stand) add('stub', t.line, `stand-in ${t.v}`, mkProviders(defMods.get(t.v), user), { name: t.v });
      }
    }
    // code: a refusal-shaped literal no source gives
    for (let k = 0; k < toks.length; k++) {
      const t = toks[k];
      if (t.t !== 'str' || !CODE_RE.test(t.v) || ownersOf(t.v)) continue;
      let at = false;
      for (let j = k - 1; j >= 0 && j >= k - 6; j--) { const u = toks[j]; if (u.t === 'p' && ';{}'.includes(u.v)) break; if (u.t === 'id' && CODE_KEYS.has(u.v)) { at = true; break; } }
      if (!at) for (let j = k + 1; j < toks.length && j <= k + 5; j++) { const u = toks[j]; if (u.t === 'p' && ';{}'.includes(u.v)) break; if (u.t === 'id' && CODE_KEYS.has(u.v) && isP(toks[j - 1], '.')) { at = true; break; } }
      if (!at) continue;
      { const q = parent[k], h = q >= 0 ? parent[q] : -1; if (q >= 0 && isP(toks[q], '{') && h >= 0 && isP(toks[h], '(') && /^(push|unshift|add|concat)$/.test((calleeOf(toks, h) || '').split('.').pop())) continue; } // a finding the module builds into its own list
      { const q = parent[k]; if (q >= 0 && isP(toks[q], '{') && isP(toks[q - 1], ':') && toks[q - 2] && DATA_KEYS.has(toks[q - 2].v)) continue; } // a field of a data object (`why: { code }`)
      if (passThrough(t.v)) continue; // fed in and asserted to come out: the test's own pass-through data
      if (cands.some((c) => c.cls === 'answer' && c.file === f && c.line === t.line && c.invented)) continue; // carried by the answer's tag
      if (flagged.some(([a, b]) => k > a && k < b)) continue;
      add('code', t.line, '', [], { codes: [t.v] });
    }
  }

  // 4. contracts: acceptance and the markers' own failures
  const contractUsed = new Set();
  const runKey = (provider, user, id) => `${provider}\0${user}\0${id}`;
  const runSet = new Set(runs.map((r) => runKey(r.provider, r.user, r.id)));
  const genUsed = new Set();
  for (const c of cands) {
    c.status = 'fail'; c.relation = relationOf(c, order);
    if (c.codes && c.codes.length) { // K5044 (2): `// fixtures-generic: CODE` accepts a code made up on purpose; a code the markers do not name stays a finding
      const cover = generics.filter((x) => x.file === c.file && x.line <= c.line && c.line <= x.line + MARK_SPAN);
      for (const x of cover) if (c.codes.includes(x.code)) genUsed.add(x);
      if (c.codes.every((cd) => cover.some((x) => x.code === cd))) { c.status = 'accepted'; c.contract = 'generic'; continue; }
    }
    if (c.cls === 'code') continue;
    const mk = contracts.filter((x) => x.file === c.file && x.line <= c.line && c.line <= (x.end || x.line + MARK_SPAN)).sort((a, b) => b.line - a.line)[0]; // the nearest marker above
    if (!mk) continue;
    contractUsed.add(mk);
    if (!order.has(mk.provider)) { c.tag = `${c.tag} contract-unknown-provider`.trim(); continue; }
    if (!(order.get(mk.provider) > order.get(c.user))) { c.tag = `${c.tag} contract-not-later`.trim(); c.providers = [mk.provider]; c.relation = relationOf(c, order); continue; }
    if (!runSet.has(runKey(mk.provider, c.user, mk.id))) { c.tag = `${c.tag} contract-no-run`.trim(); c.providers = [mk.provider]; c.relation = relationOf(c, order); continue; }
    c.status = 'accepted'; c.providers = [mk.provider]; c.relation = 'later'; c.contract = mk.id;
  }
  // K5044 (4): a contract on a harness value (a test-support file) also covers every import of it in other modules' tests
  const harness = new Map(); // `file\0name` -> contract id of an accepted harness stub
  for (const c of cands) if (c.status === 'accepted' && c.cls === 'stub' && c.name && c.user === 'test-support' && c.contract !== 'generic') harness.set(`${c.file}\0${c.name}`, c);
  for (const c of cands) {
    if (c.status === 'accepted' || c.cls !== 'stub' || !c.name || !c.srcFile) continue;
    const h = harness.get(`${c.srcFile}\0${c.name}`);
    if (h) { c.status = 'accepted'; c.contract = h.contract; c.providers = h.providers; c.relation = 'later'; }
  }
  const extra = []; // class contract: markers that hold nothing
  for (const mk of contracts) if (!contractUsed.has(mk) && (!only.length || only.includes(mk.user))) extra.push({ cls: 'contract', user: mk.user, file: mk.file, line: mk.line, tag: 'idle', text: `fixtures-contract: ${mk.provider} ${mk.id}`, providers: [mk.provider], imports: [], status: 'fail', relation: '' });
  for (const x of generics) if (!genUsed.has(x) && (!only.length || only.includes(x.user))) extra.push({ cls: 'contract', user: x.user, file: x.file, line: x.line, tag: 'idle-generic', text: `fixtures-generic: ${x.code}`, providers: [], imports: [], status: 'fail', relation: '' });
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
  const tagged = (w) => failing.filter((c) => c.cls === 'answer' && c.tag.startsWith(w)).length;
  const invented = failing.filter((c) => c.invented).length;
  const accepted = all.filter((c) => c.status === 'accepted').length;
  const summary = `${parsed.length} test files read, ${state.modules.length} modules; answer ${n('answer')} (${invented} with an invented code, ${tagged('builder')} builder, ${tagged('op-table')} op-table), stub ${n('stub')}, code ${n('code')}, contract ${n('contract')}, accepted ${accepted}`;
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
