// Runs the format, architecture and coverage checks on a product repository, the channels check when the product
// has a registry `build/channels.md` (§13.1), and the words check when the product has a word table
// (`docs/development/ux-substrate/screens/words.json`; §8.6: it runs in every job's checks before COMPLETE and at every
// layer close; bio K3923). and the fixplan check when a `build/plan/fix-round-*.md` is IN FORCE or DRAFT (§8; bio K4426, K4597). Ownership needs a job's module and base ref, so it runs on its own (checks/ownership.mjs).
// Usage: node checks/run.mjs <product-root>
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { checkArchitecture } from './architecture.mjs';
import { checkCoverage } from './coverage.mjs';
import { checkFormat } from './format.mjs';
import { checkChannels } from './channels.mjs';
import { checkWords, WORDS_JSON } from './words.mjs';
import { checkFixplan, fixPlans } from './fixplan.mjs';
import { report } from './lib.mjs';

const root = process.argv[2] || '.';
const checks = [['format', checkFormat], ['architecture', checkArchitecture], ['coverage', checkCoverage]];
if (existsSync(join(root, 'build/channels.md'))) checks.push(['channels', checkChannels]);
if (existsSync(join(root, WORDS_JSON))) checks.push(['words', checkWords]); // async: awaited below
if (fixPlans(root).length) checks.push(['fixplan', checkFixplan]); // a fix-round plan IN FORCE or DRAFT (K4597)
let failed = 0;
for (const [name, fn] of checks) {
  const { failures, summary } = await fn(root);
  failed += report(name, failures, summary);
}
process.exitCode = failed ? 1 : 0;
