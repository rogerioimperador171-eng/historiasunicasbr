# Histórias Únicas — Campanha do Kauê

Landing page da campanha + pagamento Pix integrado à API **FlevoPay**
(`https://app.flevopay.com.br`), com a chave secreta protegida no servidor.

Contrato da API: https://app.flevopay.com.br/documentation.

## Estrutura

- `src/site/landing.html` — conteúdo da landing page (HTML original preservado)
- `public/css/site.css` — estilos originais da landing page
- `public/js/site.js` — scripts da landing (menu, FAQ, modal de doação, máscaras)
- `public/images/`, `public/js/embed.js` — imagens e player de vídeo
- `src/routes/index.tsx` — rota `/` que serve a landing page
- `src/routes/pagamento.tsx` — página de pagamento (QR Code, Pix copia e cola, status automático)
- `src/lib/propix.server.ts` — integração com a API FlevoPay (uso exclusivo no servidor)
- `netlify/functions/pix-create.mts` — gera o Pix (`POST /api/v1/transaction`)
- `netlify/functions/pix-status.mts` — consulta o pagamento (`GET /api/v1/query?action=get_transaction&id=...`)
- `netlify.toml` — build, diretório de functions e redirects de `/api/public/pix/*`
- `scripts/prepare-netlify-output.mjs` — prepara `netlify-dist` a partir da saída gerada pelo build

## Variáveis de ambiente

| Nome                        | Descrição                                                                         |
| --------------------------- | --------------------------------------------------------------------------------- |
| `FLEVOPAY_API_KEY`          | Chave secreta da FlevoPay, disponível apenas no servidor                          |
| `FLEVOPAY_DEFAULT_DOCUMENT` | CPF/CNPJ autorizado, apenas números, usado quando o pagador não informa documento |
| `FLEVOPAY_DEFAULT_EMAIL`    | E-mail autorizado usado quando o doador não informa e-mail                        |
| `FLEVOPAY_DEFAULT_PHONE`    | Telefone autorizado com DDD usado quando o doador não informa telefone            |
| `FLEVOPAY_POSTBACK_URL`     | Opcional: URL HTTPS de um receptor de webhooks já implementado                    |

A chave secreta **nunca** aparece no frontend: ela só é lida dentro das Netlify
Functions / rotas de servidor e enviada à FlevoPay no header `X-API-Key`.
Não use o prefixo `VITE_` para nenhuma dessas variáveis. As credenciais antigas
`PROPAY_CLIENT_ID` e `PROPAY_CLIENT_SECRET` não são mais utilizadas.

A FlevoPay exige nome, e-mail, documento e telefone para criar a cobrança.
E-mail e telefone informados no formulário têm prioridade sobre os padrões.
Como o formulário não solicita CPF/CNPJ, `FLEVOPAY_DEFAULT_DOCUMENT` é necessário
no fluxo atual. Configure somente dados autorizados para esse uso e confirme
com a FlevoPay se esse fluxo de doação é permitido; não são gerados dados fictícios.
Dados ausentes ou malformados impedem a criação da cobrança.

### Configurar na Netlify

1. Acesse **Site configuration → Environment variables**.
2. Configure `FLEVOPAY_API_KEY` e os dados padrão acima no escopo de runtime das Functions, inclusive no contexto de produção.
3. Faça um novo deploy (**Deploys → Trigger deploy → Clear cache and deploy site**).

### Trocar a chave secreta no futuro

Basta editar `FLEVOPAY_API_KEY` e refazer o deploy. Nenhum arquivo de código
precisa ser alterado. Se uma chave for compartilhada em um chat ou publicada,
revogue-a na FlevoPay e configure uma nova na Netlify.

## Publicar na Netlify

1. Conecte o repositório em **Add new site → Import an existing project**.
2. Build command: `npm run build` · Publish directory: `netlify-dist` ·
   Functions directory: `netlify/functions` (já definidos em `netlify.toml`).
3. Cadastre as variáveis de ambiente acima e faça o deploy.

## Testar localmente

```bash
npm install
npm run dev            # http://localhost:8080
```

Para testar as Netlify Functions localmente:

```bash
netlify dev --port 8889
```

Configure as variáveis no ambiente antes de iniciar o servidor, sem gravar
segredos no repositório. As chamadas abaixo geram cobranças reais se uma chave
de produção estiver configurada; use apenas com autorização.

Teste manual dos endpoints:

```bash
curl -X POST http://localhost:8889/api/public/pix/create \
  -H "Content-Type: application/json" \
  -d '{"amount":5,"payerName":"Teste"}'

curl -X POST http://localhost:8889/api/public/pix/status \
  -H "Content-Type: application/json" \
  -d '{"transactionId":"ID_RETORNADO_NA_CRIACAO"}'
```

## Fluxo de pagamento

1. O visitante clica em **DOAR AGORA**, escolhe/digita o valor (mínimo R$ 5,00) e informa o nome
   (WhatsApp e e-mail são opcionais).
2. Ao clicar em **GERAR PIX AGORA** ele vai para `/pagamento`.
3. A página chama `POST /api/public/pix/create`, que no servidor chama
   `POST /api/v1/transaction` com o header `X-API-Key`, o valor convertido de reais
   para centavos e uma referência única. `source: api_externa` permite a doação
   sem cadastrar um produto na FlevoPay.
4. QR Code, Pix copia e cola e o status "Aguardando pagamento" aparecem na hora.
5. A cada 3 segundos a página consulta `POST /api/public/pix/status`
   (`GET /api/v1/query?action=get_transaction&id=...`). Somente o status
   `approved` confirma o pagamento; estados como `pending`, `processing`,
   `refunded` e `chargeback` não confirmam a doação. Quando aprovado, o polling para e a
   tela de pagamento aprovado aparece sem recarregar a página.

## Atualizar a API no futuro

- URL base: definida apenas no servidor em `src/lib/propix.server.ts`.
- Payload, headers e leitura da resposta: `src/lib/propix.server.ts`
  (usado tanto pelas Netlify Functions quanto pelas rotas de servidor).
