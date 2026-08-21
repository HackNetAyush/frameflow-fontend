/**
 * A LaTeX subset parser, sized for explainer-video maths.
 *
 * The previous approach ran regex substitutions over the raw string, which
 * deleted any command it didn't recognise while leaving its braces behind
 * (`\sum_{i=1}^{n}` came out as `{i=1}ⁿ`). Parsing to a tree instead means an
 * unknown command degrades to an upright word rather than corrupting
 * everything around it, and real two-dimensional constructs — fractions,
 * radicals, operators with limits — can be laid out as boxes.
 */

/* Greek, operators, relations, arrows, set theory. */
export const SYMBOLS = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε',
  zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'ϑ', iota: 'ι', kappa: 'κ',
  lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', varpi: 'ϖ', rho: 'ρ',
  varrho: 'ϱ', sigma: 'σ', varsigma: 'ς', tau: 'τ', upsilon: 'υ', phi: 'φ',
  varphi: 'ϕ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π',
  Sigma: 'Σ', Upsilon: 'Υ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',

  times: '×', div: '÷', cdot: '⋅', pm: '±', mp: '∓', ast: '∗', star: '⋆',
  circ: '∘', bullet: '∙', oplus: '⊕', ominus: '⊖', otimes: '⊗', odot: '⊙',

  leq: '≤', le: '≤', geq: '≥', ge: '≥', neq: '≠', ne: '≠', equiv: '≡',
  approx: '≈', sim: '∼', simeq: '≃', cong: '≅', propto: '∝', ll: '≪', gg: '≫',
  subset: '⊂', supset: '⊃', subseteq: '⊆', supseteq: '⊇', in: '∈', notin: '∉',
  ni: '∋', cup: '∪', cap: '∩', setminus: '∖', emptyset: '∅', varnothing: '∅',

  rightarrow: '→', to: '→', leftarrow: '←', gets: '←', leftrightarrow: '↔',
  Rightarrow: '⇒', implies: '⇒', Leftarrow: '⇐', Leftrightarrow: '⇔', iff: '⇔',
  mapsto: '↦', uparrow: '↑', downarrow: '↓', longrightarrow: '⟶',

  infty: '∞', partial: '∂', nabla: '∇', forall: '∀', exists: '∃', neg: '¬',
  lnot: '¬', land: '∧', wedge: '∧', lor: '∨', vee: '∨', therefore: '∴',
  because: '∵', angle: '∠', perp: '⊥', parallel: '∥', degree: '°',
  prime: '′', hbar: 'ℏ', ell: 'ℓ', Re: 'ℜ', Im: 'ℑ', aleph: 'ℵ',
  dots: '…', ldots: '…', cdots: '⋯', vdots: '⋮', ddots: '⋱',
  quad: ' ', qquad: '  ',

  // Delimiters usable on their own, not only after \left / \right — bra-ket
  // and floor/ceiling notation is normally written without them.
  langle: '⟨', rangle: '⟩', lceil: '⌈', rceil: '⌉', lfloor: '⌊', rfloor: '⌋',
  lbrace: '{', rbrace: '}', vert: '|', Vert: '‖', backslash: '∖',
};

/** Operators that take limits above and below in display mode. */
export const BIG_OPS = {
  sum: '∑', prod: '∏', coprod: '∐', int: '∫', iint: '∬', iiint: '∭',
  oint: '∮', bigcup: '⋃', bigcap: '⋂', bigoplus: '⨁', bigotimes: '⨂',
  lim: 'lim', limsup: 'lim sup', liminf: 'lim inf', max: 'max', min: 'min',
  sup: 'sup', inf: 'inf', argmax: 'arg max', argmin: 'arg min',
};

/** Upright multi-letter function names. */
export const FUNCTIONS = [
  'sin', 'cos', 'tan', 'csc', 'sec', 'cot', 'arcsin', 'arccos', 'arctan',
  'sinh', 'cosh', 'tanh', 'log', 'ln', 'lg', 'exp', 'det', 'dim', 'ker',
  'deg', 'gcd', 'lcm', 'mod', 'Pr', 'var', 'cov',
];

const ACCENTS = {
  vec: '⃗', hat: '̂', bar: '̄', overline: '̄', tilde: '̃',
  dot: '̇', ddot: '̈', widehat: '̂', overrightarrow: '⃗',
};

