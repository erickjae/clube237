import { isRedirect, redirect } from '@tanstack/react-router';
import { currentAccount } from '@/services/auth.functions';
import { canAccessPanel, panelDestination, type PanelPath } from './panel-access';

export async function loadPanelAccount(panel: PanelPath) {
  try {
    const account = await currentAccount({ data: {} });

    if (account.mustChangePassword) {
      throw redirect({ to: '/auth', search: { reason: 'password' }, replace: true });
    }

    if (!canAccessPanel(account.role, panel)) {
      const destination = panelDestination(account.role);
      if (!destination) throw new Error('Conta sem permissão.');
      throw redirect({ to: destination, replace: true });
    }

    return account;
  } catch (error) {
    if (isRedirect(error)) throw error;

    throw redirect({ to: '/auth', search: { reason: 'access' }, replace: true });
  }
}
