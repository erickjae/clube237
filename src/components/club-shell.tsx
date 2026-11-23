import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from '@tanstack/react-router';
import { ArrowUpRight, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReactNode } from 'react';

export function Wordmark() { return <span className="wordmark">CLUBE<span>237</span></span>; }
export function ClubShell({ children }: { children: ReactNode }) {
  const [panel, setPanel] = useState<'/admin' | '/painel' | null>(null);
  useEffect(() => {
    let active = true;
    async function refresh() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (active) setPanel(null); return; }
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
      if (active) setPanel(data?.role === 'owner' ? '/admin' : data?.role === 'admin' ? '/painel' : null);
    }
    void refresh();
    const { data } = supabase.auth.onAuthStateChange(() => { void refresh(); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  return <div className="club-shell"><header className="club-header container-club"><Link to="/" aria-label="Clube237, início"><Wordmark /></Link><nav className="club-nav" aria-label="Navegação principal"><Link to="/" activeOptions={{ exact: true }}>O clube</Link><Link to="/filmes">Filmes</Link><Link to="/fila">Na fila</Link><Link to="/membros">Membros</Link></nav><Button asChild variant="outline" size="sm">{panel ? <Link to={panel}><LockKeyhole />Meu painel<ArrowUpRight /></Link> : <Link to="/auth"><LockKeyhole />Entrar no clube<ArrowUpRight /></Link>}</Button></header><main>{children}</main><footer className="club-footer container-club"><div className="footer-top"><Link to="/"><Wordmark /></Link><span className="text-xs text-muted-foreground">Cinema. Pessoas. Percepções.</span></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Clube237. Um clube, muitas perspectivas.</span><div><a className="tmdb-wordmark" href="https://www.themoviedb.org" target="_blank" rel="noreferrer">TMDB ↗</a><p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p></div></div></footer></div>;
}