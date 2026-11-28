import { z } from 'zod';
import { CapabilitySchema, type EngineCapability } from './living-skill.js';

// The living skill answers "what can this engine do" from hand-written records. Nothing in
// that flow can fail when a record stops being true: a capability whose source file was
// moved, whose symbol was renamed, or whose maturity was raised without evidence would keep
// appearing in the generated manual. This audit is the part that can fail.
//
// It stays browser-safe on purpose: it reads the filesystem through a port and the built
// entrypoint through a lookup, so the SDK module itself imports neither node builtins nor
// the package index (which would be circular).

export interface CapabilityAuditPort {
  /** Whether the declared source file exists next to the package being audited. */
  sourceExists(source: string): boolean;
  /** The exported value for a declared symbol, or undefined when it is not exported. */
  exportOf(symbol: string): unknown;
}

export interface CapabilityFinding {
  readonly id: string;
  readonly severity: 'error' | 'warning';
  readonly code: string;
  readonly detail: string;
}

export interface CapabilityAuditReport {
  readonly schemaVersion: 1;
  readonly capabilities: number;
  readonly ok: boolean;
  readonly counts: Readonly<{ error: number; warning: number }>;
  readonly findings: readonly CapabilityFinding[];
}

const SEVERITY_ORDER = { error: 0, warning: 1 } as const;

export function auditCapabilities(
  registryInput: unknown,
  port: CapabilityAuditPort,
): CapabilityAuditReport {
  if (typeof port?.sourceExists !== 'function' || typeof port?.exportOf !== 'function') {
    throw new Error('INVALID_AUDIT_PORT');
  }
  const registry: EngineCapability[] = z.array(CapabilitySchema).parse(registryInput);
  const declared = new Set(registry.map((entry) => entry.id));
  const seen = new Set<string>();
  const findings: CapabilityFinding[] = [];
  const add = (id: string, severity: CapabilityFinding['severity'], code: string, detail: string) =>
    findings.push({ id, severity, code, detail });

  for (const capability of registry) {
    if (seen.has(capability.id)) {
      add(capability.id, 'error', 'DUPLICATE_CAPABILITY', 'declared more than once');
    }
    seen.add(capability.id);

    if (!port.sourceExists(capability.source)) {
      add(capability.id, 'error', 'MISSING_SOURCE', `source does not exist: ${capability.source}`);
    } else if (!capability.source.startsWith('src/')) {
      add(
        capability.id,
        'warning',
        'SOURCE_OUTSIDE_SRC',
        `source is not under src/: ${capability.source}`,
      );
    }

    const exported = port.exportOf(capability.symbol);
    if (exported === undefined) {
      add(capability.id, 'error', 'MISSING_SYMBOL', `not exported by the entrypoint: ${capability.symbol}`);
    } else if (typeof exported !== 'function') {
      add(
        capability.id,
        'error',
        'SYMBOL_NOT_CALLABLE',
        `${capability.symbol} is a ${typeof exported}, not a function`,
      );
    }

    // A maturity above 'implemented' is a claim about verification. Certification already
    // requires an SOP and evidence inside compileLivingSkill; 'tested' is held to evidence
    // alone, because that is the only part of the claim a consumer can check.
    if (capability.maturity === 'tested' || capability.maturity === 'certified') {
      if (capability.evidence.length === 0) {
        add(
          capability.id,
          'warning',
          'UNEVIDENCED_MATURITY',
          `claims ${capability.maturity} without evidence`,
        );
      }
    }

    if (capability.maturity === 'certified' && !capability.sop) {
      add(capability.id, 'error', 'CERTIFIED_WITHOUT_SOP', 'certification requires a procedure');
    }

    const missing = capability.requires.filter((dependency) => !declared.has(dependency));
    if (missing.length > 0) {
      add(
        capability.id,
        'error',
        'MISSING_DEPENDENCY',
        `requires undeclared capabilities: ${missing.join(', ')}`,
      );
    }
  }

  // Deterministic order so two runs of the same registry produce the same report.
  findings.sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      a.id.localeCompare(b.id) ||
      a.code.localeCompare(b.code),
  );

  const counts = {
    error: findings.filter((finding) => finding.severity === 'error').length,
    warning: findings.filter((finding) => finding.severity === 'warning').length,
  };
  return Object.freeze({
    schemaVersion: 1 as const,
    capabilities: registry.length,
    ok: counts.error === 0,
    counts: Object.freeze(counts),
    findings: Object.freeze(findings.map((finding) => Object.freeze(finding))),
  });
}

// A one-line receipt for logs and PR bodies, with the first failure included so a reader
// does not have to open the JSON to learn what broke.
export function summarizeCapabilityAudit(report: CapabilityAuditReport) {
  const first = report.findings.find((finding) => finding.severity === 'error');
  return `${report.capabilities} capabilities · ${report.counts.error} errors · ${report.counts.warning} warnings${
    first ? ` · first: ${first.id} ${first.code}` : ''
  }`;
}
