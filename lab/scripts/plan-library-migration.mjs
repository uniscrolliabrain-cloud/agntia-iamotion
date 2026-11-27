import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { auditBaseline } from './audit-baseline.mjs';

const hash = (value) => createHash('sha256').update(value).digest('hex');

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export async function planLibraryMigration(root) {
  const report = await auditBaseline(root);
  if (report.counts.errors) return { status: 'blocked', reason: 'AUDIT_FAILED', report };

  const path = 'library/catalog/assets.json';
  const bytes = await readFile(join(root, path));
  if (hash(bytes) !== report.inputHashes[path]) {
    return { status: 'blocked', reason: 'AUDIT_INPUT_CHANGED', path };
  }

  const files = JSON.parse(bytes).map((asset) => ({
    path: `library/assets/pending-review/${asset.id}${asset.extension}`,
    sha256: asset.id,
    bytes: asset.bytes,
    derivedPath: `binary/${asset.id}.json`,
    legacyPath: `library/entities/${asset.id}`,
  })).sort((a, b) => a.sha256.localeCompare(b.sha256, 'en'));

  const manifest = {
    schemaVersion: 1,
    parentSnapshotId: null,
    inputHashes: report.inputHashes,
    toolVersions: { audit: report.schemaVersion, migrationPlan: 1 },
    files,
    counts: report.counts,
  };

  return {
    status: 'dry-run',
    manifest: { ...manifest, snapshotId: hash(canonical(manifest)) },
    pending: report.findings,
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const plan = await planLibraryMigration(resolve(process.argv[2] ?? '.'));
  console.log(JSON.stringify(plan, null, 2));
  process.exitCode = plan.status === 'blocked' ? 2 : 0;
}
