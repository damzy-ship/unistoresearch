-- Create school_banners table
create table if not exists public.school_banners (
    id uuid default gen_random_uuid() primary key,
    school_id uuid references public.schools(id) on delete cascade not null,
    image_url text not null,
    title text,
    subtitle text,
    target_url text,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.school_banners enable row level security;

-- Policies for school_banners
create policy "School banners are viewable by everyone"
    on public.school_banners for select
    using (true);

create policy "Admins can insert school banners"
    on public.school_banners for insert
    with check (
        exists (
            select 1 from public.unique_visitors
            where unique_visitors.auth_user_id = auth.uid()
            and unique_visitors.is_admin = true
        )
    );

create policy "Admins can update school banners"
    on public.school_banners for update
    using (
        exists (
            select 1 from public.unique_visitors
            where unique_visitors.auth_user_id = auth.uid()
            and unique_visitors.is_admin = true
        )
    );

create policy "Admins can delete school banners"
    on public.school_banners for delete
    using (
        exists (
            select 1 from public.unique_visitors
            where unique_visitors.auth_user_id = auth.uid()
            and unique_visitors.is_admin = true
        )
    );

-- Add index for performance
create index if not exists school_banners_school_id_idx on public.school_banners(school_id);
