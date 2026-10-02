import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ZtLanguage='pt-BR'|'en';

const STORAGE_KEY='zt_language';
const LanguageContext=createContext<{language:ZtLanguage;setLanguage:(language:ZtLanguage)=>void}>({
  language:'pt-BR',
  setLanguage:()=>{}
});

const EN:Record<string,string>={
  'Buscar':'Search',
  'Entrar':'Sign in',
  'Sair':'Sign out',
  'Criar minha Riot Life':'Create my Riot Life',
  'MINHA RIOT LIFE':'MY RIOT LIFE',
  'Sua história Riot, viva.':'Your Riot story, alive.',
  'SUA HISTÓRIA RIOT, VIVA.':'YOUR RIOT STORY, ALIVE.',
  'SUA HISTÓRIA RIOT.':'YOUR RIOT STORY.',
  'SUA RIOT LIFE,':'YOUR RIOT LIFE,',
  'RIOT LIFE.':'RIOT LIFE.',
  'Fechar':'Close',
  'Buscar jogador':'Search player',
  'Seu Riot ID':'Your Riot ID',
  'Riot ID para buscar jogador':'Riot ID to search player',
  'Servidor da busca':'Search server',
  'BUSCAR':'SEARCH',
  'LIMPAR':'CLEAR',
  'BUSCAS RECENTES':'RECENT SEARCHES',
  'SEM CADASTRO':'NO SIGN-UP',
  'DADOS PÚBLICOS':'PUBLIC DATA',
  'DADOS RIOT':'RIOT DATA',
  'NÃO É LOGIN RIOT':'NOT RIOT LOGIN',
  'Digite um Riot ID. O ZeroTwo procura sessões, mudanças, momentos e padrões dentro dos dados que a Riot realmente disponibiliza.':'Enter a Riot ID. ZeroTwo looks for sessions, changes, moments, and patterns within the data Riot actually provides.',
  'Nome#TAG localiza seu perfil de League.':'Name#TAG locates your League profile.',
  'Isso não comprova propriedade da conta.':'This does not prove account ownership.',
  'Até 100 partidas podem ser analisadas sem mostrar tudo de uma vez.':'Up to 100 matches can be analyzed without showing everything at once.',
  'Buscando perfil, histórico e capítulos…':'Searching profile, history, and chapters…',
  'Histórico, rank, maestria e padrões recentes...':'History, rank, mastery, and recent patterns...',
  'CARREGANDO SUA RIOT LIFE':'LOADING YOUR RIOT LIFE',
  'PREPARANDO SUA RIOT LIFE':'PREPARING YOUR RIOT LIFE',
  'LENDO A RIOT LIFE':'READING YOUR RIOT LIFE',
  'CONSTRUINDO SUA HISTÓRIA':'BUILDING YOUR HISTORY',
  'NÃO CONSEGUIMOS CONCLUIR A BUSCA.':'WE COULD NOT COMPLETE THE SEARCH.',
  'TENTAR NOVAMENTE':'TRY AGAIN',
  'PESQUISAR UM RIOT ID ↑':'SEARCH A RIOT ID ↑',
  'ABRA UM JOGADOR PARA VER A RIOT LIFE DELE →':'OPEN A PLAYER TO SEE THEIR RIOT LIFE →',
  'VER EXPERIÊNCIA COMPLETA →':'VIEW FULL EXPERIENCE →',
  'VER PARTIDAS E DADOS':'VIEW MATCHES AND DATA',
  'VOLTAR AO TOPO ↑':'BACK TO TOP ↑',
  'CONTINUE INVESTIGANDO':'KEEP EXPLORING',
  'AGORA SIM, OS DETALHES.':'NOW, THE DETAILS.',
  'AS EVIDÊNCIAS CONTINUAM DISPONÍVEIS ABAIXO.':'THE EVIDENCE REMAINS AVAILABLE BELOW.',
  'CONFIRA O QUE SUSTENTA A LEITURA.':'CHECK WHAT SUPPORTS THIS READING.',
  'Partidas e dados oficiais ficam separados das interpretações calculadas pelo ZeroTwo para você poder conferir a evidência quando quiser.':'Official matches and data stay separate from ZeroTwo interpretations so you can check the evidence whenever you want.',
  'Partidas, campeões, maestria e contexto ficam separados da narrativa para não competir com ela.':'Matches, champions, mastery, and context stay separate from the narrative so they do not compete with it.',
  'ISTO NÃO É UM DASHBOARD.':'THIS IS NOT A DASHBOARD.',
  'MENOS DASHBOARD.':'LESS DASHBOARD.',
  'MAIS DESCOBERTA.':'MORE DISCOVERY.',
  'UM NÚMERO BOM É ÚTIL.':'A GOOD NUMBER IS USEFUL.',
  'UMA HISTÓRIA É MEMORÁVEL.':'A STORY IS MEMORABLE.',
  'UMA DESCOBERTA POR VEZ':'ONE DISCOVERY AT A TIME',
  'O ZeroTwo não abre com uma parede de estatísticas. Primeiro ele escolhe o que realmente marcou a janela disponível e transforma isso em uma leitura curta.':'ZeroTwo does not open with a wall of statistics. It first picks what actually defined the available window and turns it into a short reading.',
  'SUA HISTÓRIA NÃO É':'YOUR HISTORY IS NOT',
  'SÓ UMA TABELA.':'JUST A TABLE.',
  'MINHA HISTÓRIA':'MY HISTORY',
  'HISTÓRIA':'HISTORY',
  'História':'History',
  'Histórico completo':'Full history',
  'HISTÓRICO RECENTE':'RECENT HISTORY',
  'PARTIDAS':'MATCHES',
  'PARTIDA':'MATCH',
  'JOGOS':'GAMES',
  'JOGADOR':'PLAYER',
  'JOGADORES NA AMOSTRA':'PLAYERS IN SAMPLE',
  'TEMPO EM JOGO':'TIME PLAYED',
  'PARTIDAS ANALISADAS':'MATCHES ANALYZED',
  'APROFUNDAR ATÉ 100 PARTIDAS':'EXPAND TO 100 MATCHES',
  'CARREGANDO...':'LOADING...',
  'HISTÓRIA 100 CARREGADA':'100-MATCH HISTORY LOADED',
  'HISTÓRIA FORTE':'STRONG HISTORY',
  'BOA AMOSTRA':'GOOD SAMPLE',
  'HISTÓRICO SENDO APROFUNDADO':'EXPANDING HISTORY',
  'MAIOR SEQUÊNCIA POSITIVA':'LONGEST POSITIVE STREAK',
  'ainda sem amostra suficiente':'not enough data yet',
  'QUANDO VOCÊ JOGA':'WHEN YOU PLAY',
  'SEU RITMO AINDA ESTÁ APARECENDO.':'YOUR RHYTHM IS STILL EMERGING.',
  'Carregue mais partidas para descobrir seu ritmo.':'Load more matches to discover your rhythm.',
  'QUEM VOLTA A APARECER NAS SUAS PARTIDAS':'WHO KEEPS APPEARING IN YOUR MATCHES',
  'RECORRÊNCIAS // SUA AMOSTRA':'RECURRING PLAYERS // YOUR SAMPLE',
  'MAIS RECORRENTE NA AMOSTRA':'MOST RECURRING IN SAMPLE',
  'COPIAR RIOT ID':'COPY RIOT ID',
  'Ainda não encontramos jogadores recorrentes nesta amostra.':'We have not found recurring players in this sample yet.',
  'Jogadores recorrentes nas partidas carregadas. Isso não significa necessariamente que estavam no seu time. Esta área aparece somente na sua história autenticada.':'Recurring players in loaded matches. This does not necessarily mean they were on your team. This area only appears in your authenticated history.',
  'CAMPEÕES':'CHAMPIONS',
  'CAMPEÕES MAIS PRESENTES':'MOST PRESENT CHAMPIONS',
  'CAMPEÕES DIFERENTES':'DIFFERENT CHAMPIONS',
  'DOMINA O PERÍODO.':'DOMINATES THIS PERIOD.',
  'ESTA AMOSTRA ESTÁ COMPLETA.':'THIS SAMPLE IS COMPLETE.',
  'HÁ MAIS PARTIDAS PARA CARREGAR.':'THERE ARE MORE MATCHES TO LOAD.',
  'CARREGAR PARTIDAS MAIS ANTIGAS':'LOAD OLDER MATCHES',
  'CRIANDO SUA CONTA...':'CREATING YOUR ACCOUNT...',
  'Conta criada. Confira seu e-mail para confirmar.':'Account created. Check your email to confirm.',
  'Conta conectada. Preparando sua Riot Life...':'Account connected. Preparing your Riot Life...',
  'Localizando seu Riot ID...':'Locating your Riot ID...',
  'Não foi possível consultar o jogador agora. Tente novamente.':'We could not look up this player right now. Try again.',
  'Sua sessão expirou. Entre novamente.':'Your session expired. Sign in again.',
  'Jogador encontrado, mas não foi possível preparar sua Riot Life.':'Player found, but we could not prepare your Riot Life.',
  'Jogador encontrado, mas não foi possível salvar os dados.':'Player found, but we could not save the data.',
  'Tudo pronto. Abrindo sua Riot Life...':'All set. Opening your Riot Life...',
  'CONECTE SEU':'CONNECT YOUR',
  'CRIE SUA':'CREATE YOUR',
  'League of Legends é a fonte desta versão do ZeroTwo. Informe seu Riot ID para começar com partidas, campeões, eras e mudanças observadas.':'League of Legends is the data source for this version of ZeroTwo. Enter your Riot ID to begin with matches, champions, eras, and observed changes.',
  'Pesquise jogadores de League sem conta. Crie a sua somente quando quiser manter memória e construir sua própria história.':'Search League players without an account. Create yours only when you want persistent memory and your own history.',
  'Criar conta':'Create account',
  'ENTRAR →':'SIGN IN →',
  'CRIAR MINHA RIOT LIFE →':'CREATE MY RIOT LIFE →',
  'Continuar com Google':'Continue with Google',
  'ou use e-mail':'or use email',
  'E-mail':'Email',
  'Senha':'Password',
  'Mínimo 6 caracteres':'Minimum 6 characters',
  'leva poucos segundos':'takes only a few seconds',
  'Sua conta serve para memória e histórico. A busca pública de League continua disponível sem login.':'Your account is used for memory and history. Public League search remains available without signing in.',
  'FONTE ATUAL':'CURRENT SOURCE',
  'Versão atual do ZeroTwo focada somente em League.':'Current ZeroTwo version focused on League only.',
  'NÃO CONECTADO':'NOT CONNECTED',
  'ATUALIZAR RIOT ID':'UPDATE RIOT ID',
  'CONECTAR LEAGUE':'CONNECT LEAGUE',
  'CONECTAR RIOT ID':'CONNECT RIOT ID',
  'Não conectado':'Not connected',
  'Conecte League para criar sua história.':'Connect League to create your history.',
  'SUA CONTA ESTÁ':'YOUR ACCOUNT IS',
  'CONECTE SUA':'CONNECT YOUR',
  'Informe seu Riot ID para começar a construir sua história.':'Enter your Riot ID to start building your history.',
  'ATUALIZAR LEITURA':'REFRESH READING',
  'SEM RIOT ID':'NO RIOT ID',
  'RANK OFICIAL':'OFFICIAL RANK',
  'RESULTADO':'RESULT',
  'sem rank publicado':'no published rank',
  'VOCÊ COSTUMA APARECER':'YOU USUALLY APPEAR',
  'SUA HISTÓRIA ESTÁ SENDO CONSTRUÍDA.':'YOUR HISTORY IS BEING BUILT.',
  'Abra sua história para aprofundar rotina, modos e mudanças observadas.':'Open your history to explore routine, modes, and observed changes.',
  'A leitura é criada automaticamente a partir das partidas recentes.':'The reading is created automatically from recent matches.',
  'Conecte League para começar.':'Connect League to begin.',
  'IDENTIDADE EM FORMAÇÃO':'IDENTITY IN PROGRESS',
  'Não foi possível atualizar agora.':'Could not update right now.',
  'Dados Riot atualizados agora.':'Riot data updated just now.',
  'Analisando suas partidas recentes...':'Analyzing your recent matches...',
  'Ainda não conseguimos atualizar seu Gaming DNA.':'We still could not update your Gaming DNA.',
  'Riot ID não informado':'Riot ID not provided',
  'AGORA':'NOW',
  'ASSINATURA':'SIGNATURE',
  'SESSÃO':'SESSION',
  'PONTO ALTO':'HIGHLIGHT',
  'MUDANÇA':'CHANGE',
  'PESSOAS':'PEOPLE',
  'RITMO':'RHYTHM',
  'CONSISTÊNCIA':'CONSISTENCY',
  'DANO':'DAMAGE',
  'ECONOMIA':'ECONOMY',
  'SOBREVIVÊNCIA':'SURVIVAL',
  'MAESTRIA':'MASTERY',
  'ARENA':'ARENA',
  'SEQUÊNCIAS':'STREAKS',
  'HORÁRIOS':'TIME OF DAY',
  'DIAS':'DAYS',
  'DURAÇÃO':'DURATION',
  'IMPACTO':'IMPACT',
  'TENDÊNCIA':'TREND',
  'AGORA VAI':'NEXT',
  'AGORA // O PALCO DESTA FASE':'NOW // THE STAGE OF THIS PHASE',
  'ASSINATURA // QUEM MAIS APARECEU':'SIGNATURE // WHO APPEARED MOST',
  'SESSÃO // COMO VOCÊ JOGOU DE UMA VEZ':'SESSION // HOW YOU PLAYED IN ONE SITTING',
  'PONTO ALTO // UMA PARTIDA':'HIGHLIGHT // ONE MATCH',
  'MUDANÇA // O QUE NÃO É MAIS IGUAL':'CHANGE // WHAT IS NO LONGER THE SAME',
  'PESSOAS // QUEM SE REPETE':'PEOPLE // WHO REPEATS',
  'RITMO // FREQUÊNCIA':'RHYTHM // FREQUENCY',
  'CONSISTÊNCIA // VARIAÇÃO':'CONSISTENCY // VARIATION',
  'DANO // PRESSÃO':'DAMAGE // PRESSURE',
  'ECONOMIA // RECURSOS':'ECONOMY // RESOURCES',
  'SOBREVIVÊNCIA // TROCAS':'SURVIVAL // TRADES',
  'MAESTRIA // HISTÓRIA ACUMULADA':'MASTERY // ACCUMULATED HISTORY',
  'ARENA // COLOCAÇÕES':'ARENA // PLACEMENTS',
  'SEQUÊNCIAS // EMBALO':'STREAKS // MOMENTUM',
  'HORÁRIOS // QUANDO':'TIME OF DAY // WHEN',
  'DIAS // CALENDÁRIO':'DAYS // CALENDAR',
  'DURAÇÃO // CURTA OU LONGA':'DURATION // SHORT OR LONG',
  'IMPACTO // PARTICIPAÇÃO':'IMPACT // PARTICIPATION',
  'TENDÊNCIA // ÚLTIMAS 10':'TREND // LAST 10',
  'AGORA VAI // O QUE VALE OLHAR':'NEXT // WHAT IS WORTH LOOKING AT',
  'SEU CONTEXTO':'YOUR CONTEXT',
  'SEU SINAL PRINCIPAL':'YOUR MAIN SIGNAL',
  'SEU RITMO RECENTE':'YOUR RECENT RHYTHM',
  'SEU JEITO DE JOGAR':'YOUR PLAYSTYLE',
  'SEU JEITO DE JOGAR DEPENDE DO CONTEXTO.':'YOUR PLAYSTYLE DEPENDS ON CONTEXT.',
  'SEU JOGO MUDA COM O TEMPO.':'YOUR GAME CHANGES OVER TIME.',
  'SUA HISTÓRIA MUDOU ENTRE AS VISITAS.':'YOUR HISTORY CHANGED BETWEEN VISITS.',
  'SUA MEMÓRIA JÁ COMEÇOU A CRESCER.':'YOUR MEMORY HAS STARTED TO GROW.',
  'SEU FOCO MUDOU DENTRO DESTA JANELA.':'YOUR FOCUS CHANGED WITHIN THIS WINDOW.',
  'A FASE RECENTE NÃO É IGUAL À ANTERIOR.':'THE RECENT PHASE IS DIFFERENT FROM THE PREVIOUS ONE.',
  'AINDA É CEDO PARA MEDIR UMA MUDANÇA.':'IT IS STILL TOO EARLY TO MEASURE A CHANGE.',
  'Amostra pequena: trate padrões como sinais iniciais.':'Small sample: treat patterns as early signals.',
  'Amostra em formação: a leitura fica mais confiável conforme o histórico cresce.':'Developing sample: the reading becomes more reliable as history grows.',
  'Amostra suficiente para padrões recentes com melhor contexto.':'Enough data for recent patterns with better context.',
  'Riot Life em capítulos':'Riot Life in chapters',
  'Capítulos da Riot Life':'Riot Life chapters',
  'Distribuição dos modos jogados':'Distribution of played modes',
  'VOCÊ VOLTOU DEPOIS DE UMA PAUSA LONGA.':'YOU CAME BACK AFTER A LONG BREAK.',
  'HOUVE UMA PAUSA ENTRE VOCÊ E O LEAGUE.':'THERE WAS A BREAK BETWEEN YOU AND LEAGUE.',
  'Campeões mais presentes':'Most present champions',
  'NA ÚLTIMA SESSÃO.':'IN THE LAST SESSION.',
  'AINDA NÃO HÁ UMA SESSÃO CLARA.':'THERE IS NOT A CLEAR SESSION YET.',
  'UMA PARTIDA':'ONE MATCH',
  'ANTES':'BEFORE',
  'AGORA':'NOW',
  'sem mudança':'no change',
  'COM QUE RITMO VOCÊ ESTÁ JOGANDO?':'WHAT PACE ARE YOU PLAYING AT?',
  'A frequência ajuda a separar uma fase intensa de uma janela espalhada no tempo. Não mede qualidade; mede presença.':'Frequency helps separate an intense phase from a window spread over time. It does not measure quality; it measures presence.',
  'JOGOS / DIA':'GAMES / DAY',
  'SESSÕES':'SESSIONS',
  'JOGOS / SESSÃO':'GAMES / SESSION',
  'DIAS ATIVOS':'ACTIVE DAYS',
  'Comparamos a dispersão do seu KDA e a frequência de partidas próximas da sua própria média. Isso mede regularidade, não habilidade.':'We compare KDA dispersion and how often matches stay close to your own average. This measures consistency, not skill.',
  'KDA MÉDIO':'AVERAGE KDA',
  'PERTO DA MÉDIA':'NEAR THE AVERAGE',
  'quanto menor, mais estável':'lower means more stable',
  'QUANTO DANO SUA FASE ESTÁ PRODUZINDO?':'HOW MUCH DAMAGE IS THIS PHASE PRODUCING?',
  'Além do dano bruto, agora usamos a participação no dano da equipe e a composição físico/mágico/verdadeiro quando o Match-V5 fornece esses campos.':'Beyond raw damage, we now use team damage share and physical/magic/true damage composition when Match-V5 provides those fields.',
  'DANO / MIN':'DAMAGE / MIN',
  'DANO TOTAL':'TOTAL DAMAGE',
  'DANO / PARTIDA':'DAMAGE / MATCH',
  '% DO DANO DO TIME':'% OF TEAM DAMAGE',
  'FÍSICO':'PHYSICAL',
  'MÁGICO':'MAGIC',
  'VERDADEIRO':'TRUE',
  'QUANTO RECURSO VOCÊ TRANSFORMA POR MINUTO?':'HOW MUCH RESOURCE DO YOU TURN OVER PER MINUTE?',
  'Ouro por minuto agora usa o valor oficial do Match-V5 quando disponível. Também mostramos os itens que mais se repetem na janela.':'Gold per minute now uses the official Match-V5 value when available. We also show the items that repeat most in the window.',
  'OURO':'GOLD',
  'OURO / MIN':'GOLD / MIN',
  'OURO / JOGO':'GOLD / GAME',
  'OURO GASTO / JOGO':'GOLD SPENT / GAME',
  'ITENS MAIS RECORRENTES':'MOST RECURRING ITEMS',
  'ITENS':'ITEMS',
  'QUANTO CUSTA FICAR VIVO NESSA FASE?':'WHAT DOES IT COST TO STAY ALIVE IN THIS PHASE?',
  'Mortes, mitigação, controle e tempo fora da luta contextualizam melhor o KDA do que olhar apenas abates e mortes.':'Deaths, mitigation, crowd control, and time out of the fight contextualize KDA better than looking only at kills and deaths.',
  'DANO RECEBIDO':'DAMAGE TAKEN',
  'DANO MITIGADO':'DAMAGE MITIGATED',
  'CURA':'HEALING',
  'CARREGA SUA MAIOR MAESTRIA.':'CARRIES YOUR HIGHEST MASTERY.',
  'AINDA NÃO HÁ MAESTRIA DISPONÍVEL.':'THERE IS NO MASTERY DATA AVAILABLE YET.',
  'Maestria conta a experiência acumulada ao longo da conta. A Riot Life cruza isso com as':'Mastery tracks accumulated experience across the account. Riot Life crosses that with the',
  'partidas recentes para mostrar se seu legado ainda aparece na fase atual.':'recent matches to show whether your legacy still appears in your current phase.',
  'Quando a Riot disponibilizar dados de Champion Mastery para esta conta, eles entram aqui sem misturar experiência histórica com desempenho recente.':'When Riot provides Champion Mastery data for this account, it appears here without mixing historical experience with recent performance.',
  'MAIOR MAESTRIA':'HIGHEST MASTERY',
  'FASE RECENTE':'RECENT PHASE',
  'RELAÇÃO':'RELATION',
  'TOP 5 NA AMOSTRA':'TOP 5 IN SAMPLE',
  'história e fase atual':'history and current phase',
  'não apareceu':'did not appear',
  'sem amostra recente':'no recent sample',
  'POOL RECENTE':'RECENT POOL',
  'CONCENTRAÇÃO':'CONCENTRATION',
  'REPETIÇÃO':'REPETITION',
  'ONDE SUAS ARENAS ESTÃO TERMINANDO?':'WHERE ARE YOUR ARENA GAMES ENDING?',
  'AINDA NÃO HÁ ARENAS SUFICIENTES NESTA JANELA.':'THERE ARE NOT ENOUGH ARENA GAMES IN THIS WINDOW YET.',
  'Distribuição das colocações dentro da amostra Arena. Top 4 é usado como resultado positivo, mas 1º lugar continua separado.':'Placement distribution within the Arena sample. Top 4 is treated as a positive result, while 1st place stays separate.',
  'Este capítulo fica reservado para colocação média, Top 4 e primeiros lugares quando partidas de Arena entrarem na amostra.':'This chapter is reserved for average placement, Top 4, and first places when Arena matches enter the sample.',
  'COLOCAÇÃO':'PLACEMENT',
  'COLOCAÇÃO MÉDIA':'AVERAGE PLACEMENT',
  '1º LUGAR':'1ST PLACE',
  'FORA DO TOP 4':'OUTSIDE TOP 4',
  'SEM AMOSTRA':'NO SAMPLE',
  'AUMENTOS':'AUGMENTS',
  'AUMENTOS MAIS RECORRENTES':'MOST RECURRING AUGMENTS',
  'QUAL FOI SUA MAIOR SEQUÊNCIA?':'WHAT WAS YOUR LONGEST STREAK?',
  'Contamos resultados positivos consecutivos dentro do contexto principal da amostra. Em Arena, resultado positivo significa Top 4.':'We count consecutive positive results within the sample’s main context. In Arena, a positive result means Top 4.',
  'MELHOR SEQUÊNCIA':'BEST STREAK',
  'MAIOR SEQUÊNCIA FORA':'LONGEST OUT-OF-RESULT STREAK',
  'SEQUÊNCIA ATUAL':'CURRENT STREAK',
  'fora do resultado':'outside the result',
  'EM QUE PARTE DO DIA VOCÊ MAIS APARECE?':'WHAT TIME OF DAY DO YOU APPEAR MOST?',
  'Horários são calculados no fuso local do dispositivo. Só tratamos uma faixa como comparável quando há partidas suficientes nela.':'Times are calculated in the device’s local time zone. We only treat a time range as comparable when it has enough matches.',
  'MAIS JOGADO':'MOST PLAYED',
  'KDA NESSE HORÁRIO':'KDA AT THIS TIME',
  'QUAL DIA DA SEMANA MAIS APARECE NESSA JANELA?':'WHICH DAY OF THE WEEK APPEARS MOST IN THIS WINDOW?',
  'Este capítulo observa distribuição e resultado por dia da semana. Ele descreve a amostra; não afirma que o dia causa um desempenho melhor.':'This chapter observes distribution and results by day of week. It describes the sample; it does not claim the day causes better performance.',
  'MAIS ATIVO':'MOST ACTIVE',
  'O RESULTADO MUDA QUANDO A PARTIDA SE ALONGA?':'DOES THE RESULT CHANGE WHEN THE MATCH RUNS LONG?',
  'Dividimos a própria amostra pela duração mediana. Isso evita escolher um corte arbitrário igual para todos os modos.':'We split the sample by its own median duration. This avoids choosing the same arbitrary cutoff for every mode.',
  'RESULTADO · CURTAS':'RESULT · SHORT',
  'RESULTADO · LONGAS':'RESULT · LONG',
  'COMO VOCÊ PARTICIPA ALÉM DO KDA?':'HOW DO YOU CONTRIBUTE BEYOND KDA?',
  'Agora o impacto reúne participação, solo kills, multikills, suporte em aliados, objetivos e visão. Cada métrica só descreve o que o Match-V5 registrou.':'Impact now combines participation, solo kills, multikills, ally support, objectives, and vision. Each metric only describes what Match-V5 recorded.',
  'PARTICIPAÇÃO':'PARTICIPATION',
  'SOLO KILLS':'SOLO KILLS',
  'MULTIKILLS':'MULTIKILLS',
  'OBJETIVOS':'OBJECTIVES',
  'DANO EM OBJETIVOS':'OBJECTIVE DAMAGE',
  'VISÃO':'VISION',
  'DANO EM TORRES':'TURRET DAMAGE',
  'AS ÚLTIMAS 10 ESTÃO DIFERENTES DAS 10 ANTERIORES?':'ARE THE LAST 10 DIFFERENT FROM THE PREVIOUS 10?',
  'AINDA FALTAM PARTIDAS PARA UMA TENDÊNCIA CURTA.':'THERE ARE STILL NOT ENOUGH MATCHES FOR A SHORT-TERM TREND.',
  'Uma janela curta reage mais rápido a mudanças recentes. Ela é mostrada ao lado da história de 100 partidas, não no lugar dela.':'A short window reacts faster to recent changes. It is shown alongside the 100-match history, not instead of it.',
  'Precisamos de pelo menos 15–20 partidas comparáveis no contexto principal para separar uma janela recente de uma anterior.':'We need at least 15–20 comparable matches in the main context to separate a recent window from the previous one.',
  'O RESTO SÓ ENTRA SE TROUXER ALGO NOVO.':'THE REST ONLY ENTERS IF IT BRINGS SOMETHING NEW.',
  'MY RIOT PATCH':'MY RIOT PATCH',
  'O PATCH, MAS SÓ A PARTE QUE':'THE PATCH, BUT ONLY THE PART THAT',
  'ENCOSTA EM VOCÊ.':'TOUCHES YOUR GAME.',
  'Comparamos o Data Dragon atual com o patch anterior e cruzamos as diferenças com campeões e itens vistos nas suas partidas recentes.':'We compare the current Data Dragon with the previous patch and cross the differences with champions and items seen in your recent matches.',
  'NADA RELEVANTE DETECTADO NA SUA AMOSTRA.':'NOTHING RELEVANT DETECTED IN YOUR SAMPLE.',
  'Entre os campeões e itens recentemente usados que conseguimos cruzar, o Data Dragon não mostrou diferenças estruturadas entre esses dois patches.':'Among the recently used champions and items we could cross-check, Data Dragon showed no structured differences between these two patches.',
  'SEM “BUFF/NERF” INVENTADO.':'NO INVENTED “BUFF/NERF”.',
  'Quando o Data Dragon só registra mudança de texto/dados sem valor numérico claro, o ZeroTwo diz exatamente isso.':'When Data Dragon only records a text/data change without a clear numeric value, ZeroTwo says exactly that.',
  'COMPARANDO SEU HISTÓRICO COM O PATCH...':'COMPARING YOUR HISTORY WITH THE PATCH...',
  'Versão anterior não encontrada':'Previous version not found',
  'CAMPEÃO':'CHAMPION',
  'Vida/nível':'Health/level',
  'Recurso/nível':'Resource/level',
  'Armadura/nível':'Armor/level',
  'Resistência mágica':'Magic resist',
  'RM/nível':'MR/level',
  'Regen. vida/nível':'Health regen/level',
  'Dano de ataque':'Attack damage',
  'Vel. ataque/nível':'Attack speed/level',
  'Crítico':'Crit',
  'Dados/descrição atualizados no Data Dragon.':'Data/description updated in Data Dragon.',
  'ALGUNS NOMES VOLTAM A APARECER.':'SOME NAMES KEEP APPEARING.',
  'Aqui não tentamos medir amizade ou “sinergia”. Só mostramos quem realmente se repetiu nas partidas analisadas.':'We do not try to measure friendship or “synergy” here. We only show who actually repeated across analyzed matches.',
  'PROCURANDO JOGADORES RECORRENTES...':'LOOKING FOR RECURRING PLAYERS...',
  'NENHUM PARCEIRO RECORRENTE FOI ENCONTRADO NESTA AMOSTRA.':'NO RECURRING PARTNER WAS FOUND IN THIS SAMPLE.',
  'Precisamos de mais partidas para formar uma combinação recorrente.':'We need more matches to form a recurring combination.',
  'PARCEIROS // FALHA DE LEITURA':'PARTNERS // READ FAILURE',
  'NÃO FOI POSSÍVEL ANALISAR OS PARCEIROS DESTA AMOSTRA.':'WE COULD NOT ANALYZE PARTNERS IN THIS SAMPLE.',
  'PLAYER ERAS // HISTÓRIA DA AMOSTRA':'PLAYER ERAS // SAMPLE HISTORY',
  'SUA AMOSTRA TEM CAPÍTULOS DIFERENTES.':'YOUR SAMPLE HAS DIFFERENT CHAPTERS.',
  'SEU FOCO DE CAMPEÃO MUDOU.':'YOUR CHAMPION FOCUS CHANGED.',
  'VOCÊ MUDOU O TIPO DE PARTIDA QUE DOMINAVA.':'THE MATCH TYPE THAT DOMINATED YOUR PLAY CHANGED.',
  'O MESMO PERFIL APARECEU COM OUTRO RITMO.':'THE SAME PROFILE APPEARED WITH A DIFFERENT RHYTHM.',
  'As divisões priorizam pausas reais entre partidas.':'The divisions prioritize real breaks between matches.',
  'Não encontramos uma pausa temporal forte, então dividimos a amostra em capítulos cronológicos equivalentes.':'We did not find a strong time break, so we divided the sample into equivalent chronological chapters.',
  'INÍCIO DA AMOSTRA':'START OF SAMPLE',
  'TRANSIÇÃO':'TRANSITION',
  'SEM CAMPEÃO DOMINANTE':'NO DOMINANT CHAMPION',
  'PRÓXIMO CAPÍTULO':'NEXT CHAPTER',
  'RIOT CHALLENGES ARCADE':'RIOT CHALLENGES ARCADE',
  'QUAL CAMPEÃO MAIS APARECEU NESTA AMOSTRA?':'WHICH CHAMPION APPEARED MOST IN THIS SAMPLE?',
  'QUAL CONTEXTO DOMINOU SUAS PARTIDAS?':'WHICH CONTEXT DOMINATED YOUR MATCHES?',
  'QUAL FOI O MAIOR KDA OBSERVADO EM UMA PARTIDA?':'WHAT WAS THE HIGHEST KDA OBSERVED IN ONE MATCH?',
  'QUAL FOI O MAIOR DANO OBSERVADO?':'WHAT WAS THE HIGHEST DAMAGE OBSERVED?',
  'VOCÊ SABE EXATAMENTE O QUE ANDA FAZENDO.':'YOU KNOW EXACTLY WHAT YOU HAVE BEEN DOING.',
  'SEU HISTÓRICO TE SURPREENDEU.':'YOUR HISTORY SURPRISED YOU.',
  'VOCÊ CONHECIA PARTE DA HISTÓRIA.':'YOU KNEW PART OF THE STORY.',
  'JOGAR DE NOVO ↻':'PLAY AGAIN ↻',
  'Um minijogo curto criado apenas com fatos encontrados nas suas partidas atuais.':'A short mini-game created only from facts found in your current matches.',
  'RIOT WRAPPED // AGORA':'RIOT WRAPPED // NOW',
  'MOMENTOS DA AMOSTRA':'SAMPLE MOMENTS',
  'MELHOR KDA OBSERVADO':'BEST OBSERVED KDA',
  'MAIOR DANO':'HIGHEST DAMAGE',
  'MAIS ABATES':'MOST KILLS',
  'MAIS ASSISTÊNCIAS':'MOST ASSISTS',
  'PARTIDA MAIS LONGA':'LONGEST MATCH',
  'MUDANÇA RECENTE':'RECENT CHANGE',
  'ONDE VOCÊ ESTEVE':'WHERE YOU WERE',
  'SEQUÊNCIA':'STREAK',
  'MELHOR SEQUÊNCIA DE VITÓRIAS':'LONGEST WIN STREAK',
  'MAIOR SEQUÊNCIA DE DERROTAS':'LONGEST LOSS STREAK',
  'Recordes objetivos — sem criar uma nota de habilidade.':'Objective records — without creating a skill score.',
  'Não precisa esperar dezembro: sempre que sua amostra mudar, este resumo pode mudar junto.':'No need to wait for December: whenever your sample changes, this summary can change too.',
  'Um resumo rápido e compartilhável dos sinais mais fortes encontrados nas partidas disponíveis. Ele muda junto com sua Riot Life.':'A quick, shareable summary of the strongest signals found in available matches. It changes with your Riot Life.',
  'EM ANÁLISE':'UNDER REVIEW',
  'Conta':'Account',
  'Jogos':'Games',
  'Minha Riot Life':'My Riot Life',
  'ONLINE':'ONLINE',
  'SAIR':'SIGN OUT',
  'SAIR DA CONTA':'SIGN OUT',
  'CONTA // CONTROLE':'ACCOUNT // CONTROL',
  'Gerencie a identidade usada no ZeroTwo e as conexões da sua conta.':'Manage the identity used in ZeroTwo and your account connections.',
  'NOME NO ZEROTWO':'ZEROTWO NAME',
  'Nome exibido dentro da área autenticada.':'Name displayed inside the authenticated area.',
  'RIOT ID PRINCIPAL':'PRIMARY RIOT ID',
  'Riot ID público':'Public Riot ID',
  'PRIVACIDADE':'PRIVACY',
  'Encerra sua sessão atual neste dispositivo.':'Ends your current session on this device.',
  'DIAGNÓSTICO':'DIAGNOSTICS',
  'SESSÃO':'SESSION',
  'EVENTOS':'EVENTS',
  'ERROS':'ERRORS',
  'ATUALIZAR':'REFRESH',
  'CARREGANDO LOGS...':'LOADING LOGS...',
  'NENHUM EVENTO REGISTRADO AINDA.':'NO EVENTS RECORDED YET.',
  'Tokens, senhas e identificadores sensíveis são bloqueados pelo logger.':'Tokens, passwords, and sensitive identifiers are blocked by the logger.',
  'PULAR PARA O CONTEÚDO PRINCIPAL':'SKIP TO MAIN CONTENT',
  'NOVAS PARTIDAS':'NEW MATCHES',
  'NOVA PARTIDA':'NEW MATCH',
  'FECHAR':'CLOSE',
  'AGORA ABRA A EVIDÊNCIA.':'NOW OPEN THE EVIDENCE.',
  'DADOS QUE SUSTENTAM A LEITURA.':'DATA THAT SUPPORTS THE READING.',
  'EVIDÊNCIAS DA ANÁLISE':'ANALYSIS EVIDENCE',
  'EVIDÊNCIAS DO PERÍODO RECENTE':'RECENT PERIOD EVIDENCE',
  'EVIDÊNCIA':'EVIDENCE',
  'EVIDÊNCIAS // DADOS RIOT + CÁLCULOS ZEROTWO':'EVIDENCE // RIOT DATA + ZEROTWO CALCULATIONS',
  'O QUE ESTÁ MAIS FORTE NESTA AMOSTRA.':'WHAT IS STRONGEST IN THIS SAMPLE.',
  'O QUE SUA AMOSTRA':'WHAT YOUR SAMPLE',
  'ESTÁ DIZENDO HOJE.':'IS SAYING TODAY.',
  'WRAPPED PERMANENTE.':'PERMANENT WRAPPED.',
  'MAIS VISTOS':'MOST SEEN',
  'RESULTADO CONTEXTUAL: vitória em modos tradicionais · Top 4 em Arena':'CONTEXTUAL RESULT: win in traditional modes · Top 4 in Arena',
  'FATO // frequência observada na amostra, não avaliação de habilidade':'FACT // frequency observed in the sample, not a skill assessment',
  'MÉTODO // partidas separadas por até 2 horas entram na mesma sessão':'METHOD // matches separated by up to 2 hours enter the same session',
  'CRITÉRIO // maior KDA dentro da janela atual, não “melhor partida” absoluta':'CRITERION // highest KDA within the current window, not an absolute “best match”',
  'FORMA E MAESTRIA':'FORM AND MASTERY',
  'Forma e maestria':'Form and mastery',
  'Forma recente e maestria respondem perguntas diferentes. Escolha uma de cada vez.':'Recent form and mastery answer different questions. Choose one at a time.',
  'Quem aparece nas partidas recentes':'Who appears in recent matches',
  'Em quem você acumulou experiência':'Who you accumulated experience on',
  'RIOT ID LOCALIZADO':'RIOT ID FOUND',
  'DADOS TÉCNICOS DO JOGADOR':'PLAYER TECHNICAL DATA',
  'CONEXÃO PRONTA. SUA HISTÓRIA COMEÇA COM OS DADOS DISPONÍVEIS AGORA.':'CONNECTION READY. YOUR HISTORY STARTS WITH THE DATA AVAILABLE NOW.'
};

