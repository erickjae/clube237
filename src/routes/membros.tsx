import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ClubShell } from '@/components/club-shell';
import { EmptyClub } from '@/components/catalog-view';
import { catalogOptions } from './index';
import { pageHead } from '@/lib/metadata';
export const Route = createFileRoute('/membros')({ head: () => pageHead('Membros', 'Conheça as pessoas e perspectivas que fazem parte do Clube237.'), loader: ({ context }) => context.queryClient.ensureQueryData(catalogOptions), component: Members });
function Members() { const { data } = useSuspenseQuery(catalogOptions); return <ClubShell><div className="container-club"><header className="page-heading"><p className="eyebrow">Pessoas, não críticos</p><h1>Os olhares do clube</h1><p>O mesmo filme nunca é o mesmo para todo mundo.</p></header><div className="member-list">{data.profiles.length ? data.profiles.map(p => <article className="member-row" key={p.id}><div className="club-avatar" aria-label="Avatar padrão do Clube237">237</div><div><h2>{p.display_name}</h2><p className="text-sm text-muted-foreground">{p.about}</p></div></article>) : <EmptyClub title="Os primeiros olhares estão chegando" description="Os perfis dos membros convidados aparecerão aqui." />}</div></div></ClubShell>; }