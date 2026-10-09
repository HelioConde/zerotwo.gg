import { useState } from 'react';
import { Icon } from '../../components/ZeroTwoUI';
import { VISUAL_ASSETS } from '../../lib/visualAssets';

type Props={data:any;champions?:Record<string,{id?:string;name?:string}>};
const STORY_BACKGROUND=VISUAL_ASSETS.sharing.matchStory;

function saveBlob(blob:Blob,fileName:string){
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;
  link.download=fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),10000);
}

type FeaturedChampion={name:string;games:number;splashUrl:string|null};

/** A champion is featured only when observed in real matches; the Riot asset is decorative. */
function getFeaturedChampion(data:any,champions:Props['champions']):FeaturedChampion|null{
  const matches=Array.isArray(data?.matches)?data.matches:[];
  const counts=new Map<string,number>();
  for(const match of matches){
    const name=String(match?.champion||'').trim();
    if(name)counts.set(name,(counts.get(name)||0)+1);
  }
  if(!counts.size)return null;
  // Use the actual observed count. Ties prefer the more recently played champion
  // because match lists are returned newest first by the Riot profile endpoint.
  const [name,games]=[...counts].sort((a,b)=>b[1]-a[1])[0];
  const aliases:Record<string,string>={
    'Wukong':'MonkeyKing','Nunu & Willump':'Nunu','Renata Glasc':'Renata',
    'LeBlanc':'Leblanc','Kha\'Zix':'Khazix','Vel\'Koz':'Velkoz',
    'Kai\'Sa':'Kaisa','Cho\'Gath':'Chogath','Kog\'Maw':'KogMaw'
  };
  const fallbackId=aliases[name]||name.replace(/[^A-Za-z0-9]/g,'');
  const officialId=champions?.[name]?.id||champions?.[fallbackId]?.id;
  const id=String(officialId||fallbackId);
  // Never interpolate untrusted text in a URL without strict validation.
  const splashUrl=/^[A-Za-z][A-Za-z0-9]{0,39}$/.test(id)
    ?'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/'+id+'_0.jpg'
    :null;
  return {name,games,splashUrl};
}

function loadStoryImage(src:string,crossOrigin=false):Promise<HTMLImageElement>{
  return new Promise((resolve,reject)=>{
    const image=new Image();
    // Canvas exports require CORS-allowed pixels for externally hosted splash art.
    if(crossOrigin)image.crossOrigin='anonymous';
    const timeout=window.setTimeout(()=>reject(new Error('Imagem indisponível.')),7000);
    image.onload=()=>{window.clearTimeout(timeout);resolve(image)};
    image.onerror=()=>{window.clearTimeout(timeout);reject(new Error('Imagem indisponível.'))};
    image.src=src;
  });
}

function drawCover(ctx:CanvasRenderingContext2D,image:HTMLImageElement,x:number,y:number,w:number,h:number){
  const scale=Math.max(w/image.naturalWidth,h/image.naturalHeight);
  const iw=image.naturalWidth*scale,ih=image.naturalHeight*scale;
  ctx.drawImage(image,x+(w-iw)/2,y+(h-ih)/2,iw,ih);
}

