import { readFile } from 'node:fs/promises';
import { dirname, join, posix, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { auditBaseline } from './audit-baseline.mjs';

const tuple = ({ repository, commit, path }) => JSON.stringify([repository, commit, path]);
const safePath = (path) => typeof path === 'string' &&
  !/[\\:\u0000-\u001f]/u.test(path) && path.split('/').every((part) => part && part !== '.' && part !== '..');

const pinned = ({ repository, commit, path }) => typeof repository === 'string' &&
  repository.length > 0 && typeof commit === 'string' && /^[a-f0-9]{40}$/u.test(commit) && safePath(path);

export function reconcileLibrary(assets, inventories, cards, assignments = []) {
  const binaries = new Set(assets.map(({ id }) => id));
  const sources = new Map();
  for (const inventory of inventories) {
    for (const asset of inventory.assets) {
      for (const source of asset.sources) {
        if (!pinned(source) || !binaries.has(asset.id)) continue;
        const key = tuple(source);
        const ids = sources.get(key) ?? new Set();
        ids.add(asset.id);
        sources.set(key, ids);
      }
    }
  }

  const binaryToVisual = Object.fromEntries([...binaries].sort().map((id) => [id, []]));
  const visualToBinary = Object.create(null);
  for (const { visualId, binaryIds } of assignments) {
    if (!/^v_[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(visualId) ||
        Object.hasOwn(visualToBinary, visualId) || !Array.isArray(binaryIds) || binaryIds.length === 0 ||
        new Set(binaryIds).size !== binaryIds.length || binaryIds.some((id) => !binaries.has(id))) {
      throw new Error('INVALID_VISUAL_ASSIGNMENT');
    }
    visualToBinary[visualId] = [...binaryIds].sort();
    for (const id of binaryIds) binaryToVisual[id].push(visualId);
  }
  for (const ids of Object.values(binaryToVisual)) ids.sort();

  const candidates = [];
  const conflicts = [];
  const unresolved = [];
  for (const { id, references } of [...cards].sort((a, b) => a.id.localeCompare(b.id, 'en'))) {
    const found = new Set();
    for (const [index, reference] of references.entries()) {
      const { hash, path } = reference;
      const key = pinned(reference) ? tuple(reference) : undefined;
      const matches = key ? [...(sources.get(key) ?? [])].sort() : [];
      if (matches.length > 1 || (hash !== undefined && matches.length && !matches.includes(hash))) {
        conflicts.push({ id, index, hash: hash ?? null, path, matches });
        continue;
      }
      const match = hash ?? matches[0];
      if (binaries.has(match)) found.add(match);
      else unresolved.push({ id, index, reason: hash ? 'UNKNOWN_HASH' : key ? 'PATH_NOT_FOUND' : 'UNPINNED_PATH' });
    }
    if (!references.length) unresolved.push({ id, index: null, reason: 'NO_REFERENCE' });
    candidates.push({ id, binaryIds: [...found].sort() });
  }

  return { schemaVersion: 1, candidates, conflicts, unresolved, binaryToVisual, visualToBinary };
}

function cardReferences(card) {
  const source = card.source ?? {};
  const { repository, commit, manifest, variants = {}, sha256 = {} } = source;
  const refs = [];
  for (const variant of [...new Set([...Object.keys(variants), ...Object.keys(sha256)])].sort()) {
    const path = variants[variant];
    refs.push({
      repository, commit, hash: sha256[variant],
      path: safePath(path) && safePath(manifest) && ['original', 'png', 'webp'].includes(variant)
        ? posix.join(dirname(manifest), path) : path,
    });
  }
  for (const field of ['expectedPath', 'expectedGeneratedPath', 'expectedCollectedPath']) {
    if (source[field]) refs.push({ repository, commit, path: source[field] });
  }
  return refs;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const root = resolve('.');
  const audit = await auditBaseline(root);
  if (audit.counts.errors) {
    console.log(JSON.stringify({ status: 'blocked', reason: 'AUDIT_FAILED', audit }));
    process.exitCode = 2;
  } else {
    const read = async (path) => JSON.parse(await readFile(join(root, 'library', path), 'utf8'));
    const [assets, legacy, ...inventories] = await Promise.all([
      read('catalog/assets.json'),
      read('catalog/semantic.json'),
      ...['main', 'ui-lab', 'ui-lab-pro'].map((ref) => read(`inventory/${ref}.json`)),
    ]);
    const cardFiles = await Promise.all(
      ['formation-automation', 'launcher-v3', 'mi-empresa-v1'].map((name) => read(`cards/${name}.json`)),
    );
    const cards = cardFiles.flat().map((card) => ({ id: card.id, references: cardReferences(card) }));
    const proposal = reconcileLibrary(assets, inventories, cards);
    const legacyById = new Map(legacy.map(({ id, assetIds }) => [id, assetIds]));
    const legacyLinksMissingFromProposal = proposal.candidates.flatMap(({ id, binaryIds }) =>
      (legacyById.get(id) ?? []).filter((binaryId) => !binaryIds.includes(binaryId))
        .map((binaryId) => ({ id, binaryId })));
    console.log(JSON.stringify({ status: 'proposal', auditInputHash: audit.inputHash,
      ...proposal, legacyLinksMissingFromProposal }, null, 2));
  }
}
