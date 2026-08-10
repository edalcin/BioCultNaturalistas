# ADR-002: Modelo de dados e contextos do BioCultNaturalistas

## Status

**Aceito** — Julho 2026

## Contexto

`docs/promptInicial.md` pediu a documentação — sem código — dos fundamentos de produto do
BioCultNaturalistas: uma estrutura de dados que registre com fidelidade a vinda de naturalistas ao Brasil
(séc. XVII–XIX), suas obras e relatórios, as evidências de biodiversidade neles contidas e o uso dessa
biodiversidade pela sociedade da época. O "look and feel" e o stack tecnológico são herdados do BioCultDB
(`docs/principiosDesenvolvimento.md`), com três subtrações pedidas explicitamente: sem interface de
curadoria, sem entidade de comunidades como entidade central, e espécies associadas às **referências**
(obras), não a comunidades.

Esta ADR registra as decisões estruturais tomadas a partir desse pedido — o modelo de dados propriamente
dito está em `docs/decisions/data-model.md`; os requisitos funcionais que ele suporta estão em
`docs/decisions/spec.md`. Aqui ficam o **porquê** de cada decisão e suas consequências.

## Decisão

### M1 — Cinco tabelas-documento com prefixo `bcn_`

O BioCultNaturalistas usa cinco tabelas-documento independentes (`bcn_naturalistas`, `bcn_viagens`,
`bcn_obras`, `bcn_taxons`, `bcn_evidencias`), ligadas por id, em vez de um único doc-raiz nos moldes de
`biocultdb_records` do BioCultDB (que embute `comunidades[].plantas[]` dentro da Referência).

**Justificativa**: uma obra de naturalista (ex. Martius, Spruce) pode conter centenas de evidências de
uso de biodiversidade. Embutir todas elas dentro do documento da Obra criaria um documento de tamanho
ilimitado e obrigaria a consulta "todas as evidências de um táxon, em todas as obras" — um requisito
central de produto (`docs/promptInicial.md`) — a varrer `json_each` sobre a base inteira em vez de usar
um índice direto sobre `taxon_id`.

**Alternativa descartada**: espelhar literalmente `biocultdb_records`, com Evidência embutida dentro de
Obra. Rejeitada pelo motivo de crescimento ilimitado de documento acima.

### M2 — Ausência de workflow de curadoria

Nenhuma das cinco tabelas tem coluna ou campo `status`. Um registro é publicável no momento exato em que
é gravado — não existe estado `pending`/`approved`/`rejected` nem um segundo papel de aprovação.

**Consequência**: a qualidade do dado depende inteiramente de quem registra. O único controle de
qualidade disponível é o vocabulário controlado do BioCultTermos (categorias de uso, partes usadas,
povos/comunidades, tipos de acervo — ver ADR-003), que atua como convergência posterior, não como
aprovação prévia.

### M3 — Comunidade não é entidade

`bcn_evidencias.contextoSociocultural.povosOuComunidades` é um array de vocabulário controlado dentro da
evidência — não existe tabela `bcn_comunidades`.

Isso é exatamente o que separa esta unidade do BioCultDB, cujo doc-raiz tem `comunidades[]` como array
**obrigatório** e estrutural (`D:/git/BioCultDB/backend/src/models/Reference.js:25-42`): no BioCultDB a
Comunidade é a entidade organizadora (Referência → Comunidades → Plantas); no BioCultNaturalistas a
Evidência é a entidade central e a comunidade é um atributo qualificador dela, não um nó da hierarquia.

### M4 — Espécie ligada à obra pela evidência

Não há relação direta táxon ↔ obra (nenhum array `taxonIds` em `bcn_obras`, nenhum array `obraIds` em
`bcn_taxons`). Toda associação passa por `bcn_evidencias`, que carrega o `obraId`, o `taxonId` e o
trecho-fonte transcrito.

**Consequência deliberada**: não é possível registrar "esta obra menciona esta espécie" sem transcrever
o trecho que sustenta essa afirmação. É o mecanismo que garante rastreabilidade — todo vínculo
espécie-obra é auditável até a citação exata na fonte (`citacaoNaObra.volume/pagina/prancha`).

### M5 — Nome científico aceito atual é campo manual

`bcn_taxons.nomeCientificoAtual` é texto livre, preenchido manualmente, sem consulta a serviços externos
(Flora e Funga do Brasil, GBIF ou equivalente).

