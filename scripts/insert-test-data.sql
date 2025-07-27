-- SQL script to insert test real-time products
-- Run this in your Supabase SQL editor

-- First, let's create a test merchant if it doesn't exist
DO $$
DECLARE
    merchant_id uuid;
BEGIN
    -- Check if merchant exists
    SELECT id INTO merchant_id FROM merchants WHERE phone_number = '+2347010363424' LIMIT 1;
    
    -- If merchant doesn't exist, create one
    IF merchant_id IS NULL THEN
        INSERT INTO merchants (email, full_name, phone_number, school_name, seller_description, is_billing_active)
        VALUES (
            'test@unistore.com',
            'Test Merchant',
            '+2347010363424',
            'Bingham University',
            'Test merchant for real-time products',
            true
        ) RETURNING id INTO merchant_id;
        
        RAISE NOTICE 'Created new merchant with ID: %', merchant_id;
    ELSE
        RAISE NOTICE 'Found existing merchant with ID: %', merchant_id;
    END IF;
    
    -- Insert test real-time products
    INSERT INTO real_time_products (
        merchant_id,
        title,
        description,
        price,
        location,
        contact_phone,
        category,
        media_url,
        media_type,
        duration,
        expires_at
    ) VALUES
    (
        merchant_id,
        'iPhone 13 Pro Max - Excellent Condition',
        'Perfect condition iPhone 13 Pro Max, 256GB, Sierra Blue. Comes with original box and accessories. No scratches or dents.',
        450000,
        'Bingham University Campus',
        '+2347010363424',
        'Electronics',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop',
        'image',
        NULL,
        NOW() + INTERVAL '24 hours'
    ),
    (
        merchant_id,
        'MacBook Air M1 - 2020 Model',
        'MacBook Air with Apple M1 chip, 8GB RAM, 256GB SSD. Perfect for students. Lightweight and powerful.',
        650000,
        'Veritas University',
        '+2347010363424',
        'Electronics',
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop',
        'image',
        NULL,
        NOW() + INTERVAL '24 hours'
    ),
    (
        merchant_id,
        'Nike Air Jordan 1 Retro High',
        'Authentic Nike Air Jordan 1 Retro High OG, Size 42. Limited edition colorway. Brand new in box.',
        85000,
        'Bingham University',
        '+2347010363424',
        'Clothing',
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
        'image',
        NULL,
        NOW() + INTERVAL '24 hours'
    ),
    (
        merchant_id,
        'Samsung Galaxy S21 Ultra',
        'Samsung Galaxy S21 Ultra, 128GB, Phantom Black. Excellent condition with original box and charger.',
        380000,
        'Veritas University Campus',
        '+2347010363424',
        'Electronics',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop',
        'image',
        NULL,
        NOW() + INTERVAL '24 hours'
    ),
    (
        merchant_id,
        'Textbooks Bundle - Computer Science',
        'Complete set of Computer Science textbooks for 2nd year. Clean and well-maintained. Great price for students.',
        25000,
        'Bingham University Library',
        '+2347010363424',
        'Books',
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop',
        'image',
        NULL,
        NOW() + INTERVAL '24 hours'
    ),
    (
        merchant_id,
        'Gaming Laptop - ASUS ROG',
        'ASUS ROG Gaming Laptop, RTX 3060, 16GB RAM, 512GB SSD. Perfect for gaming and programming.',
        750000,
        'Veritas University',
        '+2347010363424',
        'Electronics',
        'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&h=600&fit=crop',
        'image',
        NULL,
        NOW() + INTERVAL '24 hours'
    ),
    (
        merchant_id,
        'Wireless Earbuds - AirPods Pro',
        'Apple AirPods Pro with active noise cancellation. Excellent condition, comes with charging case.',
        120000,
        'Bingham University',
        '+2347010363424',
        'Electronics',
        'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&h=600&fit=crop',
        'image',
        NULL,
        NOW() + INTERVAL '24 hours'
    ),
    (
        merchant_id,
        'Designer Watch - Rolex Submariner',
        'Authentic Rolex Submariner, excellent condition. Perfect gift or investment piece.',
        2500000,
        'Veritas University',
        '+2347010363424',
        'Accessories',
        'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&h=600&fit=crop',
        'image',
        NULL,
        NOW() + INTERVAL '24 hours'
    );

    RAISE NOTICE 'Test products inserted successfully!';
END $$; 