# ADR-003: Fonte de vocabulário do BioCultTermos para o BioCultNaturalistas

## Status

**Aceito** — Julho 2026

> **Emenda 2026-08-10**: o contrato V2 abaixo foi revisado — `$.nomeCientificoAtual` deixou de ser
> campo monitorado, por força de
> `Arquitetura-BioCultural/docs/architecture-decisions/ADR-014-nomenclatura-cientifica-fora-do-vocabulario.md`
> (N1, N3). Ver a nota após a tabela V2 e "Data de Revisão".

## Contexto

`docs/decisions/ADR-001-integracao-bioculttermos.md` ponto 6 (`:69-83`) já decidiu que o
`AcquisitionService` do BioCultTermos precisa ser generalizado: hoje ele lê, hardcoded, a tabela
`biocultdb_records` do BioCultDB com uma lista fixa de campos (`comunidades.tipo`,
`comunidades.plantas.nomeVernacular`, `comunidades.plantas.tipoUso`, `comunidades.atividadesEconomicas`).
A decisão registrada foi generalizar para **uma** tabela-fonte configurável e **uma** lista de campos
monitorados — no singular, porque na época da ADR-001 o desenho de dados do BioCultNaturalistas ainda não
existia.

O modelo definido em `docs/decisions/data-model.md` (ADR-002 M1) tem os termos candidatos ao BioCultTermos
espalhados em **duas** tabelas, não uma:

- `bcn_evidencias`: `$.usos[*].categoriaUso`, `$.usos[*].partesUsadas[*]`,
  `$.contextoSociocultural.povosOuComunidades[*]`
- `bcn_taxons`: `$.nomeCientificoAtual`, `$.nomesVernaculares[*].nome`

> **Nota (2026-08-10)**: `$.nomeCientificoAtual` era, quando esta ADR foi escrita, candidato ao
> BioCultTermos.
> `Arquitetura-BioCultural/docs/architecture-decisions/ADR-014-nomenclatura-cientifica-fora-do-vocabulario.md`
> (N1, N3) retirou nomenclatura científica do escopo do vocabulário controlado da federação — ver a
> emenda ao contrato V2, abaixo. `$.nomesVernaculares[*].nome` não é afetado.

O desenho singular do `AcquisitionService` (uma tabela, uma lista de campos) não cobre esse caso sem
rodar duas configurações separadas ou fazer union de resultados manualmente na aplicação — esta ADR
aperta a decisão da ADR-001 ponto 6 para o formato real que o BioCultNaturalistas precisa.

## Decisão

### V1 — Generalização como lista de pares `{tabela, campos[]}`

O `AcquisitionService` do BioCultTermos DEVE aceitar uma **lista de pares `{tabela, campos[]}`** como
configuração — não uma tabela única com uma lista de campos, como a redação original da ADR-001 ponto 6
sugeria. Cada par declara uma tabela-fonte (`bcn_evidencias`, `bcn_taxons`, ou futuramente qualquer outra
tabela-documento de qualquer unidade) e os caminhos JSON, dentro dela, monitorados para candidatos a
conceito.

Isso é **requisito sobre o repositório compartilhado BioCultTermos** — trabalho de código lá, não neste
repositório de documentação — e é **bloqueante** da fase de integração, no mesmo sentido em que
`integracao.md:112-115` (passo 1 do checklist de implementação) já trata a generalização como pré-requisito
antes de tocar nesta unidade: "Confirmar que o `AcquisitionService` do BioCultTermos já foi generalizado
(§2.1) — se não, esse é o primeiro passo, no repositório BioCultTermos, antes de tocar nesta unidade."
Esta ADR estende esse bloqueio explicitamente ao formato de lista de pares, não apenas à configurabilidade
de nome de tabela/campos.

### V2 — Contrato inicial de campos monitorados

Os caminhos JSON listados no Contexto acima são o **contrato inicial** de campos monitorados desta
unidade, e esta ADR é quem os versiona (não a ADR-002, que decide o modelo de dados, nem a ADR-001, que
decide a integração operacional em geral):

| Tabela | Campo (caminho JSON) | Vira conceito candidato como |
|---|---|---|
| `bcn_evidencias` | `$.usos[*].categoriaUso` | categoria de uso (ex. "medicinal", "ritual") |
| `bcn_evidencias` | `$.usos[*].partesUsadas[*]` | parte da planta/organismo usada |
| `bcn_evidencias` | `$.contextoSociocultural.povosOuComunidades[*]` | povo ou comunidade tradicional |
| `bcn_taxons` | ~~`$.nomeCientificoAtual`~~ | ~~nome científico aceito atual~~ — **REMOVIDO pela ADR-014 N3** |
| `bcn_taxons` | `$.nomesVernaculares[*].nome` | nome vernacular |

