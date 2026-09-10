#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'blog', 'posts');
let files = 0;

function firstSentenceCite(prose) {
  if (/(?<!\$)\[1\]/.test(prose)) return prose;
  const parts = prose.split(/(```[\s\S]*?```)/);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith('```')) continue;
    const m = parts[i].match(/^((?:> \[[!N].+\n)?(?:.+\n){0,6}?[A-Z][^.\n]{40,220}\.)/m);
    if (m && !/e\.g\.|i\.e\.|Next\.js|tsconfig\.json/.test(m[1].slice(-12))) {
      parts[i] = parts[i].replace(m[1], m[1].replace(/\.$/, ' [1].'));
      return parts.join('');
    }
    const paras = parts[i].split(/\n\n+/);
    for (let p = 0; p < paras.length; p++) {
      const t = paras[p].trim();
      if (t.startsWith('#') || t.startsWith('```') || t.startsWith('>') || t.startsWith('|') || t.startsWith('-') || t.startsWith('*') || /^\d+\./.test(t)) continue;
      if (t.length < 80) continue;
      const end = t.match(/^([\s\S]{60,}?\.)(\s|$)/);
      if (end && !/\(e\.g\.|\(i\.e\./.test(end[1].slice(0, 80))) {
        paras[p] = paras[p].replace(end[1], end[1].replace(/\.$/, ' [1].'));
        parts[i] = paras.join('\n\n');
        return parts.join('');
      }
    }
  }
  return parts.join('');
}

for (const file of readdirSync(DIR).filter((f) => f.endsWith('.md'))) {
  const path = join(DIR, file);
  let md = readFileSync(path, 'utf8');
  const orig = md;
  md = md.replace(/e \[1\]\.g/g, 'e.g');
  md = md.replace(/i \[1\]\.e/g, 'i.e');
  md = md.replace(/Next \[1\]\.js/g, 'Next.js');
  md = md.replace(/tsconfig \[1\]\.json/g, 'tsconfig.json');
  md = md.replace(/^(\d+) \[1\]\./gm, '$1.');
  md = md.replace(/([A-Za-z]) \[1\]\.(js|json|ts|tsx|md)/g, '$1.$2');
  md = md.replace(/\n \[2\]\s*\n(\n## References)/g, ' [2]\n$1');
  md = md.replace(/\n \[2\]\s*$/m, ' [2]');
  // attach leftover orphan [2] lines to previous text
  md = md.replace(/([^\n])\n \[2\]\n/g, '$1 [2]\n');
  if (/^## References & Further Reading\s*$/m.test(md)) {
    md = firstSentenceCite(md);
  }
  if (md !== orig) {
    writeFileSync(path, md);
    files++;
  }
}
console.log(`Repaired citations in ${files} files`);
