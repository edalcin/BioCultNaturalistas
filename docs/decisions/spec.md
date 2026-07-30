# Especificação Funcional — BioCultNaturalistas

**Feature**: Registro de evidências de biodiversidade e uso tradicional em obras de naturalistas (séc. XVII–XIX)
**Date**: 2026-07-30
**Status**: Completo
**Input**: `docs/promptInicial.md`

Este documento espelha o papel de `D:/git/BioCultDB/docs/decisions/spec.md` — os requisitos funcionais
que o modelo de dados de `docs/decisions/data-model.md` deve suportar. Convenções de "look and feel" e
stack são herdadas do BioCultDB (`docs/principiosDesenvolvimento.md`); as três subtrações pedidas em
`docs/promptInicial.md` (sem curadoria, sem entidade Comunidade autônoma, espécie associada à Obra via
Evidência) atravessam toda esta especificação.

## Escopo

O BioCultNaturalistas registra manualmente evidências de biodiversidade e de seu uso pela sociedade da
época, extraídas de obras e relatórios de naturalistas em visita ao Brasil entre os séculos XVII e XIX.
**Não há extração automática de texto** — diferente do BioCultDB, que tem o BioCultPapers como fonte de
aquisição automatizada, o BioCultNaturalistas não tem (nem terá) um equivalente: todo dado nasce de
transcrição e sistematização manual, feitas por quem lê a obra-fonte. **Não há contexto de curadoria**:
quem registra é quem sistematiza, e o registro é publicável no exato momento da gravação — não existe um
estado intermediário "pendente" nem um segundo papel de aprovação. A responsabilidade pela qualidade do
dado recai inteiramente sobre quem o registra, apoiada pelo vocabulário controlado do BioCultTermos (ver
`docs/decisions/ADR-003-fonte-de-vocabulario-bioculttermos.md`).

## Requisitos Funcionais — Contexto Registro (porta 3001)

Cada requisito nomeia a entidade (`docs/decisions/data-model.md`) que a tela grava.

