/**
 * Domain transform used by both the JSON-RPC mapper and the in-process baseline.
 *
 * `.sfc` files mimic a Vue single-file component: a `<script lang="ts">` block
 * plus a template. TypeScript 7.1 never sees the template. It type-checks the
 * extracted script as virtual `.ts` and remaps diagnostics through a Verbatim
 * span covering that script body.
 *
 * `.lisp` files follow the content-mapper PR's add/plus example so Atom and
 * Alias spans can be measured against Verbatim.
 */

export const SPAN_KIND = Object.freeze({
  Verbatim: 0,
  Atom: 1,
  Alias: 2,
});

export const CHECKOUT_SFC = `<script lang="ts">
export const checkoutTotal: number = "not-a-number";
</script>
<template>
  <p>{{ checkoutTotal }}</p>
</template>
`;

export const ADD_LISP = `(+ 1 2 "oops")
`;

/**
 * @typedef {object} TransformOutput
 * @property {string} text
 * @property {string} extension
 * @property {number[][]} mappings
 * @property {Array<{messageText: string, start: number, length: number, code: number}>} [diagnostics]
 */

/**
 * @param {string} fileName
 * @param {string} content
 * @returns {TransformOutput}
 */
export function transformMappedFile(fileName, content) {
  if (fileName.endsWith('.lisp')) {
    return transformLisp(content);
  }
  return transformSfc(content);
}

/**
 * @param {string} content
 * @returns {TransformOutput}
 */
export function transformSfc(content) {
  const open = content.indexOf('<script');
  if (open < 0) {
    return {
      text: 'export {};\n',
      extension: '.ts',
      mappings: [],
      diagnostics: [
        {
          messageText: 'SFC is missing a <script> block',
          start: 0,
          length: Math.min(content.length, 1),
          code: 1001,
        },
      ],
    };
  }
  const tagEnd = content.indexOf('>', open);
  const close = content.indexOf('</script>', tagEnd);
  if (tagEnd < 0 || close < 0) {
    return {
      text: 'export {};\n',
      extension: '.ts',
      mappings: [],
      diagnostics: [
        {
          messageText: 'SFC <script> block is unclosed',
          start: open,
          length: 7,
          code: 1002,
        },
      ],
    };
  }
  const inner = content.slice(tagEnd + 1, close);
  return {
    text: inner,
    extension: '.ts',
    mappings: [[0, inner.length, tagEnd + 1, inner.length, SPAN_KIND.Verbatim]],
  };
}

/**
 * Original: `(+ 1 2 "oops")\n`
 * Virtual:  `declare function add(a: number, b: number, c: number): number;\nadd(1, 2, "oops");\n`
 *
 * `add` is an Alias for `+`. Literals are Verbatim.
 * @param {string} content
 * @returns {TransformOutput}
 */
export function transformLisp(content) {
  const original = content.trimEnd();
  const header = 'declare function add(a: number, b: number, c: number): number;\n';
  const call = 'add(1, 2, "oops");\n';
  const text = header + call;
  const plus = original.indexOf('+');
  const one = original.indexOf('1');
  const two = original.indexOf('2');
  const oops = original.indexOf('"oops"');
  if (plus < 0 || one < 0 || two < 0 || oops < 0) {
    return {
      text: 'export {};\n',
      extension: '.ts',
      mappings: [],
      diagnostics: [
        {
          messageText: 'Lisp form must match (+ 1 2 "oops")',
          start: 0,
          length: original.length,
          code: 1003,
        },
      ],
    };
  }
  const callStart = header.length;
  return {
    text,
    extension: '.ts',
    mappings: [
      [callStart, 3, plus, 1, SPAN_KIND.Alias],
      [callStart + 4, 1, one, 1, SPAN_KIND.Verbatim],
      [callStart + 7, 1, two, 1, SPAN_KIND.Verbatim],
      [callStart + 10, 6, oops, 6, SPAN_KIND.Verbatim],
    ],
  };
}

/**
 * Map a virtual offset back to the original file using mapper span tuples.
 * Synthesized gaps (no covering segment) return null.
 *
 * @param {number[][]} mappings
 * @param {number} virtualPos
 * @returns {{originalPos: number, kind: number} | null}
 */
export function virtualToOriginal(mappings, virtualPos) {
  for (const tuple of mappings) {
    const [virtualStart, virtualLength, originalStart, , kind] = tuple;
    if (virtualPos >= virtualStart && virtualPos < virtualStart + virtualLength) {
      if (kind === SPAN_KIND.Verbatim) {
        return { originalPos: originalStart + (virtualPos - virtualStart), kind };
      }
      return { originalPos: originalStart, kind };
    }
  }
  return null;
}

/**
 * Locate the planted string literal in virtual SFC text so a TS2322-class
 * assignment error can be remapped to the original `.sfc`.
 * @param {string} virtualText
 */
export function plantedStringLiteral(virtualText) {
  const needle = '"not-a-number"';
  const start = virtualText.indexOf(needle);
  if (start < 0) {
    throw new Error('virtual SFC is missing the planted string literal');
  }
  return { start, length: needle.length };
}
