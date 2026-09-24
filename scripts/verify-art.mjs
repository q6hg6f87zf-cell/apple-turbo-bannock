import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const manifest=readFileSync('docs/CANONICAL-ART-MANIFEST.md','utf8');let checked=0;
for(const line of manifest.split('\n')){
 const m=line.match(/\| `(public\/[^`]+)` \| byte-for-byte \/ `([a-f0-9]{64})`/);if(!m)continue;
 const path=m[1].replace(/^public\//,'ios/App/App/public/');
 if(createHash('sha256').update(readFileSync(path)).digest('hex')!==m[2])throw Error('Native art mismatch: '+path);checked++;
}
if(checked!==68)throw Error('Incomplete art manifest');console.log(`Verified ${checked} canonical binaries in the offline iOS bundle.`);
