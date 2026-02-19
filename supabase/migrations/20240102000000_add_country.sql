-- Add country column to profiles and listings for international support
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS country TEXT;
