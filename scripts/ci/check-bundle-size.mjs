#!/usr/bin/env node
/**
 * Simple bundle size guard. Scans dist assets, sums JS + CSS, compares to budget.
 * Budget chosen conservatively for current app size; adjust as features grow.
 */
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const dist = 'dist';
const BUDGET_KB = 1450; // 1.45 MB combined (realistic for enterprise PDF + GIS features)

/**
 * @returns {string[]}
 * @param {string} dir
 */
function walk(dir) {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) return walk(p);
    return [p];
  });
}

let total = 0;
let detail = [];
try {
  const files = walk(dist).filter(f => /\.(js|css)$/.test(f));
  for (const f of files) {
    const size = statSync(f).size;
    total += size;
    detail.push({ f, size });
  }
} catch (e) {
  const msg = typeof e === 'object' && e !== null && 'message' in e ? e.message : String(e);
  console.error('Bundle size check failed to read dist:', msg);
  process.exit(1);
}

const kb = (total / 1024).toFixed(1);
if (total / 1024 > BUDGET_KB) {
  console.error(`✖ Bundle size ${kb} KB exceeds budget ${BUDGET_KB} KB`);
  detail.sort((a,b)=>b.size-a.size).slice(0,10).forEach(d=>console.error(`  ${d.size} ${d.f}`));
  process.exit(2);
} else {
  console.log(`✓ Bundle size ${kb} KB within budget (${BUDGET_KB} KB)`);
}
