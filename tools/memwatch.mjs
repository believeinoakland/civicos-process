// proc's memory watch (lane HANDOFF R14): runs beside a test run and, every 200 ms, reads the resident memory of every
// process under <root pid>. One over <cap MB> is killed at once, so a runaway test fails by itself instead of the
// kernel killing whatever is largest (a heap cap cannot do this: much of a test's memory lies outside the JS heap).
// Writes one JSON line per process seen, with its test file, peak and whether it was killed, to <log>, kept current at each
// reading; exits when <root pid> does, or on SIGTERM.
//   node tools/memwatch.mjs <root pid> <cap MB> <log>
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
const [root, capMb, log] = [Number(process.argv[2]), Number(process.argv[3]), process.argv[4]];
const seen = new Map();   // pid → { file, mb, killed }
const read = (p) => { try { return readFileSync(p, 'utf8'); } catch { return null; } };
function tick() {
  const parent = new Map();
  for (const d of readdirSync('/proc')) {
    if (!/^\d+$/.test(d)) continue;
    const st = read(`/proc/${d}/stat`);
    if (st) parent.set(Number(d), Number(st.slice(st.lastIndexOf(')') + 2).split(' ')[1]));
  }
  const under = (pid) => { for (let p = parent.get(pid), n = 0; p && n < 64; p = parent.get(p), n++) if (p === root) return true; return false; };
  for (const pid of parent.keys()) {
    if (pid === process.pid || !under(pid)) continue;
    const mb = Math.round(Number(read(`/proc/${pid}/status`)?.match(/^VmRSS:\s+(\d+) kB$/m)?.[1] || 0) / 1024);
    const s = seen.get(pid) ?? { file: (read(`/proc/${pid}/cmdline`) || '').split('\0').filter((a) => a.endsWith('.test.mjs')).pop() || '(runner)', mb: 0 };
    s.mb = Math.max(s.mb, mb);
    if (mb > capMb && !s.killed) { try { process.kill(pid, 'SIGKILL'); s.killed = true; } catch { /* gone */ } }
    seen.set(pid, s);
  }
  writeFileSync(log, [...seen.values()].map((s) => JSON.stringify(s)).join('\n') + '\n');   // kept current: the reader never waits
}
const done = () => process.exit(0);
process.on('SIGTERM', done);
setInterval(() => { try { process.kill(root, 0); } catch { done(); } tick(); }, 200);
