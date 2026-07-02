alter table public.cards
  add column if not exists image_url text;

alter table public.cards
  drop column if exists image_small_url,
  drop column if exists image_normal_url;

comment on column public.cards.image_url is
  E'Base Scryfall API image URL used by the frontend to derive display sizes and formats.';

alter table public.mtg_card_details
  add column if not exists scryfall_id text;

comment on column public.mtg_card_details.scryfall_id is
  E'Scryfall card UUID used to compose MTG-specific image URLs.';

create index if not exists binders_owner_id_updated_at_sort_idx
on public.binders (
  owner_id,
  updated_at desc nulls last
);

create index if not exists binder_cards_binder_id_position_sort_idx
on public.binder_cards (
  binder_id,
  position asc nulls last,
  created_at desc nulls last,
  id asc nulls last
);

create index if not exists binder_cards_binder_id_created_at_sort_idx
on public.binder_cards (
  binder_id,
  created_at desc nulls last,
  id asc nulls last
);

create index if not exists binder_cards_binder_id_card_name_sort_idx
on public.binder_cards (
  binder_id,
  card_name asc nulls last,
  card_released_at desc nulls last,
  id asc nulls last
);

create index if not exists binder_cards_binder_id_card_released_at_sort_idx
on public.binder_cards (
  binder_id,
  card_released_at desc nulls last,
  card_name asc nulls last,
  id asc nulls last
);

create index if not exists binder_cards_binder_id_price_amount_asc_sort_idx
on public.binder_cards (
  binder_id,
  price_amount asc nulls last,
  card_name asc nulls last,
  id asc nulls last
);

create index if not exists binder_cards_binder_id_price_amount_desc_sort_idx
on public.binder_cards (
  binder_id,
  price_amount desc nulls last,
  card_name asc nulls last,
  id asc nulls last
);
