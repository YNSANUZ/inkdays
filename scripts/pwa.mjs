import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const files=[];
async function walk(dir='dist') {for(const item of await readdir(dir,{withFileTypes:true})){const path=`${dir}/${item.name}`;if(item.isDirectory())await walk(path);else if(item.name!=='sw.js')files.push(path.slice(5));}}
await walk();files.sort();
const hash=createHash('sha256');for(const f of files)hash.update(await readFile(`dist/${f}`));
const version=hash.digest('hex').slice(0,16);
await writeFile('dist/sw.js',`const CACHE='inkdays-${version}';
const FILES=${JSON.stringify(files)};
const BASE=self.registration.scope;
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(f=>new URL(f,BASE).href))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('inkdays-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||!e.request.url.startsWith(BASE))return;
 const url=new URL(e.request.url);
 const relative=url.pathname.slice(new URL(BASE).pathname.length);
 if(e.request.mode==='navigate'){
   if(relative!==''&&relative!=='index.html')return;
   e.respondWith(caches.open(CACHE).then(c=>c.match(new URL('index.html',BASE).href)).then(r=>r||fetch(e.request)));return;
 }
 if(!FILES.includes(relative))return;
 e.respondWith(caches.open(CACHE).then(c=>c.match(e.request,{ignoreSearch:true})).then(r=>r||fetch(e.request)));
});
`);
console.log(`PWA: ${files.length} arquivos, versão ${version}`);
