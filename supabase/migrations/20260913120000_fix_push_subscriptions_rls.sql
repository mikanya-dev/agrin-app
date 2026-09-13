-- push_subscriptions は匿名ユーザー（購読者のブラウザ）から直接
-- INSERT/UPDATE される想定だが、当初のマイグレーションには
-- SELECT ポリシーしかなく、書き込みが RLS に拒否されていた。

DROP POLICY IF EXISTS "push_subscriptions_insert_all" ON push_subscriptions;
CREATE POLICY "push_subscriptions_insert_all" ON push_subscriptions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "push_subscriptions_update_all" ON push_subscriptions;
CREATE POLICY "push_subscriptions_update_all" ON push_subscriptions
  FOR UPDATE USING (true) WITH CHECK (true);
