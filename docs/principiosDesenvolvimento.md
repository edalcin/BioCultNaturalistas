# Principios

Siga o "look and feel" e todo o stack tecnológico da ferramenta já desenvolvida na arquitetura: BioCultDB (./../BioCultDB)

Respeite a arquitetura biocultural, em "../../Arquitetura-BioCultural"

## Versionamento (Git)

- Commitar **sempre** no branch `main`. Nunca criar novos branches.
- Nunca commitar credenciais, tokens, senhas ou segredos. Usar placeholders genéricos (ex.: `YOUR_API_KEY`, `<DB_PATH>`).
- Fornecer um arquivo `.env.example` com as variáveis necessárias e garantir que `.env` esteja no `.gitignore`.

## Empacotamento e Implantação (Docker)

- Publicar a imagem em `ghcr.io/edalcin/<nome-da-ferramenta>`.
- Priorizar a simplicidade do stack e o **menor tamanho de imagem possível** (multi-stage build, base mínima como Alpine ou distroless, dependências enxutas).
- Criar **workflow do GitHub Actions** que faça build e push de uma nova imagem a cada mudança no código (push para `main`), com tags `latest` e do commit (SHA).
- Fornecer **instruções específicas de instalação no UNRAID** via interface gráfica (Docker → Add), incluindo: mapeamento de portas, mapeamento do volume do `DB_PATH` e configuração das variáveis de ambiente.

## Segurança (desde o início)

A ferramenta em produção deve ser tão segura e inviolável quanto possível. No mínimo:

- Container roda como usuário **não-root**.
- Nenhum segredo embutido na imagem ou no repositório; tudo via variável de ambiente.
- Validação e sanitização de toda entrada do usuário.
- Dependências mínimas e atualizadas; habilitar verificação de vulnerabilidades no CI (ex.: Dependabot e/ou Trivy).
- Headers de segurança HTTP adequados e aplicação do princípio do menor privilégio.