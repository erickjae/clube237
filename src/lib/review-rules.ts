export function canModifyReview(accountId: string, reviewAdministratorId: string) {
  return accountId === reviewAdministratorId;
}

export function reviewWriteError(code?: string) {
  if (code === '23505') return 'Você já avaliou este filme. Exclua a avaliação anterior para iniciar um novo ciclo.';
  if (code === 'P0001') return 'Adicione o filme à sua fila antes de avaliar.';
  if (code === '42501') return 'Você só pode alterar as próprias avaliações.';
  if (code === '23514') return 'Revise a nota, a recomendação e o comentário informados.';
  return 'Não foi possível atualizar a avaliação. Tente novamente.';
}

export function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(value));
}
