-- ============================================================
-- MoveOutSale — Initial Schema
-- ============================================================

-- ── Extensions ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Custom types ──────────────────────────────────────────────
CREATE TYPE listing_condition AS ENUM ('new', 'like_new', 'good', 'fair');
CREATE TYPE listing_status    AS ENUM ('active', 'reserved', 'sold');

-- ── Profiles ──────────────────────────────────────────────────
-- Extends Supabase auth.users with app-specific fields.
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name  TEXT,
  avatar_url    TEXT,
  facebook_id   TEXT,
  city          TEXT,
  state         TEXT,
  zip_code      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create a profile row when a new user signs up via OAuth.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Moving Sales ───────────────────────────────────────────────
-- Bundles all listings from one seller's move into a single page.
CREATE TABLE moving_sales (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id    UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  move_date    DATE,
  city         TEXT,
  state        TEXT,
  zip_code     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Listings ───────────────────────────────────────────────────
CREATE TABLE listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  moving_sale_id  UUID REFERENCES moving_sales ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  price           NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  condition       listing_condition NOT NULL DEFAULT 'good',
  category        TEXT NOT NULL,
  status          listing_status NOT NULL DEFAULT 'active',
  city            TEXT,
  state           TEXT,
  zip_code        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update the updated_at timestamp on changes.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER listings_set_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Listing Photos ─────────────────────────────────────────────
CREATE TABLE listing_photos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id     UUID NOT NULL REFERENCES listings ON DELETE CASCADE,
  storage_path   TEXT NOT NULL,
  display_order  INT NOT NULL DEFAULT 0
);

-- ── Conversations ──────────────────────────────────────────────
-- One conversation per buyer+listing pair (enforced by UNIQUE).
CREATE TABLE conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID NOT NULL REFERENCES listings ON DELETE CASCADE,
  buyer_id    UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  seller_id   UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (listing_id, buyer_id)
);

-- ── Messages ───────────────────────────────────────────────────
CREATE TABLE messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES conversations ON DELETE CASCADE,
  sender_id        UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  content          TEXT NOT NULL CHECK (char_length(content) > 0),
  is_read          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast message queries by conversation
CREATE INDEX messages_conversation_id_created_at_idx
  ON messages (conversation_id, created_at);

-- ── Saved Listings ─────────────────────────────────────────────
CREATE TABLE saved_listings (
  user_id     UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  listing_id  UUID NOT NULL REFERENCES listings ON DELETE CASCADE,
  saved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);

-- ── Indexes ────────────────────────────────────────────────────
CREATE INDEX listings_seller_id_idx    ON listings (seller_id);
CREATE INDEX listings_status_idx       ON listings (status);
CREATE INDEX listings_zip_code_idx     ON listings (zip_code);
CREATE INDEX listings_category_idx     ON listings (category);

-- ── Row Level Security ─────────────────────────────────────────
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE moving_sales    ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_photos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_listings  ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- moving_sales
CREATE POLICY "Moving sales are viewable by everyone"
  ON moving_sales FOR SELECT USING (true);

CREATE POLICY "Users can manage their own moving sales"
  ON moving_sales FOR ALL USING (auth.uid() = seller_id);

-- listings
CREATE POLICY "Active listings are viewable by everyone"
  ON listings FOR SELECT USING (status = 'active' OR auth.uid() = seller_id);

CREATE POLICY "Sellers can manage their own listings"
  ON listings FOR ALL USING (auth.uid() = seller_id);

-- listing_photos
CREATE POLICY "Listing photos are viewable by everyone"
  ON listing_photos FOR SELECT USING (true);

CREATE POLICY "Sellers can manage photos for their own listings"
  ON listing_photos FOR ALL USING (
    auth.uid() = (SELECT seller_id FROM listings WHERE id = listing_id)
  );

-- conversations
CREATE POLICY "Participants can view their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can start conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- messages
CREATE POLICY "Participants can view messages in their conversations"
  ON messages FOR SELECT USING (
    auth.uid() IN (
      SELECT buyer_id FROM conversations WHERE id = conversation_id
      UNION
      SELECT seller_id FROM conversations WHERE id = conversation_id
    )
  );

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    auth.uid() IN (
      SELECT buyer_id FROM conversations WHERE id = conversation_id
      UNION
      SELECT seller_id FROM conversations WHERE id = conversation_id
    )
  );

CREATE POLICY "Recipients can mark messages as read"
  ON messages FOR UPDATE USING (
    auth.uid() IN (
      SELECT buyer_id FROM conversations WHERE id = conversation_id
      UNION
      SELECT seller_id FROM conversations WHERE id = conversation_id
    )
  );

-- saved_listings
CREATE POLICY "Users can view their own saved listings"
  ON saved_listings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own saved listings"
  ON saved_listings FOR ALL USING (auth.uid() = user_id);

-- ── Storage Buckets ────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-photos', 'listing-photos', true);

CREATE POLICY "Anyone can view listing photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-photos');

CREATE POLICY "Authenticated users can upload listing photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'listing-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own listing photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'listing-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
