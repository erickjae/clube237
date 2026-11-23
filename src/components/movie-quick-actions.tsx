import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ReviewFormDialog } from '@/components/review-form-dialog';
import { addToWatchlist } from '@/services/watchlist.functions';
import { myReviews } from '@/services/reviews.functions';
import { myWatchlist } from '@/services/watchlist.functions';

type Movie = { id: string; title: string; poster_path: string | null; release_date: string; tmdb_id?: number };
export function MovieQuickActions({ movie }: { movie: Movie }) {
  const client = useQueryClient();
  const [authenticated, setAuthenticated] = useState(false);
  useEffect(() => { let active = true; void supabase.auth.getSession().then(({data}) => { if(active) setAuthenticated(!!data.session); }); const {data: listener} = supabase.auth.onAuthStateChange((_event, session) => { if(active) setAuthenticated(!!session); }); return () => { active=false; listener.subscription.unsubscribe(); }; }, []);
  const add = useServerFn(addToWatchlist);
  const loadReviews = useServerFn(myReviews);
  const loadWatchlist = useServerFn(myWatchlist);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [review, setReview] = useState(false);
  const upcoming = movie.release_date > new Date().toISOString().slice(0, 10);
  const entry = { id: 'direct-' + movie.id, addedAt: new Date().toISOString(), movie: {
    id: movie.id, tmdbId: movie.tmdb_id ?? 0, title: movie.title, posterPath: movie.poster_path, releaseDate: movie.release_date,
  } };
  async function perform(action: 'add' | 'review') {
    setBusy(true); setNotice('');
    try {
      const [reviews, queue] = await Promise.all([loadReviews(), loadWatchlist()]);
      if (reviews.some(r => r.movie.id === movie.id)) { setNotice('Você já avaliou este filme.'); return; }
      if (action === 'review') { if (upcoming) { setNotice('Aguarde a estreia para avaliar.'); return; } setReview(true); return; }
      if (queue.some(q => q.movie.id === movie.id)) { setNotice('Este filme já está na sua fila.'); return; }
      await add({ data: { movieId: movie.id } });
      await Promise.all([client.invalidateQueries({ queryKey: ['my-watchlist'] }), client.invalidateQueries({ queryKey: ['my-dashboard'] }), client.invalidateQueries({ queryKey: ['public-catalog'] })]);
      setNotice('Adicionado à sua fila!');
    } catch (e) { setNotice(e instanceof Error ? e.message : 'Não foi possível concluir a ação.'); }
    finally { setBusy(false); }
  }
  if (!authenticated) return null;
  return <div className="movie-quick-actions" onClick={e => e.stopPropagation()}>
    <Button size="sm" variant="outline" disabled={busy} onClick={() => void perform('add')}>Minha fila +</Button>
    <Button size="sm" disabled={busy || upcoming} onClick={() => void perform('review')}>{upcoming ? 'Em breve' : 'Avaliar'}</Button>
    {notice && <p role="status" className="movie-quick-notice">{notice}</p>}
    {review && <ReviewFormDialog entry={entry} direct onClose={() => setReview(false)} onSaved={() => { setReview(false); setNotice('Avaliação publicada!'); void client.invalidateQueries({ queryKey: ['films-page'] }); }} />}
  </div>;
}
