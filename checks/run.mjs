// Runs the architecture, coverage and format checks on a product repository, and the channels check when the product
// has a registry `build/channels.md` (§13.1); ownership needs a job's module and base ref, so it runs on its own
// (checks/ownership.mjs).
// Usage: node checks/run.mjs <product-root>
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { checkArchitecture } from './architecture.mjs';
import { checkCoverage } from './coverage.mjs';
import { checkFormat } from './format.mjs';
import { checkChannels } from './channels.mjs';
import { report } from './lib.mjs';

const root = process.argv[2] || '.';
const checks = [['format', checkFormat], ['architecture', checkArchitecture], ['coverage', checkCoverage]];
if (existsSync(join(root, 'build/channels.md'))) checks.push(['channels', checkChannels]);
let failed = 0;
for (const [name, fn] of checks) {
  const { failures, summary } = fn(root);
  failed += report(name, failures, summary);
}
process.exitCode = failed ? 1 : 0;
