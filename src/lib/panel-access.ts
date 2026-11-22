export type ClubRole = 'owner' | 'admin';
export type PanelPath = '/admin' | '/painel';

export function panelDestination(role: string): PanelPath | null {
  if (role === 'owner') return '/admin';
  if (role === 'admin') return '/painel';
  return null;
}

export function canAccessPanel(role: string, panel: PanelPath): boolean {
  if (role === 'owner') return true;
  return role === 'admin' && panel === '/painel';
}

export function canManageAdministrators(role: string, mustChangePassword: boolean): boolean {
  return role === 'owner' && !mustChangePassword;
}