async function renderStory(data:any,featured:FeaturedChampion|null):Promise<Blob>{
  const image=await loadStoryImage(STORY_BACKGROUND);
  const canvas=document.createElement('canvas');
  canvas.width=1080;
  canvas.height=1920;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('Este navegador não conseguiu criar a imagem.');

  const scale=Math.max(canvas.width/image.width,canvas.height/image.height);
  const drawWidth=image.width*scale;
  const drawHeight=image.height*scale;
  ctx.drawImage(image,(canvas.width-drawWidth)/2,(canvas.height-drawHeight)/2,drawWidth,drawHeight);
  const shade=ctx.createLinearGradient(0,0,0,canvas.height);
  shade.addColorStop(0,'rgba(3,7,19,.28)');
  shade.addColorStop(.22,'rgba(3,7,19,.50)');
  shade.addColorStop(.50,'rgba(3,7,19,.83)');
  shade.addColorStop(.79,'rgba(3,7,19,.57)');
  shade.addColorStop(1,'rgba(3,7,19,.52)');
  ctx.fillStyle=shade;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  if(featured?.splashUrl){
    // If the remote CDN fails or blocks cross-origin canvas usage, export a clean
    // story with the existing background rather than failing the download.
    try{
      const splash=await loadStoryImage(featured.splashUrl,true);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0,1090,1080,620);
      ctx.clip();
      drawCover(ctx,splash,0,1090,1080,620);
      ctx.restore();
      const artShade=ctx.createLinearGradient(0,1070,0,1730);
      artShade.addColorStop(0,'rgba(3,7,19,.90)');
      artShade.addColorStop(.25,'rgba(3,7,19,.39)');
      artShade.addColorStop(.66,'rgba(3,7,19,.46)');
      artShade.addColorStop(1,'rgba(3,7,19,.95)');
      ctx.fillStyle=artShade;
      ctx.fillRect(0,1070,1080,660);
    }catch{
      // Original artwork remains visible as a graceful fallback.
    }
  }

  const player=String(data?.player?.gameName||'JOGADOR')+'#'+String(data?.player?.tagLine||'');
  const matches=Array.isArray(data?.matches)?data.matches:[];
  const context=String(data?.summary?.mainContext||data?.modeSummaries?.[0]?.name||'LEAGUE OF LEGENDS');
  const contextGames=matches.filter((match:any)=>String(match?.context||'')===context).length;
  const champion=featured?.name||'—';
  const championGames=featured?.games||0;

  ctx.textBaseline='middle';
  ctx.textAlign='center';
  ctx.fillStyle='#72e4ff';
  ctx.font='900 32px Arial, sans-serif';
  ctx.fillText('ZEROTWO.GG  /  RIOT LIFE',540,195,900);
  ctx.fillStyle='#f8fbff';
  ctx.font='900 64px Arial, sans-serif';
  ctx.fillText('MINHA HISTÓRIA RIOT',540,385,960);
  ctx.fillStyle='#b8c9e4';
  ctx.font='700 42px Arial, sans-serif';
  ctx.fillText(player,540,473,940);

  ctx.fillStyle='rgba(4,12,27,.78)';
  ctx.fillRect(92,690,896,470);
  ctx.strokeStyle='rgba(127,218,255,.42)';
  ctx.lineWidth=3;
  ctx.strokeRect(92,690,896,470);
  ctx.fillStyle='#82dfff';
  ctx.font='900 32px Arial, sans-serif';
  ctx.fillText('PARTIDAS OBSERVADAS',540,782);
  ctx.fillStyle='#ffffff';
  ctx.font='900 168px Arial, sans-serif';
  ctx.fillText(String(matches.length),540,939);
  ctx.fillStyle='#9baecb';
  ctx.font='600 31px Arial, sans-serif';
  ctx.fillText('Amostra recente · Dados Riot',540,1063,810);

  ctx.save();
  ctx.shadowColor='rgba(0,0,0,.95)';
  ctx.shadowBlur=22;
  ctx.fillStyle='#85e1ff';
  ctx.font='900 29px Arial, sans-serif';
  ctx.fillText('CONTEXTO MAIS PRESENTE',540,1254);
  ctx.fillStyle='#f6f8ff';
  ctx.font='900 62px Arial, sans-serif';
  ctx.fillText(context,540,1334,910);
  ctx.fillStyle='#a9b9d1';
  ctx.font='600 29px Arial, sans-serif';
  ctx.fillText(contextGames+' de '+matches.length+' partidas',540,1399,860);

  if(championGames>0){
    ctx.fillStyle='#c899ff';
    ctx.font='900 27px Arial, sans-serif';
    ctx.fillText('CAMPEÃO MAIS FREQUENTE',540,1510);
    ctx.fillStyle='#ffffff';
    ctx.font='900 48px Arial, sans-serif';
    ctx.fillText(champion+'  ·  '+championGames+'x',540,1578,880);
  }

  ctx.restore();
  ctx.fillStyle='#cad6eb';
  ctx.font='700 29px Arial, sans-serif';
  ctx.fillText('HISTÓRICO OBSERVADO, NÃO RANK DE HABILIDADE',540,1770,930);
  return new Promise<Blob>((resolve,reject)=>{
    canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Falha ao exportar imagem.')),'image/png');
  });
}

