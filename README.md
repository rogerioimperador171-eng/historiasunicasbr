# Histórias Únicas — Campanha do Kauê

Landing page da campanha + pagamento Pix integrado à API **ProPixBR**
(`https://api.propixbr.com`), com as credenciais protegidas no servidor.

## Estrutura

- `src/site/landing.html` — conteúdo da landing page (HTML original preservado)
- `public/css/site.css` — estilos originais da landing page
- `public/js/site.js` — scripts da landing (menu, FAQ, modal de doação, máscaras)
- `public/images/`, `public/js/embed.js` — imagens e player de vídeo
- `src/routes/index.tsx` — rota `/` que serve a landing page
- `src/routes/pagamento.tsx` — página de pagamento (QR Code, Pix copia e cola, status automático)
- `src/lib/propix.server.ts` — integração com a API ProPixBR (uso exclusivo no servidor)
- `netlify/functions/pix-create.mts` — gera o Pix (`POST /api/v1/deposit`)
- `netlify/functions/pix-status.mts` — consulta o pagamento (`POST /api/v1/check`)
- `netlify.toml` — build, diretório de functions e redirects de `/api/public/pix/*`

## Variáveis de ambiente

| Nome | Descrição |
| --- | --- |
| `PROPAY_CLIENT_ID` | Client ID da ProPixBR (`live_...`) |
| `PROPAY_CLIENT_SECRET` | Client Secret da ProPixBR (`sk_...`) |

O Client Secret **nunca** aparece no frontend: ele só é lido dentro das Netlify
Functions / rotas de servidor.

### Configurar na Netlify

1. Acesse **Site configuration → Environment variables**.
2. Clique em **Add a variable** e crie `PROPAY_CLIENT_ID` e `PROPAY_CLIENT_SECRET`.
3. Faça um novo deploy (**Deploys → Trigger deploy → Clear cache and deploy site**).

### Trocar Client ID / Client Secret no futuro

Basta editar os valores dessas duas variáveis e refazer o deploy. Nenhum arquivo
de código precisa ser alterado.

## Publicar na Netlify

1. Conecte o repositório em **Add new site → Import an existing project**.
2. Build command: `npm run build` · Publish directory: `.output/public` ·
   Functions directory: `netlify/functions` (já definidos em `netlify.toml`).
3. Cadastre as variáveis de ambiente acima e faça o deploy.

## Testar localmente

```bash
npm install
npm run dev            # http://localhost:8080
```

Para testar as Netlify Functions localmente:

```bash
npm i -g netlify-cli
PROPAY_CLIENT_ID=... PROPAY_CLIENT_SECRET=... netlify dev
```

Teste manual dos endpoints:

```bash
curl -X POST http://localhost:8080/api/public/pix/create \
  -H "Content-Type: application/json" \
  -d '{"amount":5,"payerName":"Teste"}'

curl -X POST http://localhost:8080/api/public/pix/status \
  -H "Content-Type: application/json" \
  -d '{"transactionId":"api_in_..."}'
```

## Fluxo de pagamento

1. O visitante clica em **DOAR AGORA**, escolhe/digita o valor (mínimo R$ 5,00) e informa o nome
   (WhatsApp e e-mail são opcionais).
2. Ao clicar em **GERAR PIX AGORA** ele vai para `/pagamento`.
3. A página chama `POST /api/public/pix/create`, que no servidor chama
   `POST /api/v1/deposit` com os headers `x-client-id` e `x-client-secret`.
4. QR Code, Pix copia e cola e o status "Aguardando pagamento" aparecem na hora.
5. A cada 3 segundos a página consulta `POST /api/public/pix/status`
   (`/api/v1/check`). Quando `transactionState` for `COMPLETO`, o polling para e a
   tela de pagamento aprovado aparece sem recarregar a página.

## Atualizar a API no futuro

- URL base: `PROPIX_BASE_URL` em `src/lib/propix.ts`.
- Payload, headers e leitura da resposta: `src/lib/propix.server.ts`
  (usado tanto pelas Netlify Functions quanto pelas rotas de servidor).
