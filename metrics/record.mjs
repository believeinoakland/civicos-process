// Metrics recording (PROCESS-MECHANICS §10; P14): at its end, a session appends one row of TOKENS
// PROCESSED to the product's build/metrics/T<n>.csv. The counts are summed from the session's own
// transcript, as the model service reported them per request, never estimated and never in dollars.
//
// Usage: node metrics/record.mjs --product <root> --tranche <T0|T1|…> --role <BOB|job> [--module <id>]
//          [--test-runs <n>] [--module-lines <n>] [--transcript <file.jsonl>] [--record <job-record.md>] [--dry-run]
// --record appends the row to a job's own record instead of the shared CSV (mechanics §10): a job
// touches no shared file, and BOB copies the rows into build/metrics/T<n>.csv when the layer closes.
// Without --transcript it reads the newest transcript of the working directory's project in
// ~/.claude/projects/. Sessions of the transition, before tranche T1, record under T0.
import { readFileSync, appendFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { homedir } from 'node:os';

export const HEADER = 'session,role,module,cache_read,cache_write,input,output,turns,test_runs,module_lines';

// One model request can be written as several transcript entries (one per content block), all
// carrying the same message id and the same usage; each request is counted once. `turns` is the
// number of model requests: each one re-reads the whole context, which is what P13 prices.
export function sumTranscript(text) {
  const seen = new Set();
  const t = { cache_read: 0, cache_write: 0, input: 0, output: 0, turns: 0, session: null };
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    let e; try { e = JSON.parse(line); } catch { continue; }
    if (!t.session && e.sessionId) t.session = e.sessionId;
    if (e.type !== 'assistant' || !e.message || !e.message.usage) continue;
    const key = e.message.id || e.requestId || e.uuid;
    if (seen.has(key)) continue;
    seen.add(key);
    const u = e.message.usage;
    t.cache_read += u.cache_read_input_tokens || 0;
    t.cache_write += u.cache_creation_input_tokens || 0;
    t.input += u.input_tokens || 0;
    t.output += u.output_tokens || 0;
    t.turns++;
  }
  return t;
}

export function newestTranscript(cwd = process.cwd()) {
  const dir = join(homedir(), '.claude', 'projects', cwd.replace(/[^A-Za-z0-9]/g, '-'));
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) => f.endsWith('.jsonl')).map((f) => join(dir, f));
  files.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return files[0] || null;
}

const clean = (v) => String(v ?? '').replace(/[,\n\r]/g, ' ').trim();

export function row(t, { role, module = '', testRuns = '', moduleLines = '', session }) {
  return [session || t.session || 'unknown', role, module, t.cache_read, t.cache_write, t.input, t.output, t.turns, testRuns, moduleLines].map(clean).join(',');
}

export function recordInJob(file, line) {
  appendFileSync(file, `\n## Metrics\n\n\`\`\`csv\n${HEADER}\n${line}\n\`\`\`\n`);
  return file;
}

// The metrics rows written into job records under `## Metrics`, for BOB to collect.
export function rowsInJobRecord(text) {
  const out = [];
  for (const m of text.matchAll(/## Metrics\s*\n+```csv\n([^`]*)```/g)) for (const l of m[1].split('\n')) if (l.trim() && l.trim() !== HEADER) out.push(l.trim());
  return out;
}

export function record(product, tranche, line) {
  if (!/^T\d+$/.test(tranche)) throw new Error(`tranche must be T<n>, got ${tranche}`);
  const file = join(product, 'build', 'metrics', `${tranche}.csv`);
  mkdirSync(dirname(file), { recursive: true });
  if (!existsSync(file)) appendFileSync(file, HEADER + '\n');
  appendFileSync(file, line + '\n');
  return file;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dry-run') { a['dry-run'] = true; continue; }
    a[argv[i].replace(/^--/, '')] = argv[++i];
  }
  if (!a.product || !a.tranche || !a.role) {
    console.error('usage: node metrics/record.mjs --product <root> --tranche <Tn> --role <BOB|job> [--module <id>] [--test-runs <n>] [--module-lines <n>] [--transcript <file>] [--dry-run]');
    process.exit(2);
  }
  const transcript = a.transcript || newestTranscript();
  if (!transcript) { console.error('no transcript found; pass --transcript'); process.exit(2); }
  const t = sumTranscript(readFileSync(transcript, 'utf8'));
  if (!t.turns) { console.error(`${transcript}: no model requests with usage; nothing recorded`); process.exit(1); }
  const line = row(t, { role: a.role, module: a.module, testRuns: a['test-runs'], moduleLines: a['module-lines'], session: t.session || basename(transcript, '.jsonl') });
  console.log(HEADER); console.log(line);
  if (!a['dry-run']) console.log(`recorded in ${a.record ? recordInJob(a.record, line) : record(a.product, a.tranche, line)}`);
}
