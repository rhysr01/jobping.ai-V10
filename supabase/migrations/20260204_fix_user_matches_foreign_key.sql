-- Fix user_matches foreign key constraint
-- Problem: user_matches.user_id references auth.users.id but free users only exist in public.users
-- Solution: Change foreign key to reference public.users.id instead

-- Drop the existing constraint that references auth.users
ALTER TABLE user_matches DROP CONSTRAINT IF EXISTS user_matches_user_id_fkey;

-- Add new constraint that references public.users
ALTER TABLE user_matches ADD CONSTRAINT user_matches_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Verify the new constraint
SELECT 
  conname as constraint_name, 
  conrelid::regclass as table_name, 
  confrelid::regclass as foreign_table, 
  pg_get_constraintdef(oid) as constraint_definition 
FROM pg_constraint 
WHERE contype = 'f' 
  AND conrelid = 'user_matches'::regclass 
  AND conname = 'user_matches_user_id_fkey';