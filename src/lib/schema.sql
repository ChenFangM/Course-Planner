-- Create courses table
create table if not exists public.courses (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid references auth.users(id) on delete cascade,
    code text not null,
    name text not null,
    credits integer not null default 4,
    is_required boolean not null default false,
    prerequisites text[] default array[]::text[],
    grade text,
    semester integer not null default 1,
    unique(user_id, code)
);

-- Create course_plans table
create table if not exists public.course_plans (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid references auth.users(id) on delete cascade unique,
    total_semesters integer not null default 8,
    semesters jsonb not null default '[]'::jsonb
);

-- Enable RLS
alter table public.courses enable row level security;
alter table public.course_plans enable row level security;

-- Create policies
create policy "Users can view their own courses"
    on public.courses for select
    using (auth.uid() = user_id);

create policy "Users can insert their own courses"
    on public.courses for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own courses"
    on public.courses for update
    using (auth.uid() = user_id);

create policy "Users can delete their own courses"
    on public.courses for delete
    using (auth.uid() = user_id);

create policy "Users can view their own course plan"
    on public.course_plans for select
    using (auth.uid() = user_id);

create policy "Users can insert their own course plan"
    on public.course_plans for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own course plan"
    on public.course_plans for update
    using (auth.uid() = user_id);

create policy "Users can delete their own course plan"
    on public.course_plans for delete
    using (auth.uid() = user_id);
