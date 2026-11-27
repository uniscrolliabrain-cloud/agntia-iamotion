import { createHash } from 'node:crypto';
import { visualLibraryJsonSchemas } from '../../dist/index.js';

const schemas = visualLibraryJsonSchemas();
const hashes = Object.fromEntries(Object.entries(schemas).map(([name, schema]) =>
  [name, createHash('sha256').update(JSON.stringify(schema)).digest('hex')]));
console.log(JSON.stringify({
  schemaVersion: 1,
  canonicalForm: 'JSON.stringify of each schema',
  hashes,
  schemas,
}, null, 2));
