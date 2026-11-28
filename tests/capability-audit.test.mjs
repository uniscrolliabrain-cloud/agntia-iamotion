import test from 'node:test';
import assert from 'node:assert/strict';
import { accessSync } from 'node:fs';
import {
  auditCapabilities,
  summarizeCapabilityAudit,
} from '../dist/sdk/capability-audit.js';
import { capabilityRegistry } from '../dist/sdk/capability-registry.js';
import * as sdk from '../dist/index.js';

// The real port, used against the registry that actually ships in the package.
const realPort = {
  sourceExists: (source) => {
    try {
      accessSync(source);
      return true;
    } catch {
      return false;
    }
  },
  exportOf: (symbol) => sdk[symbol],
};

const base = {
  revision: 1,
  source: 'src/factory/x.ts',
  symbol: 'compileX',
  maturity: 'implemented',
  environments: ['node'],
  requires: [],
  evidence: [],
  uxConstraints: ['Preserve approved layout'],
};
const capability = (over) => ({ ...base, id: 'x.compile', title: 'X', description: 'Compiles x', ...over });
const port = (over) => ({
  sourceExists: () => true,
  exportOf: () => () => undefined,
  ...over,
});
const codes = (report) => report.findings.map((finding) => finding.code);

test('a registry whose claims hold produces an empty report', () => {
  const report = auditCapabilities([capability()], port());
  assert.equal(report.ok, true);
  assert.deepEqual(report.findings, []);
  assert.deepEqual(report.counts, { error: 0, warning: 0 });
  assert.equal(report.capabilities, 1);
  assert.ok(Object.isFrozen(report));
});

test('a source that no longer exists is an error, not a warning', () => {
  const report = auditCapabilities([capability()], port({ sourceExists: () => false }));
  assert.equal(report.ok, false);
  assert.deepEqual(codes(report), ['MISSING_SOURCE']);
  assert.match(report.findings[0].detail, /src\/factory\/x\.ts/);
});

test('a renamed symbol is caught at the entrypoint', () => {
  const report = auditCapabilities([capability()], port({ exportOf: () => undefined }));
  assert.deepEqual(codes(report), ['MISSING_SYMBOL']);
  assert.equal(report.ok, false);
});

test('a symbol that is not callable is an error', () => {
  const report = auditCapabilities([capability()], port({ exportOf: () => ({}) }));
  assert.deepEqual(codes(report), ['SYMBOL_NOT_CALLABLE']);
  assert.match(report.findings[0].detail, /object/);
});

test('duplicate identifiers are refused', () => {
  const report = auditCapabilities([capability(), capability()], port());
  assert.deepEqual(codes(report), ['DUPLICATE_CAPABILITY']);
  assert.equal(report.ok, false);
});

test('a maturity claim without evidence warns but does not fail the build', () => {
  const report = auditCapabilities([capability({ maturity: 'tested' })], port());
  assert.equal(report.ok, true);
  assert.deepEqual(codes(report), ['UNEVIDENCED_MATURITY']);
  assert.equal(report.counts.warning, 1);
});

test('certification without a procedure is an error', () => {
  const report = auditCapabilities(
    [capability({ maturity: 'certified', evidence: ['tests/x.test.mjs'] })],
    port(),
  );
  assert.deepEqual(codes(report), ['CERTIFIED_WITHOUT_SOP']);
  assert.equal(report.ok, false);
});

test('a dependency on an undeclared capability is an error', () => {
  const report = auditCapabilities([capability({ requires: ['ghost'] })], port());
  assert.deepEqual(codes(report), ['MISSING_DEPENDENCY']);
  assert.match(report.findings[0].detail, /ghost/);
});

test('reports are deterministic and summarised with the first failure', () => {
  const registry = [
    capability({ id: 'z', requires: ['ghost'] }),
    capability({ id: 'a', maturity: 'tested' }),
  ];
  const first = auditCapabilities(registry, port());
  const second = auditCapabilities([...registry].reverse(), port());
  assert.deepEqual(first, second);
  assert.deepEqual(
    first.findings.map((finding) => [finding.severity, finding.id]),
    [['error', 'z'], ['warning', 'a']],
  );
  assert.match(summarizeCapabilityAudit(first), /2 capabilities · 1 errors · 1 warnings · first: z MISSING_DEPENDENCY/);
});

test('a broken port is rejected instead of silently passing', () => {
  assert.throws(() => auditCapabilities([capability()], {}), /INVALID_AUDIT_PORT/);
});

// Two tests on the shipped registry: one proves the current claims hold, the other proves
// the audit would notice if they stopped holding. Without the second, a green audit is
// indistinguishable from an audit that cannot fail.
test('the shipped registry passes the audit against the built package', () => {
  const report = auditCapabilities(capabilityRegistry, realPort);
  assert.deepEqual(report.findings, []);
  assert.equal(report.ok, true);
  assert.ok(report.capabilities >= 12);
});

test('the audit bites: renaming one declared symbol fails the shipped registry', () => {
  const [first] = capabilityRegistry;
  const mutated = [{ ...first, symbol: `${first.symbol}Renamed` }, ...capabilityRegistry.slice(1)];
  const report = auditCapabilities(mutated, realPort);
  assert.equal(report.ok, false);
  assert.equal(report.findings[0].code, 'MISSING_SYMBOL');
  assert.match(summarizeCapabilityAudit(report), new RegExp(first.id));
});
