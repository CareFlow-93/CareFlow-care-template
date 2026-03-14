create extension if not exists pgcrypto;

drop table if exists manager_claims cascade;
drop table if exists reactions cascade;
drop table if exists comments cascade;
drop table if exists post_images cascade;
drop table if exists posts cascade;
drop table if exists centers cascade;
drop table if exists centers_raw cascade;

delete from storage.objects where bucket_id = 'post-images';
delete from storage.buckets where id = 'post-images';

create table centers_raw (
  source_org_code text,
  name text,
  address text,
  region_text text,
  source_type_code text,
  type_name text,
  capacity_total text,
  capacity_current text,
  rating_grade text,
  rating_total_score text,
  staff_social_worker text,
  staff_caregiver text,
  latitude text,
  longitude text
);

create table centers (
  id uuid primary key default gen_random_uuid(),
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
  latitude double precision not null,
  longitude double precision not null,
  phone text,
  created_at timestamptz not null default now()
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references centers(id) on delete cascade,
  author_id uuid,
  author_name text not null,
  author_role text,
  title text not null,
  content text not null,
  type text not null default 'general',
  visibility text not null default 'public',
  like_count integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  image_url text not null,
  created_at timestamptz not null default now()
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_name text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  device_key text not null,
  reaction_type text not null default 'like',
  created_at timestamptz not null default now(),
  constraint reactions_unique unique (post_id, device_key, reaction_type)
);

create table manager_claims (
  id uuid primary key default gen_random_uuid(),
  center_id uuid references centers(id) on delete set null,
  requester_name text not null,
  requester_phone text,
  note text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index idx_centers_lat on centers(latitude);
create index idx_centers_lng on centers(longitude);
create index idx_centers_name on centers(name);
create index idx_posts_center on posts(center_id);
create index idx_posts_created on posts(created_at desc);
create index idx_comments_post on comments(post_id);
create index idx_reactions_post on reactions(post_id);
create index idx_manager_claims_center on manager_claims(center_id);

create or replace function increment_comment_count() returns trigger language plpgsql as $$ begin update posts set comment_count = comment_count + 1 where id = new.post_id; return new; end; $$;
create or replace function decrement_comment_count() returns trigger language plpgsql as $$ begin update posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id; return old; end; $$;
create or replace function increment_like_count() returns trigger language plpgsql as $$ begin if new.reaction_type = 'like' then update posts set like_count = like_count + 1 where id = new.post_id; end if; return new; end; $$;
create or replace function decrement_like_count() returns trigger language plpgsql as $$ begin if old.reaction_type = 'like' then update posts set like_count = greatest(like_count - 1, 0) where id = old.post_id; end if; return old; end; $$;

create trigger trg_comments_count_ins after insert on comments for each row execute function increment_comment_count();
create trigger trg_comments_count_del after delete on comments for each row execute function decrement_comment_count();
create trigger trg_reactions_count_ins after insert on reactions for each row execute function increment_like_count();
create trigger trg_reactions_count_del after delete on reactions for each row execute function decrement_like_count();

insert into storage.buckets (id, name, public) values ('post-images', 'post-images', true);

-- CSV import: first import careflow_centers_all_geocoded.csv into centers_raw, then run the block below.
insert into centers (
  source_org_code,name,address,region_text,source_type_code,type_name,capacity_total,capacity_current,rating_grade,rating_total_score,staff_social_worker,staff_caregiver,latitude,longitude
)
select
  source_org_code,
  name,
  address,
  region_text,
  source_type_code,
  type_name,
  nullif(capacity_total, '')::integer,
  nullif(capacity_current, '')::integer,
  rating_grade,
  nullif(rating_total_score, '')::numeric,
  nullif(staff_social_worker, '')::integer,
  nullif(staff_caregiver, '')::integer,
  nullif(latitude, '')::double precision,
  nullif(longitude, '')::double precision
from centers_raw
where nullif(latitude, '') is not null and nullif(longitude, '') is not null;
