-- Hadith books master table
CREATE TABLE public.hadith_books (
  id text PRIMARY KEY,
  title text NOT NULL,
  title_bn text,
  title_ar text,
  author text,
  author_bn text,
  total_chapters integer NOT NULL DEFAULT 0,
  total_hadiths integer NOT NULL DEFAULT 0,
  description text,
  description_bn text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hadith_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active hadith books"
  ON public.hadith_books FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage hadith books"
  ON public.hadith_books FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Hadith chapters table
CREATE TABLE public.hadith_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id text NOT NULL REFERENCES public.hadith_books(id) ON DELETE CASCADE,
  chapter_number integer NOT NULL,
  title text NOT NULL,
  title_bn text,
  title_ar text,
  hadith_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(book_id, chapter_number)
);

ALTER TABLE public.hadith_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read hadith chapters"
  ON public.hadith_chapters FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage hadith chapters"
  ON public.hadith_chapters FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Seed hadith books
INSERT INTO public.hadith_books (id, title, title_bn, title_ar, author, author_bn, total_chapters, total_hadiths, description, description_bn, display_order) VALUES
('bukhari', 'Sahih Bukhari', 'সহীহ বুখারী', 'صحيح البخاري', 'Imam Muhammad ibn Ismail al-Bukhari', 'ইমাম মুহাম্মদ ইবনে ইসমাইল আল-বুখারী (রহ.)', 97, 7563, 'The most authentic collection of Hadith, compiled by Imam Bukhari (194–256 AH).', 'ইমাম বুখারী (রহ.) কর্তৃক সংকলিত সর্বাধিক বিশুদ্ধ হাদিস গ্রন্থ।', 1),
('muslim', 'Sahih Muslim', 'সহীহ মুসলিম', 'صحيح مسلم', 'Imam Muslim ibn al-Hajjaj', 'ইমাম মুসলিম ইবনুল হাজ্জাজ (রহ.)', 56, 7563, 'The second most authentic Hadith collection, compiled by Imam Muslim (206–261 AH).', 'ইমাম মুসলিম (রহ.) কর্তৃক সংকলিত দ্বিতীয় সর্বাধিক বিশুদ্ধ হাদিস গ্রন্থ।', 2),
('tirmidhi', 'Jami at-Tirmidhi', 'জামে তিরমিযী', 'جامع الترمذي', 'Imam Abu Isa Muhammad at-Tirmidhi', 'ইমাম আবু ঈসা মুহাম্মদ আত-তিরমিযী (রহ.)', 49, 3956, 'A prominent Hadith collection known for grading hadith authenticity, compiled by Imam Tirmidhi (209–279 AH).', 'ইমাম তিরমিযী (রহ.) কর্তৃক সংকলিত হাদিসের মান নির্ণয়ে বিখ্যাত হাদিস গ্রন্থ।', 3),
('abu-dawud', 'Sunan Abu Dawud', 'সুনানে আবু দাউদ', 'سنن أبي داود', 'Imam Abu Dawud Sulayman ibn al-Ashath', 'ইমাম আবু দাউদ সুলায়মান ইবনুল আশআস (রহ.)', 43, 5274, 'A major Hadith collection focusing on legal hadith, compiled by Imam Abu Dawud (202–275 AH).', 'ইমাম আবু দাউদ (রহ.) কর্তৃক সংকলিত ফিকহী হাদিসের অন্যতম প্রধান গ্রন্থ।', 4);
