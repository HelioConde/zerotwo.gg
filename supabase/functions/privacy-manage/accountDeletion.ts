// Shared Supabase Auth contains ZeroTwo, Chibi and TFT products.
// Never delete a shared Auth identity when another app owns data for it.
export const ZEROTWO_USER_TABLES=[
  'riot_life_snapshots','valorant_user_matches','valorant_accounts','riot_rso_states',
  'duo_experience_feedback','player_discovery_settings','player_dna_snapshots',
  'player_match_feedback','test_player_interactions','client_event_logs',
  'riot_legacy_public_profiles','riot_legacy_rso_states','riot_accounts','profiles',
] as const;
export const SHARED_APP_TABLES=[
  'chibi_recorded_matches','chibi_riot_account_links',
  'tft_museum_collections','tft_museum_match_archive',
  'tft_museum_public_shares','tft_museum_state','tft_museum_watch_profiles',
] as const;
export type AccountAdmin={from(table:string):any;auth:{admin:{deleteUser(id:string):Promise<{error:{code?:string}|null}>}}};
export async function eraseAccountData(admin:AccountAdmin,userId:string){
  let sharedData=false;
  // Fail CLOSED if another application's rows cannot be inspected.
  for(const table of SHARED_APP_TABLES){
    const {count,error}=await admin.from(table).select('user_id',{count:'exact',head:true}).eq('user_id',userId);
    if(error)return {ok:false,error:'shared_account_audit_failed',table,completed:[] as string[]};
    if((count||0)>0)sharedData=true;
  }
  const completed:string[]=[];
  for(const table of ZEROTWO_USER_TABLES){
    const {error}=await admin.from(table).delete().eq('user_id',userId);
    if(error)return {ok:false,error:'zerotwo_data_cleanup_failed',table,completed};
    completed.push(table);
  }
  if(!sharedData){
    const {error}=await admin.auth.admin.deleteUser(userId);
    if(error)return {ok:false,error:'auth_deletion_failed',completed};
  }
  return {ok:true,scope:'zerotwo_owned_records',completed,sharedAuthRetained:sharedData,authDeleted:!sharedData};
}
