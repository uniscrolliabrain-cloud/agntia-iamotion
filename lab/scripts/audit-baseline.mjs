import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, open, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const sha256 = /^[a-f0-9]{64}$/;
const safePath = (value) => typeof value === 'string' &&
  !/[\\:\u0000-\u001f]/u.test(value) &&
  value.split('/').every((part) => part && part !== '.' && part !== '..');
const strings = (value) => Array.isArray(value) && value.every((item) => typeof item === 'string');
const signature = {
  '.png': (b) => b.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')),
  '.jpg': (b) => b.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex')),
  '.webp': (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
  '.svg': (b) => /<svg(?:\s|>)/iu.test(b.toString('utf8')),
};
const binary = (row) => row && typeof row.id === 'string' && sha256.test(row.id) &&
  Object.hasOwn(signature, row.extension) && Number.isSafeInteger(row.bytes) && row.bytes > 0;
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function containedFile(root, relative) {
  if (!safePath(relative)) throw Object.assign(new Error('Invalid path'), { code: 'UNSAFE_PATH' });
  const parts = relative.split('/');
  let directory = root;
  for (const part of parts.slice(0, -1)) {
    directory = join(directory, part);
    if (!(await lstat(directory)).isDirectory()) {
      throw Object.assign(new Error('Expected a directory'), { code: 'UNSAFE_PATH' });
    }
  }
  const file = join(root, relative);
  if (!(await lstat(file)).isFile()) {
    throw Object.assign(new Error('Expected a regular file'), { code: 'UNSAFE_PATH' });
  }
  return open(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
}

export async function auditBaseline(root) {
  const findings = [];
  const inputHashes = {};
  const evidenceDigest = createHash('sha256');
  const add = (code, id, detail = null, severity = 'error') =>
    findings.push({ code, id, detail, severity });
  async function json(path, isEvidence = false) {
    let file;
    try {
      file = await containedFile(root, path);
      const buffer = Buffer.alloc(4 * 1024 * 1024 + 1);
      let length = 0;
      while (length < buffer.length) {
        const { bytesRead } = await file.read(buffer, length, buffer.length - length, null);
        if (!bytesRead) break;
        length += bytesRead;
      }
      if (length === buffer.length) throw new Error('Input exceeds byte limit');
      const bytes = buffer.subarray(0, length);
      if (isEvidence) evidenceDigest.update(path).update(':').update(digest(bytes)).update('\n');
      else inputHashes[path] = digest(bytes);
      return JSON.parse(bytes.toString('utf8'));
    } catch (error) {
      add('INVALID_INPUT', path, error.code ?? error.message);
      return null;
    } finally {
      await file?.close();
    }
  }

  function index(rows, valid, name) {
    const result = new Map();
    if (!Array.isArray(rows)) add('INVALID_ROWS', name);
    for (const [position, row] of (Array.isArray(rows) ? rows : []).entries()) {
      if (!valid(row)) add('INVALID_ROW', name, position);
      else if (result.has(row.id)) add('DUPLICATE_ID', row.id, name);
      else result.set(row.id, row);
    }
    return result;
  }

  const assets = index(await json('library/catalog/assets.json'), (row) =>
    binary(row) && strings(row.cardIds) && strings(row.paths) && strings(row.refs) &&
    typeof row.status === 'string', 'assets');
  const cards = index(await json('library/catalog/semantic.json'), (row) =>
    row && typeof row.id === 'string' && row.id.length > 0 &&
    strings(row.assetIds) && row.assetIds.every((id) => sha256.test(id)), 'cards');

  const refs = {};
  const sourceHashes = new Map();
  const inventoried = new Set();
  for (const ref of ['main', 'ui-lab', 'ui-lab-pro']) {
    const inventory = await json(`library/inventory/${ref}.json`);
    const rows = index(inventory?.assets, (row) =>
      binary(row) && row.sha256 === row.id && Array.isArray(row.sources), ref);
    refs[ref] = { commit: inventory?.commit ?? null, assets: rows.size, sources: 0 };
    if (inventory?.ref !== ref || !/^[a-f0-9]{40}$/.test(inventory?.commit) ||
        inventory?.uniqueAssets !== rows.size) add('INVALID_INVENTORY', ref);
    const foldedPaths = new Map();
    for (const row of rows.values()) {
      inventoried.add(row.id);
      const asset = assets.get(row.id);
      if (!asset || row.bytes !== asset.bytes) add('INVENTORY_MISMATCH', row.id, ref);
      for (const source of row.sources) {
        refs[ref].sources++;
        if (!source || typeof source.repository !== 'string' || !source.repository ||
            source.commit !== inventory.commit || source.ref !== ref || !safePath(source.path)) {
          add('INVALID_SOURCE', row.id, ref);
          continue;
        }
        const key = JSON.stringify([source.repository, source.commit, source.path]);
        const previous = sourceHashes.get(key);
        if (previous && previous !== row.id) add('SOURCE_HASH_CONFLICT', row.id, key);
        sourceHashes.set(key, row.id);
        const folded = JSON.stringify([source.repository, source.commit, source.path.toLowerCase()]);
        if (foldedPaths.has(folded)) add('AMBIGUOUS_SOURCE_PATH', row.id, key);
        foldedPaths.set(folded, row.id);
      }
    }
    if (inventory?.trackedImages !== refs[ref].sources) add('SOURCE_COUNT_MISMATCH', ref);
  }

  const expectedFiles = new Set();
  let verified = 0;
  let classified = 0;
  let claims = 0;
  for (const asset of assets.values()) {
    if (!inventoried.has(asset.id)) add('MISSING_PROVENANCE', asset.id);
    if (asset.status !== 'approved') add('RIGHTS_REVIEW_PENDING', asset.id, null, 'pending');
    for (const path of asset.paths) if (!safePath(path)) add('UNSAFE_SOURCE_PATH', asset.id, path);
    for (const id of asset.cardIds) {
      if (!cards.get(id)?.assetIds.includes(asset.id)) add('BROKEN_CARD_LINK', asset.id, id);
    }

    const evidence = await json(`library/entities/${asset.id}/evidence.json`, true);
    if (!Array.isArray(evidence?.claims)) add('INVALID_ENTITY_EVIDENCE', asset.id);
    else {
      if (evidence.claims.length) classified++;
      claims += evidence.claims.length;
    }

    const name = asset.id + asset.extension;
    expectedFiles.add(name);
    let file;
    try {
      file = await containedFile(root, `library/assets/pending-review/${name}`);
      const hash = createHash('sha256');
      const header = Buffer.alloc(128);
      let bytes = 0;
      const svg = [];
      for await (const chunk of file.createReadStream({ autoClose: false })) {
        if (bytes < header.length) chunk.copy(header, bytes, 0, header.length - bytes);
        bytes += chunk.length;
        if (bytes > 95 * 1024 * 1024) throw Object.assign(new Error(), { code: 'ASSET_TOO_LARGE' });
        hash.update(chunk);
        if (asset.extension === '.svg' && bytes <= 1024 * 1024) svg.push(chunk);
      }
      const actualHash = hash.digest('hex');
      const sample = asset.extension === '.svg' ? Buffer.concat(svg) : header;
      const isLfs = header.toString('utf8').startsWith('version https://git-lfs.github.com/spec/v1');
      if (isLfs) add('LFS_POINTER', asset.id);
      if (bytes !== asset.bytes) add('SIZE_MISMATCH', asset.id, bytes);
      if (actualHash !== asset.id) add('HASH_MISMATCH', asset.id, actualHash);
      if (!signature[asset.extension](sample)) add('MIME_MISMATCH', asset.id, asset.extension);
      if (!isLfs && bytes === asset.bytes && actualHash === asset.id &&
          signature[asset.extension](sample)) verified++;
      if (asset.extension === '.svg') {
        const xml = sample.toString('utf8')
          .replace(/^\s*<\?xml[^?]*\?>/iu, '')
          .replace(/url\s*\(\s*#[a-z_][\w.-]*\s*\)/giu, '');
        // Conservative screening for triage. Every SVG still requires a separate review before use.
        if (bytes > 1024 * 1024 ||
            /<!|<\?|<(?:[\w-]+:)?(?:script|foreignObject|style|image|use)\b|\bon[\w-]+\s*=|\b(?:href|src)\s*=|url\s*\(/iu.test(xml)) {
          add('UNSAFE_SVG', asset.id);
        }
      }
    } catch (error) {
      add(error.code === 'ENOENT' ? 'MISSING_BINARY' : error.code ?? 'READ_ERROR', asset.id);
    } finally {
      await file?.close();
    }
  }

  for (const card of cards.values()) {
    if (!card.assetIds.length) add('UNLINKED_CARD', card.id, null, 'pending');
    for (const id of card.assetIds) {
      if (!assets.get(id)?.cardIds.includes(card.id)) add('BROKEN_ASSET_LINK', card.id, id);
    }
  }
  try {
    for (const path of ['library', 'library/assets', 'library/assets/pending-review']) {
      if (!(await lstat(join(root, path))).isDirectory()) {
        throw Object.assign(new Error('Expected a directory'), { code: 'UNSAFE_PATH' });
      }
    }
    for (const name of await readdir(join(root, 'library/assets/pending-review'))) {
      if (!expectedFiles.has(name)) add('UNLISTED_BINARY', name);
    }
  } catch (error) {
    add('ASSET_DIRECTORY_ERROR', 'library/assets/pending-review', error.code);
  }
  const entities = await json('lab/observability/entity-build.json');
  if (entities?.entities !== assets.size || entities?.classified !== classified ||
      entities?.claims !== claims) add('ENTITY_RECEIPT_COUNT_MISMATCH', 'entities');
  await json('library/taxonomy/lexicon.v1.json');
  for (const path of ['library/catalog/assets.json', 'library/catalog/semantic.json',
    'library/taxonomy/lexicon.v1.json']) {
    if (inputHashes[path] !== entities?.inputHashes?.[path]) add('ENTITY_RECEIPT_HASH_MISMATCH', path);
  }
  inputHashes['library/entities/*/evidence.json'] = evidenceDigest.digest('hex');
  findings.sort((a, b) => Buffer.from(JSON.stringify(a)).compare(Buffer.from(JSON.stringify(b))));
  return {
    schemaVersion: 1,
    inputHash: digest(JSON.stringify(inputHashes)),
    inputHashes,
    counts: {
      assets: assets.size, verified, cards: cards.size, classified, claims, sourceTuples: sourceHashes.size,
      errors: findings.filter(({ severity }) => severity === 'error').length,
      pending: findings.filter(({ severity }) => severity === 'pending').length,
    },
    refs,
    findings,
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const report = await auditBaseline(resolve(process.argv[2] ?? '.'));
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.counts.errors ? 2 : 0;
}
