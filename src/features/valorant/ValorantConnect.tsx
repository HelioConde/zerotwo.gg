import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { GameBadge } from '../../components/ZeroTwoUI';

const RSO_ENABLED=import.meta.env.VITE_VALORANT_RSO_ENABLED==='true';
const SHARDS=[
  ['br','BR'],
  ['latam','LATAM'],
  ['na','NA'],
  ['eu','EU'],
  ['kr','KR'],
  ['ap','AP']
] as const;

export function ValorantConnect({onLinkedChange}:{onLinkedChange?:(linked:boolean)=>void}){
  const [profile,setProfile]=useState<any>(null);
  const [loading,setLoading]=useState(false);
  const [status,setStatus]=useState('');
  const [shard,setShard]=useState('br');

  async function load(){
    if(!RSO_ENABLED){
      onLinkedChange?.(false);
      return;
    }
    setLoading(true);
    const {data,error}=await supabase.functions.invoke('valorant-profile',{body:{}});
    setLoading(false);
    if(error){
      setStatus('Integração VALORANT indisponível no momento.');
      onLinkedChange?.(false);
      return;
    }
    setProfile(data);
    const linked=Boolean(data?.linked);
    onLinkedChange?.(linked);
    if(linked&&data?.account?.shard)setShard(data.account.shard);
  }

  useEffect(()=>{
    load();
    const params=new URLSearchParams(location.search);
    if(params.get('valorant')){
      params.delete('valorant');
      params.delete('reason');
      const q=params.toString();
      history.replaceState({},document.title,location.pathname+(q?'?'+q:'')+location.hash);
    }
  },[]);

  async function connect(){
    setStatus('');
    setLoading(true);
    const {data,error}=await supabase.functions.invoke('valorant-rso-start',{body:{shard}});
    setLoading(false);
    if(error||!data?.authorizationUrl){
      setStatus('RSO da Riot ainda não está disponível para este projeto.');
      return;
    }
    location.assign(data.authorizationUrl);
  }

  async function unlink(){
    if(!confirm('Desconectar VALORANT do seu Player 01?'))return;
    setLoading(true);
    const {error}=await supabase.functions.invoke('valorant-unlink',{body:{}});
    setLoading(false);
    if(error){
      setStatus('Não foi possível desconectar agora.');
      return;
    }
    setProfile({linked:false});
    onLinkedChange?.(false);
    setStatus('VALORANT desconectado.');
  }

  if(!RSO_ENABLED){
    return <div className="connectedGame upcoming valorantIntegration">
      <GameBadge game="valorant"/>
      <div><small>VALORANT</small><b>RSO PREPARADO</b><em>AGUARDANDO ACESSO DE PRODUÇÃO DA RIOT</em></div>
      <span>EM PREPARAÇÃO</span>
    </div>;
  }

  if(profile?.linked){
    return <div className="connectedGame active valorantIntegration linked">
      <GameBadge game="valorant"/>
      <div>
        <small>VALORANT // OPT-IN RSO</small>
        <b>{profile.account?.gameName}<i>#{profile.account?.tagLine}</i></b>
        <em>{String(profile.account?.shard||shard).toUpperCase()} · {profile.summary?.matches??0} PARTIDAS RECENTES</em>
        {profile.summary?.topAgents?.[0]&&<em>AGENTE RECENTE · {profile.summary.topAgents[0].name}</em>}
      </div>
      <div className="valorantInlineActions"><button onClick={load} disabled={loading}>{loading?'...':'ATUALIZAR'}</button><button onClick={unlink} disabled={loading}>DESCONECTAR</button></div>
    </div>;
  }

  return <div className="connectedGame upcoming valorantIntegration ready">
    <GameBadge game="valorant"/>
    <div><small>VALORANT // RIOT SIGN ON</small><b>CONECTAR COM OPT-IN</b><em>SUAS ESTATÍSTICAS SÓ APARECEM DEPOIS DA AUTORIZAÇÃO RIOT</em>{status&&<em className="valorantStatus">{status}</em>}</div>
    <div className="valorantInlineActions"><select aria-label="Região do VALORANT" value={shard} onChange={e=>setShard(e.target.value)}>{SHARDS.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select><button onClick={connect} disabled={loading}>{loading?'ABRINDO...':'CONECTAR RIOT'}</button></div>
  </div>;
}
