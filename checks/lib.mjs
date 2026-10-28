// Shared reading of a product repository's build state (PROCESS-MECHANICS §1, §8).
// Every check takes the product repository's root and reads only what is committed there.
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 256 << 20 });
}

// The product's generated artifacts (mechanics §14): rows of build/manifest.md's table
// `| \`<path>\`[, \`<path>\`…] | <owner> | \`<regenerate>\` | \`<verify>\` |`, in the table's order.
export function artifactRows(text) {
  return [...String(text || '').matchAll(/^\| (`[^`|]+`(?:, `[^`|]+`)*) \| [^|]+ \| `([^`]+)` \| `([^`]+)` \|$/gm)].map((x) => ({ paths: [...x[1].matchAll(/`([^`]+)`/g)].map((y) => y[1]), regen: x[2], verify: x[3] }));
}
// Every generated artifact path of the product (a directory's path is matched as its prefix, `dist` as `dist/`).
export function generatedPaths(root) {
  const f = join(root, 'build/manifest.md');
  return existsSync(f) ? artifactRows(readFileSync(f, 'utf8')).flatMap((r) => r.paths) : [];
}
export const isGenerated = (paths, file) => paths.some((p) => file === p || file.startsWith(p.endsWith('/') ? p : `${p}/`));

// Tracked files only: what a commit holds, never a local build or node_modules.
export function trackedFiles(root) {
  return git(root, ['ls-files', '-z']).split('\0').filter(Boolean);
}

export function readModules(root) {
  const text = readFileSync(join(root, 'build/modules.json'), 'utf8');
  return JSON.parse(text);
}

// A path ending in "/" owns everything under it; any other path owns that one file.
export function pathMatches(p, file) {
  return p.endsWith('/') ? file.startsWith(p) : file === p;
}

// Who owns a file. Ruling (BOB #38, 2026-09-26): "exactly one owner" (P4, mechanics §1) is read as
// the MOST SPECIFIC matching path: a legacy module's directory may contain an extracted module's
// directory (bio-plane/test/ holds bio-plane/test/m/<module>/). Two modules claiming the same
// path is an error, reported by the format check.
export function ownerIndex(state) {
  const entries = [];
  for (const m of state.modules) {
    for (const p of m.paths || []) entries.push({ path: p, module: m.id, role: 'code' });
    for (const p of m.tests || []) entries.push({ path: p, module: m.id, role: 'tests' });
  }
  entries.sort((a, b) => b.path.length - a.path.length);
  return (file) => entries.find((e) => pathMatches(e.path, file)) || null;
}

export function notProduct(state) {
  return (file) => (state.not_product || []).some((p) => pathMatches(p, file));
}

// Requirement ids in a requirements file: an id is defined where it is written in bold, `**Rn**`
// (build/requirements/README.md, rule 5); a mention elsewhere is written plain (`R12`). Ruling (BOB #38,
// 2026-09-26): the bold is the marker, wherever it stands on its line, because three approved files put
// ids after a service's signature. A retired id carries "*(retired" on its line and needs no test.
export function requirementIds(text) {
  const live = [], retired = [], all = [];
  for (const line of text.split('\n')) {
    for (const m of line.matchAll(/\*\*(R\d+)\*\*/g)) {
      all.push(m[1]);
      (/\*\(retired/i.test(line) ? retired : live).push(m[1]);
    }
  }
  return { live, retired, all };
}

export function requirementFiles(root) {
  const dir = join(root, 'build/requirements');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md').map((f) => f.slice(0, -3));
}

export function report(name, failures, summary) {
  for (const f of failures) console.log(`FAIL  ${f}`);
  console.log(`${name}: ${summary}; ${failures.length} failure${failures.length === 1 ? '' : 's'}`);
  return failures.length ? 1 : 0;
}

// A new module enters build/modules.json with empty `paths` and `tests` (bio K1185); its first job's COMPLETE fills
// them (lane-process-repair item e). Returns `text` with the row of `id` given `paths` and `tests`, every other byte
// unchanged, or null when that row has no empty `paths` and `tests` to fill.
export function fillModuleRow(text, id, { paths, tests }) {
  const at = text.search(new RegExp(`"id":\\s*${JSON.stringify(id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[,}]`));
  if (at < 0) return null;
  const next = text.slice(at + 1).search(/"id":\s*"/), end = next < 0 ? text.length : at + 1 + next;
  const fmt = (xs) => `[${xs.map((x) => JSON.stringify(x)).join(', ')}]`;
  let row = text.slice(at, end), n = 0;
  row = row.replace(/"paths":\s*\[\s*\]/, () => { n++; return `"paths": ${fmt(paths)}`; });
  row = row.replace(/"tests":\s*\[\s*\]/, () => { n++; return `"tests": ${fmt(tests)}`; });
  return n === 2 ? `${text.slice(0, at)}${row}${text.slice(end)}` : null;
}
// What a change to build/modules.json between `before` and `after` (their texts) does, judged for module `id`:
// { fill: { paths, tests } } when it only fills that module's own empty `paths` and `tests` (every other row, key and
// order unchanged), else { why } naming what else changed.
export function rowFill(before, after, id) {
  let a, b; try { a = JSON.parse(before); b = JSON.parse(after); } catch (e) { return { why: `build/modules.json does not parse (${e.message})` }; }
  const rows = (s) => (Array.isArray(s) ? s : s.modules) || [];
  const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  const ra = rows(a), rb = rows(b);
  if (!same(ra.map((r) => r.id), rb.map((r) => r.id))) return { why: 'build/modules.json: rows added, removed or reordered (BOB writes rows)' };
  if (!Array.isArray(a) && !same({ ...a, modules: null }, { ...b, modules: null })) return { why: 'build/modules.json: a field outside the rows changed' };
  const i = ra.findIndex((r) => r.id === id);
  for (let k = 0; k < ra.length; k++) if (k !== i && !same(ra[k], rb[k])) return { why: `build/modules.json: the row of ${ra[k].id} changed` };
  if (i < 0) return { why: `build/modules.json: no row for ${id}` };
  const x = ra[i], y = rb[i];
  if ((x.paths || []).length || (x.tests || []).length) return { why: `build/modules.json: ${id}'s row already named its paths and tests; only BOB changes it` };
  if (!same({ ...x, paths: null, tests: null }, { ...y, paths: null, tests: null })) return { why: `build/modules.json: ${id}'s row changed beyond its paths and tests` };
  if (!(y.paths || []).length || !(y.tests || []).length) return { why: `build/modules.json: ${id}'s row is filled with both its paths and its tests, or not at all` };
  return { fill: { paths: y.paths, tests: y.tests } };
}
