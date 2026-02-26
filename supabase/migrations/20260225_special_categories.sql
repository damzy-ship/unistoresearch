-- 1. Create special categories definition table
CREATE TABLE IF NOT EXISTS public.hostel_special_categories (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subtitle TEXT,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('price', 'ai', 'category', 'keyword')),
    rule_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add special_category_ids column to products table for pre-tagging
ALTER TABLE public.hostel_product_updates 
ADD COLUMN IF NOT EXISTS special_category_ids UUID[] DEFAULT '{}';

-- 3. Enable RLS
ALTER TABLE public.hostel_special_categories ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
CREATE POLICY "Enable read access for all users" ON public.hostel_special_categories
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for admins" ON public.hostel_special_categories
    USING (
        EXISTS (
            SELECT 1 FROM public.unique_visitors
            WHERE auth_user_id = auth.uid() AND is_admin = true
        )
    );

-- 5. Add GIN index for fast array searches
CREATE INDEX IF NOT EXISTS idx_hostel_product_updates_special_categories 
ON public.hostel_product_updates USING GIN (special_category_ids);
