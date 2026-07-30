# Integração BioCultTermos → BioCultNaturalistas (unidade Obras de Naturalistas séc. XVII–XIX)

> Documento de referência para o agente de IA (Claude) que implementará esta integração **quando o
> BioCultNaturalistas tiver código**. Produzido em sessão de `grill-with-docs` em 2026-07-12, na mesma
> sessão em que a integração equivalente foi planejada para o BioCultDB e para o BioCultRelatos.
>
> **Leia primeiro**: `BioCultDB/integracao.md` e `BioCultDB/docs/decisions/ADR-001-integracao-bioculttermos.md`
> — é o modelo de implementação real (scaffold Docker já construído e testado) do qual este documento
> deriva. `BioCultRelatos/integracao.md` é a adaptação irmã mais próxima (mesma lógica de N instâncias
> soberanas). Este documento assume que você já leu esses e foca só nas **diferenças**.
>
> Decisão operacional desta integração: `BioCultNaturalistas/docs/decisions/ADR-001-integracao-bioculttermos.md`
> (leia antes deste checklist).

## 0. Por que este documento é diferente do equivalente do BioCultDB

O documento do BioCultDB descreve um **corte em produção**: container `etnoDB` já rodando, dados reais,
imagem já publicada. Este documento descreve um **padrão a aplicar quando o BioCultNaturalistas for
implementado do zero** — hoje o repositório só tem `README.md`, nenhum `backend/`, nenhum `docker/`.
Trate as seções abaixo como especificação de arquitetura de deploy, não como checklist contra um sistema
existente.

Diferença estrutural mais importante: BioCultDB é **uma instância única e global**. BioCultNaturalistas é
**um padrão replicado N vezes** — uma instância inteiramente separada e soberana por **projeto de
sistematização** de obra(s) de naturalista(s) membro da federação (por exemplo, um projeto dedicado a
sistematizar as obras de um naturalista específico, ou um conjunto delas, é uma unidade soberana própria).
Tudo abaixo descreve o padrão de UMA instância (um projeto); ele se repete, sem compartilhar nada (nem
imagem de dados, nem credenciais, nem arquivo SQLite), para cada novo projeto que entra na federação.

## 1. O que herda diretamente do padrão BioCultDB (sem adaptação)

Estes princípios são a mesma decisão arquitetural (ADR-005), aplicados de novo:

- **Um container por unidade (por projeto), um único arquivo SQLite compartilhado** entre
  BioCultNaturalistas e BioCultTermos, tabelas distintas, nunca uma tabela comum. `SQLITE_DB_PATH` aponta
  pra ele. Modo WAL (`journal_mode=WAL`, `foreign_keys=ON`, `busy_timeout=5000`).
- **BioCultTermos como git submodule** em `BioCultNaturalistas/bioculttermos`, apontando para
  `github.com/edalcin/BioCultTermos` — o **mesmo** repositório/código usado pelo BioCultDB, não um fork.
  Fluxo de desenvolvimento idêntico ao documentado em `BioCultDB/integracao.md` §7: editar dentro de
  `BioCultNaturalistas/bioculttermos/`, commit + push para o remoto do submodule, depois bump do ponteiro
  + commit no repositório host (`BioCultNaturalistas`).
- **Portas do BioCultTermos fixas: 4000 (público, sem auth) / 4001 (admin, HTTP Basic + bcrypt)** —
  definidas pelo próprio código do submodule (`PUBLIC_PORT`/`ADMIN_PORT`, default 4000/4001;
  `bioculttermos/backend/src/config/index.js:34-35`), independem da ferramenta parceira.
- **Autenticação do BioCultTermos admin via `ADMIN_USERNAME` + `ADMIN_PASSWORD`** (texto plano, hash
  bcrypt gerado no boot — mesma Opção B de `config/index.js:22-28`). **Diferente do BioCultDB**: aqui
  cada instância escolhe suas próprias credenciais no momento do deploy — nunca reaproveitar
  usuário/senha de outra instância.
