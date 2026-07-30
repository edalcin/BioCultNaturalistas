# ADR-001: Integração operacional do BioCultTermos na unidade Obras de Naturalistas (séc. XVII–XIX)

## Status

**Aceito** (decisão de padrão, implementação diferida) — Julho 2026

## Contexto

A Arquitetura BioCultural v3.2 (`Arquitetura-BioCultural/docs/architecture-decisions/ADR-004-federated-architecture.md`
e `ADR-005-sqlite-json-persistence.md`) já define, no nível arquitetural, que toda unidade **Obras de
Naturalistas (séc. XVII–XIX)** membro da federação opera uma unidade com **um único container** rodando
BioCultNaturalistas (extração e sistematização de evidências de conhecimento tradicional em obras e
relatórios de naturalistas europeus em visita ao Brasil entre os séculos XVII e XIX) e **BioCultTermos**
(vocabulário SKOS-XL soberano do projeto) sobre **um único arquivo SQLite compartilhado**.

Em 2026-07-12, a mesma integração foi planejada e documentada para a unidade irmã "Fontes Secundárias"
(BioCultDB + BioCultTermos) — ver `BioCultDB/integracao.md` e `BioCultDB/docs/decisions/ADR-001-integracao-bioculttermos.md`.
Essa sessão serviu de sessão de grilling **e** de modelo de implementação real (scaffold Docker
multi-stage, submodule, entrypoint dual-processo, todos já testados e funcionando para BioCultDB). Esta
ADR replica os **princípios** dessa integração para o BioCultNaturalistas, adaptando-os às diferenças
reais entre as duas unidades — não é uma cópia mecânica.

