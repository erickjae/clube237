import { useState } from 'react';
import { queryOptions, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { myProfile, saveMyProfile } from '@/services/profile.functions';

export const myProfileQueryOptions = queryOptions({ queryKey: ['my-profile'], queryFn: () => myProfile() });

export function ProfilePanel() {
  const { data: profile } = useSuspenseQuery(myProfileQueryOptions);
  const queryClient = useQueryClient();
  const save = useServerFn(saveMyProfile);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [about, setAbout] = useState(profile.about);
  const [philosophy, setPhilosophy] = useState(profile.rating_philosophy);
  const [favorites, setFavorites] = useState<string[]>(profile.favoriteGenreIds);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function uploadAvatar(file?: File) {
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError('Use JPG, PNG ou WebP com no máximo 2 MB.'); return;
    }
    setBusy(true); setError(''); setNotice('');
    try {
      const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `${profile.id}/avatar-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(path);
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl.publicUrl }).eq('id', profile.id);
      if (updateError) throw updateError;
      await Promise.all([queryClient.invalidateQueries({ queryKey: ['my-profile'] }), queryClient.invalidateQueries({ queryKey: ['public-catalog'] })]);
      setNotice('Avatar atualizado.');
    } catch {
      setError('Não foi possível enviar o avatar. Verifique se o bucket avatars está configurado no Supabase.');
    } finally { setBusy(false); }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      await save({ data: { displayName, about, ratingPhilosophy: philosophy, favoriteGenreIds: favorites } });
      await Promise.all([queryClient.invalidateQueries({ queryKey: ['my-profile'] }), queryClient.invalidateQueries({ queryKey: ['public-catalog'] })]);
      setNotice('Perfil salvo! As alterações já podem ser vistas pelo público.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar o perfil.'); }
    finally { setBusy(false); }
  }

  return <section className="profile-editor">
    <div className="watchlist-heading"><div><p className="dashboard-section-number">Sua identidade no clube</p><h2>Meu perfil</h2></div><p>Conte quem você é e como enxerga o cinema.</p></div>
    {error && <p role="alert" className="form-error">{error}</p>}
    {notice && <p role="status" className="management-notice">{notice}</p>}
    <div className="profile-avatar-editor">
      {profile.avatar_url ? <img src={profile.avatar_url} alt="Seu avatar atual" /> : <div className="club-avatar">{displayName.slice(0,1).toUpperCase()}</div>}
      <label className="profile-avatar-upload">Alterar foto (JPG, PNG ou WebP, até 2 MB)
        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => { void uploadAvatar(e.target.files?.[0]); e.target.value = ''; }} />
      </label>
    </div>
    <form onSubmit={submit} className="profile-editor-form">
      <label>Nome público<input required minLength={2} maxLength={60} value={displayName} onChange={e=>setDisplayName(e.target.value)} /></label>
      <label>Sobre mim <small>{about.length}/600</small><textarea maxLength={600} rows={4} value={about} onChange={e=>setAbout(e.target.value)} placeholder="Quem sou eu e o que gosto de assistir..." /></label>
      <label>Como avalio filmes <small>{philosophy.length}/600</small><textarea maxLength={600} rows={4} value={philosophy} onChange={e=>setPhilosophy(e.target.value)} placeholder="O que considero importante ao dar uma nota..." /></label>
      <fieldset><legend>Meus gêneros favoritos (até 5)</legend>
        {profile.genres.length ? <div className="profile-genre-options">{profile.genres.map(genre => <label key={genre.id}><input type="checkbox" checked={favorites.includes(genre.id)} disabled={!favorites.includes(genre.id) && favorites.length >= 5} onChange={e=>setFavorites(current=>e.target.checked ? [...current,genre.id] : current.filter(id=>id!==genre.id))} />{genre.name}</label>)}</div> : <p className="text-sm text-muted-foreground">Os gêneros ainda não foram cadastrados no banco de dados.</p>}
      </fieldset>
      <Button type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar meu perfil'}</Button>
    </form>
  </section>;
}
