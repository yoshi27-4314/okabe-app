/* ===== 新規登録機能 ===== */

// 新規登録方法選択モーダル
function showRegisterChoice() {
  const el = document.createElement('div');
  el.id = 'registerChoiceModal';
  el.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:998;';
  el.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:24px;width:calc(100% - 48px);max-width:340px;text-align:center;">
      <div style="font-size:15px;font-weight:700;margin-bottom:20px;">新規登録方法を選択</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button onclick="document.getElementById('registerChoiceModal').remove(); openRegister();" style="
          padding:16px;border-radius:12px;border:1.5px solid var(--border);background:#fff;color:var(--text);
          font-size:15px;font-weight:700;font-family:inherit;cursor:pointer;
          display:flex;align-items:center;justify-content:center;gap:8px;">
          <span style="font-size:20px;">✏️</span> 手入力で登録
        </button>
        <button onclick="document.getElementById('registerChoiceModal').remove(); openShakenRegister();" style="
          padding:16px;border-radius:12px;border:none;background:var(--accent);color:#fff;
          font-size:15px;font-weight:700;font-family:inherit;cursor:pointer;
          display:flex;align-items:center;justify-content:center;gap:8px;
          box-shadow:0 2px 8px rgba(37,99,235,0.3);">
          <span style="font-size:20px;">📄</span> 車検証データから登録
        </button>
      </div>
      <button onclick="document.getElementById('registerChoiceModal').remove();" style="
        margin-top:14px;padding:10px;border:none;background:none;
        color:var(--sub);font-size:13px;font-family:inherit;cursor:pointer;">
        キャンセル
      </button>
    </div>`;
  document.body.appendChild(el);
}

// 登録フォームの状態
let registerState = {
  step: 1, // 1:顧客 2:車両 3:タイヤセット 4:タイヤ4本
  customerId: null,
  vehicleId: null,
  tireSetId: null,
};

// 登録画面を開く
function openRegister() {
  registerState = { step: 1, customerId: null, vehicleId: null, tireSetId: null };
  switchTab('register');
  showRegisterStep(1);
  buildTireInputs();
}

// タイヤ4本の入力フォームを生成
function buildTireInputs() {
  const container = document.getElementById('tireInputs');
  if (!container) return;

  const positions = ['右前', '右後', '左前', '左後'];
  let html = '';

  positions.forEach(pos => {
    html += `
    <div style="background:var(--gray-bg);border-radius:10px;padding:12px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:13px;font-weight:700;color:var(--primary);">${pos}</span>
        <div style="display:flex;gap:4px;">
          <button type="button" class="camera-scan-btn" style="width:32px;height:32px;font-size:14px;" onclick="scanTireForRegister('${pos}')" title="タイヤ読取">📁</button>
          <button type="button" class="camera-scan-btn" style="width:32px;height:32px;font-size:14px;background:var(--success);" onclick="scanDepthForRegister('${pos}')" title="残溝読取">📏</button>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>メーカー</label><input type="text" name="${pos}_manufacturer" placeholder="ブリヂストン"></div>
        <div class="form-group"><label>サイズ</label><input type="text" name="${pos}_size" placeholder="195/65R15"></div>
      </div>
      <div class="form-group"><label>パターン</label><input type="text" name="${pos}_pattern" placeholder="ECOPIA EP150"></div>
      <div class="form-row">
        <div class="form-group"><label>残溝(mm)</label><input type="number" step="0.1" name="${pos}_tread_depth" placeholder="5.0"></div>
        <div class="form-group"><label>測定日</label><input type="date" name="${pos}_tread_measured_date"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>ホイール</label><select name="${pos}_wheel_type"><option value="">—</option><option value="純正">純正</option><option value="社外">社外</option></select></div>
        <div class="form-group"><label>素材</label><select name="${pos}_wheel_material"><option value="">—</option><option value="アルミ">アルミ</option><option value="鉄">鉄</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>キャップ</label><select name="${pos}_hubcap"><option value="">—</option><option value="有">有</option><option value="無">無</option></select></div>
        <div class="form-group"><label>ナット</label><select name="${pos}_lug_nuts"><option value="">—</option><option value="共用">共用</option><option value="別">別</option></select></div>
      </div>
      <div class="form-group"><label>チェック者</label><input type="text" name="${pos}_inspector" placeholder="佐藤"></div>
    </div>`;
  });

  container.innerHTML = html;
}

// ステップ表示
function showRegisterStep(step) {
  registerState.step = step;
  document.querySelectorAll('.reg-step').forEach(el => el.style.display = 'none');
  const stepEl = document.getElementById('regStep' + step);
  if (stepEl) stepEl.style.display = 'block';

  // ステップインジケーター更新
  document.querySelectorAll('.step-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i < step);
    dot.classList.toggle('current', i === step - 1);
  });
}

// Step 1: 顧客登録
async function submitCustomer() {
  const form = document.getElementById('customerForm');
  const data = {
    type: form.querySelector('[name="type"]').value,
    name: form.querySelector('[name="name"]').value,
    kana: form.querySelector('[name="kana"]').value,
    phone: form.querySelector('[name="phone"]').value,
    mobile: form.querySelector('[name="mobile"]').value,
    address: form.querySelector('[name="address"]').value,
    line_id: form.querySelector('[name="line_id"]').value,
    web_registered: form.querySelector('[name="web_registered"]').checked,
    customer_status: form.querySelector('[name="customer_status"]').value,
  };

  if (!data.name) { alert('お名前を入力してください'); return; }

  const result = await createCustomer(data);
  if (result) {
    registerState.customerId = result.id;
    showRegisterStep(2);
  } else {
    alert('登録に失敗しました');
  }
}

// Step 2: 車両登録
async function submitVehicle() {
  const form = document.getElementById('vehicleForm');
  const data = {
    customer_id: registerState.customerId,
    plate_number: form.querySelector('[name="plate_number"]').value,
    maker: form.querySelector('[name="maker"]').value,
    model: form.querySelector('[name="model"]').value,
    color: form.querySelector('[name="color"]').value,
  };

  if (!data.plate_number) { alert('ナンバーを入力してください'); return; }

  const result = await createVehicle(data);
  if (result) {
    registerState.vehicleId = result.id;
    showRegisterStep(3);
  } else {
    alert('登録に失敗しました');
  }
}

// ナンバーをOCRで読み取り→フォームに入力
function scanPlateForRegister() {
  openCamera('plate_number', (result) => {
    if (!result) return;
    const form = document.getElementById('vehicleForm');
    if (result.plate_number) form.querySelector('[name="plate_number"]').value = result.plate_number;
  });
}

// Step 3: タイヤセット登録
async function submitTireSet() {
  const form = document.getElementById('tireSetForm');
  const data = {
    vehicle_id: registerState.vehicleId,
    season_type: form.querySelector('[name="season_type"]').value,
    storage_location_no: form.querySelector('[name="storage_location_no"]').value,
    fee: parseInt(form.querySelector('[name="fee"]').value) || null,
  };

  const tireSet = await createTireSet(data);
  if (!tireSet) { alert('登録に失敗しました'); return; }

  registerState.tireSetId = tireSet.id;

  // 預かり期間も登録
  const startDate = form.querySelector('[name="start_date"]').value;
  const returnDate = form.querySelector('[name="planned_return_date"]').value;
  if (startDate) {
    await createStoragePeriod({
      tire_set_id: tireSet.id,
      start_date: startDate,
      planned_return_date: returnDate || null,
      status: '預かり中',
    });
  }

  showRegisterStep(4);
}

// Step 4: タイヤ4本登録
async function submitTires() {
  const positions = ['右前', '右後', '左前', '左後'];
  let success = true;

  for (const pos of positions) {
    const prefix = pos;
    const form = document.getElementById('tiresForm');
    const getVal = (name) => form.querySelector(`[name="${prefix}_${name}"]`)?.value || '';
    const getNum = (name) => parseFloat(getVal(name)) || null;

    const data = {
      tire_set_id: registerState.tireSetId,
      position: pos,
      manufacturer: getVal('manufacturer'),
      pattern: getVal('pattern'),
      size: getVal('size'),
      tread_depth: getNum('tread_depth'),
      tread_measured_date: getVal('tread_measured_date') || null,
      needs_replacement: getNum('tread_depth') !== null && getNum('tread_depth') < 2,
      wheel_type: getVal('wheel_type') || null,
      wheel_material: getVal('wheel_material') || null,
      hubcap: getVal('hubcap') || null,
      lug_nuts: getVal('lug_nuts') || null,
      inspector: getVal('inspector'),
    };

    const result = await createTire(data);
    if (!result) success = false;
  }

  if (success) {
    alert('✅ 登録完了しました！');
    // 顧客詳細を表示
    showCustomerDetail(registerState.customerId);
  } else {
    alert('一部のタイヤ登録に失敗しました');
  }
}

// タイヤ情報をOCRで読み取り→フォームに入力
function scanTireForRegister(position) {
  openCamera('tire_info', (result) => {
    if (!result) return;
    const form = document.getElementById('tiresForm');
    const prefix = position;
    if (result.manufacturer) {
      const el = form.querySelector(`[name="${prefix}_manufacturer"]`);
      if (el) el.value = result.manufacturer;
    }
    if (result.pattern) {
      const el = form.querySelector(`[name="${prefix}_pattern"]`);
      if (el) el.value = result.pattern;
    }
    if (result.size) {
      const el = form.querySelector(`[name="${prefix}_size"]`);
      if (el) el.value = result.size;
    }
  });
}

// 残溝をOCRで読み取り→フォームに入力
function scanDepthForRegister(position) {
  openCamera('tread_depth', (result) => {
    if (!result) return;
    const form = document.getElementById('tiresForm');
    const el = form.querySelector(`[name="${position}_tread_depth"]`);
    if (el && result.tread_depth_mm) el.value = result.tread_depth_mm;
  });
}