const RULES:Array<[RegExp,string]>=[
  [/(\d+) partidas\b/g,'$1 matches'],
  [/(\d+) partida\b/g,'$1 match'],
  [/(\d+) jogos\b/g,'$1 games'],
  [/(\d+) jogo\b/g,'$1 game'],
  [/(\d+) dias\b/g,'$1 days'],
  [/(\d+) dia\b/g,'$1 day'],
  [/(\d+) horas\b/g,'$1 hours'],
  [/(\d+) hora\b/g,'$1 hour'],
  [/(\d+) min\b/g,'$1 min'],
  [/(\d+)% de vitórias/g,'$1% wins'],
  [/(\d+)% dos resultados negativos seguidos de recuperação/g,'$1% of negative results followed by recovery'],
  [/nível (\d+)/gi,'level $1'],
  [/NÍVEL (\d+)/g,'LEVEL $1'],
  [/partidas analisadas/g,'matches analyzed'],
  [/partidas recentes/g,'recent matches'],
  [/partidas carregadas/g,'loaded matches'],
  [/partidas disponíveis/g,'available matches'],
  [/partidas desta janela/g,'matches in this window'],
  [/na amostra/g,'in the sample'],
  [/nesta amostra/g,'in this sample'],
  [/desta janela/g,'in this window'],
  [/nesta consulta/g,'in this lookup'],
  [/colocação média/g,'average placement'],
  [/dano por minuto/g,'damage per minute'],
  [/campeão mais presente agora/g,'most present champion now'],
  [/campeão mais presente/g,'most present champion'],
  [/mais presente/g,'most present'],
  [/média observada/g,'observed average'],
  [/resultado misto/g,'mixed result'],
  [/resultado/g,'result'],
  [/vitória/g,'win'],
  [/vitórias/g,'wins'],
  [/derrota/g,'loss'],
  [/derrotas/g,'losses'],
  [/hoje/g,'today'],
  [/(\d+)d atrás/g,'$1d ago'],
  [/d atrás/g,'d ago'],
  [/jogos ·/g,'games ·'],
  [/partidas ·/g,'matches ·']
];

