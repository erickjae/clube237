# Release 25 — Meu universo cinematográfico

Continuação funcional da fundação 0013 publicada na release 24. Não reaplicar 0013.

## Escopo
- Substituir Visão geral por Meu universo; título Meu universo cinematográfico; manter identidade visual vermelha e grafite.
- Relatório privado por membro: identidade determinística, tempo total com cobertura de runtime, notas e recomendações, gêneros em barras, diversidade, evolução mensal, décadas, países e idiomas, memórias, conquistas, afinidade e sugestões do catálogo.
- Top 5 elenco e diretores, com até 10 atores por filme em ordem de crédito e todos os diretores; contagens distintas, média e recomendação.
- Estados progressivos sem inventar dados; paginação de detalhes; excluir fila dos indicadores; reavaliação não duplica e exclusão reduz totais.
- Afinidade com mínimo de cinco filmes comuns: 70% proximidade de notas e 30% concordância de recomendação.

## Implementação pendente
- [ ] Consultas agregadas e autorização por membro; validar RLS e privilégios.
- [ ] Worker durável com leases, retries, 429 Retry-After e backfill limitado a 2 requisições/s; mecanismo de execução a definir sem custo adicional não aprovado.
- [ ] Interface responsiva, estados vazios e acessibilidade.
- [ ] Invalidar indicadores após alteração de avaliações e enriquecimento.
- [ ] Verificar impacto das FKs da 0013 na exclusão de filmes.
- [ ] Testar migrações adicionais em ambiente isolado, sem reaplicar 0013.
- [ ] Benchmark de inclusão, fila e avaliações; nenhuma chamada TMDB adicional no caminho crítico ou na abertura do relatório.
- [ ] Testes de segurança, regressão, build e homologação antes do merge.

## Estado
Este documento inicia o trabalho; não representa implementação funcional. Backup e deploy da fundação confirmados pelo responsável. Recuperação integral dos serviços gerenciados Supabase e segunda cópia protegida ainda não verificadas. Não habilitar worker nem executar migração de produção sem validação.