export function RiotShareCard({data,champions}:Props){
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState('');
  const [brokenArtwork,setBrokenArtwork]=useState<string|null>(null);
  if(!Array.isArray(data?.matches)||data.matches.length===0)return null;

  const player=String(data?.player?.gameName||'JOGADOR')+'#'+String(data?.player?.tagLine||'');
  const context=String(data?.summary?.mainContext||data?.modeSummaries?.[0]?.name||'LEAGUE OF LEGENDS');
  const contextGames=data.matches.filter((match:any)=>String(match?.context||'')===context).length;
  const featured=getFeaturedChampion(data,champions);
  const champion=featured?.name||'';
  const championGames=featured?.games||0;
  const championArt=featured?.splashUrl&&brokenArtwork!==featured.splashUrl?featured.splashUrl:null;

  async function exportStory(share:boolean){
    if(busy)return;
    setBusy(true);
    setStatus('');
    try{
      const blob=await renderStory(data,featured);
      const fileName='zerotwo-riot-life-'+String(data?.player?.gameName||'player').replace(/[^a-z0-9_-]/gi,'').slice(0,32)+'.png';
      if(share&&typeof navigator.share==='function'){
        const file=new File([blob],fileName,{type:'image/png'});
        if(typeof navigator.canShare==='function'&&navigator.canShare({files:[file]})){
          await navigator.share({files:[file],title:'Minha Riot Life no ZeroTwo',text:player+' · '+data.matches.length+' partidas observadas',url:location.href});
          setStatus('Imagem compartilhada.');
          return;
        }
      }
      saveBlob(blob,fileName);
      setStatus(share?'Seu navegador baixou a imagem para compartilhar.':'Download da imagem iniciado.');
    }catch(error:any){
      if(error?.name!=='AbortError')setStatus(error?.message||'Não foi possível gerar a imagem. Tente novamente.');
    }finally{
      setBusy(false);
    }
  }

  return <section className="riotSharePanel" aria-labelledby="riot-share-title">
    <div className="riotShareCopy">
      <small>ZEROTWO // MATCH STORY</small>
      <h3 id="riot-share-title">SUA HISTÓRIA.<br/><span>PRONTA PARA COMPARTILHAR.</span></h3>
      <p>Transforme os dados da sua amostra em um story vertical. O cartão usa somente as partidas observadas, sem criar notas ou resultados fictícios.</p>
      <div className="riotShareFacts">
        <span><small>JOGADOR</small><b>{player}</b></span>
        <span><small>PARTIDAS</small><b>{data.matches.length}</b></span>
        <span><small>CONTEXTO</small><b>{context}</b></span>
      </div>
      <div className="riotShareActions">
        <button type="button" onClick={()=>exportStory(false)} disabled={busy} aria-busy={busy}><Icon name="arrow"/>{busy?'PREPARANDO IMAGEM...':'BAIXAR STORY 9:16'}</button>
        <button type="button" className="riotShareSecondary" onClick={()=>exportStory(true)} disabled={busy}><Icon name="spark"/> COMPARTILHAR IMAGEM</button>
      </div>
      <p className="riotShareStatus" role="status" aria-live="polite">{status||'Formato PNG · 1080 × 1920 · ideal para stories'}</p>
    </div>
    <div className="riotSharePreview" aria-label={'Prévia do story de '+player}>
      <img className="riotSharePreviewBackground" src={STORY_BACKGROUND} loading="lazy" decoding="async" alt="" aria-hidden="true"/>
      {championArt&&<img className="riotSharePreviewChampionArt" key={championArt} src={championArt} crossOrigin="anonymous" loading="lazy" decoding="async" alt="" aria-hidden="true" onError={()=>setBrokenArtwork(championArt)}/>}
      {championArt&&<div className="riotSharePreviewChampionShade" aria-hidden="true"/>}
      <div className="riotSharePreviewContent">
        <small>ZEROTWO.GG // RIOT LIFE</small>
        <strong>MINHA HISTÓRIA RIOT</strong>
        <em>{player}</em>
        <div className="riotSharePreviewStat"><small>PARTIDAS OBSERVADAS</small><b>{data.matches.length}</b><span>Amostra recente · Dados Riot</span></div>
        <small>CONTEXTO MAIS PRESENTE</small>
        <b className="riotSharePreviewContext">{context}</b>
        <span>{contextGames} de {data.matches.length} partidas</span>
        {championGames>0&&<span className="riotSharePreviewChampion">CAMPEÃO MAIS FREQUENTE <b>{champion} · {championGames}x</b></span>}
        <span className="riotSharePreviewFoot">HISTÓRICO OBSERVADO · NÃO RANK DE HABILIDADE</span>
      </div>
    </div>
  </section>;
}
