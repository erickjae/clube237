import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { Film, Star } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MovieQuickActions } from '@/components/movie-quick-actions';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { publicFilmFilters, publicFilmsPage } from '@/services/catalog.functions';

export function EmptyClub({ title, description }: { title: string; description: string }) {
  return <div className="empty-club"><Film aria-hidden="true" /><h3>{title}</h3><p>{description}</p></div>;
}
type Sort = 'best' | 'worst' | 'most' | 'title';
type Filters = Awaited<ReturnType<typeof publicFilmFilters>>;

export function CatalogView({ filters }: { filters: Filters }) {
  const state = useSearch({ from: '/filmes' });
  const navigate = useNavigate({ from: '/filmes' });
  const { query, genreId, administratorId, recommend, sort, hideReviewed, page } = state;
  const change = (patch: Partial<typeof state>) => { void navigate({ search: prev => ({ ...prev, ...patch, page: 1 }), replace: true, resetScroll: false }); };
  const changePage = (next: number) => { void navigate({ search: prev => ({ ...prev, page: next }), resetScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); };
  const restored = useRef(false);
  const [accessToken, setAccessToken] = useState<string | undefined>();
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const { data } = await supabase.auth.getSession();
      if (active) setAccessToken(data.session?.access_token);
    };
    void refresh();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setAccessToken(session?.access_token);

      }
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);
  const search = useQuery({
    queryKey: ['films-page', page, query, genreId, administratorId, recommend, sort, hideReviewed, hideReviewed ? accessToken : null],
    enabled: !hideReviewed || !!accessToken,
    staleTime: 60000,
    queryFn: () => publicFilmsPage({ data: {
      page, search: query, genreId: genreId || null, administratorId: administratorId || null,
      recommend: recommend === '' ? null : recommend === 'yes',
      sort, hideReviewed: hideReviewed && !!accessToken,
      accessToken: hideReviewed ? accessToken : undefined,
    } }),
  });
  useLayoutEffect(() => {
    if (!search.isSuccess || restored.current) return;
    restored.current = true;
    try {
      const saved = sessionStorage.getItem('clube237:catalog-return');
      if (saved) {
        const target = JSON.parse(saved);
        sessionStorage.removeItem('clube237:catalog-return');
        if (target.url === window.location.pathname + window.location.search) requestAnimationFrame(() => window.scrollTo({ top: target.y, behavior: 'instant' }));
      }
    } catch { /* storage unavailable */ }
  }, [search.isSuccess]);
  const rememberPosition = () => { try { sessionStorage.setItem('clube237:catalog-return', JSON.stringify({ url: window.location.pathname + window.location.search, y: window.scrollY })); } catch { /* storage unavailable */ } };
  const total = search.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 50));
  const movies = search.data?.movies ?? [];
  return <>
    <form className="search-form film-filters" onSubmit={event => event.preventDefault()}>
      <input aria-label="Pesquisar filmes avaliados" className="field" placeholder="Buscar entre todos os filmes avaliados" value={query} onChange={event => change({ query: event.target.value })} maxLength={100} />
      <select aria-label="Filtrar por gênero" className="field" value={genreId} onChange={event => change({ genreId: event.target.value })}>
        <option value="">Todos os gêneros</option>
        {filters.genres.map(g => <option value={g.id} key={g.id}>{g.name}</option>)}
      </select>
      <select aria-label="Filtrar por administrador" className="field" value={administratorId} onChange={event => change({ administratorId: event.target.value })}>
        <option value="">Todos os administradores</option>
        {filters.profiles.map(p => <option value={p.administrator_id} key={p.administrator_id}>{p.display_name}</option>)}
      </select>
      <select aria-label="Filtrar por recomendação" className="field" value={recommend} onChange={event => change({ recommend: event.target.value as '' | 'yes' | 'no' })}>
        <option value="">Todas as recomendações</option>
        <option value="yes">Recomenda</option>
        <option value="no">Não recomenda</option>
      </select>
      <select aria-label="Ordenar filmes" className="field" value={sort} onChange={event => change({ sort: event.target.value as Sort })}>
        <option value="best">Melhores avaliados</option>
        <option value="worst">Menores notas</option>
        <option value="most">Mais avaliações</option>
        <option value="title">Título (A–Z)</option>
      </select>
      {accessToken && <label className="film-hide-reviewed">
        <input type="checkbox" checked={hideReviewed} onChange={event => change({ hideReviewed: event.target.checked })} />
        Ocultar filmes que já avaliei
      </label>}
      {(query || genreId || administratorId || recommend || sort !== 'best' || hideReviewed) && <Button variant="ghost" type="button" onClick={() => change({ query: '', genreId: '', administratorId: '', recommend: '', sort: 'best', hideReviewed: false })}>Limpar</Button>}
    </form>
    <p className="text-sm text-muted-foreground" aria-live="polite">{search.isPending ? 'Carregando filmes...' : `${total} ${total === 1 ? 'filme encontrado' : 'filmes encontrados'} · 50 por página`}</p>
    {search.isError ? <div role="alert"><p>Não foi possível carregar os filmes.</p><Button type="button" onClick={() => void search.refetch()}>Tentar novamente</Button></div> : null}
    {search.isSuccess && (movies.length ? <div className="film-grid">{movies.map(movie =>
      <article className="film-item" key={movie.id}><Link to="/filmes/$movieId" params={{ movieId: movie.id }} className="catalog-film-link" onClick={rememberPosition} search={{ fromCatalog: true, catalog: state }}>
        <div className="film-poster-frame">
          {movie.poster_path
            ? <img className="film-poster" src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={`Pôster de ${movie.title}`} loading="lazy" />
            : <div className="film-poster flex items-center justify-center"><Film /></div>}
          <span className="film-rating-badge" aria-label={`Média ${Number(movie.average_rating).toFixed(1)} de 10, com ${movie.review_count} avaliações`}><Star size={15} fill="currentColor" />{Number(movie.average_rating).toFixed(1).replace('.', ',')}</span>
        </div>
        <div className="catalog-film-meta"><h3>{movie.title}</h3>
        <p>{movie.release_date.slice(0, 4)}</p>
        {movie.genres.length > 0 && <p className="film-genres">{movie.genres.join(' · ')}</p>}
        <p className="film-review-count">{movie.review_count} {movie.review_count === 1 ? 'avaliação' : 'avaliações'}</p></div>
      </Link><MovieQuickActions movie={movie} />
      </article>
    )}</div> : <EmptyClub title="Nenhum filme encontrado" description="Experimente mudar os filtros ou pesquisar outro título." />)}
    {search.isSuccess && pages > 1 && <nav aria-label="Paginação de filmes" className="flex flex-wrap items-center justify-center gap-3 mt-8">
      <Button type="button" variant="outline" disabled={page === 1} onClick={() => changePage(Math.max(1, page - 1))}>Anterior</Button>
      <span className="text-sm">Página {page} de {pages}</span>
      <Button type="button" variant="outline" disabled={page >= pages} onClick={() => changePage(Math.min(pages, page + 1))}>Próxima</Button>
    </nav>}
  </>;
}