function translateString(value:string){
  if(!value)return value;
  const exact=EN[value.trim()];
  if(exact){
    const leading=value.match(/^\s*/)?.[0]||'';
    const trailing=value.match(/\s*$/)?.[0]||'';
    return leading+exact+trailing;
  }
  let next=value;
  for(const [pattern,replacement] of RULES)next=next.replace(pattern,replacement);
  return next;
}

const originals=new WeakMap<Text,string>();
const knownTextNodes=new Set<Text>();
const attrOriginals=new WeakMap<Element,Map<string,string>>();
const knownAttrElements=new Set<Element>();
const ATTRS=['placeholder','title','aria-label'] as const;

function shouldSkip(node:Node){
  const parent=node.parentElement;
  return !parent||!!parent.closest('[data-i18n-skip],script,style,code,pre');
}
function processTextNode(node:Text,language:ZtLanguage){
  if(shouldSkip(node))return;
  if(!originals.has(node)){originals.set(node,node.nodeValue||'');knownTextNodes.add(node)}
  const original=originals.get(node)||'';
  const target=language==='en'?translateString(original):original;
  if(node.nodeValue!==target)node.nodeValue=target;
}
function processElement(element:Element,language:ZtLanguage){
  let saved=attrOriginals.get(element);
  for(const attr of ATTRS){
    if(!element.hasAttribute(attr))continue;
    if(!saved){saved=new Map();attrOriginals.set(element,saved);knownAttrElements.add(element)}
    if(!saved.has(attr))saved.set(attr,element.getAttribute(attr)||'');
    const original=saved.get(attr)||'';
    const target=language==='en'?translateString(original):original;
    if(element.getAttribute(attr)!==target)element.setAttribute(attr,target);
  }
}
function processTree(root:Node,language:ZtLanguage){
  if(root.nodeType===Node.TEXT_NODE){processTextNode(root as Text,language);return}
  if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_FRAGMENT_NODE)return;
  if(root.nodeType===Node.ELEMENT_NODE)processElement(root as Element,language);
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
  let node=walker.nextNode();
  while(node){
    if(node.nodeType===Node.TEXT_NODE)processTextNode(node as Text,language);
    else if(node.nodeType===Node.ELEMENT_NODE)processElement(node as Element,language);
    node=walker.nextNode();
  }
}
function cleanup(){
  for(const node of [...knownTextNodes])if(!node.isConnected)knownTextNodes.delete(node);
  for(const element of [...knownAttrElements])if(!element.isConnected)knownAttrElements.delete(element);
}