const STYLES = {
  mathbb: 'bb', mathbf: 'bf', bf: 'bf', mathrm: 'rm', rm: 'rm', text: 'rm',
  textrm: 'rm', mathit: 'it', mathsf: 'sf', mathcal: 'cal', mathfrak: 'cal',
  operatorname: 'rm', textbf: 'bfrm',
};

const BLACKBOARD = {
  R: 'ℝ', N: 'ℕ', Z: 'ℤ', Q: 'ℚ', C: 'ℂ', P: 'ℙ', E: '𝔼', H: 'ℍ', F: '𝔽',
};

const OPEN_DELIMS = { '(': '(', '[': '[', '\\{': '{', '|': '|', '\\|': '‖', '.': '', '\\langle': '⟨', '\\lceil': '⌈', '\\lfloor': '⌊' };
const CLOSE_DELIMS = { ')': ')', ']': ']', '\\}': '}', '|': '|', '\\|': '‖', '.': '', '\\rangle': '⟩', '\\rceil': '⌉', '\\rfloor': '⌋' };

const MATRIX_ENVS = {
  matrix: ['', ''], pmatrix: ['(', ')'], bmatrix: ['[', ']'],
  Bmatrix: ['{', '}'], vmatrix: ['|', '|'], Vmatrix: ['‖', '‖'],
  cases: ['{', ''], aligned: ['', ''], array: ['', ''],
};

/* ------------------------------------------------------------------ *
 * Tokenizer
 * ------------------------------------------------------------------ */

function tokenize(src) {
  const out = [];
  let i = 0;

  while (i < src.length) {
    const c = src[i];

    if (c === '\\') {
      // Escaped punctuation, e.g. \{ \} \$ \% \&
      const next = src[i + 1];
      if (next === '\\') { out.push({ t: 'newrow' }); i += 2; continue; }
      if (next && !/[a-zA-Z]/.test(next)) {
        out.push({ t: 'cmd', name: next, escaped: true });
        i += 2;
        continue;
      }
      let j = i + 1;
      while (j < src.length && /[a-zA-Z]/.test(src[j])) j++;
      out.push({ t: 'cmd', name: src.slice(i + 1, j) });
      i = j;
      continue;
    }

    if (c === '{') { out.push({ t: '{' }); i++; continue; }
    if (c === '}') { out.push({ t: '}' }); i++; continue; }
    if (c === '^') { out.push({ t: '^' }); i++; continue; }
    if (c === '_') { out.push({ t: '_' }); i++; continue; }
    if (c === '&') { out.push({ t: 'amp' }); i++; continue; }

    if (/\s/.test(c)) { i++; continue; }

    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.,]/.test(src[j])) j++;
      // Don't swallow a trailing separator: "1, 2" is a list, "1,000" is one number.
      let text = src.slice(i, j).replace(/[.,]+$/, '');
      if (!text) text = src[i];
      out.push({ t: 'num', v: text });
      i += text.length;
      continue;
    }

    if (/[a-zA-Z]/.test(c)) { out.push({ t: 'letter', v: c }); i++; continue; }

    out.push({ t: 'char', v: c });
    i++;
  }

  return out;
}

/* ------------------------------------------------------------------ *
 * Parser
 * ------------------------------------------------------------------ */

const REL = new Set(['=', '<', '>', '≤', '≥', '≠', '≡', '≈', '∼', '≃', '≅', '∝', '≪', '≫', '⊂', '⊃', '⊆', '⊇', '∈', '∉', '∋', '→', '←', '↔', '⇒', '⇐', '⇔', '↦', '⟶', '∴', '∵', ':']);
const BIN = new Set(['+', '-', '−', '×', '÷', '⋅', '±', '∓', '∗', '⋆', '∘', '∙', '⊕', '⊖', '⊗', '⊙', '∪', '∩', '∖', '∧', '∨', '/']);
const PUNCT = new Set([',', ';', '!', '?']);

const classify = (ch) => {
  if (REL.has(ch)) return 'rel';
  if (BIN.has(ch)) return 'bin';
  if (PUNCT.has(ch)) return 'punct';
  if (ch === '(' || ch === '[' || ch === '{') return 'open';
  if (ch === ')' || ch === ']' || ch === '}') return 'close';
  return 'ord';
};

class Parser {
  constructor(tokens) {
    this.toks = tokens;
    this.i = 0;
  }

  peek() { return this.toks[this.i]; }
  next() { return this.toks[this.i++]; }

