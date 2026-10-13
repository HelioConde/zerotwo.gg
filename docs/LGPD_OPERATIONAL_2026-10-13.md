# ZeroTwo — privacidade, proteção de dados e atendimento

## Canal privado para contas verificadas
A Central de Privacidade possui formulário autenticado de solicitações LGPD: acesso, correção, exclusão ou outras questões. O endpoint \`privacy-manage\` recebe no máximo três solicitações por usuário em 24 h, identificando o usuário por \`auth.getUser(token)\`. O operador recebe as solicitações na tabela \`public.zerotwo_privacy_requests\`, acessível apenas com credenciais administrativas; o browser não recebe permissão SQL direta. O operador deverá consultar a tabela no Supabase Dashboard (filtrar \`status='received'\`) e responder pelo e-mail da conta. Nenhum mecanismo de aviso por e-mail foi ativado; o operador precisa verificar a caixa.

O registro permanece após exclusão da conta, pois o vínculo \`user_id\` vira NULL para que exista histórico de atendimento. Definir operacionalmente retenção de no máximo 90 dias após resolução e descartar solicitações já encerradas; ainda não há exclusão automática ou aviso ao operador.

## Exclusão de conta
A operação autenticada \`delete_account\` exige confirmação explícita. O backend elimina registros por \`user_id\` de \`riot_life_snapshots\`, \`valorant_user_matches\`, \`valorant_accounts\`, \`riot_rso_states\`, \`player_dna_snapshots\`, \`client_event_logs\`, \`riot_accounts\` e \`profiles\`, em seguida solicita \`auth.admin.deleteUser\`. Em qualquer erro, falha sem declarar êxito. A limpeza pode ter sido parcial e requer nova tentativa ou atendimento privado. Caches públicos com dados Riot não pertencem a uma única conta e não são excluídos. Outras tabelas históricas, se existirem fora do repositório, requerem auditoria separada.

## Testes
- Deno unit test de serviço com admin fake: só apaga linhas com user_id autenticado, impede excluir auth depois de erro de tabela e informa falhas de Auth.
- QA live recusa chamadas anônimas às ações de apagar snapshots, criar ticket e excluir conta.
- Playwright valida textos e habilitação condicional; **não apaga conta real**.
- **FALTA** teste end-to-end com usuário descartável criado pelo próprio operador no projeto gamer: criar conta de teste, gravar snapshot e ticket, excluir pelo navegador, consultar auth/tabelas e garantir remoção dos dados. A conexão Supabase disponível ao assistente não contém este projeto, impedindo esse teste direto.

## Solicitações sem conta
Deve ser definido um endereço privado do ZeroTwo antes de considerar concluído o atendimento de titulares sem conta. Não publicar uma conta Gmail pessoal sem consentimento. O formulário autenticado não satisfaz sozinho todos os casos LGPD.
