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
