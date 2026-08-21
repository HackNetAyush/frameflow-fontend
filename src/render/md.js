/**
 * Markdown -> slide document AST.
 *
 * The old parser only understood tokens ending in `_open`/`_close` plus `text`,
 * so every self-closing token markdown-it emits — fences, inline code, hard
 * rules — was silently dropped, and `ordered_list` was never mapped at all.
 * This converter handles the full token stream and adds four slide-specific
 * extensions on top of CommonMark + GFM:
 *
 *   $x$ / $$x$$        inline and display math
 *   ==text==           highlighter pen
 *   [text]{teal}       semantic colour from a fixed palette
 *   > [!tip] ...       callout panels
 */

import MarkdownIt from 'markdown-it';

const SWATCHES = ['red', 'green', 'blue', 'amber', 'violet', 'teal', 'pink', 'muted'];
const CALLOUTS = ['note', 'tip', 'warn', 'key', 'example'];

/* ------------------------------------------------------------------ *
 * Inline extensions
 * ------------------------------------------------------------------ */

/**
 * `$...$` and `$$...$$`.
 *
 * The delimiters have to coexist with prose that mentions money, so an opener
 * may not be followed by whitespace and a closer may not be preceded by one.
 * "Costs $50, saves $20." fails both tests and stays literal text — the old
 * sanitiser stripped every `$` unconditionally and turned it into "Costs 50".
 */
function mathInline(state, silent) {
  const src = state.src;
  let pos = state.pos;
  if (src[pos] !== '$') return false;
  if (pos > 0 && src[pos - 1] === '\\') return false;

  const display = src[pos + 1] === '$';
  const fence = display ? 2 : 1;
  let start = pos + fence;

  if (start >= src.length) return false;
  if (!display && /\s/.test(src[start])) return false;

  let end = -1;
  for (let i = start; i < src.length - fence + 1; i++) {
    if (src[i] !== '$' || src[i - 1] === '\\') continue;
    if (display && src[i + 1] !== '$') continue;
    if (!display && /\s/.test(src[i - 1])) continue;
    end = i;
    break;
  }
  if (end < 0) return false;

  const content = src.slice(start, end).trim();
  if (!content) return false;
  // A digit straight after the closer means we almost certainly clipped a price.
  if (!display && /\d/.test(src[end + 1] || '')) return false;

  if (!silent) {
    const token = state.push(display ? 'math_display' : 'math_inline', 'math', 0);
    token.content = content;
    token.markup = display ? '$$' : '$';
  }
  state.pos = end + fence;
  return true;
}

/** `\( ... \)` — the other spelling LLMs reach for. */
function mathParen(state, silent) {
  const src = state.src;
  const pos = state.pos;
  if (src[pos] !== '\\' || src[pos + 1] !== '(') return false;

  const end = src.indexOf('\\)', pos + 2);
  if (end < 0) return false;

  const content = src.slice(pos + 2, end).trim();
  if (!content) return false;

  if (!silent) {
    const token = state.push('math_inline', 'math', 0);
    token.content = content;
  }
  state.pos = end + 2;
  return true;
}

/** `==highlighted==` */
function markRule(state, silent) {
  const src = state.src;
  const pos = state.pos;
  if (src[pos] !== '=' || src[pos + 1] !== '=') return false;

  const end = src.indexOf('==', pos + 2);
  if (end < 0) return false;

  const content = src.slice(pos + 2, end);
  if (!content.trim()) return false;

  if (!silent) {
    state.push('mark_open', 'mark', 1);
    const tok = state.push('text', '', 0);
    tok.content = content;
    state.push('mark_close', 'mark', -1);
  }
  state.pos = end + 2;
  return true;
}

/**
 * `[text]{teal}` — registered ahead of the link rule so it gets first refusal
 * on `[`. If the `{swatch}` suffix is absent it declines and normal link
 * parsing continues untouched.
 */
function colorRule(state, silent) {
  const src = state.src;
  const pos = state.pos;
  if (src[pos] !== '[') return false;

  let depth = 1;
  let close = -1;
  for (let i = pos + 1; i < src.length; i++) {
    if (src[i] === '\\') { i++; continue; }
    if (src[i] === '[') depth++;
    else if (src[i] === ']') { depth--; if (!depth) { close = i; break; } }
  }
  if (close < 0) return false;

  const m = /^\{([a-z]+)\}/.exec(src.slice(close + 1));
  if (!m || !SWATCHES.includes(m[1])) return false;

  const inner = src.slice(pos + 1, close);
  if (!inner.trim()) return false;

  if (!silent) {
    const open = state.push('color_open', 'span', 1);
    open.meta = { color: m[1] };
    const tok = state.push('text', '', 0);
    tok.content = inner;
    state.push('color_close', 'span', -1);
  }
  state.pos = close + 1 + m[0].length;
  return true;
}

