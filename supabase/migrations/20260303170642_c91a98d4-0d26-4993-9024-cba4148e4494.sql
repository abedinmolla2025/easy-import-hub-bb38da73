
-- Create hadiths table for storing imported hadith data
CREATE TABLE public.hadiths (
  id text NOT NULL PRIMARY KEY,
  chapter_id integer NOT NULL,
  hadith_number integer NOT NULL,
  arabic text NOT NULL,
  bengali text,
  english text,
  hindi text,
  book_key text NOT NULL DEFAULT 'bukhari',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX idx_hadiths_book_chapter ON public.hadiths (book_key, chapter_id);
CREATE INDEX idx_hadiths_number ON public.hadiths (hadith_number);

-- Enable RLS
ALTER TABLE public.hadiths ENABLE ROW LEVEL SECURITY;

-- Anyone can read hadiths
CREATE POLICY "Anyone can read hadiths"
  ON public.hadiths FOR SELECT
  USING (true);

-- Only admins can manage hadiths
CREATE POLICY "Admins can manage hadiths"
  ON public.hadiths FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
