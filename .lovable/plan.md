# Painéis e pós-login do Clube237

- Criar a área autenticada e as rotas `/admin` e `/painel`, com navegação editorial escura, identificação do membro e saída funcional; os recursos futuros aparecem apenas como indicações, sem ações falsas.
- Validar conta ativa e função pelo servidor em cada acesso: proprietário entra em `/admin` e também pode abrir `/painel`; administrador ativo entra somente em `/painel`; acessos inválidos voltam ao login com aviso discreto.
- Alterar somente a conclusão do login existente para direcionar pela função, inclusive depois da troca obrigatória de senha, removendo a etapa “Você está no clube”.
- Adicionar testes das regras de destino e permissão e executar testes automatizados e navegação real com proprietário, administrador ativo, administrador bloqueado e visitante, incluindo recarregar e sair.
- Não alterar banco, migrations, RLS, TMDB ou páginas públicas. Contas temporárias usadas nos testes serão removidas ao final.
