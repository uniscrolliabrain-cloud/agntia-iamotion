import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { extractUsage, isUsageSource, safeUsagePath } from './extract-usage.mjs';

const run = promisify(execFile);
const maxSourceBytes = 1024 * 1024;
const sha = /^[a-f0-9]{40}$/u;
const text = new TextDecoder('utf-8', { fatal: true });
const hash = (value) => createHash('sha256').update(value).digest('hex');

export async function extractGitUsage({ root, repository, commit, prefix = '', aliases = {}, publicRoots = [] }) {
  if (typeof repository !== 'string' || !repository || !sha.test(commit) ||
      (prefix && !safeUsagePath(prefix))) throw new Error('INVALID_GIT_USAGE_INPUT');

  async function git(args, maxBuffer = 12 * 1024 * 1024) {
    const { stdout } = await run('git', ['--no-replace-objects', '-C', root, ...args], {
      encoding: 'buffer', maxBuffer, timeout: 15000, env: { ...process.env, GIT_NO_LAZY_FETCH: '1' },
    });
    return stdout;
  }

  if (text.decode(await git(['cat-file', '-t', commit])).trim() !== 'commit') throw new Error('EXPECTED_COMMIT');
  const tree = await git(['ls-tree', '-rlz', '--full-tree', commit]);
  const entries = [];
  let invalidPaths = 0;
  for (const row of text.decode(tree).split('\0')) {
    if (!row) continue;
    const separator = row.indexOf('\t');
    const meta = row.slice(0, separator).match(/^100(?:644|755) blob ([a-f0-9]{40}) +([0-9]+)$/u);
    const path = row.slice(separator + 1);
    if (!meta || !safeUsagePath(path)) {
      invalidPaths++;
      continue;
    }
    entries.push({ path, oid: meta[1], bytes: Number(meta[2]) });
  }

  const paths = entries.map(({ path }) => path);
  const sources = entries.filter(({ path }) => isUsageSource(path) &&
    (!prefix || path === prefix || path.startsWith(`${prefix}/`)));
  if (paths.length > 100000 || sources.length > 3000 ||
      sources.reduce((sum, file) => sum + Math.min(file.bytes, maxSourceBytes), 0) > 64 * maxSourceBytes) {
    throw new Error('USAGE_TREE_LIMIT');
  }
  const findings = [];
  const records = [];
  for (const { path, oid, bytes } of sources) {
    if (bytes > maxSourceBytes) {
      findings.push({ path, code: 'SOURCE_TOO_LARGE' });
      continue;
    }
    const contents = await git(['cat-file', 'blob', oid], maxSourceBytes + 1);
    try {
      const found = extractUsage({ repository, commit, sourcePath: path,
        contents: text.decode(contents), paths, aliases, publicRoots });
      for (const record of found) records.push(record);
    } catch (error) {
      findings.push({ path, code: error instanceof TypeError ? 'INVALID_SOURCE_ENCODING_OR_OPTIONS' : 'SOURCE_PARSE_FAILED' });
    }
  }
  return {
    schemaVersion: 1,
    repository, commit, prefix,
    scope: { aliases, publicRoots },
    inputHash: hash(JSON.stringify({ repository, commit, prefix, aliases, publicRoots, tree: hash(tree) })),
    counts: { sources: sources.length, invalidPaths, findings: findings.length, records: records.length },
    findings, records,
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const [, , commit, prefix = '', repository = 'uniscrolliabrain-cloud/agntia-iamotion'] = process.argv;
  const report = await extractGitUsage({ root: resolve('.'), repository, commit, prefix,
    publicRoots: ['apps/ui-lab/public'] });
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.counts.findings ? 2 : 0;
}
