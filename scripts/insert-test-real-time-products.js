// Script to insert test real-time products
// Run this with: node scripts/insert-test-real-time-products.js

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test merchant data (you can replace this with your actual merchant ID)
const TEST_MERCHANT_ID = 'your-merchant-id'; // We'll find or create this

// Test products data
const testProducts = [
  {
    title: "iPhone 13 Pro Max - Excellent Condition",
    description: "Perfect condition iPhone 13 Pro Max, 256GB, Sierra Blue. Comes with original box and accessories. No scratches or dents.",
    price: 450000,
    location: "Bingham University Campus",
    contact_phone: "+2347010363424",
    category: "Electronics",
    media_url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop",
    media_type: "image",
    duration: null
  },
  {
    title: "MacBook Air M1 - 2020 Model",
    description: "MacBook Air with Apple M1 chip, 8GB RAM, 256GB SSD. Perfect for students. Lightweight and powerful.",
    price: 650000,
    location: "Veritas University",
    contact_phone: "+2347010363424",
    category: "Electronics",
    media_url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop",
    media_type: "image",
    duration: null
  },
  {
    title: "Nike Air Jordan 1 Retro High",
    description: "Authentic Nike Air Jordan 1 Retro High OG, Size 42. Limited edition colorway. Brand new in box.",
    price: 85000,
    location: "Bingham University",
    contact_phone: "+2347010363424",
    category: "Clothing",
    media_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop",
    media_type: "image",
    duration: null
  },
  {
    title: "Samsung Galaxy S21 Ultra",
    description: "Samsung Galaxy S21 Ultra, 128GB, Phantom Black. Excellent condition with original box and charger.",
    price: 380000,
    location: "Veritas University Campus",
    contact_phone: "+2347010363424",
    category: "Electronics",
    media_url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop",
    media_type: "image",
    duration: null
  },
  {
    title: "Textbooks Bundle - Computer Science",
    description: "Complete set of Computer Science textbooks for 2nd year. Clean and well-maintained. Great price for students.",
    price: 25000,
    location: "Bingham University Library",
    contact_phone: "+2347010363424",
    category: "Books",
    media_url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop",
    media_type: "image",
    duration: null
  },
  {
    title: "Gaming Laptop - ASUS ROG",
    description: "ASUS ROG Gaming Laptop, RTX 3060, 16GB RAM, 512GB SSD. Perfect for gaming and programming.",
    price: 750000,
    location: "Veritas University",
    contact_phone: "+2347010363424",
    category: "Electronics",
    media_url: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&h=600&fit=crop",
    media_type: "image",
    duration: null
  },
  {
    title: "Wireless Earbuds - AirPods Pro",
    description: "Apple AirPods Pro with active noise cancellation. Excellent condition, comes with charging case.",
    price: 120000,
    location: "Bingham University",
    contact_phone: "+2347010363424",
    category: "Electronics",
    media_url: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&h=600&fit=crop",
    media_type: "image",
    duration: null
  },
  {
    title: "Designer Watch - Rolex Submariner",
    description: "Authentic Rolex Submariner, excellent condition. Perfect gift or investment piece.",
    price: 2500000,
    location: "Veritas University",
    contact_phone: "+2347010363424",
    category: "Accessories",
    media_url: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&h=600&fit=crop",
    media_type: "image",
    duration: null
  }
];

async function findOrCreateMerchant() {
  // First, try to find an existing merchant with your phone number
  const { data: existingMerchant, error: findError } = await supabase
    .from('merchants')
    .select('id')
    .eq('phone_number', '+2347010363424')
    .limit(1);

  if (findError) {
    console.error('Error finding merchant:', findError);
    return null;
  }

  if (existingMerchant && existingMerchant.length > 0) {
    console.log('Found existing merchant:', existingMerchant[0].id);
    return existingMerchant[0].id;
  }

  // If no merchant found, create one
  const { data: newMerchant, error: createError } = await supabase
    .from('merchants')
    .insert({
      email: 'test@unistore.com',
      full_name: 'Test Merchant',
      phone_number: '+2347010363424',
      school_name: 'Bingham University',
      seller_description: 'Test merchant for real-time products',
      is_billing_active: true
    })
    .select('id')
    .single();

  if (createError) {
    console.error('Error creating merchant:', createError);
    return null;
  }

  console.log('Created new merchant:', newMerchant.id);
  return newMerchant.id;
}

async function insertTestProducts() {
  try {
    console.log('Starting to insert test real-time products...');

    // Find or create merchant
    const merchantId = await findOrCreateMerchant();
    if (!merchantId) {
      console.error('Failed to get merchant ID');
      return;
    }

    // Insert test products
    for (const product of testProducts) {
      // Set expiration to 24 hours from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { data, error } = await supabase
        .from('real_time_products')
        .insert({
          merchant_id: merchantId,
          title: product.title,
          description: product.description,
          price: product.price,
          location: product.location,
          contact_phone: product.contact_phone,
          category: product.category,
          media_url: product.media_url,
          media_type: product.media_type,
          duration: product.duration,
          expires_at: expiresAt.toISOString()
        });

      if (error) {
        console.error('Error inserting product:', product.title, error);
      } else {
        console.log('✅ Inserted:', product.title);
      }
    }

    console.log('🎉 Test products inserted successfully!');
    console.log('You can now test the real-time products feature at:');
    console.log('- Homepage: http://localhost:5173/');
    console.log('- Real-time page: http://localhost:5173/real-time');
    console.log('- Admin panel: http://localhost:5173/admin?tab=real-time');

  } catch (error) {
    console.error('Error inserting test products:', error);
  }
}

// Run the script
insertTestProducts(); 