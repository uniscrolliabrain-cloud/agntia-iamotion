import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { resolveGraphicsFont } from '../../dist/index.js';

const bytes = new Uint8Array([1, 2, 3]);
const licenseSha256 = 'a'.repeat(64);
const face = { id: 'unit', family: 'Unit', style: 'regular',
  sha256: createHash('sha256').update(bytes).digest('hex'), licenseSha256, embedding: false,
  coverage: [65], axes: [] };
const opts = { style: 'regular', embedding: false };
test('checks license, glyph coverage, supported axes and actual font hashes', async () => {
  const select = (text, approvals, settings = opts, actual = bytes) =>
    resolveGraphicsFont([face], text, new Set(approvals), { read: async () => actual }, settings);
  assert.equal((await select('A', [licenseSha256])).ok, true);
  assert.equal((await select('B', [licenseSha256])).ok, false);
  assert.equal((await select('A', [])).ok, false);
  assert.equal((await select('A', [licenseSha256], { ...opts, embedding: true })).ok, false);
  assert.equal((await select('A', [licenseSha256], { ...opts, axes: { wght: 700 } })).ok, false);
  assert.equal((await select('A', [licenseSha256], opts, new Uint8Array([9]))).ok, false);
});
