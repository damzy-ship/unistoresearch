-- Add reactions and comments tables for real-time products

-- Real-time Product Reactions
CREATE TABLE IF NOT EXISTS real_time_product_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES real_time_products(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type = ANY (ARRAY['like'::text, 'love'::text, 'wow'::text, 'fire'::text, 'interested'::text])),
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, user_id, reaction_type)
);

-- Real-time Product Comments
CREATE TABLE IF NOT EXISTS real_time_product_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES real_time_products(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  user_name text NOT NULL,
  comment_text text NOT NULL,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add reaction counts to real_time_products table
ALTER TABLE real_time_products 
ADD COLUMN IF NOT EXISTS reactions_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_real_time_product_reactions_product_id ON real_time_product_reactions(product_id);
CREATE INDEX IF NOT EXISTS idx_real_time_product_reactions_user_id ON real_time_product_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_real_time_product_comments_product_id ON real_time_product_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_real_time_product_comments_created_at ON real_time_product_comments(created_at DESC);

-- RLS Policies for reactions
ALTER TABLE real_time_product_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions on any product" ON real_time_product_reactions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add reactions" ON real_time_product_reactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own reactions" ON real_time_product_reactions
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own reactions" ON real_time_product_reactions
  FOR DELETE USING (auth.uid()::text = user_id);

-- RLS Policies for comments
ALTER TABLE real_time_product_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on any product" ON real_time_product_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add comments" ON real_time_product_comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own comments" ON real_time_product_comments
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own comments" ON real_time_product_comments
  FOR DELETE USING (auth.uid()::text = user_id);

-- Function to update reaction counts
CREATE OR REPLACE FUNCTION update_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE real_time_products 
    SET reactions_count = reactions_count + 1
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE real_time_products 
    SET reactions_count = reactions_count - 1
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update comment counts
CREATE OR REPLACE FUNCTION update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE real_time_products 
    SET comments_count = comments_count + 1
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE real_time_products 
    SET comments_count = comments_count - 1
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic count updates
DROP TRIGGER IF EXISTS trigger_update_reaction_counts ON real_time_product_reactions;
CREATE TRIGGER trigger_update_reaction_counts
  AFTER INSERT OR DELETE ON real_time_product_reactions
  FOR EACH ROW EXECUTE FUNCTION update_reaction_counts();

DROP TRIGGER IF EXISTS trigger_update_comment_counts ON real_time_product_comments;
CREATE TRIGGER trigger_update_comment_counts
  AFTER INSERT OR DELETE ON real_time_product_comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_counts();

-- Update existing products to have default counts
UPDATE real_time_products 
SET reactions_count = 0, comments_count = 0 
WHERE reactions_count IS NULL OR comments_count IS NULL; 