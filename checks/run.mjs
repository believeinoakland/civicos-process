// Runs the architecture, coverage and format checks on a product repository; ownership needs a job's
// module and base ref, so it runs on its own (checks/ownership.mjs).
// Usage: node checks/run.mjs <product-root>
import { checkArchitecture } from './architecture.mjs';
import { checkCoverage } from './coverage.mjs';
import { checkFormat } from './format.mjs';
import { report } from './lib.mjs';

const root = process.argv[2] || '.';
let failed = 0;
for (const [name, fn] of [['format', checkFormat], ['architecture', checkArchitecture], ['coverage', checkCoverage]]) {
  const { failures, summary } = fn(root);
  failed += report(name, failures, summary);
}
process.exitCode = failed ? 1 : 0;
