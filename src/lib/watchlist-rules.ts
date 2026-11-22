export function canModifyWatchlistEntry(accountId: string, entryAdministratorId: string) {
  return accountId === entryAdministratorId;
}

export function watchlistWriteError(code?: string) {
  if (code === '23505') return 'Este filme já está na sua fila.';
  if (code === '42501') return 'Você só pode alterar a própria fila.';
  return 'Não foi possível atualizar sua fila. Tente novamente.';
}
