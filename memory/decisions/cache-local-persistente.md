# Cache local persistente do checklist

## Decisão

Usar IndexedDB para armazenar o estado do formulário, fotos selecionadas e assinatura, com `localStorage` como contingência. Para cada campo, um valor ausente ou `null` é resolvido a partir de `config.js`; valores editados válidos são restaurados do cache.

As fotos, inclusive as imagens padrão inicialmente carregadas de `public/`, são armazenadas no cache como dados reais da imagem (`dataUrl`). Na inicialização, o cache válido do tipo selecionado tem prioridade; somente se não houver imagens válidas no cache são carregados os arquivos configurados em `public/`. Registros antigos de fotos públicas que contêm apenas nomes de arquivos são considerados incompletos e migrados ao carregar os arquivos atuais de `public/`.

Fotos escolhidas manualmente e a selfie padrão também são persistidas. O cache é local ao navegador/perfil e não sincroniza entre dispositivos. Alterar um arquivo em `public/` não substitui uma imagem válida já armazenada no cache desse navegador.

A quilometragem usa a data local guardada junto ao valor e soma 30 km por dia de calendário transcorrido.

## Motivo

Preservar o preenchimento e as imagens no checklist estático, priorizando o estado local já salvo e usando `public/` apenas como fonte de recuperação quando não houver imagens válidas em cache.

## Data

2026-10-15

## Status

Ativa
