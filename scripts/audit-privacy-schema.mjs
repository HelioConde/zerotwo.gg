// Read-only schema inventory. No row-level data or credentials appear in logs.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const doc=JSON.parse(readFileSync('/tmp/zerotwo-privacy-schema.json','utf8'));
const rows=Array.isArray(doc)?doc:Array.isArray(doc?.result)?doc.result:[];
assert.ok(Array.isArray(rows)&&rows.length>0,'No metadata returned; privacy audit could not verify schema');
const existing=rows.map(row=>String(row.table_name||'')).filter(Boolean).sort();
const accountTables=[
 'riot_life_snapshots','valorant_user_matches','valorant_accounts','riot_rso_states',
 'player_dna_snapshots','client_event_logs','riot_accounts','profiles',
 'duo_experience_feedback','player_discovery_settings','player_match_feedback',
 'riot_legacy_public_profiles','riot_legacy_rso_states','test_player_interactions'
];
const sharedAppTables=[
  'chibi_recorded_matches','chibi_riot_account_links',
  'tft_museum_collections','tft_museum_match_archive',
  'tft_museum_public_shares','tft_museum_state','tft_museum_watch_profiles'
];
const exempt=['zerotwo_privacy_requests']; // FK on delete SET NULL; handled separately.
const untracked=existing.filter(name=>!accountTables.includes(name)&&!exempt.includes(name)&&!sharedAppTables.includes(name));
const missing=accountTables.filter(name=>!existing.includes(name));
console.log('Verified user-scoped schema tables:',existing.join(', '));
if(untracked.length)console.log('::warning title=ZeroTwo data inventory::Additional user_id tables require review: '+untracked.join(', '));
if(missing.length)console.log('::warning title=ZeroTwo erasure mapping::Tables absent in this project: '+missing.join(', '));
mkdirSync('privacy-schema-artifacts',{recursive:true});
writeFileSync('privacy-schema-artifacts/schema-audit.json',JSON.stringify({
 at:new Date().toISOString(),tables:existing,untracked,missing
},null,2)+'\n');
if(untracked.length)process.exitCode=1; // Never claim full deletion with unknown user data tables.
