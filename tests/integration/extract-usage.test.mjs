import assert from 'node:assert/strict';
import { test } from 'node:test';
import { extractUsage } from '../../lab/scripts/extract-usage.mjs';

const scope = {
  repository: 'test/reference-tree', commit: '3'.repeat(40), sourcePath: 'demo/legacy/view.tsx',
  paths: ['demo/legacy/icon.png', 'demo/current/icon.png', 'public/card.webp', 'demo/public/card.webp'],
  aliases: { '@current': 'demo/current' }, publicRoots: ['public', 'demo/public'],
};

test('usage extraction resolves exactly pinned imports and preserves ambiguous or dynamic references', () => {
  const records = extractUsage({ ...scope, contents: [
    'import icon from "./icon.png";',
    'import updated from "@current/icon.png";',
    'const imports = import.meta.glob("./*.png");',
    'const current = import("./icon.png");',
    'const view = <><img src="/card.webp" /><img src={`/images/${id}.png`} /></>;',
  ].join('\n') });
  assert.deepEqual(records.map(({ resolution, paths }) => [resolution, paths]), [
    ['exact', ['demo/legacy/icon.png']],
    ['exact', ['demo/current/icon.png']],
    ['unresolved', []],
    ['exact', ['demo/legacy/icon.png']],
    ['candidate', ['demo/public/card.webp', 'public/card.webp']],
    ['unresolved', []],
  ]);
  assert.equal(records[0].line, 1);
  assert.equal(records[0].legacyStatus, 'legacy');
  assert.equal(records[0].commit, scope.commit);
});

test('usage extraction refuses malformed sources and never resolves a basename outside its directory', () => {
  assert.throws(() => extractUsage({ ...scope, contents: 'const invalid =' }), /USAGE_PARSE_FAILED/u);
  assert.throws(() => extractUsage({ ...scope, sourcePath: '../entry.ts', contents: '' }), /INVALID_USAGE_INPUT/u);
  const [miss] = extractUsage({ ...scope, paths: ['demo/current/icon.png'], contents: 'import "./icon.png";' });
  assert.equal(miss.resolution, 'unresolved');
});
