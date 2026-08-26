# ComuniApp

Aplicacao full stack Next.js App Router em JavaScript, com componentes estilizados por Tailwind CSS v4 e persistencia no Neon Postgres.

## Comandos

- `pnpm dev` inicia o ambiente local.
- `pnpm build` valida o bundle de producao.
- `pnpm test` executa os testes unitarios.
- `pnpm db:setup` aplica o schema idempotente e os dados iniciais no banco configurado.
- `pnpm db:verify` valida a conexao e as tabelas essenciais.

## Convencoes

- Nunca importe `lib/db.js` em Client Components.
- Toda mutacao administrativa deve chamar `requireAdmin()` no servidor.
- Consultas SQL devem usar parametros; nao concatene entrada do usuario.
- Componentes usam utilitarios Tailwind. `app/globals.css` fica restrito a tokens, base e estilos de bibliotecas externas.
- Textos de interface usam portugues brasileiro e devem manter acessibilidade por teclado.