/** `$$ ... $$` occupying whole lines. */
function mathBlock(state, startLine, endLine, silent) {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];
  if (start + 2 > max) return false;
  if (state.src.slice(start, start + 2) !== '$$') return false;

  const firstLine = state.src.slice(start + 2, max).trim();
  let line = startLine;
  let content = '';
  let found = false;

  if (firstLine.endsWith('$$') && firstLine.length > 2) {
    content = firstLine.slice(0, -2).trim();
    found = true;
  } else {
    const buf = firstLine ? [firstLine] : [];
    while (++line < endLine) {
      const b = state.bMarks[line] + state.tShift[line];
      const e = state.eMarks[line];
      const text = state.src.slice(b, e);
      if (text.trim().endsWith('$$')) {
        const tail = text.trim().slice(0, -2).trim();
        if (tail) buf.push(tail);
        found = true;
        break;
      }
      buf.push(text);
    }
    content = buf.join('\n').trim();
  }

  if (!found || !content) return false;
  if (silent) return true;

  const token = state.push('math_block', 'math', 0);
  token.content = content;
  token.map = [startLine, line + 1];
  state.line = line + 1;
  return true;
}

const md = new MarkdownIt('default', {
  html: false,
  // Soft line breaks stay soft. The old renderer used `breaks: true`, which
  // turned every wrapped source line into a forced break and burned vertical
  // space the fitter now recovers.
  breaks: false,
  linkify: false,
  typographer: true,
});

md.inline.ruler.before('escape', 'math_paren', mathParen);
md.inline.ruler.before('escape', 'math_inline', mathInline);
md.inline.ruler.before('emphasis', 'ff_mark', markRule);
md.inline.ruler.before('link', 'ff_color', colorRule);
md.block.ruler.before('fence', 'math_block', mathBlock, {
  alt: ['paragraph', 'reference', 'blockquote', 'list'],
});

/* ------------------------------------------------------------------ *
 * Token stream -> AST
 * ------------------------------------------------------------------ */

const baseStyle = () => ({ b: false, i: false, strike: false, mark: false, color: null, code: false });

/** Flatten an `inline` token's children into positioned runs carrying style. */
function readInline(token, images) {
  const runs = [];
  const stack = [baseStyle()];
  const top = () => stack[stack.length - 1];
  const push = (patch) => stack.push({ ...top(), ...patch });

  for (const child of token.children || []) {
    switch (child.type) {
      case 'text':
        if (child.content) runs.push({ t: 'text', text: child.content, s: top() });
        break;
      case 'code_inline':
        // Previously dropped entirely, deleting the code from the sentence.
        runs.push({ t: 'text', text: child.content, s: { ...top(), code: true } });
        break;
      case 'math_inline':
      case 'math_display':
        runs.push({ t: 'math', tex: child.content, s: top(), display: child.type === 'math_display' });
        break;
      case 'strong_open': push({ b: true }); break;
      case 'em_open': push({ i: true }); break;
      case 's_open': push({ strike: true }); break;
      case 'mark_open': push({ mark: true }); break;
      case 'color_open': push({ color: child.meta.color }); break;
      case 'link_open': push({ color: 'teal' }); break;
      case 'strong_close':
      case 'em_close':
      case 's_close':
      case 'mark_close':
      case 'color_close':
      case 'link_close':
        if (stack.length > 1) stack.pop();
        break;
      case 'softbreak':
        runs.push({ t: 'text', text: ' ', s: top() });
        break;
      case 'hardbreak':
        runs.push({ t: 'br' });
        break;
      case 'image': {
        const src = child.attrs?.find((a) => a[0] === 'src')?.[1];
        if (src) images.push({ src, alt: child.content || '' });
        break;
      }
      default:
        if (child.content) runs.push({ t: 'text', text: child.content, s: top() });
    }
  }
  return runs;
}

const isBlank = (runs) => !runs.some((r) => (r.t === 'text' ? r.text.trim() : true));

/**
 * Walk the flat token stream into nested blocks. markdown-it emits containers
 * as matched `_open`/`_close` pairs, so a cursor plus recursion is enough.
 */
