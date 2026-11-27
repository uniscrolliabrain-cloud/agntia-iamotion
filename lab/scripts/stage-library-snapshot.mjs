import { lstat, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { openSnapshotStore } from './library-snapshot-store.mjs';

const checkout = resolve('.');
const lab = join(checkout, 'lab');
if (!(await lstat(lab)).isDirectory()) throw new Error('Expected a regular lab directory');
const staging = join(lab, 'staging');
await mkdir(staging, { recursive: true, mode: 0o700 });
if (!(await lstat(staging)).isDirectory()) throw new Error('Expected a regular staging directory');
const store = await openSnapshotStore(join(checkout, 'lab/staging/library-snapshots'));
const result = await store.stage(checkout);
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.status === 'blocked' ? 2 : 0;
