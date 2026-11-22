ALTER TABLE public.administrators DROP CONSTRAINT administrators_username_check;
ALTER TABLE public.administrators ADD CONSTRAINT administrators_username_check CHECK (username ~ '^[A-Za-z0-9_]{3,32}$');
CREATE UNIQUE INDEX administrators_username_case_insensitive ON public.administrators (lower(username));