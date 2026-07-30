Quero dar os primeiros passos no planejamento da implementação desta ferramenta. Aqui vão os fundamentos e primeiras definições para documentação:

* Esta ferramenta é muito parecida com o @../BioCultDB pois também irá registrar evidências provenientes de referências bibliográficas. Porém, não haverá um "BioCultPapers" para extração de dados destas referências. Os dados serão entrados somente manualmente.
* Todo o "look and feel" e stack tecnológico desta ferramenta será o mesmo do @../BioCultDB, com as seguintes diferenças:
  * Não haverá uma interface para curadoria
  * Não haverá dados sobre comunidades
  * As espécies serão associadas às referências (relatórios publicados destes naturalistas)
* As grandes entidades serão
  * as espécies
    * nomes científicos (descritos nas referências), nomes vernaculares e nomes científicos válidos atuais
    * Usos das plantas associados à partes das plantas e a eventuais contextos geográficos (locais, estados, etc.) e socioculturais (povos. comunidades tradicionais, etc.)
  * Referências e seus autores (naturalistas)
    * Citação "clássica" das referências
    * Descrição biográfica dos naturalistas
    * Contexto histórico, social, econômico etc. da vinda dos naturalistas
    * Roteiro de viagem etc.
    * Pesquise profundamente e sugira uma estrutura de dados que atenda ao registro fiel e preciso da vinda de naturalistas ao Brasil. Estude o documento @/docs/naturalistas.md como referência
    * Penso que o registro da viagem materializado nos relatórios e nas evidências que estes relatórios contém do registro destes naturalistas sobre a biodiversidade e a relação da sociedade com esta biodiversidade é a essência do BioCultNaturalistas
  * Vale notar que dependendo do registro feito pelo naturalista, os dados presentes sobre a biodiversidade e seu uso pela sociedade da época podem variar grandemente
  * Vale notar que as referências originais - os relatórios dos naturalistas - podem ter estudos feitos por pesquisadores e mesmo re-edições em outras línguas e/ou comentadas. O BioCultNaturalistas deve poder associar referências diversas à referência principal (o relato dos naturalistas em si), cada qual com conjuntos de dados específicos.
* Importante registrar que que o BioCultTermos fará parte desta implementação, como previsto na ../../Arquitetura-BioCultural, lidando com os termos específicos de cada
* Não quero gerar nenhum código agora, apenas documentar as decisões e etapas do desenvolvimento, conforme as definições descritas aqui.
* Caso seja necessário, faça perguntas para esclarecer eventuais dúvidas
* Siga os @/docs/principiosDesenvolvimento.md