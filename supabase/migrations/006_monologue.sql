-- 独語（ひとりごと）機能の追加
-- - sl_slices に location カラム追加（場所メタデータ、ユーザー任意）
-- - sl_books に固定IDの「独語」レコードを1冊投入（特殊な本として並列に並ぶ）

alter table sl_slices add column if not exists location text;

-- 独語book: 固定UUID。本に紐づかない断片の容器として、通常の本と並列に存在する
insert into sl_books (id, title, author, cover_url, synopsis, tags)
values (
  '00000000-0000-0000-0000-000000000001',
  '独語',
  '浅野智明',
  '/monologue-cover.svg',
  '本をきっかけに飛び立っていく、拡散する思考の容器。',
  '{}'::text[]
)
on conflict (id) do nothing;
