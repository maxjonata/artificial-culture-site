import { readFile, writeFile, readdir, mkdir, cp, stat, rm } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { collectReleases, toEntry } from './release.mjs';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'dist');
if (resolve(out) !== join(root,'dist') || !out.startsWith(root+sep)) throw Error('unsafe build output path');
const policy = JSON.parse(await readFile(join(root,'release-policy.json'),'utf8'));
const notes = [];
for (const project of Object.keys(policy.projects)) {
  const dir = join(root,'releases',project);
  let files;
  try { files = await readdir(dir); } catch (e) { if (e.code === 'ENOENT') continue; throw e; }
  for (const file of files.filter(f => f.endsWith('.json'))) {
    const note = JSON.parse(await readFile(join(dir,file),'utf8'));
    if (note.project !== project || file !== `v${note.version}.json`) throw Error('release path differs from payload');
    notes.push(note);
  }
}
const releases = collectReleases(notes, policy.projects);
// Output is an allowlist; product code, CI files and repository metadata are never published as site artifacts.
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
for (const file of ['index.html','updates.html','.nojekyll','assets']) await cp(join(root,file),join(out,file),{recursive:true});
const feed = JSON.parse(await readFile(join(root,'updates.json'),'utf8'));
feed.entries = [...releases.map(note => toEntry(note,policy.projects)), ...feed.entries.filter(e => !e.release_key)];
await writeFile(join(out,'updates.json'),JSON.stringify(feed,null,2)+'\n');
for (const name of ['index.html','updates.html']) {
  const html = await readFile(join(out,name),'utf8');
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    const relative = match[1];
    if (/^(https?:|data:|mailto:)/.test(relative)) continue;
    const file = resolve(out,relative.split(/[?#]/)[0]);
    if (file !== out && !file.startsWith(out+sep)) throw Error('asset leaves site');
    await stat(file);
  }
}
console.log(`Built public website: ${releases.length} versioned releases, ${feed.entries.length} total notes.`);
