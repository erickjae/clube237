import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { ClubShell } from '@/components/club-shell';
import { CatalogView } from '@/components/catalog-view';
import { publicFilmFilters } from '@/services/catalog.functions';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CatalogAddMovie } from '@/components/catalog-add-movie';
import { catalogSearchSchema } from '@/lib/catalog-navigation';
import { pageHead } from '@/lib/metadata';

const filterOptions = queryOptions({ queryKey: ['film-filters'], queryFn: () => publicFilmFilters() });
export const Route = createFileRoute('/filmes')({
  validateSearch: (search: Record<string, unknown>) => catalogSearchSchema.parse(search),
  head: () => pageHead('Filmes', 'Explore o acervo do Clube237 e pesquise filmes já lançados no TMDB.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(filterOptions),
  component: Films,
});
function Films() {
  const { data } = useSuspenseQuery(filterOptions);
  const [adminId, setAdminId] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    let version = 0;
    async function refresh() {
      const current = ++version;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { if (active && current === version) setAdminId(null); return; }
      const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).maybeSingle();
      if (active && current === version) setAdminId(role?.role === 'admin' ? session.user.id : null);
    }
    void refresh();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { if (!session) { version++; setAdminId(null); } else setTimeout(() => { if (active) void refresh(); }, 0); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);
  return <ClubShell><div className="container-club">
    <header className="page-heading catalog-page-heading"><div><p className="eyebrow">Cada filme, um universo</p><h1>Filmes</h1><p>Histórias que ficam com a gente depois dos créditos.</p></div>{adminId && <CatalogAddMovie key={adminId} userId={adminId} />}</header>
    <CatalogView filters={data} />
  </div></ClubShell>;
}
