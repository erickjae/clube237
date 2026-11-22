# Clube237

Clube privado de pessoas que compartilham experiências e percepções sobre filmes. A primeira etapa contém a identidade visual, as páginas públicas e a infraestrutura real de dados, contas, permissões, avatares e TMDB.

## Executar localmente

Requer Bun e as variáveis públicas geradas pelo Lovable Cloud.

```sh
bun install
bun run dev
```

Verificações:

```sh
oj typecheck -b --noEmit
bunx vitest run
```

## Estrutura

- `src/routes`: páginas públicas e autenticação, com SSR e metadados próprios.
- `src/components`: estrutura visual e catálogo reutilizáveis.
- `src/services`: funções de servidor para contas, catálogo e integração TMDB.
- `src/lib`: validações e regras de negócio compartilhadas.
- `src/test`: testes das regras e da navegação.
- `drizzle/migrations`: histórico gerado e aplicado pelas ferramentas do Lovable Cloud.

## Segurança e configuração

O cadastro público está desabilitado. O proprietário cria contas com senha provisória e o primeiro acesso exige troca de senha. Os endereços de autenticação são internos e nunca aparecem no catálogo público.

`TMDB_API_TOKEN` é um segredo exclusivo do servidor. As chaves administrativas do Lovable Cloud também permanecem no servidor; nenhuma credencial privada deve ser adicionada ao código ou ao repositório.

As nove tabelas incluem oito entidades do catálogo e a tabela protegida `user_roles`. Todas usam RLS. O bucket privado `avatars` aceita JPG, PNG e WebP de até 5 MB, com acesso por perfil e leitura pública autorizada por política.

## Escopo desta etapa

Não há filmes, avaliações ou membros fictícios. O painel administrativo completo pertence a uma etapa posterior. A atribuição ao TMDB está no rodapé: este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
