-- sl_slices に quote_id カラムを追加
-- 内省（reflection）を特定の引用（quote）に紐づけるツリー構造

alter table sl_slices
  add column if not exists quote_id uuid references sl_slices(id) on delete cascade;

create index if not exists idx_sl_slices_quote_id on sl_slices(quote_id);
