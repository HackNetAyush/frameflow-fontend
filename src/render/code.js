/**
 * Lightweight syntax highlighting.
 *
 * A full grammar-based highlighter would be far more code than a slide needs —
 * at video sizes a viewer reads shape and colour, not precise scope nesting. A
 * single-pass scanner over comments, strings, numbers, keywords and call sites
 * gets the whole way there for every C-family, Python-family and shell-ish
 * language an explainer is likely to show.
 */

const COMMON = [
  'if', 'else', 'for', 'while', 'return', 'break', 'continue', 'function', 'class',
  'new', 'this', 'true', 'false', 'null', 'try', 'catch', 'finally', 'throw',
  'switch', 'case', 'default', 'do', 'in', 'of', 'typeof', 'instanceof', 'delete', 'void',
];

const BY_LANG = {
  javascript: ['const', 'let', 'var', 'async', 'await', 'export', 'import', 'from', 'yield', 'static', 'extends', 'undefined', 'NaN'],
  typescript: ['const', 'let', 'var', 'async', 'await', 'export', 'import', 'from', 'interface', 'type', 'enum', 'implements', 'extends', 'public', 'private', 'readonly', 'as'],
  python: ['def', 'lambda', 'None', 'True', 'False', 'and', 'or', 'not', 'import', 'from', 'as', 'with', 'yield', 'pass', 'global', 'nonlocal', 'elif', 'assert', 'raise', 'async', 'await', 'self'],
  java: ['public', 'private', 'protected', 'static', 'final', 'void', 'int', 'long', 'double', 'float', 'boolean', 'char', 'String', 'extends', 'implements', 'package', 'import', 'abstract'],
  c: ['int', 'char', 'float', 'double', 'long', 'short', 'unsigned', 'signed', 'struct', 'union', 'enum', 'const', 'static', 'sizeof', 'include', 'define', 'NULL'],
  sql: ['select', 'from', 'where', 'join', 'inner', 'left', 'right', 'outer', 'group', 'order', 'by', 'having', 'insert', 'into', 'values', 'update', 'set', 'delete', 'create', 'table', 'index', 'as', 'on', 'and', 'or', 'not', 'limit', 'distinct'],
  bash: ['echo', 'cd', 'export', 'source', 'alias', 'sudo', 'then', 'fi', 'done', 'elif', 'esac'],
  css: ['important', 'media', 'keyframes', 'root', 'import'],
  go: ['func', 'package', 'import', 'var', 'const', 'type', 'struct', 'interface', 'go', 'defer', 'chan', 'range', 'map', 'nil'],
  rust: ['fn', 'let', 'mut', 'impl', 'struct', 'enum', 'trait', 'pub', 'use', 'mod', 'match', 'Some', 'None', 'Ok', 'Err', 'self'],
};

const ALIAS = {
  js: 'javascript', jsx: 'javascript', mjs: 'javascript', node: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  py: 'python', python3: 'python',
  'c++': 'c', cpp: 'c', h: 'c', cs: 'java',
  sh: 'bash', shell: 'bash', zsh: 'bash', console: 'bash',
  golang: 'go', rs: 'rust', postgres: 'sql', mysql: 'sql',
};

const LINE_COMMENT = {
  python: '#', bash: '#', sql: '--', yaml: '#', ruby: '#', r: '#', toml: '#',
};

const keywordSet = (lang) => {
  const key = ALIAS[lang] || lang;
  return { set: new Set([...COMMON, ...(BY_LANG[key] || [])]), key };
};

/**
 * Split one line into `{ text, type }` spans.
 *
 * `state` carries block-comment continuation between lines and is mutated.
 */
export function highlightLine(line, lang, state) {
  const { set, key } = keywordSet((lang || '').toLowerCase());
  const lineComment = LINE_COMMENT[key] || '//';
  const spans = [];
  let i = 0;
  let buf = '';
  let bufType = 'plain';

  const flush = () => {
    if (buf) spans.push({ text: buf, type: bufType });
    buf = '';
  };
  const emit = (text, type) => { flush(); spans.push({ text, type }); };

  while (i < line.length) {
    // Inside a /* ... */ that opened on an earlier line.
    if (state.block) {
      const end = line.indexOf('*/', i);
      if (end === -1) { emit(line.slice(i), 'comment'); i = line.length; break; }
      emit(line.slice(i, end + 2), 'comment');
      state.block = false;
      i = end + 2;
      continue;
    }

    const rest = line.slice(i);

    if (rest.startsWith('/*')) {
      const end = line.indexOf('*/', i + 2);
      if (end === -1) { emit(rest, 'comment'); state.block = true; i = line.length; break; }
      emit(line.slice(i, end + 2), 'comment');
      i = end + 2;
      continue;
    }

    if (rest.startsWith(lineComment) || (key !== 'python' && key !== 'bash' && rest.startsWith('#') && key === 'c')) {
      emit(rest, 'comment');
      break;
    }

    const ch = line[i];

    if (ch === '"' || ch === "'" || ch === '`') {
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === '\\') { j += 2; continue; }
        if (line[j] === ch) { j++; break; }
        j++;
      }
      emit(line.slice(i, j), 'string');
      i = j;
      continue;
    }

    if (/[0-9]/.test(ch) && !/[\w.]/.test(line[i - 1] || '')) {
      let j = i;
      while (j < line.length && /[0-9a-fA-FxX._]/.test(line[j])) j++;
      emit(line.slice(i, j), 'number');
      i = j;
      continue;
    }

    if (/[A-Za-z_$@]/.test(ch)) {
      let j = i;
      while (j < line.length && /[\w$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      const isCall = line[j] === '(';
      const upperFirst = /^[A-Z]/.test(word);

      if (set.has(word) || set.has(word.toLowerCase())) emit(word, 'keyword');
      else if (isCall) emit(word, 'fn');
      else if (upperFirst) emit(word, 'type');
      else { buf += word; bufType = 'plain'; }
      i = j;
      continue;
    }

    if (/[{}()[\];,.:+\-*/%=<>!&|^~?]/.test(ch)) {
      emit(ch, 'punct');
      i++;
      continue;
    }

    buf += ch;
    bufType = 'plain';
    i++;
  }

  flush();
  return spans;
}

/** Highlight a whole block, threading block-comment state across lines. */
export function highlightCode(code, lang) {
  const state = { block: false };
  return code.split('\n').map((line) => highlightLine(line, lang, state));
}
