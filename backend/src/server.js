/**
 * BioCultNaturalistas — Obras de Naturalistas (séc. XVII-XIX).
 *
 * Contexto de Apresentação (porta 3003), parte da convenção de portas já
 * fechada para esta unidade: 3001 Registro, 3003 Apresentação
 * (integracao.md §2.3, docs/roadmap.md). A porta 3002 fica deliberadamente
 * vaga — esta unidade não tem contexto de Curadoria (ADR-002 M2): um registro
 * é publicável no momento em que é gravado, sem workflow de aprovação.
 *
 * Hoje serve só a home page. Não há banco: o SQLite da unidade entra quando o
 * primeiro contexto com dados existir (ADR-005 — um arquivo por unidade,
 * compartilhado com o BioCultTermos).
 */

const path = require('path');
const express = require('express');

const PORT = Number(process.env.PRESENTATION_PORT) || 3003;
const rootDir = path.resolve(__dirname, '../..');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'contexts/presentation/views'));

app.use('/styles', express.static(path.join(rootDir, 'frontend/dist/styles')));

app.get('/', (req, res) => {
  res.render('index', {
    pageTitle: 'Início',
    contextName: 'BioCultNaturalistas',
    contextDescription: 'Registro de evidências de conhecimento tradicional associado à biodiversidade em obras de naturalistas em visita ao Brasil (séc. XVII-XIX)'
  });
});

// A unidade sobe mesmo incompleta, mas nunca finge: qualquer rota ainda não
// implementada responde 404 explícito em vez de uma tela vazia.
app.use((req, res) => {
  res.status(404).send('Não encontrado. O BioCultNaturalistas ainda só implementa a home page.');
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[biocultnaturalistas] Apresentação em http://localhost:${PORT}`);
  });
}

module.exports = app;
