import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

// The published entrypoint must stay usable from a browser: no Node builtins and no
// dependency that only exists for tooling. The check walks the built import graph, so
// it fails on the shipped artifact instead of on a source-level convention.

const ROOT = new URL('..', import.meta.url).pathname;
const ENTRY = resolve(ROOT, 'dist/index.js');

const NODE_BUILTINS = new Set([
  'assert', 'buffer', 'child_process', 'cluster', 'crypto', 'dgram', 'dns', 'events',
  'fs', 'fs/promises', 'http', 'http2', 'https', 'module', 'net', 'os', 'path',
  'perf_hooks', 'process', 'readline', 'stream', 'string_decoder', 'timers', 'tls',
  'tty', 'url', 'util', 'v8', 'vm', 'worker_threads', 'zlib',
]);

// Only real ESM syntax: a statement-level import/export ... from '<spec>' or import('<spec>').
// Matching bare "from '" text would also hit error messages compiled into the bundle.
// The statement must close with a semicolon: data literals also contain `from '...'`.
const STATIC_IMPORT = /^\s*(?:import|export)\b[^;\n]*?from\s*['"]([^'"\n]+)['"]\s*;/gmu;
const DYNAMIC_IMPORT = /\bimport\s*\(\s*['"]([^'"\n]+)['"]\s*\)/gu;
const isRelative = (specifier) => specifier.startsWith('.') || specifier.startsWith('/');

async function walk(entry) {
  const bare = new Map();
  const visited = new Set();
  const queue = [entry];
  while (queue.length) {
    const file = queue.pop();
    if (visited.has(file)) continue;
    visited.add(file);
    const source = await readFile(file, 'utf8');
    const specifiers = [
      ...[...source.matchAll(STATIC_IMPORT)].map((match) => match[1]),
      ...[...source.matchAll(DYNAMIC_IMPORT)].map((match) => match[1]),
    ];
    for (const specifier of specifiers) {
      if (isRelative(specifier)) queue.push(resolve(dirname(file), specifier));
      else bare.set(specifier, file);
    }
  }
  return { bare, visited };
}

test('published entrypoint imports no Node builtins', async () => {
  const { bare } = await walk(ENTRY);
  const offending = [...bare.keys()].filter((specifier) => {
    const name = specifier.startsWith('node:') ? specifier.slice(5) : specifier;
    return specifier.startsWith('node:') || NODE_BUILTINS.has(name);
  });
  assert.deepEqual(offending, []);
});

test('published entrypoint only reaches declared runtime dependencies', async () => {
  const pkg = JSON.parse(await readFile(resolve(ROOT, 'package.json'), 'utf8'));
  const runtime = new Set(Object.keys(pkg.dependencies ?? {}));
  const { bare } = await walk(ENTRY);
  const undeclared = [...bare.keys()].filter((specifier) => !runtime.has(specifier));
  assert.deepEqual(undeclared, [], `bare imports outside dependencies: ${undeclared.join(', ')}`);
});

test('the graph actually contains the engine modules', async () => {
  const { visited } = await walk(ENTRY);
  const names = [...visited].join('\n');
  for (const module of ['factory/materials/surface.js', 'factory/graphics/annular-mesh.js', 'factory/materials/contrast.js']) {
    assert.ok(names.includes(module), `missing ${module} in the published graph`);
  }
});
