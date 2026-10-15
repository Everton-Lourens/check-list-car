# Handoff do projeto

## Estado atual

Checklist estático responsivo em `index.html`, `styles.css`, `config.js` e `app.js`. O `config.js` é a fonte dos padrões configuráveis; quando um valor do cache está ausente ou é `null`, a interface volta ao padrão correspondente. O IndexedDB guarda os dados do formulário, respostas, fotos locais e assinatura; `localStorage` é contingência quando o IndexedDB não estiver disponível.

As fotos de teste vêm de `public/`: `selfie-condutor.jpeg`, cinco arquivos `e-*.jpeg` para Entrada e cinco `s-*.jpeg` para Saída. Trocar o tipo troca automaticamente o conjunto de fotos pré-selecionadas. Fotos escolhidas manualmente e a última assinatura desenhada são persistidas no navegador.

A quilometragem é acrescida em 30 km por cada dia de calendário local transcorrido desde a data-base guardada no cache. O cache é local ao navegador/perfil e não sincroniza entre dispositivos.

## Ponto de atenção

O envio continua dependendo de `google.script.run.enviarChecklist`, que não existe diretamente no GitHub Pages. O projeto não contém o código servidor `.gs` nem uma API HTTP pública documentada; a interface não afirma ter enviado quando a ponte está ausente.

## Próximo passo para envio externo

Se o checklist precisar enviar dados a partir do GitHub Pages, obter o backend Apps Script e confirmar/implementar um endpoint HTTP com contrato de dados e CORS.
