CREATE OR REPLACE FUNCTION public.guard_review() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' AND auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.watchlist
    WHERE movie_id=NEW.movie_id AND administrator_id=NEW.administrator_id
  ) THEN
    RAISE EXCEPTION 'Movie must be in member queue' USING ERRCODE='P0001';
  END IF;
  IF TG_OP='UPDATE' AND (NEW.administrator_id<>OLD.administrator_id OR NEW.movie_id<>OLD.movie_id OR NEW.created_at<>OLD.created_at OR NEW.id<>OLD.id) THEN
    RAISE EXCEPTION 'Review authorship is immutable';
  END IF;
  IF auth.uid() IS NOT NULL THEN
    NEW.updated_by=public.club_member();
    IF NEW.updated_by IS NULL THEN RAISE EXCEPTION 'Active member required'; END IF;
  END IF;
  NEW.updated_at=now();
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.submit_club_review(p_movie_id uuid, p_rating numeric, p_recommend boolean, p_comment text)
RETURNS public.reviews
LANGUAGE plpgsql
SET search_path=public
AS $$
DECLARE
  member_id uuid;
  saved public.reviews;
BEGIN
  member_id=public.club_member();
  IF member_id IS NULL THEN
    RAISE EXCEPTION 'Active member required' USING ERRCODE='42501';
  END IF;
  IF p_rating IS NULL OR p_rating<0 OR p_rating>10 OR p_rating<>round(p_rating,1) THEN
    RAISE EXCEPTION 'Invalid review rating' USING ERRCODE='23514';
  END IF;
  IF p_recommend IS NULL THEN
    RAISE EXCEPTION 'Recommendation is required' USING ERRCODE='23514';
  END IF;
  IF p_comment IS NULL OR char_length(btrim(p_comment))<2 OR char_length(btrim(p_comment))>1000 THEN
    RAISE EXCEPTION 'Invalid review comment' USING ERRCODE='23514';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.watchlist
    WHERE movie_id=p_movie_id AND administrator_id=member_id
  ) THEN
    RAISE EXCEPTION 'Movie must be in member queue' USING ERRCODE='P0001';
  END IF;

  INSERT INTO public.reviews (movie_id,administrator_id,rating,recommend,comment,updated_by)
  VALUES (p_movie_id,member_id,p_rating,p_recommend,btrim(p_comment),member_id)
  RETURNING * INTO saved;

  DELETE FROM public.watchlist
  WHERE movie_id=p_movie_id AND administrator_id=member_id;

  RETURN saved;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_club_review(uuid,numeric,boolean,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_club_review(uuid,numeric,boolean,text) TO authenticated, service_role;