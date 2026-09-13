-- RLS ポリシーだけでなく、anon ロールへのテーブル権限(GRANT)自体が
-- 不足しており、ブラウザ(anon key)からの書き込みが
-- "permission denied for table push_subscriptions" (42501) で失敗していた。
--
-- push_subscriptions: ブラウザから直接 upsert / update(is_active) される
-- push_logs: Netlify Function が anon key 経由で insert する

GRANT SELECT, INSERT, UPDATE ON public.push_subscriptions TO anon, authenticated;
GRANT SELECT, INSERT ON public.push_logs TO anon, authenticated;

-- push_logs も anon からの INSERT を許可する RLS ポリシーが未定義だった
DROP POLICY IF EXISTS "push_logs_insert_all" ON push_logs;
CREATE POLICY "push_logs_insert_all" ON push_logs
  FOR INSERT WITH CHECK (true);

-- BIGSERIAL 主キーのシーケンスにも USAGE 権限が必要
GRANT USAGE, SELECT ON SEQUENCE push_subscriptions_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE push_logs_id_seq TO anon, authenticated;
