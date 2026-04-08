/* ===== 発注・納品管理機能 ===== */

// デモ用の発注依頼データ
const demoOrderRequests = [
  {
    id: 1,
    staff_name: '山本太郎',
    customer_name: '鈴木一郎',
    vehicle: 'プリウス / 岐阜 500 あ 1234',
    tire_info: 'ブリヂストン ECOPIA EP150 195/65R15',
    quantity: 4,
    reason: '残溝不足による交換',
    requested_at: '09:15',
    status: 'pending',
  },
  {
    id: 2,
    staff_name: '佐藤次郎',
    customer_name: '田中建設株式会社',
    vehicle: 'ハイエース / 岐阜 300 さ 5678',
    tire_info: 'ヨコハマ BluEarth-GT AE51 215/60R16',
    quantity: 4,
    reason: '冬→夏 履き替え（夏タイヤ劣化）',
    requested_at: '10:30',
    status: 'pending',
  },
  {
    id: 3,
    staff_name: '山本太郎',
    customer_name: '高橋花子',
    vehicle: 'N-BOX / 岐阜 580 う 9012',
    tire_info: 'ダンロップ ENASAVE EC204 155/65R14',
    quantity: 4,
    reason: 'ひび割れあり、安全上交換推奨',
    requested_at: '11:45',
    status: 'pending',
  },
];

// 仕入先マスタ
const suppliers = {
  mstokai: { name: 'MS東海', color: '#1e40af', bgColor: '#dbeafe' },
  hagino: { name: 'ハギノ', color: '#16a34a', bgColor: '#dcfce7' },
  fuji: { name: 'フジ', color: '#dc2626', bgColor: '#fee2e2' },
};

