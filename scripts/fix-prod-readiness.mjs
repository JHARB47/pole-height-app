#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const filePath = join(projectRoot, 'PRODUCTION-READINESS-ANALYSIS.md');

console.log('Fixing PRODUCTION-READINESS-ANALYSIS.md markdown issues...');

let content = readFileSync(filePath, 'utf8');

// Fix all the markdown issues systematically
content = content
  // Fix MD022: Add blank lines around headings
  .replace(/^(### \*\*Priority [12]: [^*]+\*\*)$/gm, '\n$1\n')
  .replace(/^(\*\*Current\*\*: [^\n]+)$/gm, '\n$1')
  .replace(/^(\*\*Enhancement Needed\*\*:)$/gm, '\n$1')
  .replace(/^(#### [^#][^\n]*)$/gm, '\n$1\n')
  .replace(/^(### [^#][^\n]*)$/gm, '\n$1\n')
  
  // Fix MD031: Add blank lines around fenced code blocks
  .replace(/(\*\*Enhancement Needed\*\*:)\n```/g, '$1\n\n```')
  .replace(/```\n(###|\*\*)/g, '```\n\n$1')
  .replace(/```\n([^`\n])/g, '```\n\n$1')
  
  // Fix MD032: Add blank lines around lists
  .replace(/(\*\*[^*]+\*\*:)\n- /g, '$1\n\n- ')
  .replace(/(\n- [^\n]+)\n(###|\*\*)/g, '$1\n\n$2')
  
  // Fix MD009: Remove trailing spaces
  .replace(/[ \t]+$/gm, '')
  
  // Fix MD047: Ensure single trailing newline
  .replace(/\n*$/, '\n')
  
  // Clean up multiple consecutive blank lines
  .replace(/\n{3,}/g, '\n\n');

writeFileSync(filePath, content);
console.log('✅ Fixed PRODUCTION-READINESS-ANALYSIS.md');