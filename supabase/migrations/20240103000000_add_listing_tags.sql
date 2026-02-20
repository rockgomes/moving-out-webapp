-- Add tags array to listings for cross-cutting type-based filtering
ALTER TABLE listings ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
