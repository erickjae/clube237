import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Film, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { ClubShell } from '@/components/club-shell';
import { catalogOptions } from './index';
import { pageHead } from '@/lib/metadata';

export const Route = createFileRoute('/filmes_/$movieId')({
  head: () => pageHead('Detalhes do filme', 'Sinopse e percepções dos membros do Clube237.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogOptions),
  component: MovieDetails,
});

function MovieDetails() {
  const { movieId } = Route.useParams();
  const { data } = useSuspenseQuery(catalogOptions);
  const movie = data.movies.find(item => item.id === movieId);
  const reviews = data.reviews.filter(item => item.movie_id === movieId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return <ClubShell><div className="container-club movie-detail">
    <Link to="/filmes" className="movie-back">← Voltar aos filmes</Link>
    {!movie ? <div className="empty-club"><h1>Filme não encontrado</h1><p>Não foi possível localizar as informações deste filme.</p></div> :
      <><div className="movie-detail-heading">
        {movie.poster_path ? <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={`Pôster de ${movie.title}`} /> : <div className="movie-detail-placeholder"><Film /></div>}
        <div><p className="eyebrow">Clube237 · Detalhes do filme</p><h1>{movie.title}</h1><p>{movie.release_date.slice(0,4)}</p><h2 className="movie-synopsis-label">Sinopse</h2><p>{movie.overview || 'Sinopse ainda não disponível.'}</p>
        {reviews.length > 0 && <p>{reviews.length} {reviews.length === 1 ? 'avaliação publicada' : 'avaliações publicadas'}</p>}</div>
      </div>
      {reviews.length > 0 && <section className="movie-reviews"><h2>Percepções dos membros</h2>
        {reviews.map(review => { const author = data.profiles.find(p => p.administrator_id === review.administrator_id); return <article className="movie-review" key={review.id}>
          <header className="movie-review-header">
            <div className="movie-review-author">
              {author?.avatar_url ? <img src={author.avatar_url} alt={`Avatar de ${author.display_name}`} className="movie-review-avatar" /> : <div className="movie-review-avatar movie-review-avatar-fallback" aria-hidden="true">{(author?.display_name || 'M').slice(0,1).toUpperCase()}</div>}
              <div><h3>{author?.display_name || 'Membro do clube'}</h3><time dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString('pt-BR')}</time></div>
            </div>
            <div className="review-card-tags"><span><Star size={14} /> {Number(review.rating).toFixed(1)}</span><span>{review.recommend ? <ThumbsUp size={14} /> : <ThumbsDown size={14} />}{review.recommend ? 'Recomenda' : 'Não recomenda'}</span></div>
          </header>
          <div className="movie-review-comment">{review.comment}</div>
        </article>; })}
      </section>}
      {!reviews.length && <p className="movie-no-reviews">Este filme ainda não recebeu avaliações dos membros do clube.</p>}
      </>}
  </div></ClubShell>;
}
