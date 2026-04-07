-- sl_books に出版社・出版年・ISBNカラムを追加
alter table sl_books add column if not exists publisher text;
alter table sl_books add column if not exists published_year text;
alter table sl_books add column if not exists isbn text;

create index if not exists idx_sl_books_isbn on sl_books(isbn);
