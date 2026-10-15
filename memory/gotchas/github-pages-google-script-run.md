# Envio do Apps Script em hospedagem estática

## Problema

A página original chama `google.script.run.enviarChecklist(dados)` (e, quando aplicável, `enviarVideo`). Essa ponte é injetada no contexto do Google Apps Script HTML Service e não fica disponível em uma página servida pelo GitHub Pages ou aberta como arquivo local.

## Causa

O ZIP de origem contém o HTML capturado da interface e recursos auxiliares do navegador, mas não contém o código servidor `.gs` nem documenta um endpoint HTTP para receber fotos de páginas externas.

## Solução

Para envio real a partir do GitHub Pages, o código do servidor existente precisa expor uma API HTTP explícita com contrato de dados e configuração CORS, ou a interface deve continuar hospedada no Apps Script HTML Service. Não assumir que `POST` para a URL `/exec` funciona sem confirmar a implementação servidor.

## Evidência

A implementação cliente extraída chama `google.script.run.withSuccessHandler(...).withFailureHandler(...).enviarChecklist(dados)`.
