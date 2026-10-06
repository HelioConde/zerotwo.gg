import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods":"POST, OPTIONS"
};

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{
  status,
  headers:{...CORS,"Content-Type":"application/json","Cache-Control":"public, max-age=60"}
});

const clean=(v:unknown,max:number)=>String(v??"").trim().slice(0,max);

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:CORS});
  if(req.method!=="POST")return json({error:"method"},405);

  let body:any={};
  try{body=await req.json()}catch{return json({error:"json"},400)}

  const gameName=clean(body.gameName,32);
  const tagLine=clean(body.tagLine,16).replace(/^#/,"");
  const platform=clean(body.platform,8).toLowerCase();
  const limit=Math.min(24,Math.max(1,Number(body.limit||24)));

  if(!gameName||!tagLine||!platform)return json({error:"riot_id"},400);

  const url=Deno.env.get("SUPABASE_URL");
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!service)return json({error:"unavailable"},503);

  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const profileKey=platform+":"+gameName.toLowerCase()+"#"+tagLine.toLowerCase();

  const {data,error}=await db
    .from("lol_champion_journey_snapshots")
    .select("captured_at,sample_matches,signature,champions,source_version")
    .eq("profile_key",profileKey)
    .order("captured_at",{ascending:false})
    .limit(limit);

  if(error)return json({error:"history_unavailable"},503);

  return json({
    profileKey,
    snapshots:(data||[]).reverse().map((x:any)=>({
      capturedAt:new Date(x.captured_at).getTime(),
      sampleMatches:Number(x.sample_matches||0),
      signature:x.signature||null,
      champions:Array.isArray(x.champions)?x.champions:[],
      sourceVersion:x.source_version||null
    }))
  });
});
