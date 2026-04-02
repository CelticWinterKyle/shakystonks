-- Users (synced from Clerk on first sign-in)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  clerk_id text unique not null,
  email text,
  subscription_tier text not null default 'free',
  created_at timestamptz not null default now()
);

-- Per-user pinned tickers
create table if not exists user_watchlist (
  user_id uuid not null references users(id) on delete cascade,
  ticker text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, ticker)
);

-- Global confidence threshold preference
create table if not exists user_preferences (
  user_id uuid primary key references users(id) on delete cascade,
  confidence_threshold text not null default 'low'
    check (confidence_threshold in ('low', 'medium', 'high')),
  updated_at timestamptz not null default now()
);

-- Raw news events, deduplicated by (source, source_id)
create table if not exists news_events (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_id text not null,
  headline text not null,
  summary text,
  url text not null,
  tickers text[] not null default '{}',
  published_at timestamptz not null,
  fetched_at timestamptz not null default now(),
  unique (source, source_id)
);

create index if not exists idx_news_events_published_at on news_events(published_at desc);
create index if not exists idx_news_events_tickers on news_events using gin(tickers);

-- Classification results from Claude
create table if not exists event_classifications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references news_events(id) on delete cascade,
  event_type text not null,
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  magnitude text not null check (magnitude in ('major', 'moderate', 'minor', 'unknown')),
  reasoning text,
  tickers_extracted text[] not null default '{}',
  composite_score float not null,
  model_used text not null,
  classified_at timestamptz not null default now()
);

create index if not exists idx_classifications_composite_score on event_classifications(composite_score desc);
create index if not exists idx_classifications_event_id on event_classifications(event_id);
create index if not exists idx_classifications_confidence on event_classifications(confidence);

-- Pre-built daily digests
create table if not exists daily_digests (
  id uuid primary key default gen_random_uuid(),
  digest_date date unique not null,
  ranked_events jsonb not null default '[]',
  generated_at timestamptz not null default now()
);

-- API cost audit log
create table if not exists api_cost_log (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  model text,
  input_tokens int,
  output_tokens int,
  cost_usd numeric(10, 6),
  item_count int,
  logged_at timestamptz not null default now()
);

-- Future feedback loop: price snapshots at event time
create table if not exists price_snapshots (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references news_events(id) on delete cascade,
  ticker text not null,
  price_at_event numeric,
  price_1h numeric,
  price_4h numeric,
  price_1d numeric,
  price_5d numeric,
  recorded_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table users enable row level security;
alter table user_watchlist enable row level security;
alter table user_preferences enable row level security;
alter table news_events enable row level security;
alter table event_classifications enable row level security;
alter table daily_digests enable row level security;

-- news_events and classifications are readable by all authenticated users
create policy "Authenticated users can read news_events"
  on news_events for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read classifications"
  on event_classifications for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read digests"
  on daily_digests for select
  using (auth.role() = 'authenticated');

-- Service role (used by the pipeline) can write to all tables
-- This is handled by using the service role key in cron handlers

-- Users can only see/edit their own data
create policy "Users can read their own record"
  on users for select
  using (clerk_id = requesting_user_id());

create policy "Users can update their own record"
  on users for update
  using (clerk_id = requesting_user_id());

create policy "Users can manage their watchlist"
  on user_watchlist for all
  using (user_id = (select id from users where clerk_id = requesting_user_id()));

create policy "Users can manage their preferences"
  on user_preferences for all
  using (user_id = (select id from users where clerk_id = requesting_user_id()));

-- Helper function: extract Clerk user ID from JWT
create or replace function requesting_user_id() returns text
  language sql stable
  as $$
    select coalesce(
      current_setting('request.jwt.claims', true)::json->>'sub',
      (current_setting('request.jwt.claims', true)::json->>'userId')::text
    )
  $$;
