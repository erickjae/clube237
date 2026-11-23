import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { clubAuth } from './club-auth';

const profileInput = z.object({
  displayName: z.string().trim().min(2).max(60),
  about: z.string().trim().max(600),
  ratingPhilosophy: z.string().trim().max(600),
  favoriteGenreIds: z.array(z.string().uuid()).max(5),
});

export const myProfile = createServerFn({ method: 'POST' }).middleware([clubAuth])
  .handler(async ({ context }) => {
    if (context.role !== 'admin') throw new Error('Somente administradores possuem perfil público.');
    const [profile, genres, favorites] = await Promise.all([
      context.supabase.from('profiles').select('id, display_name, avatar_url, about, rating_philosophy').eq('administrator_id', context.account.id).single(),
      context.supabase.from('genres').select('id, name').order('name'),
      context.supabase.from('profile_favorite_genres').select('genre_id, profiles!inner(administrator_id)').eq('profiles.administrator_id', context.account.id),
    ]);
    if (profile.error || !profile.data || genres.error || favorites.error) throw new Error('Não foi possível carregar o perfil.');
    return {
      ...profile.data,
      genres: genres.data ?? [],
      favoriteGenreIds: (favorites.data ?? []).map(item => item.genre_id),
    };
  });

export const saveMyProfile = createServerFn({ method: 'POST' }).middleware([clubAuth])
  .inputValidator(profileInput)
  .handler(async ({ context, data }) => {
    if (context.role !== 'admin' || context.account.must_change_password) throw new Error('Conta sem permissão para editar o perfil.');
    const { data: profile, error: profileError } = await context.supabase.from('profiles')
      .select('id').eq('administrator_id', context.account.id).single();
    if (profileError || !profile) throw new Error('Perfil não encontrado.');
    const unique = [...new Set(data.favoriteGenreIds)];
    if (unique.length !== data.favoriteGenreIds.length) throw new Error('Selecione gêneros diferentes.');
    if (unique.length) {
      const { data: valid, error } = await context.supabase.from('genres').select('id').in('id', unique);
      if (error || valid?.length !== unique.length) throw new Error('Um dos gêneros selecionados é inválido.');
    }
    const { error: updateError } = await context.supabase.from('profiles').update({
      display_name: data.displayName, about: data.about, rating_philosophy: data.ratingPhilosophy,
    }).eq('id', profile.id);
    if (updateError) throw new Error('Não foi possível salvar as informações do perfil.');
    const { error: deleteError } = await context.supabase.from('profile_favorite_genres').delete().eq('profile_id', profile.id);
    if (deleteError) throw new Error('Dados salvos, mas não foi possível atualizar os gêneros.');
    if (unique.length) {
      const { error: insertError } = await context.supabase.from('profile_favorite_genres')
        .insert(unique.map(genre_id => ({ profile_id: profile.id, genre_id })));
      if (insertError) throw new Error('Dados salvos, mas não foi possível atualizar os gêneros.');
    }
    return { success: true };
  });