- **Imagem Docker única dual-app**, construída por um `Dockerfile.unidade`-equivalente (multi-stage:
  builder compila a ferramenta principal + BioCultTermos submodule; runtime `node:20-alpine`, non-root
  uid 1001, `dumb-init` como PID 1) e um `start-unit.sh`-equivalente (sobe os dois processos como filhos,
  forwarda `SIGTERM`, fail-fast se um crashar sozinho) — copiar a estrutura de
  `BioCultDB/docker/Dockerfile.unidade` e `docker/start-unit.sh` quase literalmente.
- **CI publica uma imagem única com submodule**: workflow `.github/workflows/docker-publish.yml`
  (a criar) com `actions/checkout@v4` + `submodules: recursive`. Uma imagem **reutilizada por todas as
  instâncias** — o que é soberano é o container + volume de cada deploy, não o binário.
- **Operação de corte (updates futuros)**: mesmo checklist do BioCultDB (`integracao.md` §4.2) por
  instância — backup do arquivo SQLite, registrar digest da imagem atual antes de atualizar (`:latest` é
  tag flutuante), substituição in-place do container, verificação de saúde, rollback pelo digest se
  necessário.

## 2. O que NÃO herda — decisões e trabalho específicos desta unidade

### 2.1 `AcquisitionService` precisa ser generalizado primeiro (bloqueante)

O `AcquisitionService` do BioCultTermos hoje só sabe ler a tabela `biocultdb_records` com uma lista fixa
de campos do schema `Reference` do BioCultDB — **reutilizar o serviço como está não funciona**. Decisão
tomada (ver ADR-001 §6): generalizar o serviço no repositório BioCultTermos para que o nome da
tabela-fonte e a lista de campos monitorados sejam configuráveis, e os textos fixos da UI virem
genéricos. Trabalho de código no repositório **BioCultTermos** (compartilhado por todas as unidades),
não específico desta unidade.

A generalização acima precisa aceitar **N** tabelas-fonte, não apenas uma: o modelo de dados desta
unidade (`docs/decisions/data-model.md`) espalha os termos candidatos ao BioCultTermos entre
`bcn_evidencias` e `bcn_taxons`. Ver `docs/decisions/ADR-003-fonte-de-vocabulario-bioculttermos.md` para
o contrato de configuração `{tabela, campos[]}` que fecha este requisito.

### 2.2 Nome do arquivo SQLite

`SQLITE_DB_PATH=/data/unidade.sqlite` desde o primeiro deploy (nome canônico da ADR-005) — sem dado
legado a preservar, ao contrário do BioCultDB.

### 2.3 Portas da ferramenta principal: Registro 3001, Apresentação 3003 (3002 vago)

Decidido em `docs/decisions/ADR-002-modelo-de-dados-e-contextos.md` (M7): dois contextos HTTP —
**Registro** (3001, entrada e edição de dados) e **Apresentação** (3003, busca e visualização pública).
A porta 3002 fica deliberadamente vaga, sem contexto de curadoria (ausente nesta unidade — ver ADR-002
M2), para nunca colidir com o significado que 3002 tem no BioCultDB (Curadoria). BioCultTermos segue
usando 4000/4001 internamente, sempre, independente da ferramenta principal.

### 2.4 Multi-tenant: convenção de deployment por instância

Cada instância soberana = um container inteiramente separado, nunca compartilhando arquivo, credenciais
ou volume com outra. Convenção recomendada: nome do container `bioculnaturalistas-<slug-do-projeto>`, um
volume de dados por projeto, credenciais admin exclusivas, backup independente (cobre a ferramenta
principal + BioCultTermos daquele projeto, mesmo arquivo).

Não existe automação de provisionamento multi-instância hoje — cada instância é criada manualmente
seguindo este documento até que o número de instâncias justifique automatizar (próxima ADR, não esta).

### 2.5 Sem CLPI direto, mas C.A.R.E. permanece obrigatório

