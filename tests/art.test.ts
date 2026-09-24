import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { WEAPONS, ITEMS } from '../src/game/domain/registry';
test('canonical artwork matches every pinned donor binary and catalog path',()=>{
 const manifest=readFileSync('docs/CANONICAL-ART-MANIFEST.md','utf8');let count=0;
 for(const line of manifest.split('\n')){const m=line.match(/\| `(public\/[^`]+)` \| byte-for-byte \/ `([a-f0-9]{64})`/);if(!m)continue;count++;assert.equal(createHash('sha256').update(readFileSync(m[1])).digest('hex'),m[2],m[1]);}
 assert.equal(count,68);for(const d of [...Object.values(WEAPONS),...Object.values(ITEMS)])if(d.art)assert.ok(existsSync('public/'+d.art.replace(/^\.\//,'')),d.art);
 assert.equal(existsSync('public/art/ironclad-title.jpg'),false);
});
