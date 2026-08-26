# Acesso administrativo do ComuniApp

## Primeiro acesso

- Endereço: `/admin/login`
- E-mail temporário: `admin@comuniapp.local`
- Senha temporária: `ComuniApp@2026!`

O primeiro acesso abre diretamente a seção **Conta e acessos**. Troque a senha
temporária e, se desejar, o e-mail. Enquanto essa troca não for concluída, as
operações administrativas ficam bloqueadas.

## Acesso de desenvolvimento

Uma segunda conta independente pode ser configurada por `DEV_ADMIN_EMAIL` e
`DEV_ADMIN_PASSWORD` no arquivo privado `.env.local`. O comando `pnpm db:setup`
cria essa conta como **Proprietário**, sem exigir a atualização do cadastro ou
da senha no primeiro acesso. Ela usa o mesmo formulário em `/admin/login` e não
altera a conta administrativa padrão.

Esse acesso deve ser configurado apenas em ambientes controlados de
desenvolvimento. Não publique suas credenciais em repositórios ou ambientes de
produção.

## Contas da equipe

A conta inicial tem o papel de **Proprietário** e pode cadastrar contas
individuais de **Gestor**. Cada gestor recebe uma senha temporária e precisa
trocá-la no primeiro acesso. Gestores podem cuidar das denúncias, serviços e
ONGs, mas não podem cadastrar outras contas.

## Configuração local

O arquivo `.env.local` contém credenciais privadas e não deve ser distribuído.
Ao mover o projeto, preserve o `.env.local` da instalação original ou crie um a
partir do `.env.example` com a conexão do banco e um `SESSION_SECRET` próprio.