Diferente do BioCultRelatos (registro primário com detentores vivos, CLPI obrigatório antes do
registro), o BioCultNaturalistas extrai evidências de **obras já publicadas** — o naturalista autor da
fonte não pode mais ser consultado, e não há protocolo de CLPI a executar no momento da sistematização.
Isso não reduz a responsabilidade ética: os princípios C.A.R.E. (Collective Benefit, Authority to
Control, Responsibility, Ethics — ver `BioCultNaturalistas/README.md`) seguem valendo integralmente,
porque a evidência extraída ainda descreve conhecimento tradicional de uma comunidade específica,
documentado por terceiros séculos atrás. **Tratamento operacional decidido**: o campo
`bcn_evidencias.sensibilidade` (`"publico"|"restrito"`, default `"publico"`) — evidências `"restrito"`
nunca saem no endpoint de federação nem na busca pública do contexto Apresentação, permanecendo
acessíveis apenas no contexto Registro. Ver `docs/decisions/ADR-002-modelo-de-dados-e-contextos.md`
(M8) para a decisão completa.

### 2.6 Endpoint de federação — não é escopo deste documento

`GET /api/federation/records` (ADR-004 D6) é responsabilidade da ferramenta principal desta unidade, não
do BioCultTermos nem desta integração — a integração aqui documentada é estritamente sobre BioCultTermos
compartilhar o arquivo SQLite e prover vocabulário controlado.

## 3. Checklist de implementação (quando o código começar a existir)

1. Confirmar que o `AcquisitionService` do BioCultTermos já foi generalizado (§2.1) — se não, esse é o
   primeiro passo, no repositório BioCultTermos, antes de tocar nesta unidade.
2. Adicionar `bioculttermos` como git submodule na raiz deste repositório
   (`git submodule add https://github.com/edalcin/BioCultTermos.git bioculttermos`).
3. Criar `docker/Dockerfile.unidade` e `docker/start-unit.sh` espelhando os do BioCultDB.
4. Portas da ferramenta principal já definidas: Registro 3001, Apresentação 3003, 3002 vago (ver
   `docs/decisions/ADR-002-modelo-de-dados-e-contextos.md` M7) — **resolvido**, nada a fazer aqui.
5. Criar `.github/workflows/docker-publish.yml` com `submodules: recursive` e build de
   `docker/Dockerfile.unidade`.
6. Para o primeiro deploy de cada instância: `SQLITE_DB_PATH=/data/unidade.sqlite` (arquivo novo, vazio),
   `ADMIN_USERNAME`/`ADMIN_PASSWORD` próprios, volume de dados dedicado, nome de container seguindo a
   convenção §2.4.
7. Verificar saúde nas mesmas linhas do checklist do BioCultDB (`BioCultDB/integracao.md` §5), adaptando
   as portas para as definidas no passo 4.
8. Disparar a primeira aquisição manualmente (`POST /acquisition/run` autenticado) assim que a instância
   já tiver algumas evidências extraídas — mesma lógica do BioCultDB: o vocabulário candidato nasce da
   varredura dos dados já existentes, não precisa esperar o cron.

## 4. Fora de escopo

- Implementação de código desta unidade em si (extração, sistematização, curadoria, apresentação) —
  este documento cobre só a integração com BioCultTermos.
- Endpoint `/api/federation/records` e integração com Pluriverso (§2.6) — decisão/documento separado.
- Automação de provisionamento multi-instância (§2.4) — próxima ADR quando o volume justificar.
- Tratamento operacional dos princípios C.A.R.E. sem CLPI direto — **decidido** em §2.5 (campo
  `sensibilidade`, ver ADR-002 M8); não é mais um ponto em aberto desta integração.

## 5. Glossário

Ver `BioCultDB/integracao.md` §10 para o glossário completo dos termos técnicos compartilhados (Unidade
Federada, `SQLITE_DB_PATH`, WAL, JSON1, FTS5, SKOS-XL, `AcquisitionService`, `candidate`/`active`/`deprecated`,
HTTP Basic Auth, `start-unit.sh`, `dumb-init`, submodule, corte/cutover) — todos se aplicam aqui
identicamente. Termo adicional específico desta unidade:

- **Obra de Naturalista**: relato, diário de viagem ou publicação de naturalista europeu em visita ao
  Brasil (séc. XVII–XIX) contendo evidências de conhecimento tradicional associado à biodiversidade. Cada
  projeto de sistematização de uma ou mais obras, membro da federação, é uma unidade soberana própria.
