#!/usr/bin/env node

/**
 * Simple Markdown linter fix script
 * Fixes common MD issues: trailing spaces, missing blank lines around headings/lists/code blocks
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const markdownFiles = [
  'STATUS.md',
  'PRODUCTION-READINESS-ANALYSIS.md',
  'NETLIFY-VISUAL-EDITOR-DEPLOYMENT-GUIDE.md'
];

function fixMarkdownFile(filePath) {
  console.log(`Fixing ${filePath}...`);
  
  let content = readFileSync(filePath, 'utf-8');
  
  // Fix trailing spaces (MD009)
  content = content.replace(/[ \t]+$/gm, '');
  
  // Fix blank lines around headings (MD022)
  content = content.replace(/^(#{1,6}.*?)$/gm, (match, heading, offset, string) => {
    const beforeChar = string[offset - 1];
    const afterMatch = string.slice(offset + match.length);
    const afterChar = afterMatch[0];
    
    let result = match;
    
    // Add blank line before heading if needed
    if (beforeChar && beforeChar !== '\n') {
      result = '\n' + result;
    }
    
    // Add blank line after heading if needed
    if (afterChar && afterChar !== '\n' && !afterMatch.startsWith('\n')) {
      result = result + '\n';
    }
    
    return result;
  });
  
  // Fix blank lines around lists (MD032)
  content = content.replace(/^([*+-]|\d+\.)\s/gm, (match, offset, string) => {
    const beforeChar = string[offset - 1];
    if (beforeChar && beforeChar !== '\n') {
      return '\n' + match;
    }
    return match;
  });
  
  // Fix blank lines around fenced code blocks (MD031)
  content = content.replace(/^```/gm, (match, offset, string) => {
    const beforeChar = string[offset - 1];
    if (beforeChar && beforeChar !== '\n') {
      return '\n' + match;
    }
    return match;
  });
  
  // Fix language specification for code blocks (MD040)
  content = content.replace(/^```\s*$/gm, '```text');
  
  // Ensure single trailing newline (MD047)
  content = content.replace(/\n*$/, '\n');
  
  writeFileSync(filePath, content);
  console.log(`Fixed ${filePath}`);
}

// Fix the specific markdown files
markdownFiles.forEach(fixMarkdownFile);

console.log('Markdown fixes completed!');