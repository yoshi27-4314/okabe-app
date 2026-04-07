-- ============================================
-- テスト用車両・タイヤ・作業データ
-- ============================================

-- 車両登録
INSERT INTO vehicles (customer_id, plate_number, maker, model, color) VALUES
  ((SELECT id FROM customers WHERE name = '鈴木一郎'), '岐阜 500 あ 1234', 'トヨタ', 'プリウス', 'シルバー'),
  ((SELECT id FROM customers WHERE name = '田中建設株式会社'), '岐阜 300 さ 5678', 'トヨタ', 'ハイエース', '白'),
  ((SELECT id FROM customers WHERE name = '山田花子'), '岐阜 580 う 9012', 'ホンダ', 'N-BOX', '赤'),
  ((SELECT id FROM customers WHERE name = '佐藤健一'), '岐阜 300 か 3456', 'スバル', 'フォレスター', '紺'),
  ((SELECT id FROM customers WHERE name = '山田商事株式会社'), '岐阜 100 た 9876', '日産', 'キャラバン', '白'),
  ((SELECT id FROM customers WHERE name = '岡田運輸株式会社'), '岐阜 800 き 7890', 'いすゞ', 'エルフ', '白');

-- タイヤセット（鈴木一郎 - 夏タイヤ）
INSERT INTO tire_sets (vehicle_id, season_type, storage_location_no, fee) VALUES
  ((SELECT id FROM vehicles WHERE plate_number = '岐阜 500 あ 1234'), '夏タイヤ', 'A-23', 8800);

-- タイヤセット（鈴木一郎 - 冬タイヤ）
INSERT INTO tire_sets (vehicle_id, season_type, storage_location_no, fee) VALUES
  ((SELECT id FROM vehicles WHERE plate_number = '岐阜 500 あ 1234'), '冬タイヤ', null, null);

-- タイヤセット（田中建設 ハイエース - 夏タイヤ）
INSERT INTO tire_sets (vehicle_id, season_type, storage_location_no, fee) VALUES
  ((SELECT id FROM vehicles WHERE plate_number = '岐阜 300 さ 5678'), '夏タイヤ', 'B-07', 8800);

-- タイヤセット（山田花子 N-BOX - 冬タイヤ）
INSERT INTO tire_sets (vehicle_id, season_type, storage_location_no, fee) VALUES
  ((SELECT id FROM vehicles WHERE plate_number = '岐阜 580 う 9012'), '冬タイヤ', 'C-15', 6600);

-- 鈴木一郎 夏タイヤ 4本
INSERT INTO tires (tire_set_id, position, manufacturer, pattern, size, tread_depth, tread_measured_date, needs_replacement, wheel_type, wheel_material, hubcap, lug_nuts, inspector) VALUES
  ((SELECT id FROM tire_sets WHERE storage_location_no = 'A-23'), '左前', 'ブリヂストン', 'ECOPIA EP150', '195/65R15', 5.2, '2026-04-01', false, '純正', 'アルミ', '有', '共用', '佐藤'),
  ((SELECT id FROM tire_sets WHERE storage_location_no = 'A-23'), '右前', 'ブリヂストン', 'ECOPIA EP150', '195/65R15', 5.0, '2026-04-01', false, '純正', 'アルミ', '有', '共用', '佐藤'),
  ((SELECT id FROM tire_sets WHERE storage_location_no = 'A-23'), '左後', 'ブリヂストン', 'ECOPIA EP150', '195/65R15', 3.8, '2026-04-01', false, '純正', 'アルミ', '有', '共用', '佐藤'),
  ((SELECT id FROM tire_sets WHERE storage_location_no = 'A-23'), '右後', 'ブリヂストン', 'ECOPIA EP150', '195/65R15', 3.1, '2026-04-01', false, '純正', 'アルミ', '有', '共用', '佐藤');

-- 田中建設 夏タイヤ 4本
INSERT INTO tires (tire_set_id, position, manufacturer, pattern, size, tread_depth, tread_measured_date, needs_replacement, wheel_type, wheel_material, hubcap, lug_nuts, inspector) VALUES
  ((SELECT id FROM tire_sets WHERE storage_location_no = 'B-07'), '左前', 'ヨコハマ', 'BluEarth-GT AE51', '215/65R16', 4.5, '2026-03-20', false, '純正', '鉄', '有', '共用', '田中'),
  ((SELECT id FROM tire_sets WHERE storage_location_no = 'B-07'), '右前', 'ヨコハマ', 'BluEarth-GT AE51', '215/65R16', 4.3, '2026-03-20', false, '純正', '鉄', '有', '共用', '田中'),
  ((SELECT id FROM tire_sets WHERE storage_location_no = 'B-07'), '左後', 'ヨコハマ', 'BluEarth-GT AE51', '215/65R16', 1.8, '2026-03-20', true, '純正', '鉄', '有', '共用', '田中'),
  ((SELECT id FROM tire_sets WHERE storage_location_no = 'B-07'), '右後', 'ヨコハマ', 'BluEarth-GT AE51', '215/65R16', 1.5, '2026-03-20', true, '純正', '鉄', '有', '共用', '田中');

-- 預かり期間
INSERT INTO storage_periods (tire_set_id, start_date, planned_return_date, status) VALUES
  ((SELECT id FROM tire_sets WHERE storage_location_no = 'A-23'), '2025-11-15', '2026-04-10', '預かり中'),
  ((SELECT id FROM tire_sets WHERE storage_location_no = 'B-07'), '2025-11-20', '2026-04-15', '預かり中'),
  ((SELECT id FROM tire_sets WHERE storage_location_no = 'C-15'), '2025-12-01', '2026-04-20', '預かり中');

-- 作業データ（今日の日付で）
INSERT INTO works (vehicle_id, tire_set_id, type, scheduled_date, status, memo) VALUES
  ((SELECT id FROM vehicles WHERE plate_number = '岐阜 300 さ 5678'),
   (SELECT id FROM tire_sets WHERE storage_location_no = 'B-07'),
   '履き替え', CURRENT_DATE, '作業中', '冬→夏 履き替え'),

  ((SELECT id FROM vehicles WHERE plate_number = '岐阜 500 あ 1234'),
   (SELECT id FROM tire_sets WHERE storage_location_no = 'A-23'),
   '履き替え', CURRENT_DATE, '予約', '冬→夏 履き替え'),

  ((SELECT id FROM vehicles WHERE plate_number = '岐阜 100 た 9876'),
   null,
   '預かり開始', CURRENT_DATE, '予約', '新規預かり'),

  ((SELECT id FROM vehicles WHERE plate_number = '岐阜 580 う 9012'),
   (SELECT id FROM tire_sets WHERE storage_location_no = 'C-15'),
   '預かり開始', CURRENT_DATE, '完了', null),

  ((SELECT id FROM vehicles WHERE plate_number = '岐阜 300 か 3456'),
   null,
   '履き替え', CURRENT_DATE, '完了', '冬→夏 履き替え'),

  ((SELECT id FROM vehicles WHERE plate_number = '岐阜 800 き 7890'),
   null,
   '点検', CURRENT_DATE, '完了', null);
