#!/usr/bin/env node
/**
 * ESLint only on files changed vs a base ref.
 *
 * Usage:
 *   node scripts/lint-changed.mjs
 *   node scripts/lint-changed.mjs --base origin/develop
 */
import { execSync, spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const baseArgIdx = args.indexOf('--base');
const baseRef =
  (baseArgIdx >= 0 ? args[baseArgIdx + 1] : null)
  || process.env.BASE_REF
  || 'HEAD~1';

function changedSrcFiles() {
  try {
    const out = execSync(`git diff --name-only --diff-filter=ACMR ${baseRef}...HEAD`, {
      cwd: root,
      encoding: 'utf8',
    });
    return out
      .split('\n')
      .map((s) => s.trim())
      .filter((f) => f.startsWith('src/') && /\.(ts|tsx|js|jsx)$/.test(f));
  } catch {
    return [];
  }
}

const files = changedSrcFiles();
if (!files.length) {
  console.log(`No hay archivos src/ modificados vs ${baseRef}.`);
  process.exit(0);
}

console.log(`ESLint sobre ${files.length} archivo(s) vs ${baseRef}:`);
files.forEach((f) => console.log(`  - ${f}`));

const result = spawnSync('npx', ['eslint', ...files], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(result.status ?? 1);
