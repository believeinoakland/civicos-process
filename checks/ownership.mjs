// Check 3, ownership (PROCESS-MECHANICS §8.3, §6; P7): a module job's diff touches only its module's
// paths and tests and its own job record. The one exception (mechanics §12.2): a module extracted
// from a legacy module may remove code from that legacy module's files, and only remove it.
// Usage: node checks/ownership.mjs <product-root> <module> <base-ref> [head-ref]
import { readModules, git, pathMatches, report } from './lib.mjs';

export function checkOwnership(root, moduleId, base, head = 'HEAD') {
  const state = readModules(root);
  const m = state.modules.find((x) => x.id === moduleId);
  if (!m) return { failures: [`${moduleId}: no such module in build/modules.json`], summary: 'nothing checked' };
  const legacy = m.from ? state.modules.find((x) => x.id === m.from) : null;
  const own = [...(m.paths || []), ...(m.tests || [])];
  const record = new RegExp(`^build/jobs/T\\d+/${moduleId.replace(/[-]/g, '\\-')}\\.md$`);
  const failures = [];
  const lines = git(root, ['diff', '--numstat', '--no-renames', '--relative', `${base}...${head}`]).split('\n').filter(Boolean);
  for (const line of lines) {
    const [added, , file] = line.split('\t');
    if (own.some((p) => pathMatches(p, file)) || record.test(file)) continue;
    if (legacy && (legacy.paths || []).some((p) => pathMatches(p, file))) {
      if (added === '0') continue;
      failures.push(`${file}: ${moduleId} may only remove code from ${legacy.id}, and this diff adds ${added} line(s)`);
      continue;
    }
    failures.push(`${file}: outside ${moduleId}'s paths, tests and job record`);
  }
  return { failures, summary: `${lines.length} files changed by ${moduleId} between ${base} and ${head}` };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [root, mod, base, head] = process.argv.slice(2);
  if (!root || !mod || !base) { console.error('usage: node checks/ownership.mjs <product-root> <module> <base-ref> [head-ref]'); process.exit(2); }
  const { failures, summary } = checkOwnership(root, mod, base, head);
  process.exitCode = report('ownership', failures, summary);
}
