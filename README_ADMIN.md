# UniStore — Admin App Guide

This document describes how to build and run an Admin site for the UniStore React + Vite + Supabase project. It collects the repository's Supabase models, table schemas, environment configuration, and recommended API/queries so a developer can implement a fully-featured admin portal with analytics and management capabilities.

## Goal
Provide an admin dashboard that can:
- View analytics (visitors, merchant metrics, request logs, billing activity)
- Manage merchants, products, categories, schools
- Inspect and edit request logs, rating records, contact interactions
- Manage billing plans, transactions, and callbacks
- Upload and manage product images (Supabase Storage)
- Run moderation tasks and export data

## Quick start — Local dev
1. Clone the repo and install dependencies
   - This project uses pnpm / npm / yarn depending on your preference. Example (npm):
     - npm install
2. Copy environment variables
   - Create a `.env` (or `.env.local`) file at project root with the following variables (see `docs/DEPLOYMENT_GUIDE.md` for additional context):
     - VITE_SUPABASE_URL=https://your-project.supabase.co
     - VITE_SUPABASE_ANON_KEY=your-anon-key
     - VITE_OPENAI_API_KEY=...(if using AI features)
     - VITE_GCLOUD_API_KEY=...(if using Google generative models locally)
     - Other env variables used by Edge Functions: SUPABASE_SERVICE_ROLE_KEY, PAYSTACK_SECRET_KEY, PAYSTACK_WEBHOOK_SECRET
3. Start dev server
   - npm run dev
4. Admin routes
   - Implement new admin routes (example `/admin`, `/admin/merchants`, `/admin/products`, `/admin/analytics`).

## Project contract (for the Admin app)
- Inputs: Supabase project (URL + keys), optional Service Role key for server-side operations, and storage buckets for product images.
- Outputs: Read / write to Supabase tables listed below; usage of Edge Functions when appropriate.
- Error modes: Permission / RLS failures, missing env keys, network issues.

## Required environment & keys
- VITE_SUPABASE_URL — public project URL
- VITE_SUPABASE_ANON_KEY — client anon key for browser usage (Admin UI should use service keys on server routes)
- SUPABASE_SERVICE_ROLE_KEY — required for server-side admin tasks (do NOT expose to browser)
- PAYSTACK_SECRET_KEY, PAYSTACK_WEBHOOK_SECRET — for payment verification

Security note: Use Service Role key only on server-side (Edge functions or server endpoints). The Admin UI should authenticate with a dedicated admin user row and use server routes for privileged operations.

## Tables & Schemas (collected from codebase & docs)
The following tables are used across the app and should be included in your Supabase project. SQL examples are included where available.

- merchants
  - Fields (from docs/API_DOCUMENTATION.md):
    - id uuid PRIMARY KEY DEFAULT gen_random_uuid()
    - seller_id text UNIQUE NOT NULL
    - email text UNIQUE NOT NULL
    - full_name text NOT NULL
    - phone_number text NOT NULL
    - school_name text NOT NULL
    - seller_description text NOT NULL
    - created_at timestamptz DEFAULT now()
    - average_rating decimal(3,2) DEFAULT 0
    - total_ratings integer DEFAULT 0
    - rating_breakdown jsonb DEFAULT '{"1":0,...}'
    - last_matched_at timestamptz
    - billing_status text (inferred: e.g. 'active'|'inactive')
    - billing_date / next_billing_date timestamptz (inferred)

- product_categories
  - id uuid PRIMARY KEY DEFAULT gen_random_uuid()
  - name text UNIQUE NOT NULL
  - created_at timestamptz DEFAULT now()

- merchant_categories (or merchant_product_categories)
  - id uuid PRIMARY KEY DEFAULT gen_random_uuid()
  - merchant_id uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE
  - category_id uuid NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE
  - created_at timestamptz DEFAULT now()
  - UNIQUE(merchant_id, category_id)

- request_logs
  - id uuid PRIMARY KEY DEFAULT gen_random_uuid()
  - user_id text NOT NULL
  - university text NOT NULL (CHECK in docs)
  - request_text text NOT NULL
  - matched_seller_ids text[]
  - generated_categories text[]
  - matched_categories text[]
  - seller_categories jsonb
  - seller_ranking_order text[]
  - admin_scores jsonb
  - admin_notes text
  - created_at timestamptz DEFAULT now()

- seller_ratings
  - id uuid PRIMARY KEY DEFAULT gen_random_uuid()
  - user_id text NOT NULL
  - merchant_id uuid NOT NULL REFERENCES merchants(id)
  - request_id uuid REFERENCES request_logs(id)
  - rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5)
  - review_text text
  - created_at timestamptz DEFAULT now()
  - can_be_cancelled boolean DEFAULT true
  - is_cancelled boolean DEFAULT false
  - UNIQUE(user_id, merchant_id, request_id)

