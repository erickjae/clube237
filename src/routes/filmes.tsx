import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { ClubShell } from '@/components/club-shell';
import { CatalogView } from '@/components/catalog-view';
import { publicFilmFilters } from '@/services/catalog.functions';
import { pageHead } from '@/lib/metadata';

const filterOptions = queryOptions({ queryKey: ['film-filters'], queryFn: () => publicFilmFilters() });
export const Route = createFileRoute('/filmes')({
  head: () => pageHead('Filmes', 'Explore o acervo do Clube237 e pesquise filmes já lançados no TMDB.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(filterOptions),
  component: Films,
});
function Films() {
  const { data } = useSuspenseQuery(filterOptions);
  return <ClubShell><div className="container-club">
    <header className="page-heading"><p className="eyebrow">Cada filme, um universo</p><h1>Filmes</h1><p>Histórias que ficam com a gente depois dos créditos.</p></header>
    <CatalogView filters={data} />
  </div></ClubShell>;
}
