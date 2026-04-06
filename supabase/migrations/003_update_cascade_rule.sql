-- 引用削除時: 紐づく内省のquote_idをnullにして独立した内省として残す
-- ON DELETE CASCADE → ON DELETE SET NULL に変更

alter table sl_slices
  drop constraint if exists sl_slices_quote_id_fkey;

alter table sl_slices
  add constraint sl_slices_quote_id_fkey
  foreign key (quote_id) references sl_slices(id) on delete set null;
