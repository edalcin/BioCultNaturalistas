# Próximos Passos — BioCultNaturalistas

> **Documento de estado desta unidade.** Registra onde o BioCultNaturalistas está e o que falta fazer. Ponto de entrada de qualquer nova sessão de trabalho — humana ou assistida por IA.
>
> Pendência de arquitetura da federação **não** mora aqui: mora em [`Arquitetura-BioCultural/docs/proximosPassos.md`](https://github.com/edalcin/Arquitetura-BioCultural/blob/main/docs/proximosPassos.md), que é a referência única do projeto. Aqui ficam só as pendências desta unidade.
>
> **Regras de manutenção:** ao final de cada sessão, atualizar a data, o estado e a lista de pendências. Pendência resolvida não é apagada: é marcada como feita, com o `onde`. Caminhos são relativos à raiz deste repositório.

**Estado em:** 2026-08-30

---

## 1. Estado

**Só documentação de fundação (F0 concluída).** O roadmap de sete fases está escrito, as ADRs existem e o submodule BioCultTermos foi adicionado. O código é um `server.js` que serve a home page: nenhuma persistência, nenhum CRUD, nenhum contexto HTTP implementado.

É a unidade das **obras dos séculos XVII–XIX**: registro de naturalistas, viagens, obras, táxons e evidências. Registro sempre de regime `evidencia`. Estudo de caso: mestrado de Camila Nascimento Dantas (PPG em Botânica, ENBT/JBRJ), que cruza a *Historia Naturalis Brasiliae* (Piso & Marcgrave, 1648) com o *Systema Materiae Medicae Vegetabilis Brasiliensis* (Martius, 1843) e com exsicatas digitalizadas (JABOT, Reflora) — hoje mantido em plataforma externa (GRIST), o que faz do mestrado também um teste de migração.

## 2. Pendências

Ordenadas pelo roadmap (`docs/roadmap.md`), F1 a F7.

| Fase | Pendência | Bloqueio |
|---|---|---|
| **F1** | **Generalizar o `AcquisitionService`** do BioCultTermos para aceitar lista de pares `{tabela, campos[]}` | **Bloqueante de tudo**; o código vive no BioCultDB |
| **F2** | Scaffold de empacotamento: `docker/Dockerfile.unidade`, `start-unit.sh`, CI com submodule recursivo | F1 |
| **F3** | Persistência SQLite+JSON1 com as cinco tabelas (`naturalistas`, `viagens`, `obras`, `taxons`, `evidencias`) e FTS5 | F2 |
| **F4–F5** | Contextos de Registro e Apresentação | F3 |
| **F6** | Endpoint de harvest paginado, com redação na fronteira | F3 + contrato de harvest da arquitetura (ADR-016) |
| **F7** | Documentação operacional e runbook de implantação | F6 |
| — | **ADR-003 V2**: remover `bcn_taxons → $.nomeCientificoAtual` do contrato de campos monitorados | Emenda da ADR-014 N3 da arquitetura (2026-08-10); pendência aberta desde a v3.6.0 |

### Requisitos que o estudo de caso impõe e ainda não têm campo

- Nomenclatura pré-linneana transposta para o binômio **sem perder a grafia original**.
- Nomes vernaculares rastreados na persistência, variação ou substituição entre séculos.
- Atribuição de autoria aos detentores silenciados sob a homogeneização linguística do "tupi" — é o regime enunciativo (ADR-015) aplicado à fonte histórica.
- Evidência física (exsicata) ligada ao enunciado de uso.
- Migração do conjunto hoje mantido no GRIST, com conformidade ao UDM verificada.

## 3. Onde está cada coisa

| Artefato | Caminho |
|---|---|
| Roadmap de sete fases, com critério de conclusão | `docs/roadmap.md` |
| Contrato de campos monitorados (V2) | `docs/decisions/ADR-003-fonte-de-vocabulario-bioculttermos.md` |
| Checklist de integração BioCultTermos | `integracao.md` |
| Escopo e fontes históricas | `docs/naturalistas.md` |
| Referência única do projeto | <https://github.com/edalcin/Arquitetura-BioCultural/blob/main/docs/proximosPassos.md> |