**Justificativa**: zero dependência de rede, de segredo (chave de API) ou de cache local, e imagem
Docker menor — alinhado a `docs/principiosDesenvolvimento.md:16` ("priorizar a simplicidade e o tamanho
do docker"). O BioCultTermos acumula `nomeCientificoAtual` e `nomesVernaculares[].nome` como conceitos
candidatos, funcionando como o mecanismo de convergência dos nomes ao longo do tempo, sem que o
BioCultNaturalistas precise implementar resolução taxonômica própria.

> **Retificação (2026-08-10)**: o parágrafo acima está incorreto quanto ao papel do BioCultTermos.
> Nomenclatura científica saiu do escopo do vocabulário controlado da federação — o BioCultTermos
> **não** acumula mais `nomeCientificoAtual` como conceito candidato
> (`Arquitetura-BioCultural/docs/architecture-decisions/ADR-014-nomenclatura-cientifica-fora-do-vocabulario.md`,
> N1, N3); apenas `nomesVernaculares[].nome` continua acumulado normalmente. A decisão de M5 acima —
> `nomeCientificoAtual` como campo manual de `bcn_taxons`, sem lookup externo — **permanece
> integralmente válida** (ADR-014 N2): nada muda na captura, validação ou exibição do campo. Só a
> convergência dos dois nomes ao longo do tempo deixa de passar por um conceito espelho no
> BioCultTermos e passa a ser a co-ocorrência dos dois nomes no mesmo registro do táxon (ADR-014 N4).

### M6 — Derivadas por auto-relação de nível único

Uma Obra tem `tipoRelacao` (`"principal"|"reedicao"|"traducao"|"comentada"|"estudo"|"fac-simile"`) e
`obraPrincipalId`, na mesma entidade — não duas entidades separadas ("Obra" e "Edição/Derivada").

**Regra**: `tipoRelacao === "principal"` ⟺ `obraPrincipalId === null`. Qualquer outro valor exige
`obraPrincipalId` apontando para uma Obra existente cujo `tipoRelacao` seja `"principal"` — hierarquia de
um único nível, sem derivada de derivada. Isso responde diretamente ao pedido de
`docs/promptInicial.md`: "o BioCultNaturalistas deve poder associar referências diversas à referência
principal (o relato dos naturalistas em si), cada qual com conjuntos de dados específicos".

### M7 — Contextos e portas: Registro 3001, Apresentação 3003

O BioCultNaturalistas tem dois contextos HTTP: **Registro** (3001, entrada e edição de dados — inclui o
que seria "aquisição" no BioCultDB) e **Apresentação** (3003, busca e visualização pública). **A porta
3002 fica deliberadamente vaga** — não é reatribuída a nenhum contexto — para marcar visualmente a
ausência de curadoria (M2) e para nunca colidir com o significado que 3002 tem no BioCultDB
(Curadoria). BioCultTermos usa 4000 (público) / 4001 (admin), fixos pelo próprio código do submodule,
independente da ferramenta que o acompanha.

**Esta decisão fecha o ponto 8 em aberto** de
`docs/decisions/ADR-001-integracao-bioculttermos.md:88-91` ("Portas do próprio BioCultNaturalistas [...]
ainda não estão definidas") e de `integracao.md:78-82` ("Portas da ferramenta principal desta unidade —
ainda não definidas").

### M8 — `sensibilidade` e `confiabilidade` como tratamento operacional de C.A.R.E. e de fidelidade

`bcn_evidencias.sensibilidade` (enum `"publico"|"restrito"`, default `"publico"`) e
`bcn_evidencias.confiabilidade` (enum `"explicita"|"inferida"`, **sem default**) são decisões novas desta
ADR:

- `sensibilidade` fecha o ponto deixado explicitamente aberto por
  `docs/decisions/ADR-001-integracao-bioculttermos.md:96-104` (ponto 10: "Tratamento operacional desse
  princípio [...] é decisão de produto do BioCultNaturalistas, fora do escopo desta ADR") e por
  `integracao.md` §2.5 (`:94-104`: "Tratamento operacional [...] é decisão de produto do
  BioCultNaturalistas — fora do escopo desta integração com BioCultTermos"). **Regra**: uma evidência com
  `sensibilidade === "restrito"` NUNCA sai no harvest de federação (`GET /api/federation/records`, ver
  `docs/roadmap.md` F6) nem aparece na busca pública do contexto Apresentação — permanece acessível
  apenas no contexto Registro. Isso é o tratamento operacional de C.A.R.E. (Collective Benefit, Authority
  to Control, Responsibility, Ethics) sem CLPI: como a fonte é uma obra histórica já publicada, sem autor
  vivo a consultar, a autoridade sobre a divulgação recai sobre quem sistematiza, exercida através deste
  campo.
- `confiabilidade`, sem default, força a distinção entre uso **afirmado no trecho transcrito**
  (`"explicita"`) e uso **interpretado** por quem sistematiza (`"inferida"`) — é o mecanismo de fidelidade
  que sustenta o requisito de "registro fiel e preciso" da vinda dos naturalistas.

## Consequências

### Positivas

- A consulta "todas as evidências de um táxon, em todas as obras" (requisito central de produto) é uma
  busca indexada por `taxon_id`, não uma varredura `json_each` na base inteira (M1).
- A ausência de curadoria (M2) simplifica o modelo e a stack — sem segundo papel, sem tabela de estado
  — ao custo de mover toda a responsabilidade de qualidade para quem registra.
- Comunidade como vocabulário, não entidade (M3), evita duplicar a mesma decisão de modelagem do
  BioCultDB onde ela não se aplica: aqui a evidência é sempre "obra diz X sobre espécie Y", e a
  comunidade é um qualificador do uso, não o sujeito organizador do registro.
- Rastreabilidade obrigatória espécie↔obra via trecho transcrito (M4) é evidência auditável desde o
  primeiro registro, sem retrabalho posterior.
- M5 mantém a imagem Docker pequena e sem dependência de rede em tempo de escrita — alinhado ao
  princípio de simplicidade do stack.
- M7 fecha uma decisão que estava bloqueando duas ADRs de outras unidades (BioCultDB, Arquitetura
  BioCultural) havia mais de duas semanas.
- M8 dá um mecanismo concreto e verificável (filtro de query) para C.A.R.E. sem exigir um protocolo de
  CLPI que não faz sentido para fonte histórica.

### Negativas

- M1 (multi-tabela) exige que toda validação de integridade referencial seja feita na camada de
  aplicação, nunca por FK nativa do SQLite (`foreign_keys=ON` não alcança ids dentro de JSON).
  - *Mitigação*: lista completa e nomeada das checagens em `docs/decisions/data-model.md`, seção
    "Integridade referencial" — nenhuma delas é implícita.
- M2 (sem curadoria) significa que um erro de registro fica público imediatamente, sem revisão prévia.
  - *Mitigação*: fora de escopo desta ADR reabrir; se o volume de instâncias justificar, uma futura ADR
    pode avaliar um modo de correção pós-publicação (não é reintrodução de curadoria, é edição direta,
    já coberta pelo CRUD do contexto Registro).
- M6 (hierarquia de um nível) não cobre o caso hipotético de uma tradução de uma reedição.
  - *Mitigação*: nenhuma obra levantada em `docs/naturalistas.md` exige esse caso; se aparecer, a
    obra intermediária pode ser registrada como `tipoRelacao: "reedicao"` da principal, e a tradução
    aponta para essa mesma principal — perda de precisão aceitável frente à simplicidade do modelo.

## Referências

- `docs/decisions/data-model.md` — modelo de dados completo que esta ADR decide.
- `docs/decisions/spec.md` — requisitos funcionais suportados por este modelo.
- `docs/decisions/ADR-001-integracao-bioculttermos.md` — pontos 6, 8 e 10 fechados/apertados por esta
  ADR e pela ADR-003.
- `D:/git/Arquitetura-BioCultural/docs/architecture-decisions/ADR-004-federated-architecture.md` —
  contrato do endpoint de federação referenciado em M8.
- `D:/git/Arquitetura-BioCultural/docs/architecture-decisions/ADR-005-sqlite-json-persistence.md` —
  padrão de arquivo SQLite compartilhado por unidade.
- `D:/git/Arquitetura-BioCultural/docs/architecture-decisions/ADR-007-shared-bioculttermos-module.md` —
  padrão de submodule compartilhado do BioCultTermos.
- `Arquitetura-BioCultural/docs/architecture-decisions/ADR-014-nomenclatura-cientifica-fora-do-vocabulario.md`
  — retira nomenclatura científica do escopo do vocabulário controlado da federação; retifica a
  afirmação sobre o BioCultTermos em M5 acima (ver nota).
- `docs/naturalistas.md` — fonte que originou os requisitos de fidelidade histórica (M4, M6, M8).

## Data de Revisão

Revisitar quando (a) a Fase F3 do `docs/roadmap.md` (persistência e modelo) for implementada e revelar
necessidade de ajuste nos schemas, ou (b) o volume de instâncias soberanas justificar reabrir M2 (ver
Consequências Negativas).
