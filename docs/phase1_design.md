# タイヤホテル OKABE — 第1フェーズ設計書

## 概要
OKABE GROUPのタイヤホテル事業の基本管理台帳アプリ。
gift-note（AWAI）をベースに、Supabase・リポジトリは別管理で構築。

## ユーザーロール（5つ）
| ロール | メインデバイス | サブ |
|--------|---------------|------|
| お客さん | スマホ（LINE経由） | — |
| 工場作業員 | スマホ | — |
| 営業マン | スマホ | PC |
| フロント事務員 | PC | スマホ |
| 幹部/管理者 | PC + スマホ両方 | — |

## テーブル設計

### customers（顧客）
| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid PK | |
| type | text | 個人/法人 |
| name | text | 氏名 or 法人名 |
| kana | text | フリガナ |
| phone | text | 電話番号 |
| mobile | text | 携帯番号 |
| email | text | |
| address | text | 住所 |
| line_id | text | LINE連携 |
| web_registered | boolean | WEB登録済みか |
| memo | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### vehicles（車両）
| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid PK | |
| customer_id | uuid FK | 顧客 |
| plate_number | text | ナンバー |
| maker | text | メーカー |
| model | text | 車種 |
| color | text | |
| memo | text | |
| created_at | timestamptz | |

### tire_sets（預かりタイヤセット）
| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid PK | |
| vehicle_id | uuid FK | 車両 |
| season_type | text | 夏タイヤ/冬タイヤ |
| customer_status | text | 新規/継続 |
| storage_location_no | text | 保管場所No. |
| fee | integer | 料金（税別） |
| memo | text | |
| created_at | timestamptz | |

### tires（個別タイヤ × 4本）
| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid PK | |
| tire_set_id | uuid FK | タイヤセット |
| position | text | 右前/右後/左前/左後 |
| manufacturer | text | メーカー名 |
| pattern | text | トレッドパターン |
| size | text | サイズ |
| tread_depth | numeric | 残溝 |
| tread_measured_date | date | 残溝測定日 |
| needs_replacement | boolean | 要交換 |
| wheel_type | text | 純正/社外 |
| wheel_material | text | アルミ/鉄 |
| hubcap | text | 有/無 |
| lug_nuts | text | 別/共用 |
| check_image_url | text | 外観チェック画像 |
| inspector | text | チェック者 |
| memo | text | |

### storage_periods（預かり期間）
| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid PK | |
| tire_set_id | uuid FK | タイヤセット |
| start_date | date | 預かり日 |
| planned_return_date | date | 返却予定日 |
| actual_return_date | date | 実返却日 |
| status | text | 預かり中/返却済/期限超過 |
| memo | text | |
| created_at | timestamptz | |

### works（作業）
| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid PK | |
| tire_set_id | uuid FK | タイヤセット |
| vehicle_id | uuid FK | 車両 |
| type | text | 履き替え/点検/預かり開始/返却 |
| scheduled_date | date | 予定日 |
| completed_date | date | 完了日 |
| status | text | 予約/受付/作業中/完了/キャンセル |
| assigned_to | uuid FK | 担当作業員(staff) |
| memo | text | |
| created_at | timestamptz | |

### terms（約款）
| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid PK | |
| version | text | バージョン |
| title | text | タイトル |
| content | text | 本文 |
| effective_date | date | 施行日 |
| created_at | timestamptz | |

### staff（スタッフ）
| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid PK | |
| auth_user_id | uuid | Supabase Auth連携 |
| name | text | 名前 |
| role | text | worker/sales/office/manager |
| created_at | timestamptz | |

## 約款の要点（申込書より）
1. ナット・センターキャップ等の付属品は預かり不可
2. 料金は車1台分（タイヤ4本セット）単位
3. 店舗責任の損害 → タイヤ・ホイールの時価額で補償
4. 期間超過 → 追加保管料が発生

