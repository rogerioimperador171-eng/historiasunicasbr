# Histórias Únicas — Campanha do Kauê

Landing page da campanha com pagamento PIX integrado à FlevoPay. A chave da API
é utilizada exclusivamente no servidor e não é enviada ao navegador.

## Configuração na Netlify

1. No painel da FlevoPay, acesse **Configurações e API** e obtenha sua chave secreta.
2. Na Netlify, acesse **Site configuration → Environment variables** e cadastre
   `FLEVOPAY_API_KEY` com escopo de execução das Functions. Não coloque a chave
   no código, em variáveis `VITE_*` ou em mensagens públicas.
3. Publique um novo deploy para aplicar a configuração.

As antigas variáveis `PROPAY_CLIENT_ID` e `PROPAY_CLIENT_SECRET` não são utilizadas.
O diretório publicado continua sendo `netlify-dist`.

## Fluxo de pagamento

O visitante escolhe o valor e preenche nome completo, e-mail, telefone com DDD e
CPF/CNPJ. Esses dados são obrigatórios para criar o PIX na FlevoPay, mas não
aparecem publicamente na campanha.

O formulário chama `POST /api/public/pix/create`. O servidor valida os campos e
converte o valor de reais para centavos antes de chamar
`POST https://app.flevopay.com.br/api/v1/transaction`, com autenticação pelo
cabeçalho `X-API-Key`, uma referência única e `source: api_externa`.

A página `/pagamento` recebe apenas um identificador aleatório na URL, carrega
o PIX já criado e apresenta o código copia e cola e o QR Code fornecidos pela
FlevoPay. Nome, e-mail, telefone e documento não são colocados na URL nem no
armazenamento do navegador. Atualizar a página não gera outra cobrança.

O endpoint `POST /api/public/pix/status` consulta
`GET /api/v1/query?action=get_transaction&id=...` a cada três segundos, sem
requisições simultâneas. Apenas o status `approved` confirma o pagamento;
pagamentos cancelados, expirados, reembolsados ou contestados recebem mensagens
específicas. A confirmação usa consultas autenticadas; não é necessário
configurar um webhook para esse fluxo.

## Armazenamento

Os dados necessários para recuperar o PIX são persistidos no Netlify Database
com Drizzle: identificador aleatório, ID da transação no provedor, valor em
centavos, código PIX, QR Code e data de criação. Os dados pessoais do cliente não
são gravados nessa tabela; são enviados à FlevoPay para processar o pagamento.

O esquema fica em `db/schema.ts` e as migrações em
`netlify/database/migrations`. A Netlify provisiona o banco e aplica as migrações
no deploy. As versões beta do Drizzle são fixadas para manter o ORM e a
ferramenta de migrações compatíveis.

## Estrutura

- `src/site/landing.html` e `public/js/site.js`: formulário de doação e validação.
- `src/routes/pagamento.tsx`: recuperação do PIX e confirmação automática.
- `src/lib/pix.ts`: contrato público do pagamento, sem credenciais.
- `src/lib/flevopay.server.ts`: integração autenticada com a FlevoPay.
- `netlify/functions/pix-create.mts` e `netlify/functions/pix-status.mts`: endpoints na Netlify.
- `src/routes/api/public/pix/`: endpoints equivalentes no servidor TanStack.
- `netlify.toml`: publicação e redirecionamento dos endpoints para as Functions.

## Desenvolvimento local

Com as dependências instaladas e a variável secreta configurada no ambiente,
execute `netlify dev --port 8889` para testar as Functions e o banco pela Netlify.
O servidor Vite isolado não emula todos os recursos da plataforma.

Verificações sem gerar os arquivos de publicação:

```bash
npx tsc --noEmit
node --check public/js/site.js
```

Documentação utilizada: https://app.flevopay.com.br/documentation.