let activeLanguage:ZtLanguage='pt-BR';
export function getLanguage(){return activeLanguage}
export function getLocale(){return activeLanguage==='en'?'en-US':'pt-BR'}

export function I18nProvider({children}:{children:React.ReactNode}){
  const [language,setLanguageState]=useState<ZtLanguage>(()=>{
    const query=new URLSearchParams(location.search).get('lang');
    if(query==='en'||query==='pt-BR')return query;
    return localStorage.getItem(STORAGE_KEY)==='en'?'en':'pt-BR';
  });

  const setLanguage=(next:ZtLanguage)=>{
    localStorage.setItem(STORAGE_KEY,next);
    setLanguageState(next);
  };

  useEffect(()=>{
    activeLanguage=language;
    document.documentElement.lang=language;
    document.title=language==='en'?'ZeroTwo.gg — Your Riot Life':'ZeroTwo.gg — Sua Riot Life';
    const meta=document.querySelector('meta[name="description"]');
    if(meta)meta.setAttribute('content',language==='en'
      ?'ZeroTwo.gg turns permitted Riot data into a personal League of Legends experience: history, champions, mastery, sessions, and changes over time.'
      :'ZeroTwo.gg transforma dados permitidos da Riot em uma experiência pessoal: resumo, história, campeões, sessões e mudanças ao longo do tempo.');
    processTree(document.body,language);
    const observer=new MutationObserver(records=>{
      for(const record of records){
        if(record.type==='characterData')processTextNode(record.target as Text,language);
        for(const node of record.addedNodes)processTree(node,language);
      }
      cleanup();
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    window.dispatchEvent(new CustomEvent('zt:language-change',{detail:{language}}));
    return()=>observer.disconnect();
  },[language]);

  const value=useMemo(()=>({language,setLanguage}),[language]);
  return <LanguageContext.Provider value={value}>
    {children}
    <div className="ztLanguageSwitcher" data-i18n-skip aria-label="Language">
      <button className={language==='pt-BR'?'active':''} onClick={()=>setLanguage('pt-BR')} aria-pressed={language==='pt-BR'}>PT-BR</button>
      <button className={language==='en'?'active':''} onClick={()=>setLanguage('en')} aria-pressed={language==='en'}>EN</button>
    </div>
  </LanguageContext.Provider>;
}

export function useLanguage(){return useContext(LanguageContext)}
export function t(value:string,language:ZtLanguage=activeLanguage){return language==='en'?translateString(value):value}
