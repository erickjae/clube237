import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { clubAuth } from './club-auth';
import { usernameSchema, passwordSchema } from '@/lib/club-rules';

export const login = createServerFn({ method: 'POST' }).inputValidator(z.object({ username: usernameSchema, password: z.string().min(1).max(128) })).handler(async ({ data }) => {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { publicClient } = await import('./public-client.server');
  const { data: account } = await supabaseAdmin.from('administrators').select('auth_user_id, status').ilike('username', data.username).single();
  if (!account || account.status !== 'active') throw new Error('Usuário ou senha inválidos.');
  const { data: identity } = await supabaseAdmin.auth.admin.getUserById(account.auth_user_id);
  const email = identity.user?.email;
  if (!email) throw new Error('Usuário ou senha inválidos.');
  const { data: signed, error } = await publicClient().auth.signInWithPassword({ email, password: data.password });
  if (error || !signed.session) throw new Error('Usuário ou senha inválidos.');
  return { access_token: signed.session.access_token, refresh_token: signed.session.refresh_token };
});

export const currentAccount = createServerFn({ method: 'POST' }).middleware([clubAuth]).handler(({ context }) => ({ username: context.account.username, mustChangePassword: context.account.must_change_password, role: context.role }));

export const changePassword = createServerFn({ method: 'POST' }).middleware([clubAuth]).inputValidator(z.object({ currentPassword: z.string().min(1), password: passwordSchema })).handler(async ({ data, context }) => {
  if (data.currentPassword === data.password) throw new Error('Escolha uma senha diferente da provisória.');
  const { error } = await context.supabase.auth.updateUser({ password: data.password, current_password: data.currentPassword });
  if (error) throw new Error('Não foi possível alterar a senha. Confira a senha atual e tente novamente.');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { error: flagError } = await supabaseAdmin.from('administrators').update({ must_change_password: false }).eq('id', context.account.id);
  if (flagError) throw new Error('Senha alterada; a liberação da conta precisa ser repetida.');
  return { success: true };
});

export const createAdministrator = createServerFn({ method: 'POST' }).middleware([clubAuth]).inputValidator(z.object({ username: usernameSchema, temporaryPassword: passwordSchema })).handler(async ({ data, context }) => {
  if (context.role !== 'owner' || context.account.must_change_password) throw new Error('Somente o proprietário pode criar contas.');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const email = `${crypto.randomUUID()}@accounts.clube237.invalid`;
  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({ email, password: data.temporaryPassword, email_confirm: true });
  if (error || !created.user) throw new Error('Não foi possível criar a conta.');
  const { error: accountError } = await supabaseAdmin.from('administrators').insert({ auth_user_id: created.user.id, username: data.username });
  if (accountError) { await supabaseAdmin.auth.admin.deleteUser(created.user.id); throw new Error('Usuário já utilizado ou conta inválida.'); }
  const { error: roleError } = await supabaseAdmin.from('user_roles').insert({ user_id: created.user.id, role: 'admin' });
  if (roleError) { await supabaseAdmin.from('administrators').delete().eq('auth_user_id', created.user.id); await supabaseAdmin.auth.admin.deleteUser(created.user.id); throw new Error('Não foi possível atribuir acesso; verifique o limite de membros.'); }
  return { username: data.username };
});

export const manageAdministrator = createServerFn({ method: 'POST' }).middleware([clubAuth]).inputValidator(z.object({ administratorId: z.string().uuid(), action: z.enum(['block','reactivate','reset']), temporaryPassword: passwordSchema.optional() })).handler(async ({ data, context }) => {
  if (context.role !== 'owner' || context.account.must_change_password) throw new Error('Somente o proprietário pode gerenciar contas.');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: target } = await context.supabase.from('administrators').select('auth_user_id').eq('id', data.administratorId).single();
  if (!target || target.auth_user_id === context.userId) throw new Error('Conta inválida para esta operação.');
  if (data.action === 'reset' && !data.temporaryPassword) throw new Error('Informe a senha provisória.');
  const patch = data.action === 'block' ? { status: 'blocked' } : data.action === 'reactivate' ? { status: 'active' } : { must_change_password: true };
  const { error: dbError } = await supabaseAdmin.from('administrators').update(patch).eq('id', data.administratorId);
  if (dbError) throw new Error('Não foi possível atualizar a conta.');
  const attributes = data.action === 'reset'
    ? { password: data.temporaryPassword! }
    : { ban_duration: data.action === 'block' ? '876000h' : 'none' };
  const { error } = await supabaseAdmin.auth.admin.updateUserById(target.auth_user_id, attributes);
  if (error) throw new Error('Permissões atualizadas; a atualização de acesso precisa ser repetida.');
  return { success: true };
});