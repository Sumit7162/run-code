
CREATE TABLE public.saved_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  code TEXT NOT NULL,
  output TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved codes"
ON public.saved_codes FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved codes"
ON public.saved_codes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved codes"
ON public.saved_codes FOR DELETE TO authenticated
USING (auth.uid() = user_id);
