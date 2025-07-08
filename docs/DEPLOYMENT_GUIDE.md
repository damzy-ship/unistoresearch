# Deployment Guide

This guide covers the complete deployment process for the UniStore application, including environment setup, database configuration, and production deployment.

## 🚀 Production Deployment

### Current Deployment
- **Platform**: Netlify
- **URL**: https://elegant-cannoli-d5b2bf.netlify.app
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`

### Deployment Configuration

#### Build Settings
```json
{
  "build": {
    "command": "npm run build",
    "publish": "dist",
    "environment": {
      "NODE_VERSION": "18"
    }
  }
}
```

#### Redirects Configuration
File: `public/_redirects`
```
/*    /index.html    200
```
This ensures proper SPA routing for React Router.

## 🔧 Environment Configuration

### Required Environment Variables

#### Frontend (.env)
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google AI Configuration
VITE_GEMINI_API_KEY=your-gemini-api-key
```

#### Supabase Environment Variables
These are automatically available in Supabase Edge Functions:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://...
```

### Environment Setup Steps

1. **Create Supabase Project**
   ```bash
   # Visit https://supabase.com
   # Create new project
   # Note down URL and anon key
   ```

2. **Get Google AI API Key**
   ```bash
   # Visit https://makersuite.google.com/app/apikey
   # Create new API key
   # Enable Generative AI API
   ```

3. **Configure Netlify Environment**
   ```bash
   # In Netlify dashboard:
   # Site settings → Environment variables
   # Add all VITE_ prefixed variables
   ```

## 🗄️ Database Setup

### Migration Process

#### 1. Initial Setup
```sql
-- Run migrations in order:
-- 1. Create tracking tables
-- 2. Create merchants table
-- 3. Add merchant policies
-- 4. Create categories system
-- 5. Create rating system
-- 6. Add analytics tables
-- 7. Add enhanced tracking
```

#### 2. Migration Files
Located in `supabase/migrations/`:
- `20250611125427_velvet_moon.sql` - Initial tracking tables
- `20250614081900_gentle_haze.sql` - Merchants table
- `20250614084303_still_disk.sql` - Merchant policies
- `20250614140022_maroon_dune.sql` - Product categories
- `20250614141127_floral_peak.sql` - Merchant categories
- `20250616020536_golden_swamp.sql` - Rating system
- `20250621121112_silver_water.sql` - Enhanced tracking
- `20250624131849_sweet_recipe.sql` - Fair visibility
- `20250624131853_bright_desert.sql` - Request deletion

#### 3. Row Level Security (RLS)
All tables have RLS enabled with public policies:

```sql
-- Example RLS setup
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to merchants"
  ON merchants FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert to merchants"
  ON merchants FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update to merchants"
  ON merchants FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete to merchants"
  ON merchants FOR DELETE TO public USING (true);
```

### Database Functions

#### Rating Summary Trigger
```sql
CREATE OR REPLACE FUNCTION update_merchant_rating_summary()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE merchants 
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM seller_ratings 
      WHERE merchant_id = COALESCE(NEW.merchant_id, OLD.merchant_id)
      AND (is_cancelled IS FALSE OR is_cancelled IS NULL)
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM seller_ratings 
      WHERE merchant_id = COALESCE(NEW.merchant_id, OLD.merchant_id)
      AND (is_cancelled IS FALSE OR is_cancelled IS NULL)
    ),
    rating_breakdown = (
      SELECT jsonb_build_object(
        '1', COUNT(*) FILTER (WHERE rating = 1),
        '2', COUNT(*) FILTER (WHERE rating = 2),
        '3', COUNT(*) FILTER (WHERE rating = 3),
        '4', COUNT(*) FILTER (WHERE rating = 4),
        '5', COUNT(*) FILTER (WHERE rating = 5)
      )
      FROM seller_ratings 
      WHERE merchant_id = COALESCE(NEW.merchant_id, OLD.merchant_id)
      AND (is_cancelled IS FALSE OR is_cancelled IS NULL)
    )
  WHERE id = COALESCE(NEW.merchant_id, OLD.merchant_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

### Initial Data

#### Schools Setup
```sql
INSERT INTO schools (name, short_name) VALUES 
  ('Bingham University', 'Bingham'),
  ('Veritas University', 'Veritas')
ON CONFLICT (name) DO NOTHING;
```

## 🔄 CI/CD Pipeline

### Netlify Auto-Deploy
```yaml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Build Process
1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Type Checking**
   ```bash
   npm run lint
   ```

3. **Build Application**
   ```bash
   npm run build
   ```

4. **Deploy to CDN**
   - Automatic via Netlify
   - Global CDN distribution
   - SSL certificate management

## 🔍 Monitoring & Analytics

### Application Monitoring

#### Error Tracking
```typescript
// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Send to monitoring service
});

// Unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Send to monitoring service
});
```

#### Performance Monitoring
```typescript
// Core Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### Database Monitoring

#### Query Performance
```sql
-- Monitor slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;
```

#### Table Statistics
```sql
-- Monitor table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 🔒 Security Configuration

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com;
  font-src 'self';
">
```

### HTTPS Configuration
- Automatic SSL via Netlify
- HSTS headers enabled
- Secure cookie settings

### API Security
```typescript
// Supabase client configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false  // Stateless for public app
  }
});
```

## 📊 Performance Optimization

### Build Optimization

#### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],  // Prevent pre-bundling
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ai: ['@google/generative-ai']
        }
      }
    }
  }
});
```

#### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist
```

### Runtime Optimization

#### Code Splitting
```typescript
// Lazy load admin dashboard
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));

// Lazy load past requests
const PastRequestsPage = React.lazy(() => import('./pages/PastRequestsPage'));
```

#### Image Optimization
```typescript
// Use external image URLs (Pexels)
const imageUrl = "https://images.pexels.com/photos/...";

// Lazy loading
<img loading="lazy" src={imageUrl} alt="..." />
```

## 🚨 Troubleshooting

### Common Issues

#### 0. Storage Bucket Missing
```bash
# Error: "Bucket not found" for product_images
# Solution: Run the storage migration
```

**Steps to fix:**
1. Go to your Supabase project dashboard
2. Navigate to Storage section
3. Create a new bucket named `product_images`
4. Set it as public
5. Or run the migration: `supabase/migrations/create_storage_bucket.sql`

#### 1. Environment Variables Not Loading
```bash
# Check variable names have VITE_ prefix
VITE_SUPABASE_URL=...  # ✅ Correct
SUPABASE_URL=...       # ❌ Won't work in frontend

# Validate URL format
VITE_SUPABASE_URL=https://your-project.supabase.co  # ✅ Correct
VITE_SUPABASE_URL=your-project.supabase.co          # ❌ Missing https://

# Validate Gemini API key format
VITE_GEMINI_API_KEY=AIzaSy...  # ✅ Correct (starts with AIza)
VITE_GEMINI_API_KEY=invalid    # ❌ Invalid format
```

#### 2. Supabase Connection Issues
```typescript
// Debug connection
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Anon Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

// Test connection
const { data, error } = await supabase.from('schools').select('count');
console.log('Connection test:', { data, error });
```

#### 3. Network/CORS Issues
```bash
# If getting "Failed to fetch" errors:
# 1. Check if URLs are accessible
curl https://vanuhutykyhkdvwgzcpv.supabase.co/rest/v1/
curl https://generativelanguage.googleapis.com/

# 2. Check browser network tab for CORS errors
# 3. Verify environment variables are loaded in browser
# 4. Try accessing the app from different network/device
```

#### 3. Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run lint
```

#### 4. Database Migration Issues
```sql
-- Check migration status
SELECT * FROM supabase_migrations.schema_migrations;

-- Reset if needed (CAUTION: Data loss)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

### Debugging Tools

#### Network Debugging
```typescript
// Log all Supabase requests
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session);
});
```

#### Performance Debugging
```typescript
// Measure component render time
const start = performance.now();
// Component render
const end = performance.now();
console.log(`Render time: ${end - start}ms`);
```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies enabled
- [ ] Initial data seeded
- [ ] Build process tested locally
- [ ] TypeScript compilation successful
- [ ] All tests passing

### Post-Deployment
- [ ] Application loads correctly
- [ ] Database connections working
- [ ] AI services responding
- [ ] WhatsApp integration functional
- [ ] Admin dashboard accessible
- [ ] Search functionality working
- [ ] Rating system operational
- [ ] Analytics tracking active

### Monitoring Setup
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Database monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Alert notifications setup

This deployment guide ensures a smooth and reliable deployment process for the UniStore application.