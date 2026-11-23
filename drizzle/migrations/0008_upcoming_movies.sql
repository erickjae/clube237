-- Permitir filmes futuros no catálogo e na fila, mas impedir avaliações antes da estreia.
DROP TRIGGER IF EXISTS movie_release ON public.movies;
DROP FUNCTION IF EXISTS public.guard_release();

CREATE OR REPLACE FUNCTION public.guard_review_release()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.movies
    WHERE id = NEW.movie_id AND release_date > CURRENT_DATE
  ) THEN
    RAISE EXCEPTION 'Movie has not been released yet' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS review_release ON public.reviews;
CREATE TRIGGER review_release
BEFORE INSERT OR UPDATE OF movie_id ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.guard_review_release();

-- Também impedir que uma atualização da data de estreia torne avaliações existentes antecipadas.
CREATE OR REPLACE FUNCTION public.guard_movie_release_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.release_date > CURRENT_DATE
    AND EXISTS (SELECT 1 FROM public.reviews WHERE movie_id = NEW.id)
  THEN
    RAISE EXCEPTION 'Cannot move reviewed movie release date into future' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS movie_release_change ON public.movies;
CREATE TRIGGER movie_release_change
BEFORE UPDATE OF release_date ON public.movies
FOR EACH ROW EXECUTE FUNCTION public.guard_movie_release_change();
