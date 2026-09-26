// Check 1, architecture (PROCESS-MECHANICS §8.1; P4): every product file is in exactly one module's
// paths or tests, and every import is to the module itself or to a module earlier in the order that
// it declares in `uses`. Usage: node checks/architecture.mjs <product-root>
import { readFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { readModules, trackedFiles, ownerIndex, notProduct, report } from './lib.mjs';

const SOURCE = /\.(mjs|cjs|js|ts)$/;

// Relative specifiers of static imports, re-exports, dynamic imports and require().
export function importsOf(text) {
  const body = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const out = [];
  const re = /(?:\bimport\s*(?:[\w*{}\s,$]+\s*from\s*)?|\bexport\s*[\w*{}\s,$]+\s*from\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)(['"])([^'"\n]+)\1/g;
  for (const m of body.matchAll(re)) if (m[2].startsWith('.')) out.push(m[2]);
  return out;
}

export function resolveImport(files, from, spec) {
  const base = posix.normalize(posix.join(posix.dirname(from), spec));
  for (const c of [base, `${base}.mjs`, `${base}.js`, `${base}/index.mjs`, `${base}/index.js`]) if (files.has(c)) return c;
  return null;
}

export function checkArchitecture(root) {
  const state = readModules(root);
  const owner = ownerIndex(state);
  const skip = notProduct(state);
  const order = new Map(state.modules.map((m, i) => [m.id, i]));
  const byId = new Map(state.modules.map((m) => [m.id, m]));
  const tracked = trackedFiles(root);
  const files = new Set(tracked);
  const failures = [];
  let product = 0, imports = 0, unresolved = 0;
  for (const f of tracked) {
    if (skip(f)) continue;
    product++;
    const o = owner(f);
    if (!o) { failures.push(`${f}: owned by no module`); continue; }
    if (!SOURCE.test(f)) continue;
    const me = byId.get(o.module);
    for (const spec of importsOf(readFileSync(join(root, f), 'utf8'))) {
      imports++;
      const target = resolveImport(files, f, spec);
      // An import that names no tracked file cannot be judged: it is text inside a fixture or string
      // more often than a real import, and a real one fails when that file is loaded. It is counted.
      if (!target) { unresolved++; continue; }
      if (skip(target)) { failures.push(`${f}: imports ${target}, which is not product`); continue; }
      const t = owner(target);
      if (!t) continue; // reported as unowned in its own right
      if (t.module === o.module) continue;
      const earlier = order.get(t.module) < order.get(o.module);
      const declared = me.uses.includes(t.module) || (me.uses.includes('*earlier') && earlier);
      if (!earlier) failures.push(`${f} (${o.module}): imports ${target} of ${t.module}, which is not earlier in the order`);
      else if (!declared) failures.push(`${f} (${o.module}): imports ${target} of ${t.module}, which ${o.module} does not declare in uses`);
    }
  }
  return { failures, summary: `${product} product files, ${imports} relative imports (${unresolved} naming no tracked file, not judged)` };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { failures, summary } = checkArchitecture(process.argv[2] || '.');
  process.exitCode = report('architecture', failures, summary);
}
