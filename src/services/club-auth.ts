import { createMiddleware } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const clubAuth = createMiddleware({ type: 'function' }).middleware([requireSupabaseAuth]).server(async ({ context, next }) => {
  const { data: identity, error } = await context.supabase.auth.getUser();
  if (error || !identity.user) throw new Error('Entre novamente para continuar.');
  const { data: account } = await context.supabase.from('administrators').select('id, username, status, must_change_password').eq('auth_user_id', identity.user.id).single();
  if (!account || account.status !== 'active') throw new Error('Esta conta não tem acesso ao clube.');
  const { data: role } = await context.supabase.from('user_roles').select('role').eq('user_id', identity.user.id).single();
  if (!role) throw new Error('Conta sem permissão.');
  return next({ context: { account, role: role.role } });
});