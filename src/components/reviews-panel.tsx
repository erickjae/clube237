import { useState } from 'react';
import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Film, Star, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyClub } from '@/components/catalog-view';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { formatReviewDate } from '@/lib/review-rules';
import { deleteReview, myReviews, myReviewsPage } from '@/services/reviews.functions';

export const myReviewsQueryOptions = queryOptions({
  queryKey: ['my-reviews'],
  queryFn: () => myReviews(),
});

type ReviewEntry = Awaited<ReturnType<typeof myReviewsPage>>['reviews'][number];

export function ReviewsPanel() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [recommendation, setRecommendation] = useState<'all' | 'yes' | 'no'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const history = useQuery({
    queryKey: ['my-reviews-page', page, search, recommendation, sort],
    queryFn: () => myReviewsPage({ data: { page, search, recommendation, sort } }),
  });
  const reviews = history.data?.reviews ?? [];
  const total = history.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 20));
  const queryClient = useQueryClient();
  const removeReview = useServerFn(deleteReview);
  const [detail, setDetail] = useState<ReviewEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReviewEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await removeReview({ data: { reviewId: deleteTarget.id } });
      const title = deleteTarget.movie.title;
      setDeleteTarget(null);
      setDetail(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: myReviewsQueryOptions.queryKey }),
        queryClient.invalidateQueries({ queryKey: ['my-reviews-page'] }),
        queryClient.invalidateQueries({ queryKey: ['public-catalog'] }),
        queryClient.invalidateQueries({ queryKey: ['my-dashboard'] }),
        queryClient.invalidateQueries({ predicate: q => String(q.queryKey[0]).startsWith('my-cinema-') || q.queryKey[0] === 'member-achievements' }),
      ]);
      setNotice(`Avaliação de ${title} excluída. O filme não voltou para a sua fila.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Não foi possível excluir a avaliação.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="reviews-section" aria-labelledby="reviews-title">
      <div className="watchlist-heading">
        <div>
          <p className="dashboard-section-number">Depois dos créditos</p>
          <h2 id="reviews-title">Minhas avaliações <span>{total}</span></h2>
        </div>
        <p>Suas percepções sobre os filmes, das mais recentes às primeiras.</p>
      </div>

      <form className="search-form film-filters" onSubmit={event => event.preventDefault()}>
        <input className="field" aria-label="Buscar minhas avaliações" placeholder="Buscar filme avaliado..." value={search} maxLength={100} onChange={event => { setSearch(event.target.value); setPage(1); }} />
        <select className="field" aria-label="Filtrar recomendações" value={recommendation} onChange={event => { setRecommendation(event.target.value as typeof recommendation); setPage(1); }}>
          <option value="all">Todas</option><option value="yes">Recomendo</option><option value="no">Não recomendo</option>
        </select>
        <select className="field" aria-label="Ordenar avaliações" value={sort} onChange={event => { setSort(event.target.value as typeof sort); setPage(1); }}>
          <option value="newest">Mais recentes</option><option value="oldest">Mais antigas</option><option value="highest">Maior nota</option><option value="lowest">Menor nota</option>
        </select>
      </form>
      <p className="text-sm text-muted-foreground">{total} avaliações encontradas · 20 por página</p>
      {history.isPending && <p role="status">Carregando avaliações...</p>}
      {history.isError && <p role="alert">Não foi possível carregar suas avaliações. <Button type="button" onClick={() => void history.refetch()}>Tentar novamente</Button></p>}
      {notice && <p className="management-notice" role="status">{notice}</p>}
      {error && !deleteTarget && <p className="form-error watchlist-error" role="alert">{error}</p>}

      {history.isSuccess && reviews.length > 0 ? (
        <div className="reviews-list">
          {reviews.map((review) => (
            <article className="review-card" key={review.id}>
              {review.movie.posterPath
                ? <img className="review-card-poster" src={`https://image.tmdb.org/t/p/w185${review.movie.posterPath}`} alt={`Pôster de ${review.movie.title}`} loading="lazy" />
                : <div className="review-card-poster watchlist-poster-empty"><Film aria-hidden="true" /></div>}
              <div className="review-card-content">
                <div className="review-card-heading">
                  <div><h3>{review.movie.title}</h3><p>{review.movie.releaseDate.slice(0, 4)}</p></div>
                  <strong aria-label={`Nota ${review.rating.toFixed(1)} de 10`}><Star />{review.rating.toFixed(1).replace('.', ',')}</strong>
                </div>
                <p className={review.recommend ? 'review-recommendation-status is-positive' : 'review-recommendation-status'}>
                  {review.recommend ? <ThumbsUp /> : <ThumbsDown />}{review.recommend ? 'Recomendo' : 'Não recomendo'}
                </p>
                <p className="review-card-comment">{review.comment}</p>
                <p className="review-card-date">Avaliado em {formatReviewDate(review.createdAt)}</p>
                <div className="review-card-actions">
                  <Button variant="outline" size="sm" onClick={() => { setError(''); setDetail(review); }}>Ver detalhes</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setError(''); setNotice(''); setDeleteTarget(review); }}><Trash2 />Excluir avaliação</Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : <EmptyClub title="Nenhuma avaliação ainda" description="Escolha um filme na sua fila e registre sua primeira percepção." />}

      {history.isSuccess && pages > 1 && <nav aria-label="Páginas de avaliações" className="flex items-center justify-center gap-3 mt-8">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
        <span>Página {page} de {pages}</span>
        <Button variant="outline" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Próxima</Button>
      </nav>}
      <Dialog open={detail !== null} onOpenChange={(open) => { if (!open) setDetail(null); }}>
        <DialogContent className="review-detail-dialog">
          <DialogHeader>
            <DialogTitle>Detalhes da avaliação</DialogTitle>
            <DialogDescription>{detail?.movie.title} · {detail?.movie.releaseDate.slice(0, 4)}</DialogDescription>
          </DialogHeader>
          {detail && <div className="review-detail-content">
            {detail.movie.posterPath
              ? <img src={`https://image.tmdb.org/t/p/w342${detail.movie.posterPath}`} alt={`Pôster de ${detail.movie.title}`} />
              : <div className="review-summary-poster-empty"><Film aria-hidden="true" /></div>}
            <div>
              <p className="review-detail-score"><Star />{detail.rating.toFixed(1).replace('.', ',')}<span>/ 10</span></p>
              <p className={detail.recommend ? 'review-recommendation-status is-positive' : 'review-recommendation-status'}>
                {detail.recommend ? <ThumbsUp /> : <ThumbsDown />}{detail.recommend ? 'Recomendo' : 'Não recomendo'}
              </p>
              <p className="review-detail-comment">{detail.comment}</p>
              <p className="review-card-date">Avaliado em {formatReviewDate(detail.createdAt)}</p>
            </div>
          </div>}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open && !busy) setDeleteTarget(null); }}>
        <AlertDialogContent className="account-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir avaliação?</AlertDialogTitle>
            <AlertDialogDescription>
              A avaliação de {deleteTarget?.movie.title} será excluída permanentemente. O filme não voltará para a sua fila.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="form-error" role="alert">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={(event) => { event.preventDefault(); void confirmDelete(); }}>
              {busy ? 'Excluindo…' : 'Excluir permanentemente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
