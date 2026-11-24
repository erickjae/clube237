import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { ClubShell } from '@/components/club-shell';
import { pageHead } from '@/lib/metadata';
import { Compass, Ticket, ListVideo, Star, UserRound, Trophy, Orbit, KeyRound } from 'lucide-react';

export const Route = createFileRoute('/guia')({
  head: () => pageHead('Guia', 'Conheça o Clube237, suas regras e como participar.'),
  component: Guide,
});

const sections = [
  { icon: Compass, title: 'Conhecendo o clube', text: 'Explore os filmes, as avaliações, a fila e os perfis públicos sem precisar de uma conta. O mesmo filme pode despertar diferentes olhares.' },
  { icon: Ticket, title: 'Faça parte do clube', text: 'A participação é exclusivamente por convite do proprietário. Com sua conta, entre usando seu nome de usuário e senha.' },
  { icon: ListVideo, title: 'Sua fila de filmes', text: 'No painel ou no catálogo, procure um filme e adicione à sua fila individual. Ao avaliá-lo, ele sai da fila automaticamente.' },
  { icon: Star, title: 'Avalie do seu jeito', text: 'Dê uma nota de 0 a 10, com até uma casa decimal, indique se recomenda e escreva um comentário de 2 a 1.000 caracteres. Você pode avaliar diretamente pelo catálogo, sem passar pela fila. Sua avaliação, sua identidade: escreva livremente, respeite opiniões diferentes e não revele spoilers.' },
  { icon: UserRound, title: 'Seu perfil', text: 'Personalize seu avatar, apresente seus gostos e explique seus critérios de avaliação. Cada membro tem sua própria maneira de sentir o cinema.' },
  { icon: Trophy, title: 'Conquistas e ranking', text: 'Desbloqueie conquistas conforme avalia filmes e explora gêneros. Acompanhe sua evolução e conheça a trajetória dos outros membros.' },
  { icon: Orbit, title: 'Meu universo cinematográfico', text: 'No seu painel, descubra seu tempo de cinema, gêneros favoritos, artistas mais presentes, afinidade com outros membros e sugestões de filmes. Alguns indicadores dependem dos dados disponíveis e do seu histórico.' },
  { icon: KeyRound, title: 'Sua conta', text: 'Use uma senha exclusiva e não compartilhe suas credenciais. Caso tenha dificuldades de acesso, procure o proprietário do clube.' },
];

const questions = [
  ['Preciso de uma conta para explorar o clube?', 'Não. O catálogo, as avaliações e os perfis públicos estão disponíveis para visitantes.'],
  ['Como faço para participar?', 'A participação acontece exclusivamente por convite do proprietário.'],
  ['Existe um padrão para escrever avaliações?', 'Não. Cada membro escreve de acordo com sua personalidade e seus critérios. Pedimos respeito às opiniões e comentários sem spoilers.'],
  ['Por que as notas podem ser tão diferentes?', 'O cinema é uma experiência individual. A diversidade de opiniões faz parte da identidade do clube.'],
  ['Preciso adicionar um filme à fila antes de avaliar?', 'Não. Você pode avaliar diretamente pelo catálogo.'],
  ['Posso alterar minha avaliação?', 'Sim. Use a opção Reavaliar no catálogo para atualizar sua avaliação, sem duplicá-la.'],
  ['O que acontece se eu excluir uma avaliação?', 'Ela é removida do seu histórico e dos indicadores associados. O filme não retorna automaticamente à fila.'],
  ['Como funcionam as conquistas?', 'São desbloqueadas conforme você avalia filmes e explora gêneros. Excluir avaliações pode alterar seu progresso.'],
  ['Como são calculadas as horas de cinema?', 'Somamos a duração dos filmes avaliados que possuem essa informação. Não é um registro de sessões repetidas.'],
  ['De onde vêm os dados dos filmes?', 'As informações cinematográficas são fornecidas pelo TMDB. As avaliações são dos membros do Clube237.'],
];

function Guide() {
  const [tab, setTab] = useState<'guide' | 'faq'>('guide');
  return <ClubShell><div className="container-club club-guide">
    <header className="page-heading"><p className="eyebrow">Clube237 / Guia</p><h1>Por trás das cortinas</h1><p>Tudo o que você precisa saber para aproveitar o Clube237.</p></header>
    <div className="guide-tabs" role="group" aria-label="Conteúdo do guia">
      <button type="button" aria-pressed={tab === 'guide'} onClick={() => setTab('guide')}>Guia de utilização</button>
      <button type="button" aria-pressed={tab === 'faq'} onClick={() => setTab('faq')}>Perguntas frequentes</button>
    </div>
    {tab === 'guide' ? <section aria-label="Guia de utilização" className="guide-sections">
      {sections.map(({ icon: Icon, title, text }) => <article className="guide-section" key={title}><Icon aria-hidden="true" /><div><h2>{title}</h2><p>{text}</p></div></article>)}
    </section> : <section aria-label="Perguntas frequentes" className="guide-sections">
      {questions.map(([question, answer]) => <details className="guide-faq" key={question}><summary>{question}</summary><p>{answer}</p></details>)}
    </section>}
    <p className="guide-signoff">O mesmo filme. Diferentes olhares. Nenhuma opinião precisa ser igual.</p>
    <Link to="/" className="guide-return">Voltar ao clube</Link>
  </div></ClubShell>;
}
