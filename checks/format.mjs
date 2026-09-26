// Check 4, format (PROCESS-MECHANICS §8.4; P4, P5, P15): the build state's files parse, and every id
// they reference exists. Usage: node checks/format.mjs <product-root>
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { requirementIds, requirementFiles, report } from './lib.mjs';

const SECTIONS = ['## Public', '### Purpose', '### Provides', '## Private', '### Uses', '### Invariants', '### Satisfies'];

export function checkFormat(root) {
  const failures = [];
  let state;
  try { state = JSON.parse(readFileSync(join(root, 'build/modules.json'), 'utf8')); }
  catch (e) { return { failures: [`build/modules.json: does not parse (${e.message})`], summary: 'stopped' }; }
  const mods = Array.isArray(state.modules) ? state.modules : [];
  if (!mods.length) failures.push('build/modules.json: no modules');
  const seen = new Map();
  const claimed = new Map();
  let lastLayer = 0;
  mods.forEach((m, i) => {
    const at = `build/modules.json: ${m && m.id ? m.id : `module ${i}`}`;
    if (!m || typeof m.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(m.id)) { failures.push(`${at}: id missing or invalid`); return; }
    if (seen.has(m.id)) failures.push(`${at}: id given twice`);
    if (!Number.isInteger(m.layer) || m.layer < 1) failures.push(`${at}: layer is not a positive integer`);
    else if (m.layer < lastLayer) failures.push(`${at}: layer ${m.layer} after layer ${lastLayer}; a layer's modules are adjacent and in order (P4)`);
    else lastLayer = m.layer;
    for (const k of ['paths', 'tests', 'uses']) if (!Array.isArray(m[k])) failures.push(`${at}: ${k} is not a list`);
    for (const p of [...(m.paths || []), ...(m.tests || [])]) {
      if (claimed.has(p) && claimed.get(p) !== m.id) failures.push(`${at}: path ${p} is also claimed by ${claimed.get(p)}`);
      claimed.set(p, m.id);
    }
    for (const u of m.uses || []) {
      if (u === '*earlier') { if (!m.legacy) failures.push(`${at}: only a legacy module may use "*earlier"`); continue; }
      if (!seen.has(u)) failures.push(`${at}: uses ${u}, which is ${mods.some((x) => x.id === u) ? 'not earlier in the order' : 'no module'}`);
    }
    for (const f of [].concat(m.from ?? [])) if (!mods.some((x) => x.id === f && x.legacy)) failures.push(`${at}: from ${f}, which is no legacy module`);
    seen.set(m.id, m);
  });
  for (const p of state.not_product || []) if (claimed.has(p)) failures.push(`build/modules.json: ${p} is both not_product and owned by ${claimed.get(p)}`);

  // layers.md: each layer row lists exactly that layer's modules, in order.
  const layersPath = join(root, 'build/layers.md');
  if (existsSync(layersPath)) {
    const rows = readFileSync(layersPath, 'utf8').split('\n').filter((l) => /^\|\s*\d+\s*\|/.test(l));
    const layers = new Set(mods.map((m) => m.layer));
    for (const row of rows) {
      const cells = row.split('|').slice(1, -1).map((c) => c.trim());
      const n = Number(cells[0]);
      if (!layers.has(n)) continue; // a table of another kind (the legacy modules' line counts has no layer number first)
      const listed = cells[cells.length - 1].split(',').map((s) => s.trim()).filter(Boolean);
      const actual = mods.filter((m) => m.layer === n).map((m) => m.id);
      if (listed.join(',') !== actual.join(',')) failures.push(`build/layers.md: layer ${n} lists ${listed.join(', ')}, but modules.json has ${actual.join(', ')}`);
      layers.delete(n);
    }
    for (const n of layers) failures.push(`build/layers.md: layer ${n} has no row`);
  } else failures.push('build/layers.md: missing');

  // Requirements files: one per module, the sections of mechanics §3, each id once.
  let reqFiles = 0;
  for (const id of requirementFiles(root)) {
    reqFiles++;
    const at = `build/requirements/${id}.md`;
    if (!seen.has(id)) failures.push(`${at}: names no module of build/modules.json`);
    const text = readFileSync(join(root, at), 'utf8');
    let from = 0;
    for (const s of SECTIONS) {
      const i = text.split('\n').findIndex((l, k) => k >= from && l.trim() === s);
      if (i < 0) failures.push(`${at}: section "${s}" missing or out of order`); else from = i + 1;
    }
    const { all } = requirementIds(text);
    const dup = all.filter((r, i) => all.indexOf(r) !== i);
    if (dup.length) failures.push(`${at}: ids given twice: ${[...new Set(dup)].join(' ')}`);
  }

  // The plan: an entry id once per module. An entry shared by two modules (a provided service and its
  // user) is listed under each; a module heading is a line that is only a bold module id, or several.
  for (const plan of ['build/plan/current.md', 'build/plan/next.md']) {
    if (!existsSync(join(root, plan))) continue;
    let under = '';
    const keys = [];
    for (const line of readFileSync(join(root, plan), 'utf8').split('\n')) {
      if (/^\*\*[a-z][a-z0-9-]*\*\*(,\s*\*\*[a-z][a-z0-9-]*\*\*)*(\s*\(.*\))?\s*$/.test(line) || /^#/.test(line)) { under = line; continue; }
      const m = line.match(/^- ((?:N|T\d+-)\d+|[A-Z]+-\d+) · /);
      if (m) keys.push(`${m[1]}\u0000${under}`);
    }
    const dup = keys.filter((k, i) => keys.indexOf(k) !== i).map((k) => k.split('\u0000')[0]);
    if (dup.length) failures.push(`${plan}: entry ids given twice under one module: ${[...new Set(dup)].join(' ')}`);
  }
  return { failures, summary: `${mods.length} modules, ${reqFiles} requirements files` };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { failures, summary } = checkFormat(process.argv[2] || '.');
  process.exitCode = report('format', failures, summary);
}
