import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Film, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { reviewSchema } from '@/lib/club-rules';
import { submitReview, submitDirectReview } from '@/services/reviews.functions';
import type { WatchlistEntry } from '@/components/watchlist-panel';

type ReviewFormDialogProps = {
  entry: WatchlistEntry;
  direct?: boolean;
  onClose: () => void;
  onSaved: (title: string) => void;
};

export function ReviewFormDialog({ entry, direct = false, onClose, onSaved }: ReviewFormDialogProps) {
  const queryClient = useQueryClient();
  const saveReview = useServerFn(submitReview);
  const saveDirect = useServerFn(submitDirectReview);
  const [rating, setRating] = useState('');
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
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
    const parsed = reviewSchema.safeParse({ rating: Number(rating), recommend, comment });
    if (!parsed.success) {
      setError('Use nota de 0 a 10 com uma casa decimal e comentário de 2 a 1.000 caracteres.');
      return;
    }

    setBusy(true);
    try {
      if (direct) await saveDirect({ data: { ...parsed.data, movieId: entry.movie.id } });
      else await saveReview({ data: { ...parsed.data, movieId: entry.movie.id } });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-watchlist'] }),
        queryClient.invalidateQueries({ queryKey: ['my-reviews'] }),
        queryClient.invalidateQueries({ queryKey: ['public-catalog'] }),
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
          <DialogTitle>Avaliar filme</DialogTitle>
          <DialogDescription>Registre sua percepção. Se o filme estiver na fila, ele sairá dela automaticamente.</DialogDescription>
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
              type="number"
              inputMode="decimal"
              min={0}
              max={10}
              step={0.1}
              required
              placeholder="0,0 a 10,0"
              value={rating}
              onChange={(event) => setRating(event.target.value)}
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
              <Button type="submit" disabled={busy}><Star />{busy ? 'Salvando…' : 'Salvar avaliação'}</Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
