// Read-only schema inventory. No row-level data or credentials appear in logs.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const doc=JSON.parse(readFileSync('/tmp/zerotwo-privacy-schema.json','utf8'));
const rows=Array.isArray(doc)?doc:Array.isArray(doc?.result)?doc.result:[];
assert.ok(Array.isArray(rows)&&rows.length>0,'No metadata returned; privacy audit could not verify schema');
const existing=rows.map(row=>String(row.table_name||'')).filter(Boolean).sort();
const accountTables=[
 'riot_life_snapshots','valorant_user_matches','valorant_accounts','riot_rso_states',
 'player_dna_snapshots','client_event_logs','riot_accounts','profiles'
];
const exempt=['zerotwo_privacy_requests']; // FK on delete SET NULL; handled separately.
const untracked=existing.filter(name=>!accountTables.includes(name)&&!exempt.includes(name));
const missing=accountTables.filter(name=>!existing.includes(name));
console.log('Verified user-scoped schema tables:',existing.join(', '));
if(untracked.length)console.log('::warning title=ZeroTwo data inventory::Additional user_id tables require review: '+untracked.join(', '));
if(missing.length)console.log('::warning title=ZeroTwo erasure mapping::Tables absent in this project: '+missing.join(', '));
mkdirSync('privacy-schema-artifacts',{recursive:true});
writeFileSync('privacy-schema-artifacts/schema-audit.json',JSON.stringify({
 at:new Date().toISOString(),tables:existing,untracked,missing
},null,2)+'\n');
if(untracked.length)process.exitCode=1; // Never claim full deletion with unknown user data tables.
