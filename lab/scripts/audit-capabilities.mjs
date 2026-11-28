import { accessSync } from 'node:fs';
import { auditCapabilities, summarizeCapabilityAudit } from '../../dist/sdk/capability-audit.js';
import { capabilityRegistry } from '../../dist/sdk/capability-registry.js';
import * as sdk from '../../dist/index.js';

// Turns the capability registry into something that can be wrong out loud.
// Every record claims a source file and a symbol next to it claims a maturity; this walks
// both against the built package and exits non-zero when a claim no longer holds.

const sourceExists = (source) => {
  try {
    accessSync(source);
    return true;
  } catch {
    return false;
  }
};

const report = auditCapabilities(capabilityRegistry, {
  sourceExists,
  exportOf: (symbol) => sdk[symbol],
});

console.log(JSON.stringify(report, null, 2));
console.error(summarizeCapabilityAudit(report));
if (!report.ok) process.exit(1);
