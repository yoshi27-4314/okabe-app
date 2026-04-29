// 当日の予約一覧（初期データ）
// ピーク日の想定：15件・4ステータス混在
const TODAY_RESERVATIONS = [
  // ===== 早朝〜午前前半（既に完了済み）=====
  {
    id: 'R001',
    time: '08:00',
    customerName: '高橋 健一',
    customerType: 'individual',
    vehicleNumber: '岐阜500あ1101',
    vehicleModel: 'トヨタ プリウス',
    workType: '冬→夏 履き替え',
    status: 'completed',
    contractIdentifier: '岐阜500あ1101-A',
    storageNo: 'A-001',
    startTime: '08:05',
    endTime: '08:45'
  },
  {
    id: 'R002',
    time: '08:30',
    customerName: '伊藤 美香',
    customerType: 'individual',
    vehicleNumber: '岐阜500か2202',
    vehicleModel: 'ホンダ N-BOX',
    workType: '冬→夏 履き替え',
    status: 'completed',
    contractIdentifier: '岐阜500か2202-A',
    storageNo: 'A-018',
    startTime: '08:35',
    endTime: '09:10'
  },
  {
    id: 'R003',
    time: '09:00',
    customerName: '株式会社岐阜建設',
    customerSubName: '小林様',
    customerType: 'corporate',
    vehicleNumber: '岐阜800さ3303',
    vehicleModel: 'いすゞ エルフ',
    workType: '冬→夏 履き替え',
    status: 'completed',
    contractIdentifier: '岐阜800さ3303-A',
    storageNo: 'B-008',
    startTime: '09:05',
    endTime: '10:00'
  },

  // ===== 午前中（作業中・受付済み）=====
  {
    id: 'R004',
    time: '09:30',
    customerName: '田中 花子',
    customerType: 'individual',
    vehicleNumber: '岐阜500あ1234',
    vehicleModel: 'ホンダ フリード',
    workType: '冬→夏 履き替え',
    status: 'working',
    contractIdentifier: '岐阜500あ1234-A',
    storageNo: 'A-127',
    startTime: '09:35'
  },
  {
    id: 'R005',
    time: '10:00',
    customerName: '株式会社岐阜運送',
    customerSubName: '鈴木様',
    customerType: 'corporate',
    vehicleNumber: '岐阜800か5678',
    vehicleModel: 'トヨタ ハイエース',
    workType: '冬→夏 履き替え',
    status: 'working',
    contractIdentifier: '岐阜800か5678-A',
    storageNo: 'B-045',
    startTime: '10:05'
  },
  {
    id: 'R006',
    time: '10:30',
    customerName: '渡辺 真理子',
    customerType: 'individual',
    vehicleNumber: '岐阜530た4404',
    vehicleModel: 'スズキ スイフト',
    workType: '冬→夏 履き替え',
    status: 'received',
    contractIdentifier: '岐阜530た4404-A',
    storageNo: 'A-156'
  },
  {
    id: 'R007',
    time: '11:00',
    customerName: '加藤 大輔',
    customerType: 'individual',
    vehicleNumber: '岐阜500ゆ5505',
    vehicleModel: 'マツダ CX-5',
    workType: '冬→夏 履き替え',
    status: 'received',
    contractIdentifier: '岐阜500ゆ5505-A',
    storageNo: 'C-022'
  },

  // ===== 昼すぎ（受付済み・予約）=====
  {
    id: 'R008',
    time: '13:00',
    customerName: '山田 太郎',
    customerType: 'individual',
    vehicleNumber: '岐阜530う9012',
    vehicleModel: 'スズキ ワゴンR',
    workType: '新規預かり（夏タイヤ）',
    status: 'reserved',
    contractIdentifier: null,
    storageNo: null
  },
  {
    id: 'R009',
    time: '13:30',
    customerName: '中村 京子',
    customerType: 'individual',
    vehicleNumber: '岐阜500の6606',
    vehicleModel: '日産 ノート',
    workType: '冬→夏 履き替え',
    status: 'reserved',
    contractIdentifier: '岐阜500の6606-A',
    storageNo: 'A-089'
  },
  {
    id: 'R010',
    time: '14:00',
    customerName: '株式会社山本商会',
    customerSubName: '田村様',
    customerType: 'corporate',
    vehicleNumber: '岐阜400れ7707',
    vehicleModel: 'ダイハツ ハイゼット',
    workType: '冬→夏 履き替え',
    status: 'reserved',
    contractIdentifier: '岐阜400れ7707-A',
    storageNo: 'B-072'
  },
  {
    id: 'R011',
    time: '14:30',
    customerName: '佐藤 一郎',
    customerType: 'individual',
    vehicleNumber: '岐阜500わ3456',
    vehicleModel: 'マツダ CX-5',
    workType: '冬→夏 履き替え',
    status: 'reserved',
    contractIdentifier: '岐阜500わ3456-B',
    storageNo: 'C-012'
  },

  // ===== 午後遅い時間（予約のみ）=====
  {
    id: 'R012',
    time: '15:00',
    customerName: '小川 雅子',
    customerType: 'individual',
    vehicleNumber: '岐阜500を8808',
    vehicleModel: 'ホンダ ヴェゼル',
    workType: '冬→夏 履き替え',
    status: 'reserved',
    contractIdentifier: '岐阜500を8808-A',
    storageNo: 'A-201'
  },
  {
    id: 'R013',
    time: '15:30',
    customerName: '吉田 浩司',
    customerType: 'individual',
    vehicleNumber: '岐阜530そ9909',
    vehicleModel: 'スバル レヴォーグ',
    workType: '冬→夏 履き替え',
    status: 'reserved',
    contractIdentifier: '岐阜530そ9909-A',
    storageNo: 'C-035'
  },
  {
    id: 'R014',
    time: '16:00',
    customerName: '株式会社マルイチ運輸',
    customerSubName: '岡田様',
    customerType: 'corporate',
    vehicleNumber: '岐阜800ね1010',
    vehicleModel: 'トヨタ ダイナ',
    workType: '冬→夏 履き替え',
    status: 'reserved',
    contractIdentifier: '岐阜800ね1010-A',
    storageNo: 'B-098'
  },
  {
    id: 'R015',
    time: '16:30',
    customerName: '林 貴史',
    customerType: 'individual',
    vehicleNumber: '岐阜500む1111',
    vehicleModel: 'トヨタ アクア',
    workType: '冬→夏 履き替え',
    status: 'reserved',
    contractIdentifier: '岐阜500む1111-A',
    storageNo: 'A-178'
  }
];

