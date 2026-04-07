-- ============================================
-- タイヤホテル OKABE — テーブル作成SQL
-- ============================================

-- 1. スタッフ
CREATE TABLE staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('worker', 'sales', 'office', 'manager')),
  created_at timestamptz DEFAULT now()
);

-- 2. 顧客
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT '個人' CHECK (type IN ('個人', '法人')),
  name text NOT NULL,
  kana text,
  phone text,
  mobile text,
  email text,
  address text,
  line_id text,
  web_registered boolean DEFAULT false,
  customer_status text DEFAULT '新規' CHECK (customer_status IN ('新規', '継続')),
  group_id uuid REFERENCES customers(id),
  memo text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. 車両
CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  plate_number text NOT NULL,
  maker text,
  model text,
  color text,
  memo text,
  created_at timestamptz DEFAULT now()
);

-- 4. タイヤセット
CREATE TABLE tire_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  season_type text NOT NULL CHECK (season_type IN ('夏タイヤ', '冬タイヤ', 'オールシーズン')),
  storage_location_no text,
  fee integer,
  assigned_staff uuid REFERENCES staff(id),
  memo text,
  created_at timestamptz DEFAULT now()
);

-- 5. 個別タイヤ（4本）
CREATE TABLE tires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tire_set_id uuid NOT NULL REFERENCES tire_sets(id) ON DELETE CASCADE,
  position text NOT NULL CHECK (position IN ('右前', '右後', '左前', '左後')),
  manufacturer text,
  pattern text,
  size text,
  tread_depth numeric,
  tread_measured_date date,
  needs_replacement boolean DEFAULT false,
  wheel_type text CHECK (wheel_type IN ('純正', '社外')),
  wheel_material text CHECK (wheel_material IN ('アルミ', '鉄')),
  hubcap text CHECK (hubcap IN ('有', '無')),
  lug_nuts text CHECK (lug_nuts IN ('別', '共用')),
  check_image_url text,
  inspector text,
  memo text
);

-- 6. 預かり期間
CREATE TABLE storage_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tire_set_id uuid NOT NULL REFERENCES tire_sets(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  planned_return_date date,
  actual_return_date date,
  status text DEFAULT '預かり中' CHECK (status IN ('預かり中', '返却済', '期限超過')),
  memo text,
  created_at timestamptz DEFAULT now()
);

-- 7. 作業
CREATE TABLE works (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tire_set_id uuid REFERENCES tire_sets(id),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id),
  type text NOT NULL CHECK (type IN ('履き替え', '点検', '預かり開始', '返却')),
  scheduled_date date,
  completed_date date,
  status text DEFAULT '予約' CHECK (status IN ('予約', '受付', '作業中', '完了', 'キャンセル')),
  assigned_to uuid REFERENCES staff(id),
  memo text,
  created_at timestamptz DEFAULT now()
);

-- 8. 約款
CREATE TABLE terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  effective_date date,
  created_at timestamptz DEFAULT now()
);

-- 9. マスター設定
CREATE TABLE settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  label text NOT NULL,
  description text,
  updated_by uuid REFERENCES staff(id),
  updated_at timestamptz DEFAULT now()
);

-- 10. 写真
CREATE TABLE photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tire_set_id uuid REFERENCES tire_sets(id) ON DELETE CASCADE,
  tire_id uuid REFERENCES tires(id) ON DELETE CASCADE,
  work_id uuid REFERENCES works(id) ON DELETE CASCADE,
  url text NOT NULL,
  photo_type text CHECK (photo_type IN ('タイヤ外観', 'ナンバー', '残溝', 'その他')),
  memo text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- インデックス
-- ============================================
CREATE INDEX idx_vehicles_customer ON vehicles(customer_id);
CREATE INDEX idx_vehicles_plate ON vehicles(plate_number);
CREATE INDEX idx_tire_sets_vehicle ON tire_sets(vehicle_id);
CREATE INDEX idx_tires_tire_set ON tires(tire_set_id);
CREATE INDEX idx_storage_periods_tire_set ON storage_periods(tire_set_id);
CREATE INDEX idx_works_vehicle ON works(vehicle_id);
CREATE INDEX idx_works_scheduled ON works(scheduled_date);
CREATE INDEX idx_works_status ON works(status);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_kana ON customers(kana);
CREATE INDEX idx_customers_group ON customers(group_id);

-- ============================================
-- 初期設定データ
-- ============================================
INSERT INTO settings (key, value, label, description) VALUES
  ('tread_good_threshold', '4', '良好判定の残溝基準(mm)', '残溝がこの値以上なら「良好」と判定します'),
  ('tread_caution_threshold', '2', '要注意判定の残溝基準(mm)', '残溝がこの値以上〜良好未満なら「要注意」と判定します'),
  ('tread_legal_minimum', '1.6', '法定最低残溝(mm)', 'この値未満は法律上使用不可です');

-- ============================================
-- 約款の初期データ
-- ============================================
INSERT INTO terms (version, title, content, effective_date) VALUES
  ('1.0', 'タイヤ保管同意書（契約条項）',
   '第一条（保管物）
タイヤ及びホイールのみをお預かりします。ナットやセンターキャップ等の付属品はお預かりできません。

第二条（料金）
お預かり料金は車1台分（タイヤ4本セット）となっております。料金は税別表示です。

第三条（保管期間）
お預かり期間は契約書記載の預かり日から返却予定日までとします。期間中の交換作業をご希望の場合は、1週間前までにご連絡をお願いいたします。

第四条（損害補償）
お預かり期間中、当店の責任により損害が生じた場合、タイヤ及びホイールの時価額（減耗などを考慮した額）を補償致します。

第五条（期間超過）
お預かり期間をすぎてもお引取りの無い場合、追加の保管料をお支払い頂きます。

第六条（免責事項）
天災地変、火災その他の不可抗力による損害については、補償の対象外とさせていただきます。

第七条（契約解除）
保管期間の途中で解約される場合、残期間の料金は返金いたしません。',
   '2026-04-07');

-- ============================================
-- RLS有効化（全テーブル）
-- ============================================
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tire_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tires ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLSポリシー（認証済みユーザーは全操作可能）
-- ※ 将来的にロール別の細かいポリシーに変更
-- ============================================
CREATE POLICY "staff_all" ON staff FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "customers_all" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "vehicles_all" ON vehicles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tire_sets_all" ON tire_sets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tires_all" ON tires FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "storage_periods_all" ON storage_periods FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "works_all" ON works FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "terms_read" ON terms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "terms_write" ON terms FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "settings_read" ON settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings_write" ON settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "photos_all" ON photos FOR ALL TO authenticated USING (true) WITH CHECK (true);
