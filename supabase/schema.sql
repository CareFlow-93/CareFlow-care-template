begin;

create extension if not exists pgcrypto;

create table if not exists public.centers (
  id bigint generated always as identity primary key,
  source_org_code text unique,
  name text not null,
  address text,
  region_text text,
  source_type_code text,
  type_name text,
  capacity_total integer,
  capacity_current integer,
  rating_grade text,
  rating_total_score numeric(6,2),
  staff_social_worker integer,
  staff_caregiver integer,
  latitude double precision,
  longitude double precision,
  phone text,
  intro_text text,
  homepage_url text,
  hero_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'guardian' check (role in ('guardian', 'center_admin', 'demo_admin')),
  center_id bigint references public.centers(id) on delete set null,
  display_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.claims (
  id bigint generated always as identity primary key,
  center_id bigint not null references public.centers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id bigint generated always as identity primary key,
  center_id bigint not null references public.centers(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  content text,
  image_url text,
  visibility text not null default 'public' check (visibility in ('public', 'guardians', 'staff')),
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.consultation_requests (
  id bigint generated always as identity primary key,
  center_id bigint not null references public.centers(id) on delete cascade,
  guardian_name text not null,
  phone text not null,
  patient_relation text,
  message text,
  status text not null default 'pending' check (status in ('pending', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_centers_name on public.centers(name);
create index if not exists idx_centers_region_text on public.centers(region_text);
create index if not exists idx_centers_type_name on public.centers(type_name);
create index if not exists idx_centers_source_org_code on public.centers(source_org_code);
create index if not exists idx_centers_lat on public.centers(latitude);
create index if not exists idx_centers_lng on public.centers(longitude);
create index if not exists idx_posts_center_id on public.posts(center_id);
create index if not exists idx_posts_created_at on public.posts(created_at desc);
create index if not exists idx_comments_post_id on public.comments(post_id);
create index if not exists idx_claims_user_id on public.claims(user_id);
create index if not exists idx_claims_center_id on public.claims(center_id);
create index if not exists idx_consultations_center_id on public.consultation_requests(center_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'phone',
    coalesce(new.raw_user_meta_data ->> 'role', 'guardian')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    role = coalesce(excluded.role, public.profiles.role),
    updated_at = now();
  return new;
end;
$$;

create or replace function public.is_demo_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'demo_admin'
  );
$$;

create or replace function public.is_center_manager(target_center_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and center_id = target_center_id
      and role in ('center_admin', 'demo_admin')
  )
  or public.is_demo_admin();
$$;

drop trigger if exists trg_centers_touch_updated_at on public.centers;
create trigger trg_centers_touch_updated_at
before update on public.centers
for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_profiles_touch_updated_at on public.profiles;
create trigger trg_profiles_touch_updated_at
before update on public.profiles
for each row execute procedure public.touch_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

alter table public.centers enable row level security;
alter table public.profiles enable row level security;
alter table public.claims enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.consultation_requests enable row level security;

drop policy if exists centers_read_all on public.centers;
create policy centers_read_all
on public.centers
for select
using (true);

drop policy if exists centers_manage_own on public.centers;
create policy centers_manage_own
on public.centers
for update
using (public.is_center_manager(id))
with check (public.is_center_manager(id));

drop policy if exists profiles_read_all on public.profiles;
create policy profiles_read_all
on public.profiles
for select
using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (auth.uid() = id or public.is_demo_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (auth.uid() = id or public.is_demo_admin())
with check (auth.uid() = id or public.is_demo_admin());

drop policy if exists claims_insert_own on public.claims;
create policy claims_insert_own
on public.claims
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists claims_read_relevant on public.claims;
create policy claims_read_relevant
on public.claims
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_center_manager(center_id)
  or public.is_demo_admin()
);

drop policy if exists claims_update_admin on public.claims;
create policy claims_update_admin
on public.claims
for update
to authenticated
using (public.is_demo_admin())
with check (public.is_demo_admin());

drop policy if exists posts_read_all on public.posts;
create policy posts_read_all
on public.posts
for select
using (true);

drop policy if exists posts_insert_manager on public.posts;
create policy posts_insert_manager
on public.posts
for insert
to authenticated
with check (auth.uid() = author_id and public.is_center_manager(center_id));

drop policy if exists posts_update_manager on public.posts;
create policy posts_update_manager
on public.posts
for update
to authenticated
using (auth.uid() = author_id or public.is_center_manager(center_id))
with check (auth.uid() = author_id or public.is_center_manager(center_id));

drop policy if exists comments_read_all on public.comments;
create policy comments_read_all
on public.comments
for select
using (true);

drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own
on public.comments
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists consultations_insert_all on public.consultation_requests;
create policy consultations_insert_all
on public.consultation_requests
for insert
with check (true);

drop policy if exists consultations_read_relevant on public.consultation_requests;
create policy consultations_read_relevant
on public.consultation_requests
for select
to authenticated
using (public.is_center_manager(center_id) or public.is_demo_admin());

drop policy if exists consultations_update_relevant on public.consultation_requests;
create policy consultations_update_relevant
on public.consultation_requests
for update
to authenticated
using (public.is_center_manager(center_id) or public.is_demo_admin())
with check (public.is_center_manager(center_id) or public.is_demo_admin());

drop policy if exists storage_read_post_images on storage.objects;
create policy storage_read_post_images
on storage.objects
for select
using (bucket_id = 'post-images');

drop policy if exists storage_insert_post_images on storage.objects;
create policy storage_insert_post_images
on storage.objects
for insert
to authenticated
with check (bucket_id = 'post-images');

drop policy if exists storage_update_post_images on storage.objects;
create policy storage_update_post_images
on storage.objects
for update
to authenticated
using (bucket_id = 'post-images')
with check (bucket_id = 'post-images');

commit;
