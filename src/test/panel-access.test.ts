import { describe, expect, it } from 'vitest';
import { canAccessPanel, canManageAdministrators, panelDestination } from '@/lib/panel-access';

describe('Panel access rules', () => {
  it('sends the owner to /admin after login', () => {
    expect(panelDestination('owner')).toBe('/admin');
  });

  it('sends an administrator to /painel after login', () => {
    expect(panelDestination('admin')).toBe('/painel');
  });

  it('does not allow an administrator into /admin', () => {
    expect(canAccessPanel('admin', '/admin')).toBe(false);
  });

  it('allows the owner into both panels', () => {
    expect(canAccessPanel('owner', '/admin')).toBe(true);
    expect(canAccessPanel('owner', '/painel')).toBe(true);
  });

  it('allows an active administrator only into /painel', () => {
    expect(canAccessPanel('admin', '/painel')).toBe(true);
  });

  it('does not assign a panel to an invalid role', () => {
    expect(panelDestination('member')).toBeNull();
    expect(canAccessPanel('member', '/painel')).toBe(false);
  });

  it('allows only the owner to manage administrators', () => {
    expect(canManageAdministrators('owner', false)).toBe(true);
    expect(canManageAdministrators('admin', false)).toBe(false);
  });

  it('requires the owner to replace a provisional password before managing accounts', () => {
    expect(canManageAdministrators('owner', true)).toBe(false);
  });
});
