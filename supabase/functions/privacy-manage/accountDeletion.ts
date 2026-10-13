// Shared by privacy-manage and isolated unit tests.
// The authenticated user ID must come from auth.getUser(token), never request JSON.
export const USER_SCOPED_TABLES = [
  'riot_life_snapshots',
  'valorant_user_matches',
  'valorant_accounts',
  'riot_rso_states',
  'player_dna_snapshots',
  'client_event_logs',
  'riot_accounts',
  'profiles',
] as const;

export type UserScopedAdmin = {
  from(table: string): {
    delete(): { eq(column:string,value:string): PromiseLike<{error:{code?:string;message?:string}|null}> }
  };
  auth: {admin: {deleteUser(id:string): Promise<{error:{code?:string;message?:string}|null}>}};
};

export async function eraseAccountData(admin:UserScopedAdmin, authenticatedUserId:string) {
  const deletedTables:string[]=[];
  // No public/shared Riot match caches: records about other players must not be destroyed.
  // Stop on ANY error instead of claiming a complete erasure.
  for(const table of USER_SCOPED_TABLES){
    const {error}=await admin.from(table).delete().eq('user_id',authenticatedUserId);
    if(error)return {ok:false,error:'user_data_cleanup_failed',table,completed:deletedTables};
    deletedTables.push(table);
  }
  const {error}=await admin.auth.admin.deleteUser(authenticatedUserId);
  if(error)return {ok:false,error:'account_deletion_failed',completed:deletedTables};
  return {ok:true,scope:'known_user_scoped_records_and_auth_account',completed:deletedTables};
}
