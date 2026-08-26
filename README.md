# ComuniApp

Aplicação comunitária full stack construída a partir do protótipo anexado. O produto usa Next.js App Router em JavaScript, componentes com Tailwind CSS e persistência real no Neon Postgres.

## O que está pronto

- Home com estatísticas reais e ocorrências recentes.
- Mapa Leaflet/OpenStreetMap com pins, filtros e geolocalização.
- Denúncia cívica e de segurança com protocolo gerado no banco, foto de até 1 MB, endereço e coordenadas. Nome e e-mail do morador são obrigatórios para a gestão, mas nunca aparecem nas consultas públicas.
- Autocomplete de endereço e mapa interativo no formulário, mantendo endereço e coordenadas sincronizados.
- Consulta pública por protocolo, histórico de status e votos sem duplicidade por dispositivo.
- Diretório pesquisável de serviços públicos, ONGs e projetos.
- Modal acessível com contatos de emergência.
- Login administrativo protegido por cookie HttpOnly e JWT assinado.
- Painel com indicadores, filtros, detalhe privado, histórico, atualização de status e CRUD/arquivamento de serviços e ONGs.
- Validação Zod, rate limiting, SQL parametrizado, controle de versão e auditoria administrativa.

## Stack

- Next.js 16 App Router + React 19, em JavaScript.
- Tailwind CSS 4 para os componentes.
- Neon Postgres com `@neondatabase/serverless` sobre HTTP.
- Leaflet + OpenStreetMap.
- Google Maps JavaScript API + Places API (New) no formulário de denúncia, com fallback para Leaflet.
- Zod e JOSE.

## Executar localmente

Requisitos: Node.js 20.9+ e pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm db:setup
pnpm dev
```

Abra `http://localhost:3000`. O painel fica em `/admin`.

O workspace já contém uma `.env.local` funcional, ignorada pelo controle de versão, conectada ao projeto Neon criado para esta aplicação. `DEV_ADMIN_EMAIL` e `DEV_ADMIN_PASSWORD` podem habilitar uma conta de desenvolvimento independente, com papel de proprietário e sem troca obrigatória de senha. Remova essa conta e altere `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `SESSION_SECRET` antes de publicar.

Para autocomplete e geocodificação no formulário, configure `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` com uma chave de navegador que tenha Maps JavaScript API, Places API (New) e Geocoding API habilitadas. Restrinja a chave aos domínios HTTP autorizados. Sem essa variável, o formulário exibe um mapa Leaflet alternativo e permite marcar o ponto manualmente.

## Banco de dados

- `database/schema.sql`: schema idempotente, constraints e índices.
- `database/seed.sql`: 12 categorias, 9 ocorrências, 6 serviços, 4 projetos sociais e 5 contatos de emergência.
- `pnpm db:setup`: aplica schema e seed.
- `pnpm db:verify`: verifica tabelas, colunas, índices, dados e integridade.

A aplicação usa uma URL pooled do Neon apenas no servidor. Para migrações em produção, configure também `DATABASE_URL_UNPOOLED` com a conexão direta.

As fotos são armazenadas no Postgres como `BYTEA`, limitadas a 1 MB, para manter este projeto autocontido. Em uma operação de grande escala, mova os arquivos para object storage e mantenha somente metadados/URLs no banco.

## Validação

```bash
pnpm test
pnpm build
```

Com um servidor local em execução, o fluxo completo também pode ser verificado com:

```bash
node --env-file=.env.local scripts/smoke-test.mjs http://127.0.0.1:3000
```

O smoke test cria registros temporários, valida denúncia, voto, login, mudança de status e CRUD do diretório, e remove os dados de QA ao terminar.

## Rotas principais

- `/`, `/mapa`, `/denunciar`, `/seguranca`, `/servicos`
- `/ocorrencias` e `/ocorrencias/[protocolo]`
- `/admin` e `/admin/login`
- `/api/health`, `/api/reports`, `/api/directory`

O ZIP original e o antigo scaffold Vite/TSX permanecem no workspace apenas como referência de design; a aplicação executável é o projeto Next.js em `app/`, `components/` e `lib/`.
# ComuniApp
