-- RLSポリシーの再確認・再作成
-- 個人利用のため anon キーでの全操作を許可

-- sl_books
drop policy if exists "sl_books_all" on sl_books;
create policy "sl_books_all" on sl_books
  for all using (true) with check (true);

-- sl_slices
drop policy if exists "sl_slices_all" on sl_slices;
create policy "sl_slices_all" on sl_slices
  for all using (true) with check (true);

-- Realtime用: sl_slicesのレプリケーションを有効化
alter publication supabase_realtime add table sl_slices;
