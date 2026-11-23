import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { ClubShell } from '@/components/club-shell';
import { catalogOptions } from './index';
import { pageHead } from '@/lib/metadata';

export const Route = createFileRoute('/membros_/$profileId')({
  head: () => pageHead('Perfil do membro', 'Conheça os membros e as avaliações do Clube237.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogOptions),
  component: MemberProfile,
});

function MemberProfile() {
  const { profileId } = Route.useParams();
  const { data } = useSuspenseQuery(catalogOptions);
  const profile = data.profiles.find(p => p.id === profileId);
  if (!profile) return <ClubShell><div className="container-club member-detail"><Link to="/membros">← Voltar aos membros</Link><h1>Perfil não encontrado</h1></div></ClubShell>;
  const reviews = data.reviews.filter(r => r.administrator_id === profile.administrator_id);
  const queue = data.queue.filter(q => q.administrator_id === profile.administrator_id);
  const genres = (data.favoriteGenres ?? []).filter(f => f.profile_id === profile.id).map(f => data.genres?.find(g => g.id === f.genre_id)?.name).filter(Boolean);
  return <ClubShell><div className="container-club member-detail">
    <Link to="/membros" className="movie-back">← Voltar aos membros</Link>
    <header className="member-detail-header">
      {profile.avatar_url ? <img className="member-detail-avatar" src={profile.avatar_url} alt={`Avatar de ${profile.display_name}`} /> : <div className="member-detail-avatar member-detail-avatar-fallback">{profile.display_name.slice(0,1).toUpperCase()}</div>}
      <div><p className="eyebrow">Membro do Clube237</p><h1>{profile.display_name}</h1><p>{profile.about || 'Este membro ainda não escreveu sua apresentação.'}</p></div>
    </header>
    <div className="member-stats"><div><strong>{reviews.length}</strong><span>Filmes avaliados</span></div><div><strong>{reviews.filter(r=>r.recommend).length}</strong><span>Recomenda</span></div><div><strong>{reviews.filter(r=>!r.recommend).length}</strong><span>Não recomenda</span></div><div><strong>{queue.length}</strong><span>Na fila</span></div></div>
    {profile.rating_philosophy && <section className="member-detail-section"><h2>Como avalio filmes</h2><p>{profile.rating_philosophy}</p></section>}
    {genres.length > 0 && <section className="member-detail-section"><h2>Gêneros favoritos</h2><div className="member-genres">{genres.map(g=><span key={g}>{g}</span>)}</div></section>}
    <section className="member-detail-section"><h2>Minhas avaliações</h2>{reviews.length ? <div className="member-review-list">{reviews.map(review => {
      const movie = data.movies.find(m=>m.id===review.movie_id);
      return <Link to="/filmes/$movieId" params={{movieId:review.movie_id}} key={review.id} className="member-review-item">
        {movie?.poster_path && <img src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`} alt="" />}
        <div><h3>{movie?.title || 'Filme'}</h3><div className="review-card-tags"><span><Star size={14}/>{Number(review.rating).toFixed(1)}</span><span>{review.recommend ? <ThumbsUp size={14}/> : <ThumbsDown size={14}/>} {review.recommend ? 'Recomenda' : 'Não recomenda'}</span></div><p>{review.comment}</p></div>
      </Link>;
    })}</div> : <p>Nenhuma avaliação publicada ainda.</p>}</section>
  </div></ClubShell>;
}
