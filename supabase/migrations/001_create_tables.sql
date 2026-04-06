-- Slice: 読書記録テーブル
-- 共有Supabaseインスタンス上で sl_ プレフィックスで分離

create table if not exists sl_books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  author text not null,
  translator text,
  cover_url text,
  synopsis text,
  tags text[] default '{}',
  created_at timestamptz default now() not null
);

create table if not exists sl_slices (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references sl_books(id) on delete cascade,
  type text not null check (type in ('quote', 'reflection')),
  body text not null,
  reference text,
  created_at timestamptz default now() not null
);

create index if not exists idx_sl_slices_book_id on sl_slices(book_id);
create index if not exists idx_sl_slices_created_at on sl_slices(created_at desc);

-- RLS
alter table sl_books enable row level security;
alter table sl_slices enable row level security;

-- 個人利用のため全許可ポリシー（将来認証追加時に差し替え）
create policy "sl_books_all" on sl_books for all using (true) with check (true);
create policy "sl_slices_all" on sl_slices for all using (true) with check (true);
