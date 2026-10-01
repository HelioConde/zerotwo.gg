import { supabase } from '../../supabase';

export type RiotLifeSnapshot={
  at:number;
  mainContext:string|null;
  avgKda:number|null;
  winRate:number|null;
  topChampion:string|null;
  rank:string|null;
};

export type RiotLifeMemoryResult={
  snapshots:RiotLifeSnapshot[];
  cloud:boolean;
};

function normalizeSnapshot(raw:any, fallbackAt?:number):RiotLifeSnapshot|null{
  if(!raw||typeof raw!=='object')return null;
  const at=Number(raw.at||fallbackAt||0);
  if(!Number.isFinite(at)||at<=0)return null;
  const maybe=(v:any)=>v==null?null:Number.isFinite(Number(v))?Number(v):null;
  return {
    at,
    mainContext:raw.mainContext==null?null:String(raw.mainContext),
    avgKda:maybe(raw.avgKda),
    winRate:maybe(raw.winRate),
    topChampion:raw.topChampion==null?null:String(raw.topChampion),
    rank:raw.rank==null?null:String(raw.rank)
  };
}

export function mergeRiotLifeSnapshots(...groups:RiotLifeSnapshot[][]){
  const byKey=new Map<string,RiotLifeSnapshot>();
  groups.flat().forEach(snapshot=>{
    const clean=normalizeSnapshot(snapshot);
    if(!clean)return;
    const day=new Date(clean.at).toISOString().slice(0,10);
    const key=[day,clean.mainContext||'',clean.topChampion||'',clean.rank||'',clean.avgKda??'',clean.winRate??''].join('|');
    byKey.set(key,clean);
  });
  return [...byKey.values()].sort((a,b)=>a.at-b.at).slice(-48);
}

export async function loadCloudRiotLifeSnapshots(playerKey:string):Promise<RiotLifeMemoryResult>{
  try{
    const {data:{session}}=await supabase.auth.getSession();
    if(!session?.user?.id)return {snapshots:[],cloud:false};
    const {data,error}=await supabase
      .from('riot_life_snapshots')
      .select('snapshot,captured_at')
      .eq('user_id',session.user.id)
      .eq('player_key',playerKey)
      .order('captured_at',{ascending:true})
      .limit(48);
    if(error){
      console.info('Riot Life cloud memory unavailable:',error.code||error.message);
      return {snapshots:[],cloud:false};
    }
    const snapshots=(data||[])
      .map((row:any)=>normalizeSnapshot(row.snapshot,Date.parse(row.captured_at)))
      .filter(Boolean) as RiotLifeSnapshot[];
    return {snapshots,cloud:true};
  }catch(error){
    console.info('Riot Life cloud memory fallback:',error);
    return {snapshots:[],cloud:false};
  }
}

export async function saveCloudRiotLifeSnapshot(args:{
  playerKey:string;
  platform:string;
  gameName:string;
  tagLine:string;
  snapshot:RiotLifeSnapshot;
}):Promise<boolean>{
  try{
    const {data:{session}}=await supabase.auth.getSession();
    if(!session?.user?.id)return false;
    const capturedAt=new Date(args.snapshot.at||Date.now()).toISOString();
    const capturedDay=capturedAt.slice(0,10);
    const {error}=await supabase
      .from('riot_life_snapshots')
      .upsert({
        user_id:session.user.id,
        player_key:args.playerKey,
        platform:args.platform,
        game_name:args.gameName,
        tag_line:args.tagLine,
        captured_day:capturedDay,
        captured_at:capturedAt,
        snapshot:args.snapshot
      },{onConflict:'user_id,player_key,captured_day'});
    if(error){
      console.info('Riot Life cloud snapshot not saved:',error.code||error.message);
      return false;
    }
    return true;
  }catch(error){
    console.info('Riot Life cloud snapshot fallback:',error);
    return false;
  }
}
