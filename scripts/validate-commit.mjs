import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { parseCommit, validateReleaseChanges } from './release.mjs';

const policy = JSON.parse(await readFile('release-policy.json','utf8'));
let range = 'HEAD';
let base = null;
if (process.env.GITHUB_EVENT_PATH) {
  const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH,'utf8'));
  if (process.env.GITHUB_EVENT_NAME === 'push' && /^[0-9a-f]{40}$/.test(event.before) && !/^0+$/.test(event.before)) base = event.before;
  else if (process.env.GITHUB_EVENT_NAME === 'pull_request') base = event.pull_request.base.sha;
  if (base) range = `${base}..HEAD`;
}
const messages = execFileSync('git',['log','--format=%B%x00',range],{encoding:'utf8'}).split('\0').map(s=>s.trim()).filter(Boolean);
let count = 0;
const notes = [];
for (const message of messages) {
  const note = parseCommit(message,policy.projects);
  if (!note) continue;
  const tracked = JSON.parse(await readFile(`releases/${note.project}/v${note.version}.json`,'utf8'));
  const { deepStrictEqual } = await import('node:assert');
  deepStrictEqual(note,tracked,'release commit block must equal public release JSON');
  notes.push(note);
  count++;
}
if (base) validateReleaseChanges(execFileSync('git',['diff','--name-status',range,'--','releases/'],{encoding:'utf8'}).trim(),notes);
console.log(`Checked ${messages.length} commit messages; ${count} major/minor releases.`);
