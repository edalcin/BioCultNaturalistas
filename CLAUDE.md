## Regra: Mudanças no submódulo `bioculttermos`

Quando este repositório tiver o submódulo `bioculttermos/` integrado (ver `integracao.md`), toda
alteração de código feita dentro dele segue este fluxo — ver ADR-007 e ADR-010 em
`Arquitetura-BioCultural/docs/architecture-decisions/`:

1. **Commit + push para o remoto compartilhado** (obrigatório): `cd bioculttermos && git push origin main`.
2. **Documentar em `BioCultTermos/CHANGELOG.md`** (obrigatório) — data, unidade de origem
   (BioCultNaturalistas), resumo, SHA. O BioCultTermos é a documentação central do módulo compartilhado
   (ADR-010 G2).
3. **Bump do ponteiro + commit neste repositório** (obrigatório): `cd .. && git add bioculttermos && git commit`.
4. **Bump nas outras unidades hospedeiras é opcional** (ADR-007 F3, reafirmado pelo ADR-010) — cada uma
   decide quando incorporar.

**Build Docker**: quando o `Dockerfile.unidade` deste repositório existir, copiar o padrão de
`BioCultDB/docker/build-unidade.sh` (falha o build se o submodule local não bater com o commit pinado,
carimba `/app/BUILD_INFO` com os SHAs de ambos os repositórios) — ADR-010 G3.

## Arquitetura v3.1 — Persistência
Persistência = SQLite com JSON (JSON1), **um arquivo por unidade federada** compartilhado pelas ferramentas (tabelas distintas), WAL, `SQLITE_DB_PATH`. Um container por unidade. Sem MongoDB.
Ref.: Arquitetura-BioCultural/docs/architecture-decisions/ADR-005.
