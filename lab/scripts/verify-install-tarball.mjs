import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Proves the package is installable by someone who does not have this repository.
// It packs the real tarball, installs it the way a consumer would (an extracted
// node_modules entry plus the declared runtime dependencies), then runs a script that only
// knows the published name. If an export map entry, a dist file or a dependency is missing,
// this fails here instead of in a consumer's project.
//
// It deliberately does not contact the registry: the repository is private at the package
// level and publishing is not authorised. What is checked is the artifact and its
// resolution, not npm's ability to fetch it.

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const fail = (message) => {
  console.error(`verify:install FAILED — ${message}`);
  process.exit(1);
};

if (!existsSync(join(ROOT, 'dist/index.js'))) fail('dist/index.js is missing; run the build first');

const work = mkdtempSync(join(tmpdir(), 'agntia-install-'));
const packs = join(work, 'packs');
const consumer = join(work, 'consumer');
mkdirSync(packs, { recursive: true });
mkdirSync(consumer, { recursive: true });

const receipt = { package: pkg.name, version: pkg.version, mode: 'tarball-extract', exports: [], checks: [] };

try {
  const packed = spawnSync('npm', ['pack', '--ignore-scripts', '--pack-destination', packs], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (packed.status !== 0) fail(`npm pack exited ${packed.status}: ${packed.stderr.trim()}`);
  const tarballName = packed.stdout.trim().split('\n').filter(Boolean).at(-1);
  const tarball = join(packs, tarballName);
  if (!existsSync(tarball)) fail(`npm pack did not produce ${tarballName}`);

  const bytes = readFileSync(tarball);
  receipt.tarball = {
    file: tarballName,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };

  const installRoot = join(consumer, 'node_modules', '@agntia', 'motion');
  mkdirSync(installRoot, { recursive: true });
  execFileSync('tar', ['-xzf', tarball, '-C', installRoot, '--strip-components=1']);

  const installed = readFileSync(join(installRoot, 'package.json'), 'utf8');
  receipt.checks.push(['tarball carries package.json', installed.length > 0]);
  receipt.checks.push(['tarball does not carry sources', !existsSync(join(installRoot, 'src'))]);

  // Runtime dependencies of the packed package, resolved the way npm would provide them.
  for (const dependency of Object.keys(pkg.dependencies ?? {})) {
    const source = join(ROOT, 'node_modules', dependency);
    if (!existsSync(source)) fail(`runtime dependency ${dependency} is not installed here`);
    const destination = join(consumer, 'node_modules', dependency);
    if (!existsSync(destination)) symlinkSync(source, destination, 'dir');
  }

  const exportsMap = typeof pkg.exports === 'string' ? { '.': pkg.exports } : pkg.exports ?? {};
  for (const [subpath, target] of Object.entries(exportsMap)) {
    if (subpath === './package.json') continue;
    const file = resolve(installRoot, String(target));
    receipt.exports.push({ subpath, target, present: existsSync(file) });
    if (!existsSync(file)) fail(`export ${subpath} points at a missing file: ${target}`);
  }

  writeFileSync(
    join(consumer, 'consumer.mjs'),
    `import { createHash } from 'node:crypto';
import { compileMotionDocument, describeMotion, sampleMotion } from ${JSON.stringify(pkg.name + '/composition')};
import * as entrypoint from ${JSON.stringify(pkg.name)};
const policy = { surface: { glass: true, spatial: true, reducedMotion: false, intensity: 1 }, particles: false, maxParticles: 0, maxVertices: 0, maxSculptureParts: 0 };
const document = { schemaVersion: 1, id: 'consumer', revision: 0, target: { previewId: 'kpi', componentId: 'card', sourceRevision: 'a'.repeat(40) }, composition: { kind: 'scene', spec: { version: 1, id: 'scene', durationMs: 1000, layers: [{ id: 'surface', kind: 'surface', startMs: 0, durationMs: 400, stage: 1 }] } } };
const compiled = compileMotionDocument(document, { policy, features: ['surface'], lockedText: {} });
const a = sampleMotion(compiled, 250);
const b = sampleMotion(compiled, 250);
// The root entrypoint must still be loadable from a consumer, not just the subpath.
const digest = createHash('sha256').update(JSON.stringify([a, b])).digest('hex');
console.log(JSON.stringify({ summary: describeMotion(compiled), deterministic: JSON.stringify(a) === JSON.stringify(b), digest, rootExports: Object.keys(entrypoint).length }));
`,
  );

  const run = spawnSync(process.execPath, ['consumer.mjs'], { cwd: consumer, encoding: 'utf8' });
  if (run.status !== 0) fail(`consumer exited ${run.status}: ${(run.stderr || '').trim().split('\n').slice(0, 4).join(' | ')}`);
  const result = JSON.parse(run.stdout.trim());
  receipt.consumer = result;
  receipt.checks.push(['consumer compiled a document by package name', result.summary.id === 'consumer']);
  receipt.checks.push(['samples are deterministic', result.deterministic === true]);
  receipt.checks.push(['root entrypoint loads', result.rootExports > 0]);
  if (result.deterministic !== true) fail('two samples of the same instant differed');
  if (!(result.rootExports > 0)) fail('the root entrypoint exported nothing');
  if (receipt.checks.some(([, ok]) => !ok)) fail('a listed check failed');

  console.log(JSON.stringify(receipt, null, 2));
} finally {
  rmSync(work, { recursive: true, force: true });
}
