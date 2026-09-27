export function Icon({name}:{name:string}){
  const supported=new Set(['search','user','dna','sync','game','arrow','login','riot','spark','check','status','target']);
  const icon=supported.has(name)?name:'game';
  return <img className={`ztIcon ztIcon--${icon}`} src={`/zerotwo.gg/assets/zerotwo/icons/${icon}.svg`} alt="" aria-hidden="true"/>;
}

export function GameBadge({game='lol',label}:{game?:string,label?:string}){
  const key=game.toLowerCase().includes('valorant')?'valorant':
    game.toLowerCase().includes('counter')||game.toLowerCase().includes('cs2')?'cs2':
    game.toLowerCase().includes('fortnite')?'fortnite':
    game.toLowerCase().includes('overwatch')?'overwatch':
    game.toLowerCase().includes('apex')?'apex':
    game.toLowerCase().includes('roblox')?'roblox':
    game.toLowerCase().includes('steam')?'steam':'lol';
  return <span className="gameBadge"><img src={`/zerotwo.gg/assets/zerotwo/icons/games/${key}.svg`} alt=""/>{label&&<b>{label}</b>}</span>;
}

export function RoleBadge({role}:{role?:string|null}){
  const raw=String(role||'').toLowerCase();
  const key=raw==='bottom'||raw==='adc'?'adc':raw==='utility'||raw==='support'?'support':['top','jungle','mid','flex'].includes(raw)?raw:'flex';
  return <span className="roleBadge"><img src={`/zerotwo.gg/assets/zerotwo/icons/games/lol/roles/${key}.svg`} alt=""/><b>{role||'EM ANÁLISE'}</b></span>;
}
