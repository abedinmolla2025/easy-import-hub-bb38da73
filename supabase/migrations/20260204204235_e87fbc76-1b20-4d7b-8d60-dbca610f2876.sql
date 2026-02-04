-- Create quiz_questions table for storing quiz data with bilingual support
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  question_en TEXT,
  question_bn TEXT,
  options TEXT[] NOT NULL DEFAULT '{}',
  options_en TEXT[],
  options_bn TEXT[],
  correct_answer INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'General',
  difficulty TEXT NOT NULL DEFAULT 'medium',
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quiz_questions
-- Allow all authenticated users to read active questions
CREATE POLICY "Anyone can read active quiz questions"
  ON public.quiz_questions
  FOR SELECT
  USING (is_active = true);

-- Allow admins to read all questions (including inactive)
CREATE POLICY "Admins can read all quiz questions"
  ON public.quiz_questions
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Allow admins to create quiz questions
CREATE POLICY "Admins can create quiz questions"
  ON public.quiz_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Allow admins to update quiz questions
CREATE POLICY "Admins can update quiz questions"
  ON public.quiz_questions
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Allow admins to delete quiz questions
CREATE POLICY "Admins can delete quiz questions"
  ON public.quiz_questions
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_quiz_questions_updated_at
  BEFORE UPDATE ON public.quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_quiz_questions_category ON public.quiz_questions(category);
CREATE INDEX idx_quiz_questions_is_active ON public.quiz_questions(is_active);
CREATE INDEX idx_quiz_questions_order_index ON public.quiz_questions(order_index);