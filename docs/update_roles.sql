-- ============================================
-- ロール定義を6階層に拡張
-- ============================================

-- staff テーブルの role 制約を更新
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_role_check;
ALTER TABLE staff ADD CONSTRAINT staff_role_check CHECK (role IN ('president', 'sales_manager', 'sales', 'factory_manager', 'office', 'worker'));

-- 既存スタッフのロールを更新
UPDATE staff SET role = 'worker' WHERE name = '田中太郎';
UPDATE staff SET role = 'office' WHERE name = '佐藤美咲';
UPDATE staff SET role = 'sales' WHERE name = '山本健一';
UPDATE staff SET role = 'sales_manager' WHERE name = '鈴木部長';

-- 追加スタッフ
INSERT INTO staff (name, role) VALUES
  ('岡部社長', 'president'),
  ('山田工場長', 'factory_manager');
