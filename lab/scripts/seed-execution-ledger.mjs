import { readFileSync, writeFileSync } from 'node:fs';

const campaign = 'docs/01-motion-factory/campaign-visual-knowledge-lab';
const docs = Array.from({ length: 6 }, (_, i) => `${campaign}/MICROSPECS-M${i + 1}.md`);
docs.push(`${campaign}/motion-graphics/MICROSPECS-M7.md`, `${campaign}/motion-graphics/MICROSPECS-M8.md`,
  `${campaign}/PROCEDURAL-PATCHSETS.md`);
const [initialHead, branch] = process.argv.slice(2);
if (!/^[a-f0-9]{40}$/.test(initialHead) || !branch) {
  throw new Error('Usage: node lab/scripts/seed-execution-ledger.mjs <initial-head> <execution-branch>');
}

const patchsets = [];
for (const source of docs) {
  const contents = readFileSync(source, 'utf8');
  for (const match of contents.matchAll(/^(?:## )?P(\d{2}) (?:— )?([^\n]+)$/gm)) {
    const [, number, title] = match;
    const patchset = `P${number}`;
    const units = ['A', 'B', 'C', 'D', 'E'];
    patchsets.push({
      patchset,
      area: Number(number) <= 12 ? 'B' : Number(number) <= 17 ? 'C'
        : Number(number) <= 26 ? 'B' : Number(number) <= 30 ? 'A'
          : Number(number) <= 32 ? 'I' : Number(number) <= 44 ? 'D' : 'F',
      title: title.split(': A ')[0],
      sourceDocs: [source],
      units: units.map((unit, index) => ({
        unit,
        dependencies: index ? [`${patchset}.${units[index - 1]}`] : [],
        owner: 'Codex',
        status: 'pending',
        files: [],
        tests: [],
        artifacts: [],
        baseline: null,
        scoreEvidence: [],
        blocker: null,
        decision: null,
        commit: null,
      })),
    });
  }
}
if (patchsets.some(({ patchset }, i) => patchset !== `P${String(i + 1).padStart(2, '0')}`) ||
    patchsets.length !== 52) throw new Error('Expected P01–P52 in canonical order');

writeFileSync('docs/codex-autonomous/ledger.json', JSON.stringify({
  schemaVersion: 1,
  initialHead,
  branch,
  patchsets,
}) + '\n', { flag: 'wx' });