- contact_interactions
  - id uuid PRIMARY KEY DEFAULT gen_random_uuid()
  - user_id text NOT NULL
  - merchant_id uuid NOT NULL REFERENCES merchants(id)
  - request_id uuid REFERENCES request_logs(id)
  - contacted_at timestamptz DEFAULT now()
  - rating_prompted boolean DEFAULT false
  - rating_completed boolean DEFAULT false
  - created_at timestamptz DEFAULT now()

- unique_visitors
  - id uuid PRIMARY KEY DEFAULT gen_random_uuid()
  - user_id text UNIQUE NOT NULL
  - phone_number text UNIQUE
  - first_visit timestamptz DEFAULT now()
  - last_visit timestamptz DEFAULT now()
  - visit_count integer DEFAULT 1
  - created_at timestamptz DEFAULT now()
  - user_type text? (inferred from interface)
  - verification_status text? (inferred)

- schools
  - id uuid PRIMARY KEY DEFAULT gen_random_uuid()
  - name text UNIQUE NOT NULL
  - short_name text UNIQUE NOT NULL
  - is_active boolean DEFAULT true
  - created_at timestamptz DEFAULT now()

- merchant_products
  - id uuid PRIMARY KEY DEFAULT gen_random_uuid()
  - merchant_id uuid NOT NULL REFERENCES merchants(id)
  - product_description text
  - product_price text
  - image_urls text[] (or jsonb array)
  - is_available boolean DEFAULT true
  - embedding float8[] or jsonb (vector) — code stores numeric arrays
  - search_description text
  - created_at timestamptz DEFAULT now()
  - is_featured boolean DEFAULT false
  - discount_price text (nullable)

- product-images (Supabase Storage bucket)
  - Bucket name: product-images
  - Files stored under `product-images/<merchantId>_<timestamp>_<random>.<ext>`

- billing_plans
  - referenced in Edge functions — fields depend on implementation. At minimum:
    - id uuid, name, price, billing_period_interval

- billing_transactions
  - used by Edge functions and webhook handlers
  - fields observed in code:
    - id, merchant_id, status, paystack_reference, billing_period_end, payment_date, metadata jsonb, updated_at

- billing_callbacks
  - fields: id, paystack_reference, callback_url

- request_logs and request analytics
  - request_logs (detailed above) + possible other analytics tables such as merchant_analytics tracked in TypeScript interfaces

- request_logs table is used to store AI results and admin notes — Admin should be able to read, delete and annotate logs.

## TypeScript models (exported in `src/lib/supabase.ts`)
These interfaces are exported and should be used in the Admin app for type safety.

- UniqueVisitor
  - id?: string
  - user_id?: string
  - auth_user_id?: string
  - full_name?: string
  - phone_number?: string
  - first_visit?: string
  - last_visit?: string
  - visit_count?: number
  - created_at?: string
  - user_type?: string
  - school_id?: string
  - brand_name?: string | null
  - verification_status?: 'pending' | 'verified' | 'unverified'| null
  - verification_id?: string

- Product
  - id: string
  - product_description: string
  - product_price: string
  - image_urls: string[]
  - is_available: boolean
  - full_name: string
  - phone_number: string
  - school_id: string
  - school_name?: string
  - school_short_name?: string
  - discount_price?: string
  - similarity?: number
  - is_featured?: boolean
  - search_description?: string
  - embedding: number[]
  - created_at?: string
  - merchant_id?: string

- RequestLog
  - id: string
  - user_id: string
  - university: string
  - request_text: string
  - matched_seller_ids?: string[]
  - created_at: string
  - matched_categories?: string[]
  - matched_features?: string[]

- Merchant
  - id: string
  - seller_id: string
  - email: string
  - full_name: string
  - phone_number: string
  - school_name: string
  - seller_description: string
  - created_at: string
  - categories?: string[]
  - last_matched_at?: string

- SellerRating
  - id: string
  - user_id: string
  - merchant_id: string
  - request_id?: string
  - rating: number
  - review_text?: string
  - created_at: string

- ContactInteraction
  - id: string
  - user_id: string
  - merchant_id: string
  - request_id?: string
  - contacted_at: string
  - rating_prompted: boolean
  - rating_completed: boolean
  - created_at: string

- MerchantWithRating and MerchantAnalytics are also defined in the repo and useful for admin analytics endpoints.

## Admin UI — Suggested pages & components
- Dashboard (overview): total merchants, active merchants, recent requests, recent transactions, unique visitors today
- Merchants list: CRUD, view merchant profile, view ratings, billing status, categories
- Products list: search, pagination, edit product, toggle availability & featured, upload images
- Categories: view/add/edit product categories
- Requests: view AI-generated categories, matched merchants, admin notes, deletion
- Ratings & Contacts: view ratings, cancel or resolve disputed ratings, contact interactions
- Billing: view plans, transactions, verify payments (use Edge functions), trigger refunds or manual updates (server-only)
- Analytics:
  - Merchant analytics: matches, contacts, match-to-contact ratio
  - Visitor analytics: unique_visitors table, visit_count over time
  - Request analytics: top requested categories, conversion rates

