-- Avaliação direta sem obrigar o membro a adicionar o filme manualmente à fila.
-- Usa a função de avaliação existente, preservando suas validações e remoção da fila.
CREATE OR REPLACE FUNCTION public.submit_direct_club_review(
  p_movie_id uuid, p_rating numeric, p_recommend boolean, p_comment text
)
RETURNS public.reviews
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  member_id uuid;
  saved public.reviews;
BEGIN
  member_id := public.club_member();
  IF member_id IS NULL THEN
    RAISE EXCEPTION 'Active member required' USING ERRCODE='42501';
  END IF;
  IF EXISTS (SELECT 1 FROM public.reviews WHERE movie_id=p_movie_id AND administrator_id=member_id) THEN
    RAISE EXCEPTION 'Movie already reviewed' USING ERRCODE='23505';
  END IF;
  -- Inserção temporária na mesma transação: a função existente valida e remove a fila.
  INSERT INTO public.watchlist (movie_id, administrator_id)
  VALUES (p_movie_id, member_id)
  ON CONFLICT (movie_id, administrator_id) DO NOTHING;

  SELECT * INTO saved FROM public.submit_club_review(p_movie_id,p_rating,p_recommend,p_comment);
  RETURN saved;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_direct_club_review(uuid,numeric,boolean,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_direct_club_review(uuid,numeric,boolean,text) TO authenticated, service_role;
