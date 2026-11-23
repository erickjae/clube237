import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Film, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { ClubShell } from '@/components/club-shell';
import { catalogOptions } from './index';
import { pageHead } from '@/lib/metadata';

export const Route = createFileRoute('/filmes/$movieId')({
  head: () => pageHead('Avaliações do filme', 'As percepções dos membros do Clube237.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogOptions),
  component: MovieDetails,
});

function MovieDetails() {
  const { movieId } = Route.useParams();
  const { data } = useSuspenseQuery(catalogOptions);
  const movie = data.reviewedMovies.find(item => item.id === movieId);
  const reviews = data.reviews.filter(item => item.movie_id === movieId);
  return <ClubShell><div className="container-club movie-detail">
    <Link to="/filmes" className="movie-back">← Voltar aos filmes</Link>
    {!movie || !reviews.length ? <div className="empty-club"><h1>Filme sem avaliações publicadas</h1><p>Este filme ainda não está no catálogo avaliado do clube.</p></div> :
      <><div className="movie-detail-heading">
        {movie.poster_path ? <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={`Pôster de ${movie.title}`} /> : <div className="movie-detail-placeholder"><Film /></div>}
        <div><p className="eyebrow">Filme avaliado</p><h1>{movie.title}</h1><p>{movie.release_date.slice(0,4)}</p><p>{movie.overview}</p><p>{reviews.length} {reviews.length === 1 ? 'avaliação publicada' : 'avaliações publicadas'}</p></div>
      </div><section className="movie-reviews"><h2>Percepções dos membros</h2>
      {reviews.map(review => { const author = data.profiles.find(p => p.administrator_id === review.administrator_id); return <article className="movie-review" key={review.id}>
        <div className="review-card-tags"><span>{author?.display_name ?? 'Membro do clube'}</span><span><Star size={14} /> {Number(review.rating).toFixed(1)}</span><span>{review.recommend ? <ThumbsUp size={14} /> : <ThumbsDown size={14} />}{review.recommend ? 'Recomenda' : 'Não recomenda'}</span></div>
        <p>{review.comment}</p>
      </article>; })}</section></>}
  </div></ClubShell>;
}