## Recommended API endpoints (server-side)
Because the Admin UI requires privileged operations, expose server endpoints (Edge functions or a small Express/Fastify server) that use SUPABASE_SERVICE_ROLE_KEY to perform:
- GET /admin/merchants — list merchants (with filters)
- GET /admin/merchant/:id — detailed merchant profile & analytics
- POST /admin/merchant/:id/billing — update billing status or dates
- GET /admin/products — paginated product fetch (wraps 'admin-fetch-products' Edge Function)
- POST /admin/product — create product
- PUT /admin/product/:id — update product
- DELETE /admin/request/:id — delete request log (use supabase service role key)
- GET /admin/analytics/merchant/:id — merchant analytics

Edge functions already exist for some flows (see `supabase/functions/`), including payment webhook and payment verification. Use them as reference or wire admin server endpoints to those functions.

## Example Supabase queries (browser-safe vs server-side)
- Browser (anon key) — read-only & safe operations subject to RLS:
  - supabase.from('schools').select('id, short_name')
  - supabase.from('unique_visitors').select('*').eq('user_id', userId)

- Server-side (service role) — privileged writes & deletes:
  - await supabase.from('request_logs').delete().eq('id', requestId)
  - await supabase.from('merchants').update({ billing_status: 'active' }).eq('id', merchantId)

## Storage (images)
- Bucket: `product-images`
- Public access: Admin should be able to manage files. Use `supabase.storage.from('product-images').upload(path, file)` and `getPublicUrl` for retrieving URLs.
- Deleting: extract file path from URL and call `.remove([filePath])`.

## Admin authentication
- Implement admin-only authentication flows; recommended approaches:
  - Dedicated admin role column on users/members table + RLS policies
  - Use service-role-backed endpoints for destructive operations
  - For a quick start, use Supabase Auth + a claim-based admin flag inside a `admins` table and RLS policies that rely on that flag

## Sample SQL snippets
- Delete a request log (server-side)
  - DELETE FROM request_logs WHERE id = '...';
- Reset a merchant's ratings
  - UPDATE merchants SET average_rating = 0, total_ratings = 0, rating_breakdown = '{"1":0,"2":0,"3":0,"4":0,"5":0}' WHERE id = '...';

## Admin analytics queries (examples)
- Total unique visitors today
  - SELECT COUNT(*) FROM unique_visitors WHERE DATE(first_visit) = CURRENT_DATE;
- Merchant's recent matches (30 days)
  - SELECT COUNT(*) FROM merchant_analytics WHERE merchant_id = '...' AND created_at > NOW() - INTERVAL '30 days';
- Top requested categories
  - SELECT jsonb_array_elements_text(generated_categories) AS category, COUNT(*) as cnt FROM request_logs GROUP BY category ORDER BY cnt DESC LIMIT 10;

## Migration files
- The repo contains migration SQL files under `supabase/migrations/` (filenames like `20250706220327_fragrant_oasis.sql` etc). Review these to reproduce exact table DDL if needed.

## Edge Functions of interest
- `supabase/functions/verify-payment/index.ts` — verifies Paystack transactions and updates `billing_transactions` and `merchants`.
- `supabase/functions/payment-webhook/index.ts` — Paystack webhook handler which updates transactions and merchant billing status.
- `supabase/functions/initialize-payment/index.ts` — prepares transactions (used by checkout flows).

## Implementation notes & edge cases
- RLS (Row Level Security): Many tables use RLS — the Admin app will likely need server endpoints using Service Role key or dedicated admin RLS policies.
- Embeddings: Product embedding fields store numeric arrays. The Admin app should allow re-generating embeddings (there are helper functions in repo).
- Large volumes: paginate product lists (example uses pages of 100 in `AllProductsPage.tsx`).

## Next steps & recommended improvements
- Add admin-specific Edge Functions for heavy or sensitive operations (delete request logs, reset merchant billing) using Service Role keys.
- Add monitoring and alerting for payment webhooks and failed billing updates.
- Provide SQL seed for admin user and RLS policies in `supabase/migrations`.

---

If you want, I can:
- Generate admin React pages scaffolding (routes + components) wired to the service endpoints.
- Extract full, canonical DDL from each migration file and include in this README as a single consolidated SQL file.

Requirements coverage:
- Collected Supabase client, TS models, and core tables: Done
- Created new README with setup, env vars, models, schemas and usage: Done (this file)
- Included Edge Functions & migrations pointers: Done

