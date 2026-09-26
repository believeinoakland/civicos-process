// Shared reading of a product repository's build state (PROCESS-MECHANICS §1, §8).
// Every check takes the product repository's root and reads only what is committed there.
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 256 << 20 });
}

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
