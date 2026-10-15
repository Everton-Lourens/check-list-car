# Alterações em fotos públicas e cache local

## Problema

Substituir uma foto em `public/` não altera necessariamente a imagem exibida em um navegador que já tenha uma versão válida da foto salva no cache do checklist.

## Causa

A aplicação prioriza deliberadamente os dados reais das fotos persistidos no IndexedDB (ou no `localStorage` de contingência). Os arquivos de `public/` são usados quando o cache de fotos não existe, está inválido/legado ou quando o tipo de vistoria exige carregar outro conjunto.

## Solução

Ao validar mudanças de uma imagem pública, use um navegador/perfil sem cache existente ou limpe os dados locais do site antes de testar. Entradas antigas que guardavam somente nomes de arquivos são migradas automaticamente ao carregar os arquivos atuais de `public/`; fotos já armazenadas como dados reais continuam prioritárias.

## Evidência

`restaurarFotos()` restaura imagens do cache quando cada registro tem um `dataUrl` válido e só chama `carregarArquivoPublico()` quando não há um conjunto válido para o tipo atual. `restaurarSelfie()` segue a mesma prioridade.
