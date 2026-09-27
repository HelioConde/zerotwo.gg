export function fmtMinutes(n:number){
  const h=Math.floor((n||0)/60),m=Math.round((n||0)%60);
  return h?String(h)+'h '+String(m).padStart(2,'0')+'min':m+'min';
}

export function hourLabel(h:number|null){
  if(h==null)return '—';
  return String(h).padStart(2,'0')+':00';
}