## 画面構成（タブ）
| タブ | 対象ロール | 内容 |
|------|-----------|------|
| 顧客一覧 | 事務員・営業・管理者 | 顧客検索・登録・詳細 |
| 車両・タイヤ | 事務員・作業員・営業 | 車両とタイヤの一覧・状態管理 |
| 作業予定 | 全ロール | 作業一覧・ステータス管理 |
| 約款 | 全スタッフ | 約款閲覧・PDF共有 |
| ダッシュボード | 管理者 | 預かり数・作業件数等 |

## AWAIから流用
- PWA構造（オフライン対応・ホーム画面追加）
- Supabase認証・RLS
- カード型UI・検索UI
- レスポンシブ（スマホ + PC）

## 第1フェーズ機能一覧
| 機能 | 内容 |
|------|------|
| 作業一覧・ステータス管理 | カード型。今日/明日/今週の切替 |
| 📷 OCR（ナンバー読取） | 撮影→車両・顧客自動紐付け |
| 📷 OCR（タイヤサイズ読取） | タイヤ側面撮影→サイズ・メーカー自動入力 |
| 📷 OCR（残溝読取） | 溝+定規撮影→残溝自動入力＋判定 |
| タイヤ4本チェック | 4輪の状態を一画面で管理 |
| 写真保存 | Supabase Storageに証拠写真保存 |
| ❓ヘルプ | 各項目横に❓。判定基準・使い方を表示 |
| マスター設定 | 判定基準の編集（管理者権限） |
| チャットBot | 画像質問対応。業務特化。約款ベース回答 |
| 約款閲覧 | スマホ表示＋PDF共有 |
| 顧客・車両・タイヤ管理 | CRUD＋検索 |

## テーブル追加: マスター設定
### settings（マスター設定）
| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid PK | |
| key | text | 設定キー（例: tread_good_threshold） |
| value | text | 設定値（例: 4） |
| label | text | 表示名（例: 良好判定の残溝基準mm） |
| description | text | ヘルプ表示用の説明文 |
| updated_by | uuid FK | 最終更新者(staff) |
| updated_at | timestamptz | |

### 初期設定値
| key | value | label |
|-----|-------|-------|
| tread_good_threshold | 4 | 良好判定の残溝基準(mm) |
| tread_caution_threshold | 2 | 要注意判定の残溝基準(mm) |
| tread_legal_minimum | 1.6 | 法定最低残溝(mm) |

## デモURL（営業ショーケース）
メインアプリとは別URLで提供。提案・営業ツールとして使用。

| オプション | 対象 | 変わること |
|-----------|------|-----------|
| 標準 | 一般スタッフ | ベースUI |
| アクセシビリティ | 障害を持つ従業員 | シンプル表示・大きなボタン・やさしい日本語 |
| シニア | 年配者 | 文字拡大・コントラスト強化 |
| 多言語 | 外国人労働者 | 言語切替（対象言語は確認後） |
| 最高レベルBot | デモ用 | 画像認識・業務判断・提案までフルスペックBot |

## 費用構造（OKABE GROUP移管時に説明）
| サービス | 内容 | 費用感 |
|---------|------|--------|
| Supabase | DB・認証・Storage・Edge Functions | 無料枠あり。規模による |
| Claude API | チャットBot・OCR | 従量課金 |
| ホスティング | アプリ公開 | 無料〜少額 |
| ドメイン（任意） | 独自ドメイン | 年数千円 |

## AWAIから流用
- PWA構造（オフライン対応・ホーム画面追加）
- Supabase認証・RLS
- カード型UI・検索UI
- レスポンシブ（スマホ + PC）
- image-ocr Edge Function → ナンバー・タイヤ読取に転用
- ai-concierge Edge Function → チャットBotに転用

## AWAIから変更
- カラースキーム → OKABE GROUPブランドカラー
- タブ構成 → タイヤ管理用
- データ構造 → 顧客・車両・タイヤ・作業
