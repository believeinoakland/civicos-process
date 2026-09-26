// Check 2, coverage (PROCESS-MECHANICS §8.2; P7): every live requirement id of a module is named by at
// least one of that module's tests. A test names an id by writing it as a word (`R12`) anywhere in a
// file under the module's `tests` paths, conventionally in the test's title.
// Usage: node checks/coverage.mjs <product-root> [module ...]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readModules, trackedFiles, pathMatches, requirementIds, requirementFiles, report } from './lib.mjs';

export function checkCoverage(root, only = []) {
  const state = readModules(root);
  const tracked = trackedFiles(root);
  const failures = [];
  let modules = 0, ids = 0, covered = 0;
  for (const id of requirementFiles(root)) {
    if (only.length && !only.includes(id)) continue;
    const m = state.modules.find((x) => x.id === id);
    if (!m) continue; // the format check reports a requirements file with no module
    modules++;
    const { live } = requirementIds(readFileSync(join(root, 'build/requirements', `${id}.md`), 'utf8'));
    const named = new Set();
    for (const f of tracked) {
      if (!(m.tests || []).some((p) => pathMatches(p, f))) continue;
      for (const t of readFileSync(join(root, f), 'utf8').matchAll(/\bR(\d+)\b/g)) named.add(`R${t[1]}`);
    }
    const missing = live.filter((r) => !named.has(r));
    ids += live.length; covered += live.length - missing.length;
    if (missing.length) failures.push(`${id}: ${missing.length} of ${live.length} live ids named by no test: ${missing.join(' ')}`);
  }
  return { failures, summary: `${modules} modules, ${covered} of ${ids} live requirement ids named by a test` };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { failures, summary } = checkCoverage(process.argv[2] || '.', process.argv.slice(3));
  process.exitCode = report('coverage', failures, summary);
}
