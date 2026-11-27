import { posix } from 'node:path';
import ts from 'typescript';

const image = /\.(?:avif|gif|jpe?g|png|svg|webp)$/iu;
const safe = (path) => typeof path === 'string' && path.length <= 2048 &&
  !/[\\:\u0000-\u001f]/u.test(path) && path.split('/').every((part) => part && part !== '.' && part !== '..');
const script = /\.(?:[cm]?[jt]s|[jt]sx)$/iu;
const assetAttribute = new Set(['src', 'poster', 'href']);

export function extractUsage({ repository, commit, sourcePath, contents, paths, aliases = {}, publicRoots = [] }) {
  if (typeof repository !== 'string' || !repository || typeof commit !== 'string' ||
      !/^[a-f0-9]{40}$/u.test(commit) || !safe(sourcePath) || !script.test(sourcePath) ||
      typeof contents !== 'string' || Buffer.byteLength(contents) > 1024 * 1024 ||
      !Array.isArray(paths) || paths.length > 100000 || !paths.every(safe) ||
      !publicRoots.every(safe) || !Object.values(aliases).every(safe)) {
    throw new Error('INVALID_USAGE_INPUT');
  }

  const tree = new Set(paths);
  const source = ts.createSourceFile(sourcePath, contents, ts.ScriptTarget.Latest, true);
  if (source.parseDiagnostics.length) throw new Error('USAGE_PARSE_FAILED');
  const records = [];
  const isLiteral = (node) => node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node));
  const supportedAsset = (value) => image.test(value.split('?')[0]);

  function locations(value) {
    if (value.startsWith('//')) return [];
    if (value.startsWith('/')) return publicRoots.map((root) => `${root}/${value.slice(1)}`);
    if (value.startsWith('./') || value.startsWith('../')) {
      return [posix.normalize(posix.join(posix.dirname(sourcePath), value))];
    }
    const alias = Object.keys(aliases).sort((a, b) => b.length - a.length).find(
      (prefix) => value.startsWith(`${prefix}/`),
    );
    return alias ? [`${aliases[alias]}/${value.slice(alias.length + 1)}`] : [];
  }

  function record(node, method, candidates, finite = false) {
    const { line, character } = source.getLineAndCharacterOfPosition(node.getStart(source));
    const paths = [...new Set(candidates)].sort();
    records.push({
      repository, commit, path: sourcePath, line: line + 1, column: character + 1,
      expression: node.getText(source), method, paths,
      resolution: paths.length === 0 ? 'unresolved' : finite || paths.length === 1 ? 'exact' : 'candidate',
      legacyStatus: /(?:^|\/)legacy(?:\/|$)/u.test(sourcePath) ? 'legacy' : 'unknown',
    });
  }

  const staticAsset = (node, method) => {
    if (isLiteral(node)) {
      if (supportedAsset(node.text)) record(node, method,
        locations(node.text.split('?')[0]).filter((path) => safe(path) && tree.has(path)));
    } else if (node) record(node, method, []);
  };

  function visit(node) {
    if (ts.isImportDeclaration(node) || (ts.isExportDeclaration(node) && node.moduleSpecifier)) {
      staticAsset(node.moduleSpecifier, 'static-import');
    } else if (ts.isJsxAttribute(node) &&
               ts.isIdentifier(node.name) && assetAttribute.has(node.name.text)) {
      const value = node.initializer;
      staticAsset(value && ts.isJsxExpression(value) ? value.expression : value, 'jsx-attribute');
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      staticAsset(node.arguments[0], 'dynamic-import');
    } else if (ts.isCallExpression(node) && node.expression.getText(source) === 'import.meta.glob') {
      const pattern = node.arguments[0];
      if (!pattern) return;
      const paths = isLiteral(pattern) && pattern.text.startsWith('.') &&
        pattern.text.length <= 256 && !/[{}[\]!]/u.test(pattern.text)
        ? locations(pattern.text).filter(safe).flatMap((glob) =>
          [...tree].filter((path) => image.test(path) && posix.matchesGlob(path, glob)))
        : [];
      record(pattern, 'vite-glob', paths, true);
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  return records;
}
