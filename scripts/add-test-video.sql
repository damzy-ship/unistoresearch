-- Add test video product for testing video functionality
-- This script adds a test video product with Gemini-extracted information

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
  is_featured,
  expires_at,
  created_at
) VALUES (
  -- Use the first merchant ID from the merchants table
  (SELECT id FROM merchants LIMIT 1),
  'Test Video Product - iPhone 13 Pro Max',
  'Selling my iPhone 13 Pro Max in excellent condition. 128GB storage, comes with original box and charger. Located at Campus Hostel Block A. Price: ₦450,000. Contact: +2348012345678',
  450000,
  'Campus Hostel Block A',
  '+2348012345678',
  'Electronics',
  'https://storage.googleapis.com/test-videos/test-video.mp4',
  'video',
  30, -- 30 seconds duration
  true, -- Featured for testing
  (NOW() + INTERVAL '24 hours'),
  NOW()
);

-- Add some test reactions
INSERT INTO real_time_product_reactions (
  product_id,
  user_id,
  reaction_type,
  created_at
) VALUES 
  ((SELECT id FROM real_time_products WHERE title = 'Test Video Product - iPhone 13 Pro Max'), 'test-user-1', 'like', NOW()),
  ((SELECT id FROM real_time_products WHERE title = 'Test Video Product - iPhone 13 Pro Max'), 'test-user-2', 'love', NOW()),
  ((SELECT id FROM real_time_products WHERE title = 'Test Video Product - iPhone 13 Pro Max'), 'test-user-3', 'interested', NOW());

-- Add some test comments
INSERT INTO real_time_product_comments (
  product_id,
  user_id,
  user_name,
  comment_text,
  is_verified,
  created_at
) VALUES 
  ((SELECT id FROM real_time_products WHERE title = 'Test Video Product - iPhone 13 Pro Max'), 'test-user-1', 'John Doe', 'Is this still available?', false, NOW()),
  ((SELECT id FROM real_time_products WHERE title = 'Test Video Product - iPhone 13 Pro Max'), 'test-user-2', 'Jane Smith', 'Great condition! Can you deliver?', false, NOW()),
  ((SELECT id FROM real_time_products WHERE title = 'Test Video Product - iPhone 13 Pro Max'), 'test-user-3', 'Mike Johnson', 'Interested in this. DM me!', false, NOW());

-- Update reaction and comment counts
UPDATE real_time_products 
SET 
  reactions_count = 3,
  comments_count = 3
WHERE title = 'Test Video Product - iPhone 13 Pro Max'; 