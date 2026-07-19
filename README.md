# BioCultNaturalistas

Registro de evidências da relação de comunidades tradicionais com a biodiversidade, presentes em **obras e relatórios de naturalistas em visita ao Brasil nos séculos XVII, XVIII e XIX**.

[![GitHub](https://img.shields.io/badge/GitHub-BioCultNaturalistas-181717?logo=github)](https://github.com/edalcin/BioCultNaturalistas)

> **Status**: Fase inicial — apenas repositório e documentação.

---

## O que é o BioCultNaturalistas?

O **BioCultNaturalistas** é o componente da [Arquitetura BioCultural](https://github.com/edalcin/Arquitetura-BioCultural) dedicado a registrar e tornar rastreáveis as evidências de conhecimento tradicional associado à biodiversidade documentadas nas obras de naturalistas que visitaram o Brasil entre os séculos XVII e XIX — uma fonte histórica rica e ainda pouco sistematizada, complementar às fontes secundárias (artigos científicos, via [BioCultDB](https://github.com/edalcin/BioCultDB)), primárias (registro de campo, via [BioCultRelatos](https://github.com/edalcin/BioCultRelatos)) e aos acervos históricos e museológicos (via [BioCultAcervos](https://github.com/edalcin/BioCultAcervos)).

## Posição na Arquitetura Federada

Na arquitetura federada da [Arquitetura BioCultural](https://github.com/edalcin/Arquitetura-BioCultural), o BioCultNaturalistas será o componente central de um novo tipo de membro — **Obras de Naturalistas (séc. XVII–XIX)** — seguindo o mesmo padrão de soberania dos demais membros: container próprio, arquivo SQLite+JSON compartilhado com uma instância soberana do [BioCultTermos](https://github.com/edalcin/BioCultTermos), e endpoint de harvest REST para o [Pluriverso](https://github.com/edalcin/pluriverso). A camada semântica dessa instância é gerida pelo BioCultTermos embutido (vocabulários soberanos do membro); o Pluriverso unifica essa camada com as dos demais membros por meio de mapeamentos SKOS-XL (`skos:exactMatch`, `skos:closeMatch`, `skos:broadMatch`), sem jamais assumir a posse dos vocabulários.

**Integração técnica com BioCultTermos**: via git submodule, seguindo o mesmo padrão já em produção no BioCultDB e planejado no BioCultRelatos — repositório único compartilhado entre as unidades, congelado como produto standalone (ver [ADR-007](https://github.com/edalcin/Arquitetura-BioCultural/blob/main/docs/architecture-decisions/ADR-007-shared-bioculttermos-module.md) da Arquitetura BioCultural). Detalhes desta integração específica em `docs/decisions/ADR-001-integracao-bioculttermos.md` e `integracao.md`.

## Princípios C.A.R.E.

Assim como os demais componentes da federação, o BioCultNaturalistas respeitará pleno e absolutamente os princípios **C.A.R.E.** (Collective Benefit, Authority to Control, Responsibility, Ethics): mesmo quando a evidência vem de uma obra histórica de séculos passados, a autoridade sobre como o conhecimento tradicional nela descrito é registrado e compartilhado permanece com a comunidade a que ele se refere.

## Contato

[GitHub Issues](https://github.com/edalcin/BioCultNaturalistas/issues) · edalcin@jbrj.gov.br

---

## Agradecimentos

A formulação desta proposta técnica e a consolidação de sua visão ética e conceitual não seriam possíveis sem os diálogos, provocações e insights preciosos de parceiros fundamentais. Registro meu profundo agradecimento à Viviane Fonseca, do Jardim Botânico do Rio de Janeiro (JBRJ); ao Lucas Zelesco, da Fundação Nacional dos Povos Indígenas (FUNAI); e aos membros do Comitê Gestor Useflora, cuja dedicação à salvaguarda da sociobiodiversidade e ao respeito às comunidades tradicionais inspirou cada linha de código e de arquitetura deste projeto.
