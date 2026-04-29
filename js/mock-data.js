// 当日の予約一覧（初期データ）
const TODAY_RESERVATIONS = [
  {
    id: 'R001',
    time: '09:00',
    customerName: '田中 花子',
    customerType: 'individual',
    vehicleNumber: '岐阜500あ1234',
    vehicleModel: 'ホンダ フリード',
    vehicleColor: 'パールホワイト',
    workType: '冬→夏 履き替え',
    status: 'received',
    contractIdentifier: '岐阜500あ1234-A',
    storageNo: 'A-127'
  },
  {
    id: 'R002',
    time: '10:30',
    customerName: '株式会社岐阜運送',
    customerSubName: '鈴木様',
    customerType: 'corporate',
    vehicleNumber: '岐阜800か5678',
    vehicleModel: 'トヨタ ハイエース',
    vehicleColor: 'ホワイト',
    workType: '冬→夏 履き替え',
    status: 'reserved',
    contractIdentifier: '岐阜800か5678-A',
    storageNo: 'B-045'
  },
  {
    id: 'R003',
    time: '13:00',
    customerName: '山田 太郎',
    customerType: 'individual',
    vehicleNumber: '岐阜530う9012',
    vehicleModel: 'スズキ ワゴンR',
    vehicleColor: 'シルバー',
    workType: '冬→夏 履き替え',
    status: 'reserved',
    contractIdentifier: '岐阜530う9012-A',
    storageNo: 'A-203'
  },
  {
    id: 'R004',
    time: '14:30',
    customerName: '佐藤 一郎',
    customerType: 'individual',
    vehicleNumber: '岐阜500わ3456',
    vehicleModel: 'マツダ CX-5',
    vehicleColor: 'ソウルレッド',
    workType: '冬→夏 履き替え',
    status: 'reserved',
    contractIdentifier: '岐阜500わ3456-B',
    storageNo: 'C-012'
  }
];

// 車検証OCRのモックデータ
const OCR_VEHICLE_INSPECTION_DATA = {
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
const OCR_TIRE_DATA = [
  { position: '右前', manufacturer: 'ブリヂストン', pattern: 'ブリザック VRX3', size: '195/65R15', manufactureDate: '2024年', treadDepth: 6.5, status: 'good' },
  { position: '右後', manufacturer: 'ブリヂストン', pattern: 'ブリザック VRX3', size: '195/65R15', manufactureDate: '2024年', treadDepth: 6.0, status: 'good' },
  { position: '左前', manufacturer: 'ブリヂストン', pattern: 'ブリザック VRX3', size: '195/65R15', manufactureDate: '2024年', treadDepth: 6.5, status: 'good' },
  { position: '左後', manufacturer: 'ブリヂストン', pattern: 'ブリザック VRX3', size: '195/65R15', manufactureDate: '2024年', treadDepth: 6.0, status: 'good' }
];

// 保管場所一覧
const STORAGE_LOCATIONS = [
  { id: 'A', name: '保管場所A' },
  { id: 'B', name: '保管場所B' },
  { id: 'C', name: '保管場所C' }
];
