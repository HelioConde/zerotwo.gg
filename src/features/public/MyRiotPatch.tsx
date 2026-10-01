import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/ZeroTwoUI';

type Props={data:any;champions:any;ddv:string};

type Change={kind:'champion'|'item';name:string;image?:string;detail:string;uses:number};

const statLabels:Record<string,string>={
  hp:'Vida',hpperlevel:'Vida/nível',mp:'Recurso',mpperlevel:'Recurso/nível',movespeed:'Movimento',
  armor:'Armadura',armorperlevel:'Armadura/nível',spellblock:'Resistência mágica',spellblockperlevel:'RM/nível',
  attackrange:'Alcance',hpregen:'Regen. de vida',hpregenperlevel:'Regen. vida/nível',
  attackdamage:'Dano de ataque',attackdamageperlevel:'AD/nível',attackspeedperlevel:'Vel. ataque/nível',attackspeed:'Vel. ataque'
};
const itemStatLabels:Record<string,string>={
  FlatHPPoolMod:'Vida',FlatPhysicalDamageMod:'Dano de ataque',FlatMagicDamageMod:'Poder de habilidade',
  FlatArmorMod:'Armadura',FlatSpellBlockMod:'Resistência mágica',PercentAttackSpeedMod:'Velocidade de ataque',
  PercentMovementSpeedMod:'Movimento',FlatCritChanceMod:'Crítico',PercentLifeStealMod:'Roubo de vida'
};
const same=(a:any,b:any)=>JSON.stringify(a??null)===JSON.stringify(b??null);
const compact=(v:any)=>Array.isArray(v)?v.join('/'):(typeof v==='number'?String(Math.round(v*100)/100):String(v));
const patchFamily=(v:string)=>v.split('.').slice(0,2).join('.');