> **Emenda 2026-08-10.** Nomenclatura científica saiu do escopo do vocabulário controlado da
> federação — decisão de
> `Arquitetura-BioCultural/docs/architecture-decisions/ADR-014-nomenclatura-cientifica-fora-do-vocabulario.md`
> (N1, N3). `$.nomeCientificoAtual` deixa de ser campo monitorado pelo `AcquisitionService`: nenhuma
> Unidade Hospedeira, incluindo esta, pode declarar caminho de nome científico como campo monitorado,
> nem hoje nem quando a travessia (V1 acima) virar configuração declarada pelo hospedeiro. O campo
> continua existindo, obrigatório e inalterado, como **dado** de `bcn_taxons` — formulário, validação,
> busca, exportação (ADR-014 N2; ver também ADR-002 M5 e `data-model.md`, entidade Táxon).
> `$.nomesVernaculares[*].nome` **permanece** no contrato V2, sem alteração. A ponte entre nome
> tradicional e nome científico deixa de ser prevista como relação entre conceitos do BioCultTermos e
> passa a ser a co-ocorrência dos dois nomes no mesmo registro de `bcn_taxons` (ADR-014 N4).

Alterações a este contrato (adicionar, remover ou renomear um caminho monitorado) exigem revisar esta
ADR — mantendo um único lugar de verdade para "o que o BioCultTermos varre nesta unidade", em vez de
espalhar a decisão pelo código do `AcquisitionService` e pelos schemas de `data-model.md` sem
sincronização documentada.

Note que `bcn_naturalistas.acervos[*].tipoAcervo` e `bcn_viagens.meiosDeTransporte[*]` /
`bcn_viagens.etapas[*].povosEncontrados[*]` também são campos de texto livre alimentados por vocabulário
do BioCultTermos (`data-model.md`, entidades Naturalista e Viagem), mas **não** entram no contrato V2
nesta primeira versão: o pedido original (`docs/promptInicial.md`) concentra o requisito de vocabulário
controlado em uso/parte/povo/nome-de-espécie. Incluí-los é extensão de escopo explícita para uma revisão
futura desta ADR, não uma omissão silenciosa.

> **Nota (2026-08-10)**: a expressão "nome-de-espécie" acima refletia o pedido original antes da
> emenda desta ADR. Hoje, apenas o nome vernacular do táxon é vocabulário controlado; o nome
> científico é dado de `bcn_taxons`, fora do escopo do BioCultTermos (ver emenda ao contrato V2).

## Consequências

### Positivas

- O `AcquisitionService` generalizado como lista de pares serve qualquer unidade futura da federação com
  qualquer número de tabelas-fonte, não apenas o caso de uma tabela — evita um segundo refactor quando a
  próxima unidade (ex. BioCultRelatos) também precisar de múltiplas tabelas-fonte.
- Ter os caminhos JSON monitorados em um único documento versionado (V2) evita que o contrato entre
  `data-model.md` e o código do BioCultTermos derive sem que ninguém perceba.

### Negativas

- V1 é trabalho de código real no repositório BioCultTermos, compartilhado por todas as unidades — não
  pode ser resolvido só com documentação neste repositório, e bloqueia o início de qualquer integração
  de aquisição de vocabulário desta unidade até ser feito.
  - *Mitigação*: já registrada como F1 em `docs/roadmap.md`, bloqueante de F3 em diante — mesma
    priorização que a ADR-001 já dava à generalização em geral.
- Duas tabelas-fonte monitoradas em vez de uma significa que o `AcquisitionService` generalizado precisa
  fazer duas varreduras (ou uma varredura por par) a cada execução, não uma.
  - *Mitigação*: aceitável — o volume de registros por instância soberana (um projeto de sistematização)
    é pequeno o suficiente para que o custo de duas varreduras seja irrelevante frente à simplicidade de
    manter a configuração como lista explícita.

## Referências

- `docs/decisions/ADR-001-integracao-bioculttermos.md` ponto 6 (`:69-83`) — decisão original que esta ADR
  aperta.
- `docs/decisions/ADR-002-modelo-de-dados-e-contextos.md` — modelo de dados de onde vêm os caminhos JSON
  do contrato V2.
- `docs/decisions/data-model.md` — schemas completos de `bcn_evidencias` e `bcn_taxons`.
- `integracao.md` §2.1 (`:64-71`) e §3 passo 1 (`:112-115`) — checklist de implementação que trata a
  generalização como bloqueante.
- `D:/git/BioCultDB/bioculttermos/backend/src/services/AcquisitionService.js` — código a generalizar.
- `Arquitetura-BioCultural/docs/architecture-decisions/ADR-014-nomenclatura-cientifica-fora-do-vocabulario.md`
  — retira nomenclatura científica do escopo do vocabulário controlado da federação (N1, N3); motivou a
  emenda de 2026-08-10 ao contrato V2 desta ADR.

## Data de Revisão

Revisitar assim que (a) o `AcquisitionService` for generalizado no repositório BioCultTermos no formato
de lista de pares decidido em V1, e/ou (b) a Fase F3 do `docs/roadmap.md` revelar necessidade de
monitorar campos adicionais além do contrato V2 (ex. `acervos[*].tipoAcervo`,
`etapas[*].povosEncontrados[*]`).

**Emenda 2026-08-10**: contrato V2 revisado — `$.nomeCientificoAtual` removido por força da
`Arquitetura-BioCultural/docs/architecture-decisions/ADR-014-nomenclatura-cientifica-fora-do-vocabulario.md`
(N1, N3). `$.nomesVernaculares[*].nome` inalterado. Ver nota no Status e no contrato V2.
