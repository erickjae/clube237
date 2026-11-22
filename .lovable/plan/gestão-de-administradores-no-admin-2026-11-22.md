# Gestão de administradores no `/admin`

- Acrescentar uma consulta protegida que devolve apenas administradores, com nome público, usuário, situação e total; o proprietário e identificadores internos ficam fora da resposta.
- Transformar a navegação “Administradores” em uma área funcional dentro do painel existente, com lista responsiva e ações reais de cadastro, bloqueio, reativação e redefinição de senha.
- Reutilizar as operações protegidas já existentes, centralizar a regra de que somente o proprietário com senha definitiva pode gerenciar contas e exigir senha provisória com troca obrigatória no próximo acesso.
- Adicionar testes de permissão e validar no navegador o fluxo completo com o proprietário e contas temporárias, incluindo login do novo administrador e remoção dos dados de teste.
- Não alterar tabelas, políticas, páginas públicas, TMDB ou outras funcionalidades.
