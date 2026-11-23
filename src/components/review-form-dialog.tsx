import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Film, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { reviewSchema } from '@/lib/club-rules';
import { submitReview, submitDirectReview, updateMyReview } from '@/services/reviews.functions';
import type { WatchlistEntry } from '@/components/watchlist-panel';

type ReviewFormDialogProps = {
  entry: WatchlistEntry;
  direct?: boolean;
  existingReview?: { id: string; rating: number; recommend: boolean; comment: string };
  onClose: () => void;
  onSaved: (title: string) => void;
};

export function ReviewFormDialog({ entry, direct = false, existingReview, onClose, onSaved }: ReviewFormDialogProps) {
  const queryClient = useQueryClient();
  const saveReview = useServerFn(submitReview);
  const saveDirect = useServerFn(submitDirectReview);
  const saveExisting = useServerFn(updateMyReview);
  const [rating, setRating] = useState(existingReview ? String(existingReview.rating).replace('.', ',') : '');
  const [recommend, setRecommend] = useState<boolean | null>(existingReview?.recommend ?? null);
  const [comment, setComment] = useState(existingReview?.comment ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (rating === '') {
      setError('Informe uma nota de 0 a 10.');
      return;
    }
    if (recommend === null) {
      setError('Escolha se você recomenda ou não o filme.');
      return;
    }
    const parsed = reviewSchema.safeParse({ rating: Number(rating.replace(',', '.')), recommend, comment });
    if (!parsed.success) {
      setError('Use nota de 0 a 10 com uma casa decimal e comentário de 2 a 1.000 caracteres.');
      return;
    }

    setBusy(true);
    try {
      if (existingReview) await saveExisting({ data: { ...parsed.data, reviewId: existingReview.id } });
      else if (direct) await saveDirect({ data: { ...parsed.data, movieId: entry.movie.id } });
      else await saveReview({ data: { ...parsed.data, movieId: entry.movie.id } });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-watchlist'] }),
        queryClient.invalidateQueries({ queryKey: ['my-reviews'] }),
        queryClient.invalidateQueries({ queryKey: ['public-catalog'] }),
        queryClient.invalidateQueries({ queryKey: ['my-dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['my-reviews-page'] }),
        queryClient.invalidateQueries({ queryKey: ['films-page'] }),
      ]);
      onSaved(entry.movie.title);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar a avaliação.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent className="review-form-dialog">
        <DialogHeader>
          <DialogTitle>{existingReview ? 'Reavaliar filme' : 'Avaliar filme'}</DialogTitle>
          <DialogDescription>{existingReview ? 'Atualize sua avaliação anterior sem criar uma nova.' : 'Registre sua percepção. Se o filme estiver na fila, ele sairá dela automaticamente.'}</DialogDescription>
        </DialogHeader>
        <div className="review-form-layout">
          <div className="review-movie-summary">
            {entry.movie.posterPath
              ? <img src={`https://image.tmdb.org/t/p/w342${entry.movie.posterPath}`} alt={`Pôster de ${entry.movie.title}`} />
              : <div className="review-summary-poster-empty"><Film aria-hidden="true" /></div>}
            <h3>{entry.movie.title}</h3>
            <p>{entry.movie.releaseDate.slice(0, 4)}</p>
          </div>
          <form className="review-form" onSubmit={submit}>
            <label htmlFor="review-rating">Nota</label>
            <input
              id="review-rating"
              className="field review-rating-input"
              type="text"
              inputMode="decimal"
              pattern="(?:10(?:[,.]0)?|[0-9](?:[,.][0-9])?)"
              required
              placeholder="0,0 a 10,0"
              value={rating}
              onChange={(event) => { const value = event.target.value; if (/^(?:10(?:[,.]0?)?|[0-9](?:[,.][0-9]?)?)?$/.test(value)) setRating(value); }}
            />
            <span className="review-field-note">De 0 a 10, com até uma casa decimal.</span>

            <fieldset className="review-recommendation">
              <legend>Você recomenda?</legend>
              <label><input type="radio" name="recommend" required checked={recommend === true} onChange={() => setRecommend(true)} />Recomendo</label>
              <label><input type="radio" name="recommend" required checked={recommend === false} onChange={() => setRecommend(false)} />Não recomendo</label>
            </fieldset>

            <label htmlFor="review-comment">Comentário</label>
            <textarea
              id="review-comment"
              className="field review-comment-input"
              required
              minLength={2}
              maxLength={1000}
              rows={5}
              placeholder="O que ficou com você depois do filme?"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
            <span className="review-field-note">{comment.length}/1.000 caracteres · mínimo de 2</span>
            {error && <p className="form-error" role="alert">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={busy}><Star />{busy ? 'Salvando…' : existingReview ? 'Salvar alterações' : 'Salvar avaliação'}</Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
