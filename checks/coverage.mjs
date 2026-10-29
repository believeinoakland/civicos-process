// Check 2, coverage (rulebooks BLD 5, INT 2; P7): every live requirement id of a module is named by at
// least one of that module's tests. A test names an id by writing it as a word (`R12`) anywhere in a
// file under the module's `tests` paths, conventionally in the test's title.
// Usage: node checks/coverage.mjs <product-root> [module ...]
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { readModules, trackedFiles, pathMatches, requirementIds, requirementFiles, report } from './lib.mjs';

// The tranche the plan names: `# Plan T<n>` (mechanics), or `# Plan: … N<n>` with the id last (neoProcess, JOB-LIFE §1); or null.
function planTranche(root) {
  const f = join(root, 'build/plan/current.md');
  if (!existsSync(f)) return null;
  const title = readFileSync(f, 'utf8').match(/^# Plan(:?) (.*)$/m);
  if (!title) return null;
  return title[1] ? title[2].match(/\b([A-Z]+\d+[a-z]?)\s*$/)?.[1] ?? null : title[2].split(/\s+/)[0];
}
// A module's job for the tranche has started: its record is on disk, or its job branch exists (local or origin):
// `job/<T>/<m>` under the mechanics, `job/<m>` under neoProcess (one job per module, JOB-LIFE §1).
function jobStarted(root, T, m) {
  if (existsSync(join(root, `build/jobs/${T}/${m}.md`))) return true;
  return [`refs/heads/job/${T}/${m}`, `refs/remotes/origin/job/${T}/${m}`, `refs/heads/job/${m}`, `refs/remotes/origin/job/${m}`].some((r) => { try { execFileSync('git', ['-C', root, 'rev-parse', '--verify', '-q', r], { stdio: 'ignore' }); return true; } catch { return false; } });
}

export function checkCoverage(root, only = []) {
  const state = readModules(root);
  const tracked = trackedFiles(root);
  const failures = [];
  let modules = 0, ids = 0, covered = 0, ahead = 0;
  const T = planTranche(root);
  for (const id of requirementFiles(root)) {
    if (only.length && !only.includes(id)) continue;
    const m = state.modules.find((x) => x.id === id);
    if (!m) continue; // the format check reports a requirements file with no module
    modules++;
    const text = readFileSync(join(root, 'build/requirements', `${id}.md`), 'utf8');
    const { live } = requirementIds(text);
    // P18: an id marked `*(not yet met: <T>)*` for this tranche, in a module whose job has not started, is written ahead: counted, never a failure.
    const isAhead = (r) => T && !jobStarted(root, T, id) && text.split('\n').some((l) => l.includes(`**${r}**`) && !/\*\(retired/i.test(l) && [...l.matchAll(/\*\(not yet met:([^)]*)\)\*/g)].some((x) => x[1].split(/[\s,;]+/).includes(T)));
    const named = new Set();
    for (const f of tracked) {
      if (!(m.tests || []).some((p) => pathMatches(p, f))) continue;
      for (const t of readFileSync(join(root, f), 'utf8').matchAll(/\bR(\d+)\b/g)) named.add(`R${t[1]}`);
    }
    const unnamed = live.filter((r) => !named.has(r));
    const missing = unnamed.filter((r) => !isAhead(r));
    ahead += unnamed.length - missing.length;
    ids += live.length; covered += live.length - unnamed.length;
    if (missing.length) failures.push(`${id}: ${missing.length} of ${live.length} live ids named by no test: ${missing.join(' ')}`);
  }
  return { failures, summary: `${modules} modules, ${covered} of ${ids} live requirement ids named by a test${ahead ? `, ${ahead} written ahead (not yet met, job not started)` : ''}` };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { failures, summary } = checkCoverage(process.argv[2] || '.', process.argv.slice(3));
  process.exitCode = report('coverage', failures, summary);
}
