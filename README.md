# FiapFastTestCompleter

Realizar os fast test usando API da OpenAPI

## Quick Start

### Setup dependencies

```bash
pnpm i
```

### Crie um arquivo .env e preencha os valores como no .env.example

```env
OPENAI_API_KEY="sk-435343*%¨&$¨%#T#G$%TY$%"
OPENAI_ORGANIZATION_ID="org-SE7Y6NaRPOYGNGeLPKZVS8z6"
FIAP_USERNAME="rm0000"
FIAP_PASSWORD="minhasenha"
```

### Altere a constante fastTestPage em server.js para apontar para o URL da página que contém o fast test que deseja completar

```js
const fastTestPage =
"https://on.fiap.com.br/mod/conteudoshtml/view.php?id=341562&c=9608&sesskey=KTY1PmQqd5";    <---- Altere aqui
```

### Rode o projeto

```bash
pnpm start
```

## Notas: (Importante!)

O projeto está configurado para utilizar o modelo GPT-4. Caso deseja utilizar outro modelo (se não tiver acesso a esta api por exemplo), configure manualmente no arquivo `openai.js``

exemplo:

```diff
- model: "gpt-4",
+ model: "gpt-3.5-turbo-1106",
```

Você pode ver os modelos existentes aqui:
https://platform.openai.com/docs/models/models