- **FR-R01**: O sistema DEVE prover CRUD completo de **Naturalista** (`bcn_naturalistas`): criar, listar,
  editar e excluir, com bloqueio de exclusão quando houver Viagem ou Obra dependente (ver "Integridade
  referencial" em `data-model.md`).
- **FR-R02**: O sistema DEVE prover CRUD completo de **Viagem** (`bcn_viagens`), incluindo um editor de
  **etapas ordenadas** — adicionar, reordenar (renumerar `ordem`) e remover etapas do roteiro, cada uma
  com localidade histórica, localidade atual, coordenadas e `precisaoGeografica`.
- **FR-R03**: O sistema DEVE prover CRUD completo de **Obra** (`bcn_obras`), com um seletor de **obra
  principal** exibido sempre que `tipoRelacao !== "principal"` — restrito a obras existentes cujo
  `tipoRelacao` seja `"principal"` (hierarquia de um único nível).
- **FR-R04**: O sistema DEVE prover CRUD completo de **Táxon** (`bcn_taxons`), com **busca-e-reuso** por
  `nomeCientificoObra` normalizado ao criar uma nova Evidência: se o nome (normalizado) já existir, a
  tela deve oferecer reaproveitar o registro existente em vez de criar um duplicado.
- **FR-R05**: O sistema DEVE prover o **formulário de Evidência** (`bcn_evidencias`), fluxo principal da
  ferramenta, na sequência: (1) escolher a Obra; (2) escolher ou criar o Táxon (FR-R04); (3) transcrever
  o trecho-fonte (`trechoTranscrito`, opcionalmente `traducaoTrecho`); (4) adicionar N usos como linhas
  incrementais via HTMX — mesmo padrão de `POST /plant/add/:communityIndex` em
  `D:/git/BioCultDB/backend/src/contexts/acquisition/routes.js:36-45`, adaptado para
  `POST /evidencia/uso/add/:idx`; (5) preencher contexto geográfico e sociocultural; (6) escolher
  `confiabilidade` (sem default) e `sensibilidade` (default `"publico"`).
- **FR-R06**: O contexto Registro DEVE exibir **todas** as evidências, independentemente de
  `sensibilidade` (ver "Regra de visibilidade" abaixo).

## Requisitos Funcionais — Contexto Apresentação (porta 3003)

- **FR-A01**: O sistema DEVE prover uma **página inicial por Naturalista**, listando biografia,
  `contextoVinda`, período no Brasil, viagens e obras associadas.
- **FR-A02**: O sistema DEVE prover uma **página de Obra** exibindo sua árvore de derivadas (obra
  principal + reedições/traduções/comentadas/estudos/fac-símiles que a referenciam via
  `obraPrincipalId`) e a lista de evidências daquela obra.
- **FR-A03**: O sistema DEVE prover uma **página de Táxon** agregando **todas** as evidências daquele
  táxon em **todas** as obras que o citam — é exatamente o que a escolha de modelo multi-tabela
  (`data-model.md`, seção "Por que multi-tabela") viabiliza sem varredura de `json_each` na base
  inteira.
- **FR-A04**: O sistema DEVE prover **busca FTS5** sobre evidências (`bcn_evidencias_fts`), com filtros
  combináveis (E lógico) por: naturalista, obra, categoria de uso, parte usada, povo/comunidade e
  estado.
- **FR-A05**: O sistema DEVE prover **visualização do roteiro de viagem**, com suas etapas em ordem,
  localidades e — quando `precisaoGeografica` permitir — mapa/coordenadas.
- **FR-A06**: O sistema DEVE prover um **painel de estatísticas**, equivalente ao `/painel` do
  BioCultDB: contagens por entidade, por categoria de uso, por estado, por naturalista/período.
- **FR-A07**: O contexto Apresentação DEVE exibir, junto a cada evidência, o rótulo de
  `confiabilidade` ("explícita"/"inferida" — ver FR-R05 e `data-model.md`).

## Regra de Visibilidade

Regra única atravessando os dois contextos e o endpoint de federação:

- **FR-V01**: O contexto **Apresentação** (3003) e o endpoint `GET /api/federation/records`
  (`docs/roadmap.md` F6) DEVEM expor **exclusivamente** evidências com `sensibilidade === "publico"`.
  Evidências `"restrito"` NUNCA aparecem em resultado de busca pública, página de obra/táxon/naturalista
  pública, painel de estatísticas público, ou harvest de federação.
- **FR-V02**: O contexto **Registro** (3001) exibe **todas** as evidências, sem filtro de
  `sensibilidade` — quem registra precisa ver e poder editar tudo o que já sistematizou.

## Não Requisitos

Cada item abaixo é uma subtração deliberada em relação ao BioCultDB (`docs/promptInicial.md`), não uma
lacuna a preencher depois:

- **Interface de curadoria**: não existe contexto/porta de curadoria; não há segundo papel de revisão.
- **Workflow de status/aprovação**: nenhuma tabela tem coluna `status`; nada fica "pendente".
- **Entidade Comunidade autônoma**: comunidades/povos tradicionais aparecem como vocabulário controlado
  dentro de `bcn_evidencias.contextoSociocultural.povosOuComunidades`, nunca como registro próprio numa
  tabela `bcn_comunidades` — ao contrário do `comunidades[]` do BioCultDB.
- **Extração automática de texto**: não existe (nem está planejado) um "BioCultNaturalistas Papers"
  equivalente ao BioCultPapers; toda entrada é manual.
- **Resolução taxonômica online**: `nomeCientificoAtual` é campo de texto livre, sem consulta a Flora e
  Funga do Brasil, GBIF ou qualquer serviço externo (ver `data-model.md`, entidade Táxon).
- **CLPI (Consentimento Livre, Prévio e Informado)**: a fonte é obra histórica já publicada, sem autor
  vivo a consultar; o tratamento ético correspondente é o campo `sensibilidade`, não um protocolo de
  CLPI (ver ADR-002 M8).

## Entidades-Chave

Ver `docs/decisions/data-model.md` para os schemas completos. Resumo:

- **Naturalista**: autor/fonte da obra; biografia e contexto de sua vinda ao Brasil.
- **Viagem**: roteiro ordenado percorrido por um ou mais naturalistas.
- **Obra**: a referência publicada (relato, edição, tradução, estudo), com auto-relação para derivadas.
- **Táxon**: a espécie citada, com nome-na-obra e nome atual (manual) separados.
- **Evidência**: entidade central — o trecho transcrito que liga uma Obra a um Táxon, com os usos
  registrados, contexto geográfico/sociocultural, confiabilidade e sensibilidade.

## Critérios de Sucesso

- **SC-001**: Toda tela do contexto Registro (FR-R01 a FR-R05) grava um documento válido segundo as
  regras de `data-model.md` na primeira submissão, sem exigir retrabalho por erro de schema.
- **SC-002**: A página de Táxon (FR-A03) retorna evidências de múltiplas obras sem exigir mais que uma
  consulta indexada por `taxon_id`.
- **SC-003**: A busca FTS5 (FR-A04) responde a uma consulta combinando os seis filtros descritos sem
  degradação perceptível até a ordem de milhares de evidências.
- **SC-004**: Uma evidência marcada `sensibilidade: "restrito"` nunca aparece em nenhuma superfície do
  contexto Apresentação nem no harvest de federação (verificável por inspeção direta do endpoint/rota).

## Premissas

- O arquivo SQLite em `SQLITE_DB_PATH` é compartilhado com uma instância soberana do BioCultTermos
  (tabelas `etnotermos_*`), nunca criado ou lido por outra ferramenta.
- Cada instância do BioCultNaturalistas é soberana por projeto de sistematização (`integracao.md` §0),
  sem dado compartilhado entre projetos.
- Interface em português do Brasil, sem internacionalização.
- Sem autenticação nos contextos Registro/Apresentação nesta fase de especificação — decisão de
  segurança de acesso (rede/infraestrutura vs. aplicação) fica para a fase de implementação (F4/F5 do
  roadmap), seguindo o princípio de segurança desde o início de `docs/principiosDesenvolvimento.md`.

## Dependências

- `docs/decisions/data-model.md` — schemas e regras de integridade que estes requisitos assumem.
- `docs/decisions/ADR-002-modelo-de-dados-e-contextos.md` — decisões de contexto/porta e de C.A.R.E.
  que este documento aplica.
- BioCultTermos (submodule) generalizado conforme
  `docs/decisions/ADR-003-fonte-de-vocabulario-bioculttermos.md` — bloqueante de qualquer tela que
  dependa de vocabulário controlado (F1 do roadmap).

## Fora de Escopo

- Tudo listado em "Não Requisitos" acima.
- Implementação de código (rotas, views, modelos) — este documento é especificação, não entrega F4/F5
  do `docs/roadmap.md`.
- Autenticação e controle de acesso granular — quando necessário, decisão de produto separada.
- Exportação de dados (CSV/JSON) e API pública além do endpoint de federação (`docs/roadmap.md` F6).