// 車検証OCRのモックデータ
var OCR_VEHICLE_INSPECTION_DATA = {
  customer: {
    type: 'individual',
    lastName: '田中',
    firstName: '花子',
    furigana: 'タナカ ハナコ',
    address: '岐阜県岐阜市茜部本郷1-2-3',
    phone: '058-123-4567',
    mobile: '090-1234-5678',
    email: 'tanaka.hanako@example.com'
  },
  vehicle: {
    number: '岐阜500あ1234',
    manufacturer: 'ホンダ',
    model: 'フリード',
    chassisNumber: 'GB7-1234567',
    vehicleType: 'DBA-GB7',
    color: 'パールホワイト'
  }
};

// タイヤOCRのモックデータ
var OCR_TIRE_DATA = [
  { position: '右前', manufacturer: 'ブリヂストン', pattern: 'ブリザック VRX3', size: '195/65R15', manufactureDate: '2024年', treadDepth: 6.5, status: 'good' },
  { position: '右後', manufacturer: 'ブリヂストン', pattern: 'ブリザック VRX3', size: '195/65R15', manufactureDate: '2024年', treadDepth: 6.0, status: 'good' },
  { position: '左前', manufacturer: 'ブリヂストン', pattern: 'ブリザック VRX3', size: '195/65R15', manufactureDate: '2024年', treadDepth: 6.5, status: 'good' },
  { position: '左後', manufacturer: 'ブリヂストン', pattern: 'ブリザック VRX3', size: '195/65R15', manufactureDate: '2024年', treadDepth: 6.0, status: 'good' }
];

// 保管場所一覧
var STORAGE_LOCATIONS = [
  { id: 'A', name: '保管場所A' },
  { id: 'B', name: '保管場所B' },
  { id: 'C', name: '保管場所C' }
];