function readBlocks(tokens, start, stop, images) {
  const blocks = [];
  let i = start;

  const collectUntil = (closeType, from) => {
    let depth = 1;
    let j = from;
    const openType = closeType.replace('_close', '_open');
    while (j < stop) {
      if (tokens[j].type === openType) depth++;
      else if (tokens[j].type === closeType) { depth--; if (!depth) break; }
      j++;
    }
    return j;
  };

  while (i < stop) {
    const tok = tokens[i];

    switch (tok.type) {
      case 'heading_open': {
        const inline = tokens[i + 1];
        const runs = inline?.type === 'inline' ? readInline(inline, images) : [];
        if (!isBlank(runs)) {
          blocks.push({ t: 'heading', level: Number(tok.tag.slice(1)) || 1, inlines: runs });
        }
        i += 3;
        break;
      }

      case 'paragraph_open': {
        const inline = tokens[i + 1];
        const runs = inline?.type === 'inline' ? readInline(inline, images) : [];
        // A paragraph holding nothing but an image contributes no text block —
        // `readInline` has already hoisted the image into `images`, and the
        // layout engine decides where it goes.
        if (!isBlank(runs)) blocks.push({ t: 'para', inlines: runs });
        i += 3;
        break;
      }

      case 'fence':
      case 'code_block': {
        const code = tok.content.replace(/\n+$/, '');
        if (code) blocks.push({ t: 'code', lang: (tok.info || '').trim().split(/\s+/)[0], code });
        i += 1;
        break;
      }

      case 'math_block':
        blocks.push({ t: 'mathBlock', tex: tok.content });
        i += 1;
        break;

      case 'hr':
        blocks.push({ t: 'hr' });
        i += 1;
        break;

      case 'bullet_list_open':
      case 'ordered_list_open': {
        const ordered = tok.type === 'ordered_list_open';
        const end = collectUntil(ordered ? 'ordered_list_close' : 'bullet_list_close', i + 1);
        const items = [];
        let j = i + 1;
        while (j < end) {
          if (tokens[j].type === 'list_item_open') {
            const itemEnd = collectUntil('list_item_close', j + 1);
            items.push({ blocks: readBlocks(tokens, j + 1, itemEnd, images) });
            j = itemEnd + 1;
          } else j++;
        }
        const startAttr = Number(tok.attrGet?.('start')) || 1;
        if (items.length) blocks.push({ t: 'list', ordered, start: startAttr, items });
        i = end + 1;
        break;
      }

      case 'blockquote_open': {
        const end = collectUntil('blockquote_close', i + 1);
        const inner = readBlocks(tokens, i + 1, end, images);
        blocks.push(asCallout(inner));
        i = end + 1;
        break;
      }

      case 'table_open': {
        const end = collectUntil('table_close', i + 1);
        blocks.push(readTable(tokens, i + 1, end, images));
        i = end + 1;
        break;
      }

      default:
        i += 1;
    }
  }

  return blocks;
}

/** `> [!tip] text` becomes a coloured panel; a plain `>` stays a quote. */
function asCallout(inner) {
  const first = inner[0];
  if (first?.t === 'para') {
    const head = first.inlines.find((r) => r.t === 'text');
    const m = head && /^\s*\[!(\w+)\]\s*/i.exec(head.text);
    if (m) {
      const kind = m[1].toLowerCase();
      if (CALLOUTS.includes(kind)) {
        head.text = head.text.slice(m[0].length);
        const trimmed = isBlank(first.inlines) ? inner.slice(1) : inner;
        return { t: 'callout', kind, blocks: trimmed };
      }
    }
  }
  return { t: 'quote', blocks: inner };
}

function readTable(tokens, start, stop, images) {
  const head = [];
  const rows = [];
  const align = [];
  let inHead = false;
  let row = null;

  for (let i = start; i < stop; i++) {
    const tok = tokens[i];
    if (tok.type === 'thead_open') inHead = true;
    else if (tok.type === 'thead_close') inHead = false;
    else if (tok.type === 'tr_open') row = [];
    else if (tok.type === 'tr_close') {
      if (row) (inHead ? head : rows).push(row);
      row = null;
    } else if (tok.type === 'th_open' || tok.type === 'td_open') {
      const style = tok.attrGet?.('style') || '';
      const a = /text-align:\s*(left|right|center)/.exec(style)?.[1] || 'left';
      if (inHead) align.push(a);
      const inline = tokens[i + 1];
      row?.push(inline?.type === 'inline' ? readInline(inline, images) : []);
    }
  }

  return { t: 'table', head: head[0] || [], rows, align };
}

/**
 * Parse slide markdown.
 *
 * Returns `{ blocks, images }`. Images are hoisted out of the flow because the
 * layout engine chooses their placement by measurement rather than dropping
 * them wherever they appeared in the source.
 */
export function parseSlide(source) {
  const images = [];
  if (!source || !source.trim()) return { blocks: [], images };

  const tokens = md.parse(source, {});
  const blocks = readBlocks(tokens, 0, tokens.length, images);
  return { blocks, images };
}

export { SWATCHES, CALLOUTS };
