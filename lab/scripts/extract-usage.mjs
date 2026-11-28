import { posix } from 'node:path';
import { parse } from 'parse5';
import postcss from 'postcss';
import valueParser from 'postcss-value-parser';
import ts from 'typescript';

const image = /\.(?:avif|gif|jpe?g|png|svg|webp)$/iu;
export const safeUsagePath = (path) => typeof path === 'string' && path.length <= 2048 &&
  !/[\\:\u0000-\u001f]/u.test(path) && path.split('/').every((part) => part && part !== '.' && part !== '..');
const safe = safeUsagePath;
const script = /\.(?:[cm]?[jt]s|[jt]sx)$/iu;
const html = /\.html?$/iu;
const css = /\.css$/iu;
export const isUsageSource = (path) => script.test(path) || html.test(path) || css.test(path);
const assetAttribute = new Set(['src', 'poster', 'href']);

export function extractUsage({ repository, commit, sourcePath, contents, paths, aliases = {}, publicRoots = [] }) {
  if (typeof repository !== 'string' || !repository || typeof commit !== 'string' ||
      !/^[a-f0-9]{40}$/u.test(commit) || !safe(sourcePath) || !isUsageSource(sourcePath) ||
      typeof contents !== 'string' || Buffer.byteLength(contents) > 1024 * 1024 ||
      !Array.isArray(paths) || paths.length > 100000 || !paths.every(safe) ||
      !Array.isArray(publicRoots) || !publicRoots.every(safe) ||
      !aliases || typeof aliases !== 'object' || Array.isArray(aliases) || !Object.values(aliases).every(safe)) {
    throw new Error('INVALID_USAGE_INPUT');
  }

  const tree = new Set(paths);
  const source = script.test(sourcePath) ? ts.createSourceFile(sourcePath, contents, ts.ScriptTarget.Latest, true) : null;
  if (source?.parseDiagnostics.length) throw new Error('USAGE_PARSE_FAILED');
  const lines = [0, ...Array.from(contents.matchAll(/\r\n|[\r\n]/gu), (match) => match.index + match[0].length)];
  const records = [];
  const isLiteral = (node) => node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node));
  const supportedAsset = (value) => image.test(value.split(/[?#]/u)[0]);

  function locations(value, documentRelative = false) {
    if (value.startsWith('//')) return [];
    if (value.startsWith('/')) return publicRoots.map((root) => `${root}/${value.slice(1)}`);
    if (value.startsWith('./') || value.startsWith('../')) {
      return [posix.normalize(posix.join(posix.dirname(sourcePath), value))];
    }
    const alias = Object.keys(aliases).sort((a, b) => b.length - a.length).find(
      (prefix) => value.startsWith(`${prefix}/`),
    );
    return alias ? [`${aliases[alias]}/${value.slice(alias.length + 1)}`]  : documentRelative && !/^[a-z][a-z0-9+.-]*:/iu.test(value)
      ? [posix.normalize(posix.join(posix.dirname(sourcePath), value))] : [];
  }

  function recordAt(offset, expression, method, candidates, finite = false) {
    let first = 0;
    let end = lines.length;
    while (end - first > 1) {
      const middle = (first + end) >>> 1;
      if (lines[middle] <= offset) first = middle;
      else end = middle;
    }
    const paths = [...new Set(candidates)].sort();
    records.push({
      repository, commit, path: sourcePath, line: first + 1, column: offset - lines[first] + 1,
      expression, method, paths,
      resolution: paths.length === 0 ? 'unresolved' : finite || paths.length === 1 ? 'exact' : 'candidate',
      legacyStatus: /(?:^|\/)legacy(?:\/|$)/u.test(sourcePath) ? 'legacy' : 'unknown',
    });
  }

  function record(node, method, candidates, finite = false) {
    recordAt(node.getStart(source), node.getText(source), method, candidates, finite);
  }

  function documentAsset(value, offset, expression, method, baseUnknown = false) {
    if (!supportedAsset(value) || /^data:/iu.test(value)) return;
    const paths = baseUnknown ? [] : locations(value.split(/[?#]/u)[0], true);
    recordAt(offset, expression, method, paths.filter((path) => safe(path) && tree.has(path)));
  }

  function htmlAssets() {
    const document = parse(contents, { sourceCodeLocationInfo: true });
    const queue = [document];
    const attributes = [];
    let baseUnknown = false;
    for (const node of queue) {
      queue.push(...(node.childNodes ?? []));
      if (node.tagName === 'base' && node.attrs.some(({ name }) => name === 'href')) baseUnknown = true;
      for (const { name, value } of node.attrs ?? []) {
        const imageAttribute = (name === 'src' && ['img', 'source', 'input'].includes(node.tagName)) ||
          (name === 'poster' && node.tagName === 'video') ||
          (name === 'href' && node.tagName === 'link' &&
            node.attrs.some((attr) => attr.name === 'rel' && /(?:^|\s)(?:icon|apple-touch-icon)(?:\s|$)/iu.test(attr.value)));
        const location = node.sourceCodeLocation?.attrs?.[name];
        if (imageAttribute && location) attributes.push({ value, location });
      }
    }
    for (const { value, location } of attributes.sort((a, b) => a.location.startOffset - b.location.startOffset)) {
      documentAsset(value, location.startOffset, contents.slice(location.startOffset, location.endOffset),
        'html-attribute', baseUnknown);
    }
  }

  function cssAssets() {
    const root = postcss.parse(contents, { from: undefined });
    root.walkDecls((decl) => {
      const raw = decl.raws.value?.raw ?? decl.value;
      const start = decl.source.start.offset + decl.prop.length + decl.raws.between.length;
      valueParser(raw).walk((node) => {
        if (node.type !== 'function' || node.value.toLowerCase() !== 'url') return;
        const parts = node.nodes.filter(({ type }) => type !== 'space' && type !== 'comment');
        if (parts.length === 1 && ['word', 'string'].includes(parts[0].type) && !node.unclosed) {
          documentAsset(parts[0].value, start + node.sourceIndex, valueParser.stringify(node), 'css-url');
        }
        return false;
      });
    });
  }

  const staticAsset = (node, method) => {
    if (isLiteral(node)) {
      if (supportedAsset(node.text)) record(node, method,
        locations(node.text.split(/[?#]/u)[0]).filter((path) => safe(path) && tree.has(path)));
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

  if (source) visit(source);
  else if (html.test(sourcePath)) htmlAssets();
  else cssAssets();
  return records;
}
