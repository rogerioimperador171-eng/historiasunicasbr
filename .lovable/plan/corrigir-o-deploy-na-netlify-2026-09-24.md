# Corrigir o deploy na Netlify

## Objetivo
Garantir que a Netlify instale exatamente as mesmas versões testadas e gere `dist/client` em todos os deploys, sem alterar o site.

## Alterações
- Fixar a instalação das dependências para evitar versões diferentes entre o ambiente local e a Netlify.
- Manter `npm run build` e `dist/client`, que já foram validados localmente.
- Simular uma instalação limpa e executar o build novamente.
- Confirmar que a página inicial e `/pagamento` são geradas e que as funções Pix e vídeo continuam empacotadas.

## Limite
Nenhuma mudança visual, de conteúdo ou no fluxo de pagamento.
