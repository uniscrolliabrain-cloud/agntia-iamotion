import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';
import { extractGitUsage } from '../../lab/scripts/extract-git-usage.mjs';

test('Git usage reads the pinned tree and never follows symlink entries or working tree changes', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'iamotion-usage-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const git = (...args) => promisify(execFile)('git', ['-C', root, ...args]);
  await git('init', '-q');
  await writeFile(join(root, 'sample.html'), '<img src="asset.png"><img src="symlink.png">');
  await writeFile(join(root, 'asset.png'), 'synthetic fixture');
  await symlink('asset.png', join(root, 'symlink.png'));
  await git('add', '.');
  await git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'Fixture');
  const { stdout } = await git('rev-parse', 'HEAD');
  const input = { root, repository: 'test/git', commit: stdout.trim() };
  const report = await extractGitUsage(input);
  assert.equal(report.counts.invalidPaths, 1);
  assert.equal(report.counts.findings, 0);
  assert.deepEqual(report.records.map(({ resolution }) => resolution), ['exact', 'unresolved']);
  await writeFile(join(root, 'sample.html'), '<img src="different.png">');
  assert.deepEqual(await extractGitUsage(input), report);
  await assert.rejects(extractGitUsage({ ...input, commit: 'HEAD' }), /INVALID_GIT_USAGE_INPUT/u);
});