**BioCultNaturalistas ainda não tem código** (`README.md:7`: "Fase inicial — apenas repositório e
documentação") — nenhum `backend/`, nenhum `docker/`, nenhum submodule ainda. Esta ADR e o
`integracao.md` que a acompanha são, portanto, um **padrão a seguir quando a implementação começar**, não
um checklist executável contra um sistema em produção (diferente do documento equivalente do BioCultDB).

### Diferenças estruturais relevantes em relação à unidade BioCultDB

| Aspecto | Unidade Fontes Secundárias (BioCultDB) | Unidade Obras de Naturalistas (BioCultNaturalistas) |
|---|---|---|
| Cardinalidade | Uma instância única, global | **N instâncias**, uma por projeto de sistematização de obra(s) de naturalista(s) membro da federação, cada uma soberana |
| Dados pré-existentes | Produção real e populada (`biocultdb.sqlite`) | Nenhum — cada projeto parte de um arquivo novo |
| Ferramenta principal | BioCultDB (3 contextos: Aquisição/Curadoria/Apresentação, sem CLPI) | BioCultNaturalistas (extração/sistematização de evidências em obras e relatórios de naturalistas, sem CLPI direto — a fonte é obra histórica publicada, não registro vivo de comunidade, mas os princípios C.A.R.E. seguem valendo integralmente) |
| Portas da ferramenta principal | 3001/3002/3003 (fixas, já em uso) | 3001 (Registro) / 3003 (Apresentação) — 3002 deliberadamente vago |
| `AcquisitionService` do BioCultTermos | Já funciona hoje (schema `biocultdb_records` hardcoded) | **Não funciona sem generalização** — schema de dados é outro (ver Decisão 6) |

## Decisão

Os princípios a seguir são **herdados diretamente** da integração BioCultDB (mesma arquitetura, ADR-005),
sem adaptação:

1. **Um container por projeto, um arquivo SQLite compartilhado.** `SQLITE_DB_PATH` aponta para um
   único arquivo dentro do container do projeto; BioCultNaturalistas e BioCultTermos leem/escrevem
   tabelas distintas do mesmo arquivo, nunca uma tabela comum. Modo WAL (`journal_mode=WAL`,
   `foreign_keys=ON`, `busy_timeout=5000`).
2. **BioCultTermos como git submodule** em `BioCultNaturalistas/bioculttermos`, apontando para o mesmo
   `github.com/edalcin/BioCultTermos` já usado pelo BioCultDB — é o **mesmo código**, não um fork.
   Mesmo fluxo de desenvolvimento: alterações são commitadas a partir de
   `BioCultNaturalistas/bioculttermos/` e pushadas para o repositório remoto do submodule, seguidas de
   bump do ponteiro no repositório host (ver `BioCultDB/integracao.md` §7 para o passo a passo exato —
   idêntico aqui).
3. **Portas do BioCultTermos fixas em 4000 (público) / 4001 (admin)**, internas ao container — definidas
   pelo próprio código do BioCultTermos (`PUBLIC_PORT`/`ADMIN_PORT`, default 4000/4001), independem de
   qual ferramenta ele acompanha.
4. **Autenticação do BioCultTermos admin via `ADMIN_USERNAME` + `ADMIN_PASSWORD`** (mesmo padrão simples
   escolhido para o BioCultDB) — porém aqui, **cada projeto de sistematização define suas próprias
   credenciais** no deploy da sua instância. Nunca reutilizar usuário/senha entre projetos diferentes.
5. **Uma imagem Docker única, dual-app, publicada por CI com submodule.** Mesmo padrão do
   `Dockerfile.unidade`/`start-unit.sh`/`docker-publish.yml` do BioCultDB: build multi-stage compilando
   BioCultNaturalistas + BioCultTermos, entrypoint que sobe os dois processos com fail-fast, CI com
   `actions/checkout` usando `submodules: recursive`. Imagem publicada como
   `ghcr.io/edalcin/bioculnaturalistas:latest` (nome a confirmar quando o repositório de imagem for
   criado) — **uma imagem, reutilizada por todos os projetos**; o que é soberano é o **container e o
   volume de dados** de cada projeto, não o binário/imagem.

Os pontos a seguir **não** são herdados automaticamente — exigem decisão/trabalho próprio:

6. **`AcquisitionService` do BioCultTermos precisa ser generalizado antes de servir ao
   BioCultNaturalistas.** Hoje (`bioculttermos/backend/src/services/AcquisitionService.js:9-14,45-46`)
   ele lê a tabela `biocultdb_records` com uma lista fixa de campos (`comunidades.tipo`,
   `comunidades.plantas.nomeVernacular`, `comunidades.plantas.tipoUso`, `comunidades.atividadesEconomicas`)
   — específicos do schema do BioCultDB (`Reference` model). O schema de dados do BioCultNaturalistas
   (evidência extraída de obra/relatório, autor, ano, trecho, espécie/uso citado, comunidade referida) é
   outro; reutilizar o serviço como está não funciona. **Decisão**: generalizar o `AcquisitionService`
   para que o nome da tabela-fonte e a lista de campos monitorados sejam configuráveis (env var ou
   arquivo de config), não hardcoded — um único BioCultTermos serve qualquer tipo de unidade sem fork de
   código. Isso também exige generalizar os textos fixos da UI do BioCultTermos que hoje mencionam
   "BioCultDB" explicitamente (`admin/views/dashboard.ejs:80`, `admin/views/acquisition/logs.ejs:24`,
   `public/views/about.ejs:17,27,62,85-91`) para linguagem genérica ("a ferramenta principal desta
   unidade"). Este é trabalho de código no **repositório BioCultTermos** (compartilhado por todas as
   unidades), não específico do BioCultNaturalistas — pode (e idealmente deve) ser feito uma única vez,
   antes de qualquer unidade além do BioCultDB entrar em produção.

   > **Atualização (Julho 2026)**: o contrato de generalização foi apertado para lista de pares
   > `{tabela, campos[]}` (esta unidade tem duas tabelas-fonte de vocabulário, não uma) — ver ADR-003.
7. **Nome do arquivo SQLite**: como não há dado legado a preservar (diferente do BioCultDB, que ficou
   com `biocultdb.sqlite` por continuidade), cada nova instância de projeto **deve** usar o nome
   canônico da ADR-005: `SQLITE_DB_PATH=/data/unidade.sqlite`. A divergência do BioCultDB é uma exceção
   documentada, não o novo padrão — projetos novos partem limpos.
8. **Portas do próprio BioCultNaturalistas** (equivalente a 3001/3002/3003 do BioCultDB) ainda não estão
   definidas — dependem do desenho de produto do BioCultNaturalistas. Fora do escopo desta ADR, que trata
   apenas da integração com BioCultTermos. Quando o BioCultNaturalistas tiver seu primeiro esboço de
   contextos/portas, revisar esta ADR.

    > **Atualização (Julho 2026)**: portas definidas — Registro 3001, Apresentação 3003, 3002
    > deliberadamente vago (sem contexto de curadoria) — ver ADR-002 (M7).
9. **Convenção de nome de container/deployment por projeto**: recomendado
   `bioculnaturalistas-<slug-do-projeto>`, um container Docker por projeto de sistematização, cada um com
   seu próprio volume de dados — nunca um container multi-tenant compartilhando arquivo entre projetos
   diferentes (violaria soberania, princípio central da arquitetura federada).
10. **Ausência de CLPI direto não dispensa C.A.R.E.** Diferente do BioCultRelatos (registro primário com
    detentores vivos, CLPI obrigatório), o BioCultNaturalistas trabalha sobre obra histórica já
    publicada — não há consulta prévia possível ao autor original (naturalista, já falecido) nem
    protocolo de CLPI a executar no momento do registro. Isso **não** dispensa os princípios C.A.R.E.
    (Collective Benefit, Authority to Control, Responsibility, Ethics): a evidência extraída ainda
    descreve conhecimento tradicional de uma comunidade específica, e a autoridade sobre como esse
    conhecimento é registrado e compartilhado permanece com a comunidade referida na obra, não com o
    projeto de sistematização. Tratamento operacional desse princípio (ex.: campos de proveniência,
    sinalização de sensibilidade) é decisão de produto do BioCultNaturalistas, fora do escopo desta ADR.

    > **Atualização (Julho 2026)**: tratamento operacional definido — campo `bcn_evidencias.sensibilidade`
    > (`"publico"|"restrito"`, default `"publico"`), que rege visibilidade no contexto Apresentação e no
    > endpoint de federação — ver ADR-002 (M8).

## Consequências

### Positivas

- Reaproveita 100% do scaffold Docker já validado no BioCultDB (Dockerfile multi-stage, entrypoint
  fail-fast, padrão de submodule) — nenhum desenho novo de infraestrutura necessário quando a
  implementação começar.
- Forçar a generalização do `AcquisitionService` agora (como decisão, mesmo sem implementar) evita que o
  BioCultDB grave ainda mais lógica hardcoded que precisaria ser desfeita depois.
- Nomeação limpa (`unidade.sqlite`) desde o primeiro deploy evita a divergência doc-vs-produção que o
  BioCultDB carrega.
- Documentar explicitamente que C.A.R.E. vale mesmo sem CLPI evita que a ausência de um protocolo de
  consulta seja lida, por engano, como ausência de responsabilidade ética sobre o dado.

### Negativas

- `AcquisitionService` generalizado é trabalho real de código no repositório compartilhado
  `BioCultTermos`, não documentação — bloqueia o início da integração até ser feito.
  - *Mitigação*: pode ser feito independentemente do calendário desta unidade (é refactor do
    BioCultTermos), inclusive aproveitando o próximo ciclo de manutenção do BioCultDB.
- Multi-tenant real (N instâncias, N containers) introduz operação repetitiva (N credenciais, N
  volumes, N backups) que a unidade única do BioCultDB não tem.
  - *Mitigação*: fora de escopo desta ADR; tratar como próximo ADR quando o número de instâncias
    justificar automação (ex.: template de container Unraid, script de provisionamento).

## Referências

- `Arquitetura-BioCultural/docs/architecture-decisions/ADR-004-federated-architecture.md`
- `Arquitetura-BioCultural/docs/architecture-decisions/ADR-005-sqlite-json-persistence.md`
- `BioCultDB/integracao.md` e `BioCultDB/docs/decisions/ADR-001-integracao-bioculttermos.md` (modelo de
  implementação real, referência primária desta ADR)
- `BioCultRelatos/integracao.md` e `BioCultRelatos/docs/decisions/ADR-001-integracao-bioculttermos.md`
  (mesma decisão aplicada à unidade Comunidade Tradicional; base de adaptação desta ADR)
- `BioCultNaturalistas/integracao.md` (checklist/padrão detalhado desta decisão)
- `BioCultDB/bioculttermos/backend/src/services/AcquisitionService.js` (ponto de generalização
  necessário)
- `docs/decisions/ADR-002-modelo-de-dados-e-contextos.md` (fecha os pontos 8 e 10 acima — portas e
  tratamento de C.A.R.E./sensibilidade)
- `docs/decisions/ADR-003-fonte-de-vocabulario-bioculttermos.md` (fecha o ponto 6 acima — contrato de
  generalização do `AcquisitionService`)

## Data de Revisão

Revisitar assim que (a) o `AcquisitionService` for generalizado no repositório BioCultTermos, e/ou (b)
esta unidade tiver seu primeiro esboço de contextos/portas próprios.
