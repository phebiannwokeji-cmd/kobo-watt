import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'evidence');
for (const name of ['11-write-succeeded-logs.txt','12-database-rows.png','13-write-failed-logs.txt','database-rows.json','enquiry-http-checks.txt']) {
  if (existsSync(path.join(out,name))) throw new Error(`Preserve existing evidence: ${name}`);
}
const wait = ms => new Promise(r => setTimeout(r,ms));
const checks=[]; let server, chrome, socket; let successLog='', failureLog='', phase='success';
const record=s=>{checks.push(s);console.log(s);};
const dbPath=path.join(root,'data/enquiries.db');
function rows(){const db=new Database(dbPath,{readonly:true});try{return db.prepare('SELECT * FROM enquiries ORDER BY id').all();}finally{db.close();}}
async function port(){const s=net.createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const n=s.address().port;await new Promise(r=>s.close(r));return n;}
async function start(readonly=false){
 const p=await port();
 server=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PORT:String(p),DB_READONLY:readonly?'1':'0'},stdio:['ignore','pipe','pipe']});
 const log=d=>{if(phase==='failure')failureLog+=d;else successLog+=d;};server.stdout.on('data',log);server.stderr.on('data',log);
 const url=`http://127.0.0.1:${p}`;
 for(let i=0;i<100;i++){if(server.exitCode!==null)throw Error('Server exited');try{if((await fetch(url)).status===200){record(`Owned server PID ${server.pid}, URL ${url}, readonly=${readonly}; home 200`);return url;}}catch{}await wait(100);}throw Error('Startup timeout');
}
async function stop(){if(server&&server.exitCode===null){const old=server;old.kill();await Promise.race([new Promise(r=>old.once('exit',r)),wait(5000).then(()=>{throw Error('Owned server did not stop');})]);record(`Stopped owned PID ${old.pid}`);}}
async function apiSubmit(url,name,expected){const response=await fetch(url+'/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,phone:'00000000000',business_type:'salon'})});const result=await response.json();assert.equal(response.status,expected);record(`POST ${response.status}: ${JSON.stringify(result)}`);}

try{
 assert.equal(rows().length,0,'Use a fresh dedicated demonstration database; never overwrite existing rows');
 let url=await start();record('HTTP integration run; browser launch unavailable. Browser interaction not claimed.');
 const invalid=await fetch(url+'/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'',phone:'bad',business_type:'invalid'})});assert.equal(invalid.status,400);assert.equal(rows().length,0);record('Invalid input: 400 and zero rows');
 const malformed=await fetch(url+'/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});assert.equal(malformed.status,400);assert.equal(rows().length,0);record('Malformed JSON: 400 and zero rows');
 for(const route of ['/data/enquiries.db','/tools/inspect-db.js','/evidence/database-rows.json','/server.js'])assert.equal((await fetch(url+route)).status,404);
 record('Database, tools, evidence and source routes return 404');
 await apiSubmit(url,'Fictional Salon Alpha',201);assert.equal(rows().length,1);const firstTime=Date.now();record(`First persisted row: ${JSON.stringify(rows()[0])}`);
 record('Waiting 125 real seconds before the second submission.');
 await wait(125000);
 await apiSubmit(url,"Fictional O'Example Salon",201);const saved=rows();assert.equal(saved.length,2);assert.ok(Date.parse(saved[1].created_at)-Date.parse(saved[0].created_at)>=120000);assert.ok(Date.now()-firstTime>=120000);record(`Second persisted row: ${JSON.stringify(saved[1])}`);
 writeFileSync(path.join(out,'database-rows.json'),JSON.stringify(saved,null,2),{flag:'wx'});
 // Screenshot is a local rendering of a direct read-only database query, not an application success message.
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const html=`<!doctype html><meta charset="utf-8"><title>Persisted SQLite rows</title><style>body{font:18px Arial;padding:24px}table{border-collapse:collapse}td,th{border:1px solid #888;padding:12px;text-align:left}caption{text-align:left;margin:16px 0}</style><h1>Task 2 — actual persisted enquiries</h1><p>Read-only SELECT from data/enquiries.db · Captured ${escape(new Date().toISOString())}</p><p>Fictional data only. Two submissions at least two minutes apart.</p><table><caption>SELECT id, name, phone, business_type, created_at FROM enquiries ORDER BY id</caption><tr>${Object.keys(saved[0]).map(k=>`<th>${escape(k)}</th>`).join('')}</tr>${saved.map(r=>'<tr>'+Object.values(r).map(v=>`<td>${escape(v)}</td>`).join('')+'</tr>').join('')}</table>`;
 writeFileSync(path.join(out,'database-rows.html'),html,{flag:'wx'});
 await stop();phase='failure';url=await start(true);const before=rows();await apiSubmit(url,'Fictional Rejected Enquiry',500);assert.deepEqual(rows(),before);record('Read-only rejection: exact persisted rows unchanged; browser retention not tested in this HTTP run');
 assert.match(failureLog,/SQLITE_READONLY/);assert.match(failureLog,/"status":500/);
 await stop();phase='success';url=await start(false);await apiSubmit(url,'Fictional Restored Enquiry',201);assert.equal(rows().length,3);record('Writable restoration: third row persisted');assert.match(successLog,/"status":201/);
 record('PASS: persistence, validation, failure, restoration and HTTP checks');
} catch(e){record('FAIL: '+e.stack);process.exitCode=1;}
finally{
 await stop().catch(e=>record(e.message));
 writeFileSync(path.join(out,'11-write-succeeded-logs.txt'),`Captured ${new Date().toISOString()}\nActual complete stdout/stderr of owned writable server runs. First two submissions were HTTP POSTs using the form endpoint, not browser interactions. Third is writable restoration.\n`+successLog,{flag:'wx'});
 writeFileSync(path.join(out,'13-write-failed-logs.txt'),`Captured ${new Date().toISOString()}\nActual complete stdout/stderr of owned read-only server run.\n`+failureLog,{flag:'wx'});
 writeFileSync(path.join(out,'enquiry-http-checks.txt'),checks.join('\n')+'\n',{flag:'wx'});
}