// サービススタッフ: 発注希望を送信
function openOrderRequest() {
  const screen = document.getElementById('orderRequestScreen');
  if (!screen) return;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

function submitOrderRequest() {
  const form = document.getElementById('orderRequestForm');
  if (!form) return;
  const customer = form.querySelector('[name="order_customer"]').value;
  const tire = form.querySelector('[name="order_tire"]').value;
  const qty = form.querySelector('[name="order_qty"]').value;
  const reason = form.querySelector('[name="order_reason"]').value;

  if (!customer || !tire) {
    alert('顧客名とタイヤ情報を入力してください');
    return;
  }

  alert(`発注希望を送信しました\n\n顧客: ${customer}\nタイヤ: ${tire}\n数量: ${qty}本\n理由: ${reason}\n\nフロント事務に通知されました。`);
  switchTab('home');
}

// フロント事務: 発注依頼一覧
function openOrderList() {
  const screen = document.getElementById('orderListScreen');
  if (!screen) return;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
  renderOrderList();
}

function renderOrderList() {
  const container = document.getElementById('orderListItems');
  if (!container) return;

  const today = new Date();
  const dateStr = today.getFullYear() + '年' + (today.getMonth() + 1) + '月' + today.getDate() + '日';

  let html = `<div style="padding:0 16px 8px;font-size:13px;color:var(--sub);font-weight:600;">${dateStr} の発注依頼（${demoOrderRequests.length}件）</div>`;

  demoOrderRequests.forEach(req => {
    html += `
    <div class="order-request-card" id="orderReq${req.id}">
      <div style="display:flex;align-items:flex-start;gap:10px;">
        <input type="checkbox" class="order-check" value="${req.id}" style="margin-top:4px;width:20px;height:20px;accent-color:var(--accent);">
        <div style="flex:1;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <span style="font-size:11px;color:var(--sub);">依頼: ${req.staff_name} / ${req.requested_at}</span>
            <span style="font-size:10px;padding:3px 10px;border-radius:10px;background:var(--warning-bg);color:var(--warning);font-weight:700;">未発注</span>
          </div>
          <div style="font-size:15px;font-weight:700;margin-bottom:2px;">${req.customer_name}</div>
          <div style="font-size:12px;color:var(--sub);margin-bottom:4px;">${req.vehicle}</div>
          <div style="font-size:13px;font-weight:600;color:var(--primary);margin-bottom:2px;">${req.tire_info}</div>
          <div style="font-size:12px;color:var(--sub);">${req.quantity}本 / ${req.reason}</div>
        </div>
      </div>
    </div>`;
  });

  container.innerHTML = html;
}

// 発注先選択モーダル
function showSupplierSelect() {
  const checked = document.querySelectorAll('.order-check:checked');
  if (checked.length === 0) {
    alert('発注する依頼を選択してください');
    return;
  }

  const modal = document.getElementById('supplierModal');
  if (modal) modal.style.display = 'flex';
}

function closeSupplierModal() {
  const modal = document.getElementById('supplierModal');
  if (modal) modal.style.display = 'none';
}

// 発注書を生成
function generateOrder(supplierKey) {
  closeSupplierModal();

  const checked = document.querySelectorAll('.order-check:checked');
  const selectedIds = Array.from(checked).map(c => parseInt(c.value));
  const items = demoOrderRequests.filter(r => selectedIds.includes(r.id));

  if (supplierKey === 'mstokai') {
    generateOrderFormMstokai(items);
  } else if (supplierKey === 'hagino') {
    generateOrderFormHagino(items);
  } else {
    generateOrderFormFuji(items);
  }
}

// MS.トーカイ 書式（実物準拠: 緑帯・横長・コード/売上日/型式/数量/単価/金額）
function generateOrderFormMstokai(items) {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const dateStr = y + '.' + m + '.' + d;
  const orderNo = String(590000 + Math.floor(Math.random() * 9999));

  // タイヤ情報をサイズ部分で分離
  function parseTire(info) {
    const sizeMatch = info.match(/(\d{3}\/\d{2,3}R?\d{2}[\s\S]*?)$/);
    const size = sizeMatch ? sizeMatch[1].trim() : '';
    const name = size ? info.replace(size, '').trim() : info;
    return { name, size };
  }

  let itemRows = '';
  let total = 0;
  items.forEach((item, i) => {
    const parsed = parseTire(item.tire_info);
    const price = 3800 + (i * 400);
    const subtotal = price * item.quantity;
    total += subtotal;
    const code = 'Y' + (94253006 + i * 1000);
    itemRows += `
      <tr>
        <td style="padding:4px 6px;border:1px solid #4a7c3f;font-size:11px;text-align:center;">${code}</td>
        <td style="padding:4px 6px;border:1px solid #4a7c3f;font-size:11px;">07110</td>
        <td style="padding:4px 6px;border:1px solid #4a7c3f;font-size:11px;">${parsed.size || item.tire_info}</td>
        <td style="padding:4px 6px;border:1px solid #4a7c3f;font-size:11px;text-align:center;">${item.quantity}</td>
        <td style="padding:4px 6px;border:1px solid #4a7c3f;font-size:11px;text-align:right;">${price.toLocaleString()}</td>
        <td style="padding:4px 6px;border:1px solid #4a7c3f;font-size:11px;text-align:right;">${subtotal.toLocaleString()}</td>
      </tr>`;
  });

  const tax = Math.floor(total * 0.1);

  const html = `
  <div style="padding:16px;max-width:700px;margin:auto;font-family:'Noto Sans JP',sans-serif;background:#fff;">
    <!-- ヘッダー：緑帯 -->
    <div style="background:#4a7c3f;color:#fff;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;margin-bottom:0;">
      <div style="font-size:20px;font-weight:700;letter-spacing:4px;">納 品 書</div>
      <div style="text-align:right;">
        <div style="font-size:14px;font-weight:700;">MS.トーカイ</div>
        <div style="font-size:9px;">株式会社 エムエストーカイ</div>
      </div>
    </div>

    <!-- 情報行 -->
    <div style="border:1px solid #4a7c3f;border-top:none;padding:8px 12px;display:flex;justify-content:space-between;font-size:11px;background:#f8fdf6;">
      <div>
        <div style="margin-bottom:2px;"><span style="color:#666;">コード:</span> 130151</div>
        <div><span style="color:#666;">売上日:</span> ${dateStr}</div>
      </div>
      <div style="text-align:right;">
        <div><span style="color:#666;">売上No:</span> ${orderNo}</div>
        <div style="margin-top:4px;"><span style="color:#666;">岐南営業所</span></div>
      </div>
    </div>

    <!-- 宛先 -->
    <div style="border:1px solid #4a7c3f;border-top:none;padding:8px 12px;font-size:13px;">
      株式会社　<b>OKABE GROUP</b>　一般　　　　様
    </div>

    <!-- 明細テーブル -->
    <table style="width:100%;border-collapse:collapse;margin-top:0;">
      <thead>
        <tr style="background:#e8f5e3;">
          <th style="padding:4px 6px;border:1px solid #4a7c3f;font-size:10px;width:100px;">型式/車名</th>
          <th style="padding:4px 6px;border:1px solid #4a7c3f;font-size:10px;width:50px;">型式</th>
          <th style="padding:4px 6px;border:1px solid #4a7c3f;font-size:10px;">商品名・サイズ</th>
          <th style="padding:4px 6px;border:1px solid #4a7c3f;font-size:10px;width:35px;">数量</th>
          <th style="padding:4px 6px;border:1px solid #4a7c3f;font-size:10px;width:60px;">単価</th>
          <th style="padding:4px 6px;border:1px solid #4a7c3f;font-size:10px;width:70px;">金額</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <!-- 合計 -->
    <div style="border:1px solid #4a7c3f;border-top:none;padding:8px 12px;display:flex;justify-content:flex-end;gap:24px;font-size:12px;background:#f8fdf6;">
      <div><span style="color:#666;">合　計</span> <b>${total.toLocaleString()}</b></div>
      <div><span style="color:#666;">消費税 10%</span> <b>${tax.toLocaleString()}</b></div>
      <div style="font-size:14px;"><span style="color:#666;">税込合計</span> <b style="color:#4a7c3f;">${(total + tax).toLocaleString()}</b></div>
    </div>

    <div style="font-size:9px;color:#888;margin-top:8px;line-height:1.6;">
      毎度ありがとうございます。万一品違いの場合は5日以内にお申し出ください。お届け先からのお問い合わせもお受けいたします。
    </div>
  </div>`;

  showOrderPreview(html, 'MS.トーカイ 発注書');
}

// ブリヂストンはきの 書式（実物準拠: 赤文字・BS帯・販売先コード・複数明細）
function generateOrderFormHagino(items) {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const dateStr = y + '.' + m + '.' + d;

  let itemRows = '';
  let total = 0;
  items.forEach((item, i) => {
    const price = 5200 + (i * 900);
    const subtotal = price * item.quantity;
    total += subtotal;
    const code = '1353' + (9422 + i * 217);
    itemRows += `
      <tr>
        <td style="padding:5px 8px;border:1px solid #c44;font-size:11px;color:#c00;text-align:center;">${code}</td>
        <td style="padding:5px 8px;border:1px solid #c44;font-size:11px;color:#c00;">${item.tire_info}</td>
        <td style="padding:5px 8px;border:1px solid #c44;font-size:11px;color:#c00;text-align:center;">${item.quantity}</td>
        <td style="padding:5px 8px;border:1px solid #c44;font-size:11px;color:#c00;text-align:right;">${price.toLocaleString()}</td>
        <td style="padding:5px 8px;border:1px solid #c44;font-size:11px;color:#c00;text-align:right;">${subtotal.toLocaleString()}</td>
      </tr>`;
  });

  const tax = Math.floor(total * 0.1);

  const html = `
  <div style="padding:16px;max-width:700px;margin:auto;font-family:'Noto Sans JP',sans-serif;background:#fff;">
    <!-- ヘッダー -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
      <div>
        <div style="font-size:18px;font-weight:700;letter-spacing:3px;">納 品 書</div>
        <div style="font-size:10px;color:#666;margin-top:2px;">〒500-8357<br>岐阜県岐阜市六条大溝1-5</div>
        <div style="font-size:12px;font-weight:600;margin-top:4px;">株式会社OKABEGROUP</div>
        <div style="font-size:10px;color:#666;">058-272-4830</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:16px;font-weight:700;color:#c00;letter-spacing:1px;">BRIDGESTONE</div>
        <div style="font-size:12px;font-weight:600;margin-top:4px;">ブリヂストンはきの株式会社</div>
        <div style="font-size:10px;color:#666;">5017 岐阜南営業所</div>
        <div style="font-size:10px;color:#666;margin-top:4px;">${dateStr}</div>
      </div>
    </div>

    <!-- 販売先情報バー -->
    <div style="background:#fde8e8;border:1px solid #c44;padding:4px 8px;font-size:10px;color:#c00;display:flex;justify-content:space-between;margin-bottom:0;">
      <span>販売先: S6012001</span>
      <span>伝票No: 44753</span>
      <span>No: 0123</span>
    </div>

    <!-- 明細 -->
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#fde8e8;">
          <th style="padding:4px 8px;border:1px solid #c44;font-size:10px;color:#c00;width:80px;">商品コード</th>
          <th style="padding:4px 8px;border:1px solid #c44;font-size:10px;color:#c00;">品名・サイズ</th>
          <th style="padding:4px 8px;border:1px solid #c44;font-size:10px;color:#c00;width:35px;">数量</th>
          <th style="padding:4px 8px;border:1px solid #c44;font-size:10px;color:#c00;width:60px;">単価</th>
          <th style="padding:4px 8px;border:1px solid #c44;font-size:10px;color:#c00;width:70px;">金額</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <!-- 合計欄 -->
    <div style="border:1px solid #c44;border-top:none;padding:8px 12px;background:#fde8e8;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="font-size:12px;font-weight:600;color:#c00;">
          株式会社OKABEGROUP<br>
          <span style="font-size:10px;color:#666;">岐阜県岐阜市六条大溝1-5-1</span>
        </div>
        <div style="text-align:right;font-size:11px;color:#c00;">
          <div>商品計 <b>${total.toLocaleString()}</b></div>
          <div>消費税 <b>${tax.toLocaleString()}</b></div>
          <div style="font-size:14px;margin-top:2px;">合計 <b>${(total + tax).toLocaleString()}</b></div>
        </div>
      </div>
    </div>

    <div style="text-align:right;margin-top:8px;font-size:10px;color:#666;">チェック欄: _____</div>
  </div>`;

  showOrderPreview(html, 'ブリヂストンはきの 発注書');
}

// フジ・コーポレーション 書式（実物準拠: Fujiロゴ・商品名/サイズ/カラー/定価/数量/値引/金額）
function generateOrderFormFuji(items) {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const dateStr = y + '年' + m + '月' + d + '日';
  const slipNo = '8119935 - 2484' + Math.floor(Math.random() * 9999);

  function parseTire(info) {
    const parts = info.split(' ');
    const maker = parts[0] || '';
    const sizeMatch = info.match(/(\d{3}\/\d{2,3}R?\d{2}\s*\S*)/);
    const size = sizeMatch ? sizeMatch[1].trim() : '';
    const pattern = info.replace(maker, '').replace(size, '').trim();
    return { maker, pattern, size };
  }

  let itemRows = '';
  let subtotalAll = 0;
  items.forEach((item, i) => {
    const parsed = parseTire(item.tire_info);
    const listPrice = 22400 + (i * 2000);
    const discount = Math.floor(listPrice * 0.5);
    const unitPrice = listPrice - discount;
    const amount = unitPrice * item.quantity;
    subtotalAll += amount;
    itemRows += `
      <tr>
        <td style="padding:6px 8px;border:1px solid #999;font-size:11px;font-weight:600;">${parsed.maker}</td>
        <td style="padding:6px 8px;border:1px solid #999;font-size:11px;">${parsed.pattern}</td>
        <td style="padding:6px 8px;border:1px solid #999;font-size:11px;">${parsed.size}</td>
        <td style="padding:6px 8px;border:1px solid #999;font-size:11px;text-align:center;">—</td>
        <td style="padding:6px 8px;border:1px solid #999;font-size:11px;text-align:right;">${listPrice.toLocaleString()}</td>
        <td style="padding:6px 8px;border:1px solid #999;font-size:11px;text-align:center;">${item.quantity}</td>
        <td style="padding:6px 8px;border:1px solid #999;font-size:11px;text-align:right;">${discount.toLocaleString()}</td>
        <td style="padding:6px 8px;border:1px solid #999;font-size:11px;text-align:right;font-weight:600;">${amount.toLocaleString()}</td>
      </tr>`;
  });

  const tax = Math.floor(subtotalAll * 0.1);

  const html = `
  <div style="padding:16px;max-width:700px;margin:auto;font-family:'Noto Sans JP',sans-serif;background:#fff;">
    <!-- ヘッダー -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
      <div>
        <div style="font-size:10px;color:#666;">〒500-8357<br>岐阜県岐阜市六条大溝1-5-1</div>
        <div style="font-size:13px;font-weight:700;margin-top:6px;">株OKABE GROUP 本部・本社工場　様</div>
        <div style="font-size:9px;color:#666;">(1349221-06306)</div>
        <div style="font-size:10px;font-weight:600;margin-top:2px;">&lt; 納品書在中 &gt;</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:10px;color:#666;">No. ${slipNo}</div>
        <div style="font-size:22px;font-weight:700;color:#1a1a8c;font-style:italic;margin:4px 0;">Fuji</div>
        <div style="font-size:9px;color:#666;">株式会社フジ・コーポレーション<br>〒981-1341 宮城県宮城郡松島町幡谷1-2<br>TEL: 022-349-3301 FAX: 022-349-3352</div>
        <div style="font-size:11px;margin-top:6px;">日付: <b>${dateStr}</b></div>
      </div>
    </div>

    <!-- 明細テーブル -->
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#f0f0f0;">
          <th style="padding:5px 8px;border:1px solid #999;font-size:9px;">商品</th>
          <th style="padding:5px 8px;border:1px solid #999;font-size:9px;">品名</th>
          <th style="padding:5px 8px;border:1px solid #999;font-size:9px;">表記サイズ</th>
          <th style="padding:5px 8px;border:1px solid #999;font-size:9px;">表記カラー</th>
          <th style="padding:5px 8px;border:1px solid #999;font-size:9px;">定価</th>
          <th style="padding:5px 8px;border:1px solid #999;font-size:9px;">数量</th>
          <th style="padding:5px 8px;border:1px solid #999;font-size:9px;">値引</th>
          <th style="padding:5px 8px;border:1px solid #999;font-size:9px;">金額</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <!-- 合計欄 -->
    <div style="display:flex;justify-content:flex-end;margin-top:0;">
      <div style="border:1px solid #999;border-top:none;width:200px;">
        <div style="display:flex;justify-content:space-between;padding:4px 10px;border-bottom:1px solid #ccc;font-size:11px;">
          <span>小　計</span><span style="font-weight:600;">${subtotalAll.toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:4px 10px;border-bottom:1px solid #ccc;font-size:11px;">
          <span>消費税</span><span>${tax.toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 10px;font-size:13px;font-weight:700;background:#f0f0f0;">
          <span>合　計</span><span>${(subtotalAll + tax).toLocaleString()}</span>
        </div>
      </div>
    </div>

    <div style="margin-top:12px;font-size:9px;color:#666;">※消費税は新税率となります。</div>
  </div>`;

  showOrderPreview(html, 'フジ・コーポレーション 発注書');
}

// 発注書プレビュー表示
function showOrderPreview(contentHtml, title) {
  const screen = document.getElementById('orderPreviewScreen');
  if (!screen) return;

  document.getElementById('orderPreviewTitle').textContent = title;
  document.getElementById('orderPreviewContent').innerHTML = contentHtml;

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

function printOrder() {
  const content = document.getElementById('orderPreviewContent').innerHTML;
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
    <style>body{margin:0;font-family:'Noto Sans JP',sans-serif;}@media print{body{margin:0;}}</style>
  </head><body>${content}</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

// ===== 納品チェック =====
let deliveryCheckState = {
  slipResult: null,
  tireResult: null,
};

function openDeliveryCheck() {
  deliveryCheckState = { slipResult: null, tireResult: null };
  const screen = document.getElementById('deliveryCheckScreen');
  if (!screen) return;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
  updateDeliveryCheckUI();
}

function scanDeliverySlip() {
  openCamera('delivery_slip', (result) => {
    if (!result) return;
    deliveryCheckState.slipResult = result;
    updateDeliveryCheckUI();
    compareDelivery();
  });
}

function scanDeliveryTire() {
  openCamera('delivery_tire', (result) => {
    if (!result) return;
    deliveryCheckState.tireResult = result;
    updateDeliveryCheckUI();
    compareDelivery();
  });
}

function updateDeliveryCheckUI() {
  const slipStatus = document.getElementById('slipScanStatus');
  const tireStatus = document.getElementById('tireScanStatus');
  if (!slipStatus || !tireStatus) return;

  if (deliveryCheckState.slipResult) {
    const slip = deliveryCheckState.slipResult;
    let items = '';
    if (slip.items && slip.items.length > 0) {
      slip.items.forEach(item => {
        items += `<div style="font-size:12px;margin-top:2px;">${item.name || ''} x${item.quantity || '?'}</div>`;
      });
    }
    slipStatus.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <span style="color:var(--success);font-size:16px;">&#10003;</span>
        <span style="font-weight:700;">納品書読取完了</span>
      </div>
      <div style="font-size:12px;color:var(--sub);">伝票No: ${slip.slip_number || '—'}</div>
      <div style="font-size:12px;color:var(--sub);">仕入先: ${slip.supplier || '—'}</div>
      ${items}`;
  } else {
    slipStatus.innerHTML = '<div style="color:var(--sub);font-size:13px;">未スキャン</div>';
  }

  if (deliveryCheckState.tireResult) {
    const tire = deliveryCheckState.tireResult;
    tireStatus.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <span style="color:var(--success);font-size:16px;">&#10003;</span>
        <span style="font-weight:700;">タイヤ読取完了</span>
      </div>
      <div style="font-size:12px;color:var(--sub);">メーカー: ${tire.manufacturer || '—'}</div>
      <div style="font-size:12px;color:var(--sub);">パターン: ${tire.pattern || '—'}</div>
      <div style="font-size:12px;color:var(--sub);">サイズ: ${tire.size || '—'}</div>`;
  } else {
    tireStatus.innerHTML = '<div style="color:var(--sub);font-size:13px;">未スキャン</div>';
  }
}

function compareDelivery() {
  const resultEl = document.getElementById('deliveryCompareResult');
  if (!resultEl) return;

  const slip = deliveryCheckState.slipResult;
  const tire = deliveryCheckState.tireResult;

  if (!slip || !tire) {
    resultEl.innerHTML = '<div style="padding:16px;text-align:center;color:var(--sub);font-size:13px;">納品書とタイヤの両方をスキャンすると照合結果を表示します</div>';
    return;
  }

  const slipItem = slip.items && slip.items[0] ? slip.items[0] : {};
  const checks = [];

  const slipMfr = (slipItem.manufacturer || '').toUpperCase();
  const tireMfr = (tire.manufacturer || '').toUpperCase();
  const mfrMatch = slipMfr && tireMfr && (slipMfr.includes(tireMfr) || tireMfr.includes(slipMfr));
  checks.push({ label: 'メーカー', slip: slipItem.manufacturer || '—', tire: tire.manufacturer || '—', match: mfrMatch });

  const slipPat = (slipItem.pattern || '').toUpperCase();
  const tirePat = (tire.pattern || '').toUpperCase();
  const patMatch = slipPat && tirePat && (slipPat.includes(tirePat) || tirePat.includes(slipPat));
  checks.push({ label: 'パターン', slip: slipItem.pattern || '—', tire: tire.pattern || '—', match: patMatch });

  const slipSize = (slipItem.size || '').replace(/\s/g, '');
  const tireSize = (tire.size || '').replace(/\s/g, '');
  const sizeMatch = slipSize && tireSize && slipSize === tireSize;
  checks.push({ label: 'サイズ', slip: slipItem.size || '—', tire: tire.size || '—', match: sizeMatch });

  const allMatch = checks.every(c => c.match);

  let html = `
    <div style="padding:12px;border-radius:10px;margin-bottom:12px;${allMatch
      ? 'background:var(--success-bg);border:2px solid var(--success);'
      : 'background:var(--danger-bg);border:2px solid var(--danger);'}">
      <div style="font-size:18px;font-weight:700;text-align:center;${allMatch ? 'color:var(--success);' : 'color:var(--danger);'}">
        ${allMatch ? '&#10003; 一致' : '&#10007; 不一致あり'}
      </div>
      <div style="font-size:12px;text-align:center;color:var(--sub);margin-top:2px;">${allMatch ? '納品書とタイヤ情報が一致しています' : '以下の項目に差異があります。確認してください。'}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:var(--gray-bg);">
          <th style="padding:8px;text-align:left;border-bottom:1px solid var(--border);">項目</th>
          <th style="padding:8px;text-align:left;border-bottom:1px solid var(--border);">納品書</th>
          <th style="padding:8px;text-align:left;border-bottom:1px solid var(--border);">実物</th>
          <th style="padding:8px;text-align:center;border-bottom:1px solid var(--border);">結果</th>
        </tr>
      </thead>
      <tbody>`;

  checks.forEach(c => {
    html += `
        <tr>
          <td style="padding:8px;border-bottom:1px solid var(--border);font-weight:600;">${c.label}</td>
          <td style="padding:8px;border-bottom:1px solid var(--border);">${c.slip}</td>
          <td style="padding:8px;border-bottom:1px solid var(--border);">${c.tire}</td>
          <td style="padding:8px;border-bottom:1px solid var(--border);text-align:center;font-weight:700;${c.match ? 'color:var(--success);' : 'color:var(--danger);'}">
            ${c.match ? '&#10003;' : '&#10007;'}
          </td>
        </tr>`;
  });

  html += '</tbody></table>';
  resultEl.innerHTML = html;
}

// ===== 車検証読取→新規登録 =====
function openShakenRegister() {
  const screen = document.getElementById('shakenRegisterScreen');
  if (!screen) return;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
  const form = document.getElementById('shakenForm');
  if (form) form.reset();
  document.getElementById('shakenVehicleInfo').style.display = 'none';
}

function scanShakenForRegister() {
  scanShaken((result) => {
    if (!result) return;
    fillShakenForm(result);
  });
}

function fillShakenForm(data) {
  const form = document.getElementById('shakenForm');
  if (!form) return;

  const setVal = (name, val) => {
    const el = form.querySelector(`[name="${name}"]`);
    if (el && val && val !== 'null') el.value = val;
  };

  setVal('shaken_plate', data.plate_number);
  setVal('shaken_registration_date', data.registration_date);
  setVal('shaken_first_registration', data.first_registration);
  setVal('shaken_expiry', data.expiry_date);
  setVal('shaken_vehicle_type', data.vehicle_type);
  setVal('shaken_purpose', data.purpose);
  setVal('shaken_private_commercial', data.private_or_commercial);
  setVal('shaken_body_shape', data.body_shape);
  setVal('shaken_vehicle_name', data.vehicle_name);
  setVal('shaken_model_code', data.model_code);
  setVal('shaken_engine_model', data.engine_model);
  setVal('shaken_displacement', data.displacement_cc);
  setVal('shaken_fuel', data.fuel_type);
  setVal('shaken_capacity', data.passenger_capacity);
  setVal('shaken_max_load', data.max_load_kg);
  setVal('shaken_weight', data.vehicle_weight_kg);
  setVal('shaken_gross_weight', data.gross_weight_kg);
  setVal('shaken_chassis', data.chassis_number);
  setVal('shaken_length', data.length_cm);
  setVal('shaken_width', data.width_cm);
  setVal('shaken_height', data.height_cm);
  setVal('shaken_owner_name', data.owner_name);
  setVal('shaken_owner_address', data.owner_address);

  let userName = data.user_name;
  let userAddr = data.user_address;
  if (userName === '***' || userName === '＊＊＊') {
    userName = data.owner_name;
    userAddr = data.owner_address;
  }
  setVal('shaken_user_name', userName);
  setVal('shaken_user_address', userAddr);
  setVal('shaken_use_location', data.use_location);
  setVal('shaken_remarks', data.remarks);

  document.getElementById('shakenVehicleInfo').style.display = 'block';

  alert('車検証の読み取りが完了しました。内容をご確認ください。');
}

function submitShakenRegister() {
  const form = document.getElementById('shakenForm');
  if (!form) return;

  const plateNumber = form.querySelector('[name="shaken_plate"]').value;
  const ownerName = form.querySelector('[name="shaken_owner_name"]').value;
  const userName = form.querySelector('[name="shaken_user_name"]').value;

  if (!plateNumber) {
    alert('ナンバーが入力されていません');
    return;
  }

  const customerName = userName || ownerName || '未入力';
  const vehicleName = form.querySelector('[name="shaken_vehicle_name"]').value || '';
  const commonName = form.querySelector('[name="shaken_common_name"]').value || '';
  const displayName = commonName || vehicleName;

  alert(`車検証データから登録します\n\n顧客名: ${customerName}\n車両: ${displayName}\nナンバー: ${plateNumber}\n\nこの後、タイヤ情報の登録に進みます`);
}

function lookupCommonName() {
  alert('通称名検索機能は今後実装予定です。\n\n型式または車台番号から、プリウス・クラウン等の通称名を自動取得する機能を追加します。');
}
