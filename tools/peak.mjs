// Loaded into every test process by proc's test runner (NODE_OPTIONS --import; lane HANDOFF R14): when the process
// exits, one line with its file and its peak memory, so a heavy test is seen before it becomes a kill.
import { appendFileSync } from 'node:fs';
const f = process.env.CIVICOS_PEAK_FILE;
if (f) process.on('exit', () => { try { appendFileSync(f, `${JSON.stringify({ file: process.argv[1] || '(runner)', mb: Math.round(process.resourceUsage().maxRSS / 1024) })}\n`); } catch { /* the run goes on */ } });
