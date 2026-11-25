// Runs tests/booking_rules.sql on the linked Supabase project and reports the
// result. The SQL rolls itself back, so the database is left as it was.
// Use it on the development project only.
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const backend = join(dirname(fileURLToPath(import.meta.url)), '..');
const result = spawnSync(
  'npx',
  ['supabase', 'db', 'query', '--remote', '--yes', '-f', join('tests', 'booking_rules.sql')],
  { cwd: backend, encoding: 'utf8', shell: process.platform === 'win32' },
);
const output = `${result.stdout}\n${result.stderr}`;
const verdict = output.match(/JOTEKU TESTS? (PASSED|FAILED)[^"\\]*/);

if (verdict?.[1] === 'PASSED') {
  console.log(verdict[0]);
  process.exit(0);
}
console.error(verdict ? verdict[0] : output);
process.exit(1);
