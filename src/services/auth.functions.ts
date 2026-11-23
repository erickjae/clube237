import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { clubAuth } from './club-auth';
import { usernameSchema, passwordSchema } from '@/lib/club-rules';
import { canManageAdministrators, panelDestination } from '@/lib/panel-access';

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

export const currentAccount = createServerFn({ method: 'POST' })
  .middleware([clubAuth])
  .inputValidator(z.object({}))
  .handler(async ({ context }) => {
    if (!panelDestination(context.role)) throw new Error('Esta conta não tem uma função válida para acessar o clube.');
    const { data: profile } = context.role === 'admin'
      ? await context.supabase.from('profiles').select('display_name').eq('administrator_id', context.account.id).maybeSingle()
      : { data: null };
    return {
      username: context.account.username,
      displayName: profile?.display_name ?? null,
      mustChangePassword: context.account.must_change_password,
      role: context.role,
    };
  });

export const listAdministrators = createServerFn({ method: 'POST' })
  .middleware([clubAuth])
  .handler(async ({ context }) => {
    if (!canManageAdministrators(context.role, context.account.must_change_password)) {
      throw new Error('Somente o proprietário pode consultar as contas.');
    }
    const [accounts, roles, profiles] = await Promise.all([
      context.supabase.from('administrators').select('id, auth_user_id, username, status, created_at'),
      context.supabase.from('user_roles').select('user_id, role'),
      context.supabase.from('profiles').select('administrator_id, display_name'),
    ]);
    if (accounts.error || roles.error || profiles.error) throw new Error('Não foi possível carregar os administradores.');

    const roleByUser = new Map((roles.data ?? []).map((row) => [row.user_id, row.role]));
    const nameByAccount = new Map((profiles.data ?? []).map((row) => [row.administrator_id, row.display_name]));
    const administrators = (accounts.data ?? [])
      .filter((account) => roleByUser.get(account.auth_user_id) === 'admin')
      .map((account) => ({
        id: account.id,
        username: account.username,
        displayName: nameByAccount.get(account.id) ?? account.username,
        status: account.status === 'blocked' ? 'blocked' as const : 'active' as const,
        createdAt: account.created_at,
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    return { total: administrators.length, administrators };
  });

export const changePassword = createServerFn({ method: 'POST' }).middleware([clubAuth]).inputValidator(z.object({ currentPassword: z.string().min(1).max(128), password: passwordSchema })).handler(async ({ data, context }) => {
  if (data.currentPassword === data.password) throw new Error('Escolha uma senha diferente da provisória.');
  const { getRequest } = await import('@tanstack/react-start/server');
  const authorization = getRequest().headers.get('authorization');
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!authorization || !url || !key) throw new Error('Entre novamente para alterar sua senha.');
  let response: Response;
  try {
    response = await fetch(`${url}/auth/v1/user`, {
      method: 'PUT',
      headers: { apikey: key, Authorization: authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: data.password, current_password: data.currentPassword }),
    });
  } catch {
    throw new Error('A conexão foi interrompida. Tente novamente.');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error_code?: string; msg?: string; message?: string } | null;
    if (body?.error_code === 'invalid_current_password') throw new Error('A senha atual está incorreta.');
    if (body?.error_code === 'weak_password' || response.status === 422) throw new Error('A nova senha foi recusada. Escolha uma frase longa e única.');
    if (response.status === 401 || response.status === 403) throw new Error('Sua sessão expirou. Entre novamente.');
    if (response.status === 429) throw new Error('Muitas tentativas. Aguarde um pouco e tente novamente.');
    throw new Error('Não foi possível alterar a senha. Tente novamente.');
  }
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { error: flagError } = await supabaseAdmin.from('administrators').update({ must_change_password: false }).eq('id', context.account.id);
  if (flagError) throw new Error('Senha alterada; a liberação da conta precisa ser repetida.');
  return { success: true };
});

export const createAdministrator = createServerFn({ method: 'POST' }).middleware([clubAuth]).inputValidator(z.object({ username: usernameSchema, temporaryPassword: passwordSchema })).handler(async ({ data, context }) => {
  if (!canManageAdministrators(context.role, context.account.must_change_password)) throw new Error('Somente o proprietário pode criar contas.');
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
  if (!canManageAdministrators(context.role, context.account.must_change_password)) throw new Error('Somente o proprietário pode gerenciar contas.');
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


export const requestPasswordRecovery = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ email: z.string().trim().email().max(254) }))
  .handler(async ({ data }) => {
    const { publicClient } = await import('./public-client.server');
    // The same message is returned for registered and unregistered addresses.
    const { error } = await publicClient().auth.resetPasswordForEmail(data.email, {
      redirectTo: 'https://clube237.vercel.app/redefinir-senha',
    });
    if (error && error.status === 429) throw new Error('Muitas tentativas. Aguarde alguns minutos.');
    if (error) throw new Error('Não foi possível enviar o e-mail agora. Tente novamente.');
    return { success: true };
  });

export const completePasswordRecovery = createServerFn({ method: 'POST' })
  .middleware([clubAuth])
  .inputValidator(z.object({}))
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin.from('administrators')
      .update({ must_change_password: false })
      .eq('id', context.account.id);
    if (error) throw new Error('Senha atualizada, mas não foi possível liberar a conta. Contate o proprietário.');
    return { success: true };
  });
