# Cache local persistente do checklist

## Decisão

Usar IndexedDB para armazenar o estado do formulário, anexos substituídos e assinatura, com `localStorage` como contingência. Para cada campo, um valor ausente ou `null` é resolvido a partir de `config.js`; valores editados válidos são restaurados do cache. Fotos padrão continuam sendo arquivos versionáveis em `public/`, com prefixo `e-` para Entrada e `s-` para Saída.

A quilometragem usa a data local guardada junto ao valor e soma 30 km por dia de calendário transcorrido.

## Motivo

Permitir que o checklist estático no GitHub Pages preserve o preenchimento no mesmo navegador e evite embutir imagens no JavaScript, sem perder os padrões definidos pelo projeto.

## Data

2026-10-15

## Status

Ativa