  /** Parse until `}` / end / a row or cell separator. */
  parseRow(stopAtSeparator = false) {
    const items = [];
    while (this.i < this.toks.length) {
      const tok = this.peek();
      if (tok.t === '}') break;
      if (stopAtSeparator && (tok.t === 'amp' || tok.t === 'newrow')) break;
      if (tok.t === 'cmd' && (tok.name === 'end' || tok.name === 'right')) break;

      const atom = this.parseAtom();
      if (atom) items.push(this.attachScripts(atom));
    }
    return { t: 'row', items };
  }

  /** A `{...}` group, or a single following atom. */
  parseGroup() {
    const tok = this.peek();
    if (!tok) return { t: 'row', items: [] };
    if (tok.t === '{') {
      this.next();
      const row = this.parseRow();
      if (this.peek()?.t === '}') this.next();
      return row;
    }
    const atom = this.parseAtom();
    return atom || { t: 'row', items: [] };
  }

  /** Collect `^`/`_` suffixes onto a base. */
  attachScripts(base) {
    let sup = null;
    let sub = null;
    let seen = false;

    while (this.i < this.toks.length) {
      const tok = this.peek();
      if (tok.t === '^') { this.next(); sup = this.parseGroup(); seen = true; }
      else if (tok.t === '_') { this.next(); sub = this.parseGroup(); seen = true; }
      else break;
    }
    if (!seen) return base;

    if (base.t === 'bigop') return { ...base, sup, sub };
    return { t: 'supsub', base, sup, sub };
  }

  parseAtom() {
    const tok = this.next();
    if (!tok) return null;

    switch (tok.t) {
      case 'num':
        return { t: 'sym', ch: tok.v, kind: 'num' };
      case 'letter':
        return { t: 'sym', ch: tok.v, kind: 'var' };
      case 'char':
        return { t: 'sym', ch: tok.v, kind: classify(tok.v) };
      case '{': {
        const row = this.parseRow();
        if (this.peek()?.t === '}') this.next();
        return row;
      }
      case 'amp':
      case 'newrow':
        return null;
      case 'cmd':
        return this.parseCommand(tok);
      default:
        return null;
    }
  }

  parseCommand(tok) {
    const name = tok.name;

    if (tok.escaped) {
      return { t: 'sym', ch: name, kind: classify(name) };
    }

    if (name === 'frac' || name === 'dfrac' || name === 'tfrac') {
      return { t: 'frac', num: this.parseGroup(), den: this.parseGroup(), compact: name === 'tfrac' };
    }

    if (name === 'binom') {
      return { t: 'delim', left: '(', right: ')', body: { t: 'frac', num: this.parseGroup(), den: this.parseGroup(), noRule: true } };
    }

    if (name === 'sqrt') {
      let index = null;
      if (this.peek()?.t === 'char' && this.peek().v === '[') {
        this.next();
        const buf = [];
        while (this.i < this.toks.length && !(this.peek().t === 'char' && this.peek().v === ']')) {
          const a = this.parseAtom();
          if (a) buf.push(a);
        }
        if (this.peek()) this.next();
        index = { t: 'row', items: buf };
      }
      return { t: 'sqrt', body: this.parseGroup(), index };
    }

    if (ACCENTS[name]) {
      return { t: 'accent', mark: ACCENTS[name], wide: name === 'overline' || name === 'widehat' || name === 'overrightarrow', body: this.parseGroup() };
    }

    if (STYLES[name]) {
      const style = STYLES[name];
      const body = this.parseGroup();
      if (style === 'bb') return { t: 'styled', style, body: mapBlackboard(body) };
      return { t: 'styled', style, body };
    }

    if (BIG_OPS[name]) {
      return { t: 'bigop', ch: BIG_OPS[name], word: BIG_OPS[name].length > 1, limits: true };
    }

    if (FUNCTIONS.includes(name)) {
      return { t: 'styled', style: 'rm', fn: true, body: { t: 'row', items: [...name].map((ch) => ({ t: 'sym', ch, kind: 'ord' })) } };
    }

    if (name === 'left') {
      const d = this.readDelim(OPEN_DELIMS);
      const body = this.parseRow();
      let right = '';
      if (this.peek()?.t === 'cmd' && this.peek().name === 'right') {
        this.next();
        right = this.readDelim(CLOSE_DELIMS);
      }
      return { t: 'delim', left: d, right, body };
    }

    if (name === 'begin') {
      return this.parseEnv();
    }

    if (name === 'text' || name === 'textrm') {
      return { t: 'styled', style: 'rm', body: this.parseGroup() };
    }

    if (name === 'space' || name === ',' || name === ';' || name === ':') {
      return { t: 'space', em: 0.22 };
    }
    if (name === 'quad') return { t: 'space', em: 1 };
    if (name === 'qquad') return { t: 'space', em: 2 };
    if (name === '!') return { t: 'space', em: -0.16 };

    if (SYMBOLS[name]) {
      const ch = SYMBOLS[name];
      return { t: 'sym', ch, kind: classify(ch) };
    }

    // Unknown command: render the name upright instead of deleting it.
    return {
      t: 'styled',
      style: 'rm',
      body: { t: 'row', items: [...name].map((ch) => ({ t: 'sym', ch, kind: 'ord' })) },
    };
  }

