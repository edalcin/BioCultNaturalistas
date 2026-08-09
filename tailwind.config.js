/** @type {import('tailwindcss').Config} */
// Tokens visuais vêm do preset do Módulo Compartilhado — não redefina cores aqui.
// Ver bioculttermos/tailwind.preset.cjs e o ADR-012 da Arquitetura-BioCultural.
module.exports = {
  presets: [require('./bioculttermos/tailwind.preset.cjs')],
  content: [
    './backend/src/contexts/**/*.ejs',
    './backend/src/shared/views/**/*.ejs',
    './frontend/src/**/*.{html,js}'
  ]
};
