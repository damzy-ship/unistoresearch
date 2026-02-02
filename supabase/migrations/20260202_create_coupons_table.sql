create table if not exists coupons (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  value numeric not null,
  claimed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies if needed, for now open read
alter table coupons enable row level security;

create policy "Coupons are viewable by everyone"
  on coupons for select
  using (true);


-- Only admins/service role can insert (handled by generic RLS or service role keys usually, keeping it simple for read)
