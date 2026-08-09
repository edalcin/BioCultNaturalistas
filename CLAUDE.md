## BioCultTermos — onde manter o código

O `bioculttermos/` deste repositório é a **Cópia de Trabalho** do Módulo Compartilhado BioCultTermos
nesta Unidade Hospedeira — não é um sub-repositório nem um clone descartável. É aqui que se edita o
código do BioCultTermos quando a mudança é motivada pelo BioCultNaturalistas.

Regras vigentes — ADR-012 em `Arquitetura-BioCultural/docs/architecture-decisions/`, que **supersede
parcialmente ADR-007 F3 e ADR-010** no ponto em que declaravam o bump entre unidades opcional:

- **Nunca** clone o BioCultTermos fora de uma Unidade Hospedeira (G2). Um clone standalone não pode ser
  executado nem testado desde o ADR-007 F2, e só envelhece até divergir.
- Antes de editar: `git -C bioculttermos pull --ff-only`. Se falhar, há commit local esquecido — resolva
  antes de tocar em qualquer coisa.
- Edite aqui apenas o que o BioCultNaturalistas motivou, e teste na unidade antes de publicar.
- Todo commit precisa ser **seguro para as quatro unidades** (G4/G5): nada específico desta unidade entra
  no código do módulo.
- Commit + push ao remoto compartilhado e registro em `bioculttermos/CHANGELOG.md` continuam
  obrigatórios (ADR-010 G2). Com `push.recurseSubmodules=on-demand`, o `git push` na raiz publica o
  módulo e o ponteiro juntos.
- A adoção de novas versões do módulo é **obrigatória e assíncrona** (G4), não mais opcional: esta
  unidade deve zerar seu Atraso de Módulo, no seu tempo.
- Veja o Atraso de Módulo das quatro unidades: `pwsh Arquitetura-BioCultural/bin/termos-status.ps1`.

**Build Docker**: quando o `Dockerfile.unidade` deste repositório existir, copiar o padrão de
`BioCultDB/docker/build-unidade.sh` (falha o build se o submodule local não bater com o commit pinado,
carimba `/app/BUILD_INFO` com os SHAs de ambos os repositórios) — ADR-010 G3.

Estratégia completa: `Arquitetura-BioCultural/docs/gestaoBioCultTermos/`

## Arquitetura v3.1 — Persistência
Persistência = SQLite com JSON (JSON1), **um arquivo por unidade federada** compartilhado pelas ferramentas (tabelas distintas), WAL, `SQLITE_DB_PATH`. Um container por unidade. Sem MongoDB.
Ref.: Arquitetura-BioCultural/docs/architecture-decisions/ADR-005.