  readDelim(table) {
    const tok = this.next();
    if (!tok) return '';
    if (tok.t === 'cmd') return table[`\\${tok.name}`] ?? (SYMBOLS[tok.name] || '');
    if (tok.t === '{') return table['\\{'] ?? '{';
    if (tok.t === '}') return table['\\}'] ?? '}';
    return table[tok.v] ?? tok.v ?? '';
  }

  parseEnv() {
    // \begin{name}
    let envName = '';
    if (this.peek()?.t === '{') {
      this.next();
      while (this.i < this.toks.length && this.peek().t !== '}') {
        const t = this.next();
        envName += t.v ?? t.name ?? '';
      }
      if (this.peek()?.t === '}') this.next();
    }

    const delims = MATRIX_ENVS[envName] || ['', ''];
    const rows = [];
    let row = [];

    while (this.i < this.toks.length) {
      const tok = this.peek();
      if (tok.t === 'cmd' && tok.name === 'end') {
        this.next();
        if (this.peek()?.t === '{') {
          this.next();
          while (this.i < this.toks.length && this.peek().t !== '}') this.next();
          if (this.peek()?.t === '}') this.next();
        }
        break;
      }
      if (tok.t === 'amp') { this.next(); row.push(this.parseRow(true)); continue; }
      if (tok.t === 'newrow') { this.next(); row.push(this.parseRow(true)); rows.push(row); row = []; continue; }

      const cell = this.parseRow(true);
      if (cell.items.length) row.push(cell);
      else if (this.peek() && this.peek().t !== 'amp' && this.peek().t !== 'newrow') this.next();
    }
    if (row.length) rows.push(row);

    return {
      t: 'matrix',
      rows: rows.filter((r) => r.length),
      left: delims[0],
      right: delims[1],
      align: envName === 'cases' || envName === 'aligned' ? 'left' : 'center',
    };
  }
}

function mapBlackboard(node) {
  if (node.t === 'sym' && BLACKBOARD[node.ch]) return { t: 'sym', ch: BLACKBOARD[node.ch], kind: 'ord' };
  if (node.t === 'row') return { ...node, items: node.items.map(mapBlackboard) };
  return node;
}

/** Merge adjacent upright letters into words so `\text{hello}` kerns properly. */
function coalesce(node) {
  if (!node || typeof node !== 'object') return node;

  if (node.t === 'row') {
    const items = node.items.map(coalesce);
    const merged = [];
    for (const item of items) {
      const prev = merged[merged.length - 1];
      if (
        item.t === 'sym' && prev?.t === 'sym' &&
        item.kind === 'var' && prev.kind === 'var' &&
        prev.ch.length === 1 && item.ch.length === 1 &&
        /[a-zA-Z]/.test(prev.ch) && /[a-zA-Z]/.test(item.ch)
      ) {
        // Adjacent single letters stay separate atoms in maths (`xy` is x·y),
        // so this only merges inside \text via the `rm` path below.
        merged.push(item);
      } else merged.push(item);
    }
    return { ...node, items: merged };
  }

  for (const key of ['num', 'den', 'body', 'base', 'sup', 'sub', 'index']) {
    if (node[key]) node[key] = coalesce(node[key]);
  }
  if (node.rows) node.rows = node.rows.map((r) => r.map(coalesce));
  return node;
}

/** Parse a TeX fragment into a layout-ready tree. */
export function parseMath(tex) {
  try {
    const parser = new Parser(tokenize(String(tex || '')));
    return coalesce(parser.parseRow());
  } catch {
    return { t: 'row', items: [...String(tex || '')].map((ch) => ({ t: 'sym', ch, kind: 'ord' })) };
  }
}
