-- Create sites table
create table public.sites (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    url text not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    api_key uuid default gen_random_uuid() not null,
    db_url text,
    db_key text,
    db_type text check (db_type in ('supabase', 'postgres', 'mysql')) default 'supabase',
    is_configured boolean default false
);

-- Create RLS policies
alter table public.sites enable row level security;

-- Sites policies
create policy "Users can view their own sites"
    on public.sites for select
    using (auth.uid() = user_id);

create policy "Users can insert their own sites"
    on public.sites for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own sites"
    on public.sites for update
    using (auth.uid() = user_id);

create policy "Users can delete their own sites"
    on public.sites for delete
    using (auth.uid() = user_id);

-- Create indexes for better performance
create index sites_user_id_idx on public.sites(user_id);
create index sites_api_key_idx on public.sites(api_key);
  