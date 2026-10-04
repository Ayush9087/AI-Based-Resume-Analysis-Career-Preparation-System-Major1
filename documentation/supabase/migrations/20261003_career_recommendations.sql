alter table public.recommendations
add column if not exists recommendation_data jsonb not null default '{}'::jsonb;