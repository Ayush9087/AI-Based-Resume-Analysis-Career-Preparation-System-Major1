import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const sourceRoot = resolve(backendRoot, 'src');

async function listJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(entries.map((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory()
      ? listJavaScriptFiles(path)
      : (entry.isFile() && entry.name.endsWith('.js') ? [path] : []);
  }));
  return nestedFiles.flat();
}

const files = await listJavaScriptFiles(sourceRoot);
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`Backend syntax check passed for ${files.length} JavaScript files.`);
