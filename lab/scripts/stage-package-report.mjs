import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = process.cwd();
const path = resolve(process.argv[2] ?? '');
const relativePath = relative(root, path);
if (!/^lab\/staging\/(?:[\w.-]+\/)*[\w.-]+\.tgz$/u.test(relativePath)) {
  throw new Error('EXPECTED_LOCAL_STAGED_TARBALL');
}
const { stdout } = await run('tar', ['--list', '--gzip', '--file', path], {
  maxBuffer: 1024 * 1024, timeout: 5000,
});
const files = stdout.trimEnd().split('\n').sort();
const allowed = /^(?:package\/(?:package\.json|README\.md|LICENSE)|package\/dist\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.(?:js|d\.ts))$/u;
if (new Set(files).size !== files.length || !files.every((name) => allowed.test(name)) ||
    !['package/package.json', 'package/dist/index.js', 'package/dist/index.d.ts'].every((name) => files.includes(name))) {
  throw new Error('PACKAGE_CONTENTS_OUTSIDE_ALLOWLIST');
}
const hash = (data) => createHash('sha256').update(data).digest('hex');
const [packageBytes, lock, packed] = await Promise.all(
  ['package.json', 'pnpm-lock.yaml', path].map((name) => readFile(name)),
);
const metadata = JSON.parse(packageBytes);
console.log(JSON.stringify({
  schemaVersion: 1,
  status: 'local-staging',
  version: metadata.version,
  packageManager: metadata.packageManager,
  runtime: process.version,
  tarball: { path: relativePath, bytes: packed.length, sha256: hash(packed) },
  lockHash: hash(lock),
  files,
}, null, 2));
