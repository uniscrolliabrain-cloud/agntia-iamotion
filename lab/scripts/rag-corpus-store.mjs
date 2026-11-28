import { constants } from 'node:fs';
import { lstat, mkdir, mkdtemp, open, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { canonical, hash } from './plan-library-migration.mjs';

const digest = /^[a-f0-9]{64}$/u;
const scopeName = /^[a-z0-9][a-z0-9-]{0,95}$/u;
const filenames = ['cards.jsonl', 'reverse-index.json', 'tombstones.json'];
const maxBytes = 16 * 1024 * 1024;
const bytesOf = (data) => Buffer.from(canonical(data) + '\n');

async function directory(path) {
  if (!(await lstat(path)).isDirectory()) throw new Error('UNSAFE_CORPUS_DIRECTORY');
}

async function read(path, size) {
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const metadata = await handle.stat();
    if (!metadata.isFile() || metadata.size > size) throw new Error('INVALID_CORPUS_FILE');
    const buffer = Buffer.alloc(metadata.size + 1);
    let offset = 0;
    while (offset < buffer.length) {
      const { bytesRead } = await handle.read(buffer, offset, buffer.length - offset, null);
      if (!bytesRead) break;
      offset += bytesRead;
    }
    if (offset !== metadata.size) throw new Error('CORPUS_FILE_CHANGED');
    return buffer.subarray(0, offset);
  } finally {
    await handle.close();
  }
}

async function write(path, bytes) {
  const handle = await open(path, 'wx', 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function sync(path) {
  const handle = await open(path, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

export async function readRagCorpus(root, snapshotId, expectedScope) {
  if (!digest.test(snapshotId) || !scopeName.test(expectedScope)) throw new Error('INVALID_CORPUS_REFERENCE');
  await directory(root);
  const path = join(root, snapshotId);
  await directory(path);
  const manifestBytes = await read(join(path, 'manifest.json'), 8192);
  if (hash(manifestBytes) !== snapshotId) throw new Error('CORPUS_MANIFEST_MISMATCH');
  const manifest = JSON.parse(manifestBytes);
  if (manifest.schemaVersion !== 1 || manifest.scope !== expectedScope ||
      !Number.isSafeInteger(manifest.cardCount) || manifest.cardCount < 0 || manifest.cardCount > 10000 ||
      !Array.isArray(manifest.files) || manifest.files.length !== filenames.length) {
    throw new Error('INVALID_CORPUS_MANIFEST');
  }
  const documents = new Map();
  for (const [index, { name, sha256, bytes }] of manifest.files.entries()) {
    if (name !== filenames[index] || !digest.test(sha256) ||
        !Number.isSafeInteger(bytes) || bytes < 0 || bytes > maxBytes) throw new Error('INVALID_CORPUS_FILE_ENTRY');
    const data = await read(join(path, name), bytes);
    if (data.length !== bytes || hash(data) !== sha256) throw new Error('CORPUS_ARTIFACT_MISMATCH');
    documents.set(name, data.toString('utf8'));
  }
  const cards = documents.get('cards.jsonl').trimEnd().split('\n').filter(Boolean).map((line) => JSON.parse(line));
  if (cards.length !== manifest.cardCount || cards.some((card) => card.scope !== expectedScope) ||
      new Set(cards.map(({ id }) => id)).size !== cards.length) throw new Error('INVALID_CORPUS_CARDS');
  return { manifest, snapshotId, cards,
    tombstones: JSON.parse(documents.get('tombstones.json')),
    reverseIndex: JSON.parse(documents.get('reverse-index.json')) };
}

export async function stageRagCorpus(root, result) {
  if (result.ok !== true || !scopeName.test(result.scope) || result.cards.length > 10000 ||
      result.cards.some((card) => card.scope !== result.scope)) throw new Error('INVALID_CORPUS_RESULT');
  await directory(root);
  const cards = [...result.cards].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const documents = [
    Buffer.from(cards.map(canonical).join('\n') + (cards.length ? '\n' : '')),
    bytesOf(result.reverseIndex), bytesOf(result.tombstones),
  ];
  if (documents.some((data) => data.length > maxBytes)) throw new Error('CORPUS_SIZE_LIMIT');
  const manifest = bytesOf({ schemaVersion: 1, scope: result.scope, cardCount: cards.length,
    files: filenames.map((name, index) => ({ name, bytes: documents[index].length, sha256: hash(documents[index]) })),
  });
  const snapshotId = hash(manifest);
  const staged = await mkdtemp(join(root, '.rag-'));
  try {
    await mkdir(join(staged, 'corpus'), { mode: 0o700 });
    const path = join(staged, 'corpus');
    for (const [index, name] of filenames.entries()) await write(join(path, name), documents[index]);
    await write(join(path, 'manifest.json'), manifest);
    await sync(path);
    try {
      await rename(path, join(root, snapshotId));
    } catch (error) {
      if (!['EEXIST', 'ENOTEMPTY'].includes(error.code)) throw error;
    }
    await sync(root);
    return await readRagCorpus(root, snapshotId, result.scope);
  } finally {
    await rm(staged, { recursive: true, force: true });
  }
}
