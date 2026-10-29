// Runs the format, architecture and coverage checks on a product repository, the channels check when the product
// has a registry `build/channels.md` (mechanics: the cross-account channel), and the words check when the product has a word table
// (`docs/development/ux-substrate/screens/words.json`; rulebook BLD 5: it runs in every job's checks before COMPLETE and at every
// layer close; bio K3923), and the fixtures check always (rulebook BLD 5; bio K5036). Ownership needs a job's module and base ref, so it runs on its own (checks/ownership.mjs).
// Usage: node checks/run.mjs <product-root>
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { checkArchitecture } from './architecture.mjs';
import { checkCoverage } from './coverage.mjs';
import { checkFormat } from './format.mjs';
import { checkChannels } from './channels.mjs';
import { checkWords, WORDS_JSON } from './words.mjs';
import { checkFixtures } from './fixtures.mjs';
import { report } from './lib.mjs';

const root = process.argv[2] || '.';
const checks = [['format', checkFormat], ['architecture', checkArchitecture], ['coverage', checkCoverage], ['fixtures', checkFixtures]];
if (existsSync(join(root, 'build/channels.md'))) checks.push(['channels', checkChannels]);
if (existsSync(join(root, WORDS_JSON))) checks.push(['words', checkWords]); // async: awaited below
let failed = 0;
for (const [name, fn] of checks) {
  const { failures, summary } = await fn(root);
  failed += report(name, failures, summary);
}
process.exitCode = failed ? 1 : 0;
