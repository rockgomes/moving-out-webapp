-- Seed mock tags on existing listings for local testing.
-- Run once in Supabase Dashboard → SQL Editor.
-- Only touches listings that still have the default empty tags array.

UPDATE listings
SET tags = CASE category
  WHEN 'living-room' THEN ARRAY['furniture', 'decor']::TEXT[]
  WHEN 'bedroom'     THEN ARRAY['furniture', 'vintage']::TEXT[]
  WHEN 'kitchen'     THEN ARRAY['appliances', 'tools']::TEXT[]
  WHEN 'bathroom'    THEN ARRAY['appliances']::TEXT[]
  WHEN 'office'      THEN ARRAY['electronics', 'books']::TEXT[]
  WHEN 'misc'        THEN ARRAY['tools', 'sports']::TEXT[]
  ELSE               ARRAY[]::TEXT[]
END
WHERE tags = '{}';
