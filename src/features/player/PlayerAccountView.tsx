import { Icon } from '../../components/ZeroTwoUI';

export function PlayerAccountView({gamerName,riotId,server,riot,onSetup,onLogout}:{gamerName:string;riotId:string;server:string;riot:any;onSetup:()=>void;onLogout:()=>void}){
  return <section className="loggedSimpleView accountLifeView">
    <header><small>CONTA // CONTROLE</small><h2>SUA RIOT LIFE, <span>SEUS CONTROLES.</span></h2><p>Gerencie a identidade usada no ZeroTwo e as conexões da sua conta.</p></header>
    <div className="accountLifeGrid">
      <article><small>NOME NO ZEROTWO</small><b>{gamerName}</b><p>Nome exibido dentro da área autenticada.</p></article>
      <article><small>RIOT ID PRINCIPAL</small><b>{riot?riotId:'Não conectado'}</b><p>{riot?server:'Conecte League para criar sua história.'}</p><button onClick={onSetup}>{riot?'ATUALIZAR RIOT ID':'CONECTAR RIOT ID'}</button></article>
      <article><small>PRIVACIDADE</small><b>MEMÓRIA DA RIOT LIFE</b><p>Snapshots autenticados usam seu usuário para manter a Time Machine entre dispositivos quando a tabela cloud estiver disponível.</p></article>
      <article className="danger"><small>SESSÃO</small><b>SAIR DA CONTA</b><p>Encerra sua sessão atual neste dispositivo.</p><button onClick={onLogout}><Icon name="login"/> SAIR</button></article>
    </div>
  </section>;
}