export function MyRiotPatch({data,champions,ddv}:Props){
  const [state,setState]=useState<{loading:boolean;previous?:string;changes:Change[];error?:string}>({loading:true,changes:[]});
  const championUses=useMemo(()=>{
    const map=new Map<string,number>();
    (data?.matches||[]).forEach((m:any)=>{if(m?.champion)map.set(m.champion,(map.get(m.champion)||0)+1)});
    return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,4);
  },[data]);
  const itemUses=useMemo(()=>{
    const map=new Map<number,number>();
    (data?.matches||[]).forEach((m:any)=>(m?.items||[]).forEach((id:number)=>{if(id>0)map.set(id,(map.get(id)||0)+1)}));
    return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12);
  },[data]);

  useEffect(()=>{
    let alive=true;
    async function load(){
      try{
        setState({loading:true,changes:[]});
        const versions:string[]=await fetch('https://ddragon.leagueoflegends.com/api/versions.json').then(r=>r.json());
        const current=versions.includes(ddv)?ddv:(versions[0]||ddv);
        const currentFamily=patchFamily(current);
        const previous=versions.find(v=>patchFamily(v)!==currentFamily);
        if(!previous)throw new Error('Versão anterior não encontrada');

        const championPairs=await Promise.all(championUses.map(async([name,uses])=>{
          const id=champions?.[name]?.id;
          if(!id)return [] as Change[];
          const [oldJson,newJson]=await Promise.all([
            fetch('https://ddragon.leagueoflegends.com/cdn/'+previous+'/data/pt_BR/champion/'+id+'.json').then(r=>r.ok?r.json():null),
            fetch('https://ddragon.leagueoflegends.com/cdn/'+current+'/data/pt_BR/champion/'+id+'.json').then(r=>r.ok?r.json():null)
          ]);
          const oldC=oldJson?.data?.[id],newC=newJson?.data?.[id];
          if(!oldC||!newC)return [] as Change[];
          const rows:Change[]=[];
          Object.keys(statLabels).forEach(key=>{
            const a=oldC.stats?.[key],b=newC.stats?.[key];
            if(a!=null&&b!=null&&!same(a,b))rows.push({kind:'champion',name:newC.name||name,image:newC.image?.full?('https://ddragon.leagueoflegends.com/cdn/'+current+'/img/champion/'+newC.image.full):undefined,detail:statLabels[key]+': '+compact(a)+' → '+compact(b),uses});
          });
          (newC.spells||[]).forEach((spell:any,i:number)=>{
            const oldSpell=oldC.spells?.[i];if(!oldSpell)return;
            if(!same(oldSpell.cooldownBurn,spell.cooldownBurn))rows.push({kind:'champion',name:newC.name||name,image:newC.image?.full?('https://ddragon.leagueoflegends.com/cdn/'+current+'/img/champion/'+newC.image.full):undefined,detail:(spell.name||'Habilidade')+' · recarga: '+compact(oldSpell.cooldownBurn)+' → '+compact(spell.cooldownBurn),uses});
            else if(!same(oldSpell.costBurn,spell.costBurn))rows.push({kind:'champion',name:newC.name||name,image:newC.image?.full?('https://ddragon.leagueoflegends.com/cdn/'+current+'/img/champion/'+newC.image.full):undefined,detail:(spell.name||'Habilidade')+' · custo: '+compact(oldSpell.costBurn)+' → '+compact(spell.costBurn),uses});
            else if(!same(oldSpell.rangeBurn,spell.rangeBurn))rows.push({kind:'champion',name:newC.name||name,image:newC.image?.full?('https://ddragon.leagueoflegends.com/cdn/'+current+'/img/champion/'+newC.image.full):undefined,detail:(spell.name||'Habilidade')+' · alcance: '+compact(oldSpell.rangeBurn)+' → '+compact(spell.rangeBurn),uses});
            else if(oldSpell.description!==spell.description)rows.push({kind:'champion',name:newC.name||name,image:newC.image?.full?('https://ddragon.leagueoflegends.com/cdn/'+current+'/img/champion/'+newC.image.full):undefined,detail:(spell.name||'Habilidade')+' teve dados/texto atualizados no Data Dragon.',uses});
          });
          if(oldC.passive?.description!==newC.passive?.description)rows.push({kind:'champion',name:newC.name||name,image:newC.image?.full?('https://ddragon.leagueoflegends.com/cdn/'+current+'/img/champion/'+newC.image.full):undefined,detail:'Passiva teve dados/texto atualizados no Data Dragon.',uses});
          return rows.slice(0,3);
        }));

        const [oldItems,newItems]=await Promise.all([
          fetch('https://ddragon.leagueoflegends.com/cdn/'+previous+'/data/pt_BR/item.json').then(r=>r.json()),
          fetch('https://ddragon.leagueoflegends.com/cdn/'+current+'/data/pt_BR/item.json').then(r=>r.json())
        ]);
        const itemRows:Change[]=[];
        itemUses.forEach(([id,uses])=>{
          const oldI=oldItems?.data?.[String(id)],newI=newItems?.data?.[String(id)];
          if(!oldI||!newI)return;
          if(oldI.gold?.total!==newI.gold?.total)itemRows.push({kind:'item',name:newI.name||String(id),image:newI.image?.full?('https://ddragon.leagueoflegends.com/cdn/'+current+'/img/item/'+newI.image.full):undefined,detail:'Preço: '+oldI.gold?.total+' → '+newI.gold?.total,uses});
          const keys=new Set([...Object.keys(oldI.stats||{}),...Object.keys(newI.stats||{})]);
          for(const key of keys){
            const a=oldI.stats?.[key]??0,b=newI.stats?.[key]??0;
            if(!same(a,b)){itemRows.push({kind:'item',name:newI.name||String(id),image:newI.image?.full?('https://ddragon.leagueoflegends.com/cdn/'+current+'/img/item/'+newI.image.full):undefined,detail:(itemStatLabels[key]||key)+': '+compact(a)+' → '+compact(b),uses});break}
          }
          if(oldI.description!==newI.description&&!itemRows.some(x=>x.kind==='item'&&x.name===newI.name))itemRows.push({kind:'item',name:newI.name||String(id),image:newI.image?.full?('https://ddragon.leagueoflegends.com/cdn/'+current+'/img/item/'+newI.image.full):undefined,detail:'Dados/descrição atualizados no Data Dragon.',uses});
        });

        const changes=[...championPairs.flat(),...itemRows].sort((a,b)=>b.uses-a.uses).slice(0,8);
        if(alive)setState({loading:false,previous,changes});
      }catch(e:any){
        if(alive)setState({loading:false,changes:[],error:e?.message||'Falha ao comparar patches'});
      }
    }
    load();
    return()=>{alive=false};
  },[data,champions,ddv,championUses,itemUses]);

  return <section className="myRiotPatch" id="my-riot-patch">
    <header><div><small>MY RIOT PATCH</small><h3>O PATCH, MAS SÓ A PARTE QUE <span>ENCOSTA EM VOCÊ.</span></h3><p>Comparamos o Data Dragon atual com o patch anterior e cruzamos as diferenças com campeões e itens vistos nas suas partidas recentes.</p></div><div className="patchVersion"><small>COMPARAÇÃO</small><b>{state.previous||'—'} → {ddv}</b><em>Data Dragon oficial</em></div></header>
    {state.loading?<div className="patchLoading"><Icon name="sync"/><b>COMPARANDO SEU HISTÓRICO COM O PATCH...</b></div>:
     state.error?<div className="patchEmpty"><b>NÃO FOI POSSÍVEL COMPARAR AGORA.</b><p>{state.error}</p></div>:
     state.changes.length?<div className="patchChanges">{state.changes.map((x,i)=><article key={x.kind+x.name+x.detail+i}>{x.image?<img src={x.image} alt=""/>:<Icon name="game"/>}<div><small>{x.kind==='champion'?'CAMPEÃO':'ITEM'} · APARECEU {x.uses}x</small><b>{x.name}</b><p>{x.detail}</p></div></article>)}</div>:
     <div className="patchEmpty"><b>NADA RELEVANTE DETECTADO NA SUA AMOSTRA.</b><p>Entre os campeões e itens recentemente usados que conseguimos cruzar, o Data Dragon não mostrou diferenças estruturadas entre esses dois patches.</p></div>}
    <footer><Icon name="check"/><span><b>SEM “BUFF/NERF” INVENTADO.</b> Quando o Data Dragon só registra mudança de texto/dados sem valor numérico claro, o ZeroTwo diz exatamente isso.</span></footer>
  </section>;
}
