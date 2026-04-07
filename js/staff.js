/* ===== スタッフ画面JavaScript ===== */

// タブ切替
function switchTab(tab) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));

  const chatInput = document.querySelector('.chat-input-area');
  if (chatInput) chatInput.style.display = 'none';

  const screenMap = {
    home: 'homeScreen',
    work: 'workScreen',
    customer: 'customerScreen',
    search: 'searchScreen',
    chat: 'chatScreen',
    terms: 'termsScreen'
  };

  if (screenMap[tab]) {
    document.getElementById(screenMap[tab]).classList.add('active');
    if (tab === 'chat' && chatInput) {
      chatInput.style.display = 'flex';
    }
  }
}

// 日付フィルター
function selectDate(el) {
  document.querySelectorAll('.date-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

// 作業詳細モーダル
function openDetail(type) {
  document.getElementById('detailModal').classList.add('active');
}
function closeDetail() {
  document.getElementById('detailModal').classList.remove('active');
}

// ステータス変更（デモ用）
function changeStatus(btn, newStatus) {
  const card = btn.closest('.work-card');
  const statusEl = card.querySelector('.work-status');

  if (newStatus === 'accepted') {
    statusEl.className = 'work-status accepted';
    statusEl.textContent = '受付済';
    card.className = 'work-card status-accepted';
    btn.className = 'work-action-btn start';
    btn.textContent = '🔧 開始';
    btn.onclick = function(e) { e.stopPropagation(); changeStatus(this, 'working'); };
  } else if (newStatus === 'working') {
    statusEl.className = 'work-status working';
    statusEl.textContent = '作業中';
    card.className = 'work-card status-working';
    btn.className = 'work-action-btn complete';
    btn.textContent = '✅ 完了';
    btn.onclick = function(e) { e.stopPropagation(); changeStatus(this, 'done'); };
  } else if (newStatus === 'done') {
    statusEl.className = 'work-status done';
    statusEl.textContent = '完了';
    card.className = 'work-card status-done';
    card.style.opacity = '0.7';
    btn.remove();
  }
}

// タイヤセット切替
function switchTireSet(el, index) {
  document.querySelectorAll('.tire-set-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tire-set-panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tireSet' + index).classList.add('active');
}

// モーダル外クリックで閉じる
document.getElementById('detailModal').addEventListener('click', function(e) {
  if (e.target === this) closeDetail();
});

// 初期表示
var chatInput = document.querySelector('.chat-input-area');
if (chatInput) chatInput.style.display = 'none';

// ============================================
// 実データ連携
// ============================================

// 検索実行
async function executeSearch() {
  const input = document.querySelector('#searchScreen .search-input');
  const resultArea = document.getElementById('searchResults');
  const query = input.value.trim();

  if (!query) {
    resultArea.innerHTML = '<div style="padding:40px 16px;text-align:center;color:var(--sub);font-size:14px;">検索キーワードを入力してください</div>';
    return;
  }

  resultArea.innerHTML = '<div style="padding:40px 16px;text-align:center;color:var(--sub);font-size:14px;">検索中...</div>';

  // 顧客名・電話で検索
  const customers = await getCustomers(query);

  // ナンバーで車両検索
  const vehicles = await searchVehicleByPlate(query);

  let html = '';

  if (customers.length === 0 && vehicles.length === 0) {
    html = '<div style="padding:40px 16px;text-align:center;color:var(--sub);font-size:14px;">該当するデータが見つかりませんでした</div>';
  } else {
    // 顧客結果
    customers.forEach(c => {
      html += `
        <div class="work-card" style="border-left-color:var(--accent);cursor:pointer;" onclick="showCustomerDetail('${c.id}')">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div class="work-customer">${c.name} ${c.type === '個人' ? '様' : ''}</div>
              <div class="work-vehicle">${c.type} ・ ${c.phone || ''} ${c.mobile ? '/ ' + c.mobile : ''}</div>
              <div style="font-size:12px;color:var(--sub);">${c.address || ''}</div>
            </div>
            <span style="font-size:20px;color:var(--gray);">›</span>
          </div>
        </div>`;
    });

    // 車両結果（顧客名付き）
    vehicles.forEach(v => {
      const cName = v.customers?.name || '';
      html += `
        <div class="work-card" style="border-left-color:var(--success);cursor:pointer;" onclick="showCustomerDetail('${v.customer_id}')">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div class="work-customer">${v.plate_number}</div>
              <div class="work-vehicle">${v.maker || ''} ${v.model || ''} ・ ${cName}</div>
            </div>
            <span style="font-size:20px;color:var(--gray);">›</span>
          </div>
        </div>`;
    });
  }

  resultArea.innerHTML = html;
}

// 顧客詳細表示（実データ）
async function showCustomerDetail(customerId) {
  switchTab('customer');
  const detailArea = document.getElementById('customerDetail');
  detailArea.innerHTML = '<div style="padding:40px;text-align:center;color:var(--sub);">読み込み中...</div>';

  const customer = await getCustomerById(customerId);
  if (!customer) {
    detailArea.innerHTML = '<div style="padding:40px;text-align:center;color:var(--danger);">顧客情報が見つかりません</div>';
    return;
  }

  const vehicles = await getVehiclesByCustomer(customerId);

  let html = `
    <div class="info-card">
      <div class="info-card-header">
        <span>お客様情報</span>
        <span class="badge-new-cont">${customer.customer_status || '新規'}</span>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">お名前</div>
          <div class="info-value-large">${customer.name} ${customer.type === '個人' ? '様' : ''}</div>
        </div>
        ${customer.kana ? `<div class="info-item"><div class="info-label">フリガナ</div><div class="info-value">${customer.kana}</div></div>` : ''}
        <div class="info-row">
          <div class="info-item"><div class="info-label">電話番号</div><div class="info-value">${customer.phone || '—'}</div></div>
          <div class="info-item"><div class="info-label">携帯番号</div><div class="info-value">${customer.mobile || '—'}</div></div>
        </div>
        ${customer.address ? `<div class="info-item"><div class="info-label">ご住所</div><div class="info-value">${customer.address}</div></div>` : ''}
        <div class="info-row">
          <div class="info-item"><div class="info-label">LINE</div><div class="info-value">${customer.line_id || '—'}</div></div>
          <div class="info-item"><div class="info-label">WEB登録</div><div class="info-value">${customer.web_registered ? '済' : '未'}</div></div>
        </div>
      </div>
    </div>`;

  // 車両ごと
  for (const v of vehicles) {
    html += `
    <div class="info-card">
      <div class="info-card-header"><span>車両: ${v.maker || ''} ${v.model || ''}</span></div>
      <div class="info-row" style="margin-bottom:8px;">
        <div class="info-item"><div class="info-label">ナンバー</div><div class="info-value-large">${v.plate_number}</div></div>
        <div class="info-item"><div class="info-label">色</div><div class="info-value">${v.color || '—'}</div></div>
      </div>`;

    // タイヤセット取得
    const tireSets = await getTireSetsByVehicle(v.id);
    if (tireSets.length > 0) {
      // タイヤセットタブ
      html += '<div class="tire-set-tabs">';
      tireSets.forEach((ts, i) => {
        const icon = ts.season_type === '冬タイヤ' ? '❄️' : '🌞';
        const statusLabel = ts.storage_periods?.find(sp => sp.status === '預かり中') ? '預かり中' : '—';
        html += `<div class="tire-set-tab ${i === 0 ? 'active' : ''}" onclick="switchTireSet(this, ${i})">${icon} ${ts.season_type}<br><span class="tire-set-status storing">${statusLabel}</span></div>`;
      });
      html += '</div>';

      // タイヤセットパネル
      tireSets.forEach((ts, i) => {
        const period = ts.storage_periods?.[0];
        html += `<div class="tire-set-panel ${i === 0 ? 'active' : ''}" id="tireSet${i}">`;
        html += `<div class="info-row" style="margin-bottom:8px;">
          <div class="info-item"><div class="info-label">保管場所No.</div><div class="info-value-large">${ts.storage_location_no || '—'}</div></div>
          <div class="info-item"><div class="info-label">料金（税別）</div><div class="info-value">${ts.fee ? '¥' + ts.fee.toLocaleString() : '—'}</div></div>
        </div>`;
        if (period) {
          html += `<div class="info-row" style="margin-bottom:8px;">
            <div class="info-item"><div class="info-label">預かり日</div><div class="info-value">${period.start_date || '—'}</div></div>
            <div class="info-item"><div class="info-label">返却予定日</div><div class="info-value">${period.planned_return_date || '—'}</div></div>
          </div>`;
        }

        // タイヤ4本
        if (ts.tires && ts.tires.length > 0) {
          html += '<div class="tire-grid">';
          const positions = ['左前', '右前', '左後', '右後'];
          positions.forEach(pos => {
            const tire = ts.tires.find(t => t.position === pos);
            if (tire) {
              const depthClass = tire.tread_depth >= 4 ? 'good' : tire.tread_depth >= 2 ? 'caution' : 'replace';
              const depthLabel = tire.tread_depth >= 4 ? '良好' : tire.tread_depth >= 2 ? '要注意' : '交換推奨';
              html += `<div class="tire-cell">
                <div class="tire-position">${pos}</div>
                ${tire.manufacturer ? `<div class="tire-maker">${tire.manufacturer}</div>` : ''}
                ${tire.pattern ? `<div class="tire-pattern">${tire.pattern}</div>` : ''}
                <div class="tire-size">${tire.size || '—'}</div>
                <div class="tire-depth">残溝 ${tire.tread_depth != null ? tire.tread_depth + 'mm' : '—'}</div>
                ${tire.tread_depth != null ? `<div class="tire-condition ${depthClass}">${depthLabel}</div>` : ''}
                ${tire.wheel_type ? `<div class="tire-wheel">${tire.wheel_type}${tire.wheel_material || ''}</div>` : ''}
              </div>`;
            }
          });
          html += '</div>';
        }

        html += '</div>';
      });
    }

    html += '</div>';
  }

  detailArea.innerHTML = html;
}
