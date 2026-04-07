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
    register: 'registerScreen',
    storage: 'storageScreen',
    search: 'searchScreen',
    chat: 'chatScreen',
    terms: 'termsScreen'
  };

  if (screenMap[tab]) {
    document.getElementById(screenMap[tab]).classList.add('active');
    if (tab === 'chat' && chatInput) {
      chatInput.style.display = 'flex';
    }
    if (tab === 'work') {
      loadWorks('today');
    }
    if (tab === 'storage') {
      loadStorage('all');
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

// ページ読み込み時にURLパラメータからタブを開く
document.addEventListener('DOMContentLoaded', function() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  if (tab) {
    switchTab(tab);
  }
});

// ============================================
// 預かり台帳
// ============================================

let currentStorageFilter = 'all';

async function loadStorage(filter) {
  currentStorageFilter = filter || 'all';
  const list = document.getElementById('storageList');
  if (!list) return;
  list.innerHTML = '<div style="padding:40px;text-align:center;color:var(--sub);">読み込み中...</div>';

  let query = db.from('storage_periods')
    .select('*, tire_sets(*, vehicles(*, customers(*)), tires(*))')
    .order('start_date', { ascending: false });

  if (filter === 'storing') query = query.eq('status', '預かり中');
  else if (filter === 'overdue') query = query.eq('status', '期限超過');
  else if (filter === 'returned') query = query.eq('status', '返却済');

  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    list.innerHTML = '<div style="padding:40px;text-align:center;color:var(--sub);font-size:14px;">データがありません</div>';
    return;
  }

  // 期限超過チェック（自動更新）
  const today = new Date().toISOString().split('T')[0];
  for (const sp of data) {
    if (sp.status === '預かり中' && sp.planned_return_date && sp.planned_return_date < today) {
      sp.status = '期限超過';
      await db.from('storage_periods').update({ status: '期限超過' }).eq('id', sp.id);
    }
  }

  let html = '';
  data.forEach(sp => {
    const ts = sp.tire_sets;
    const v = ts?.vehicles;
    const c = v?.customers;
    const isIndividual = c?.type === '個人';

    const statusColors = { '預かり中': 'blue', '期限超過': 'red', '返却済': 'green' };
    const color = statusColors[sp.status] || 'blue';
    const icon = ts?.season_type === '冬タイヤ' ? '❄️' : '🌞';

    html += `<div class="work-card" style="border-left-color:var(--${color === 'red' ? 'danger' : color === 'green' ? 'success' : 'info'});" onclick="showCustomerDetail('${c?.id}')">
      <div class="work-card-top">
        <span class="preview-badge ${color}">${sp.status}</span>
        <span class="work-time">${ts?.storage_location_no || '—'}</span>
      </div>
      <div class="work-customer">${c?.name || '不明'}${isIndividual ? ' 様' : ''}</div>
      <div class="work-vehicle">${v?.maker || ''} ${v?.model || ''} ・ ${v?.plate_number || ''}</div>
      <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;">
        <span class="work-type">${icon} ${ts?.season_type || ''}</span>
        <span style="font-size:12px;color:var(--sub);">${sp.start_date || ''} 〜 ${sp.planned_return_date || ''}</span>
      </div>
      ${ts?.fee ? `<div style="font-size:13px;font-weight:600;margin-top:4px;">¥${ts.fee.toLocaleString()}</div>` : ''}
    </div>`;
  });

  list.innerHTML = html;
}

function selectStorageFilter(el, filter) {
  el.parentElement.querySelectorAll('.date-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  loadStorage(filter);
}

// ============================================
// 作業一覧の実データ読み込み
// ============================================

async function loadWorks(dateFilter) {
  const workList = document.getElementById('workList');
  if (!workList) return;

  workList.innerHTML = '<div style="padding:40px;text-align:center;color:var(--sub);">読み込み中...</div>';

  let date;
  if (dateFilter === 'tomorrow') {
    const d = new Date(); d.setDate(d.getDate() + 1);
    date = d.toISOString().split('T')[0];
  } else if (dateFilter === 'week') {
    date = null; // 今週分は別処理
  } else {
    date = new Date().toISOString().split('T')[0];
  }

  let works;
  if (date) {
    works = await getWorksByDate(date);
  } else {
    // 今週分
    const today = new Date();
    const sun = new Date(today); sun.setDate(today.getDate() - today.getDay());
    const sat = new Date(today); sat.setDate(today.getDate() + (6 - today.getDay()));
    const { data, error } = await db.from('works')
      .select('*, vehicles(*, customers(*)), tire_sets(*, tires(*))')
      .gte('scheduled_date', sun.toISOString().split('T')[0])
      .lte('scheduled_date', sat.toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true });
    works = data || [];
  }

  if (works.length === 0) {
    workList.innerHTML = '<div style="padding:40px;text-align:center;color:var(--sub);font-size:14px;">作業データがありません</div>';
    return;
  }

  // ステータスでグループ分け
  const groups = { '作業中': [], '受付': [], '予約': [], '完了': [], 'キャンセル': [] };
  works.forEach(w => {
    if (groups[w.status]) groups[w.status].push(w);
  });

  // サマリー更新
  const reserved = groups['予約'].length + groups['受付'].length;
  const working = groups['作業中'].length;
  const done = groups['完了'].length;
  updateSummary(reserved, working, done);

  let html = '';

  // カメラバナー
  html += `<div class="camera-banner" onclick="alert('カメラ起動 → ナンバー読取')">
    <div class="camera-banner-icon">📷</div>
    <div>
      <div class="camera-banner-text">ナンバー読取で作業を開始</div>
      <div class="camera-banner-sub">ナンバープレートを撮影 → 顧客・作業を自動表示</div>
    </div>
  </div>`;

  const statusConfig = {
    '作業中': { class: 'working', css: 'status-working', btnClass: 'complete', btnText: '✅ 完了', nextStatus: '完了' },
    '受付': { class: 'accepted', css: 'status-accepted', btnClass: 'start', btnText: '🔧 開始', nextStatus: '作業中' },
    '予約': { class: 'reserved', css: 'status-reserved', btnClass: 'accept', btnText: '📋 受付', nextStatus: '受付' },
    '完了': { class: 'done', css: 'status-done' },
    'キャンセル': { class: 'cancelled', css: 'status-done' }
  };

  for (const [status, items] of Object.entries(groups)) {
    if (items.length === 0) continue;
    const cfg = statusConfig[status];
    html += `<div class="section-title">${status}</div>`;

    items.forEach(w => {
      const customerName = w.vehicles?.customers?.name || '不明';
      const vehicle = w.vehicles;
      const vehicleInfo = vehicle ? `${vehicle.maker || ''} ${vehicle.model || ''} ・ ${vehicle.plate_number}` : '';
      const isIndividual = w.vehicles?.customers?.type === '個人';

      html += `<div class="work-card ${cfg.css}" onclick="openWorkDetail('${w.id}')" ${status === '完了' ? 'style="opacity:0.7"' : ''}>
        <div class="work-card-top">
          <span class="work-status ${cfg.class}">${status}</span>
          <span class="work-time">${w.completed_date ? w.scheduled_date + ' → ' + w.completed_date : w.scheduled_date || ''}</span>
        </div>
        <div class="work-customer">${customerName}${isIndividual ? ' 様' : ''}</div>
        <div class="work-vehicle">${vehicleInfo}</div>
        <div class="work-type">${w.type}${w.memo ? ' ・ ' + w.memo : ''}</div>`;

      if (cfg.btnClass) {
        html += `<div class="work-action">
          <button class="work-action-btn ${cfg.btnClass}" onclick="event.stopPropagation(); updateWork('${w.id}', '${cfg.nextStatus}')">
            ${cfg.btnText}
          </button>
        </div>`;
      }

      html += `</div>`;
    });
  }

  workList.innerHTML = html;
}

function updateSummary(reserved, working, done) {
  const els = document.querySelectorAll('.summary-count');
  if (els.length >= 3) {
    els[0].textContent = reserved;
    els[1].textContent = working;
    els[2].textContent = done;
  }
}

async function updateWork(workId, newStatus) {
  await updateWorkStatus(workId, newStatus);
  loadWorks('today');
}

async function openWorkDetail(workId) {
  document.getElementById('detailModal').classList.add('active');
  const modalBody = document.querySelector('#detailModal .modal-body');
  modalBody.innerHTML = '<div style="padding:40px;text-align:center;color:var(--sub);">読み込み中...</div>';

  // 作業データ取得
  const { data: work, error } = await db.from('works')
    .select('*, vehicles(*, customers(*)), tire_sets(*, tires(*), storage_periods(*))')
    .eq('id', workId)
    .single();

  if (error || !work) {
    modalBody.innerHTML = '<div style="padding:40px;text-align:center;color:var(--danger);">データ取得に失敗しました</div>';
    return;
  }

  const customer = work.vehicles?.customers;
  const vehicle = work.vehicles;
  const tireSet = work.tire_sets;
  const isIndividual = customer?.type === '個人';

  let html = '';

  // 顧客・車両
  html += `<div class="detail-section">
    <div class="detail-customer">${customer?.name || '不明'}${isIndividual ? ' 様' : ''}</div>
    <div class="detail-vehicle">${vehicle?.maker || ''} ${vehicle?.model || ''} ・ ${vehicle?.plate_number || ''}</div>
    <div style="margin-top:6px;">
      <span style="font-size:12px;color:var(--accent);cursor:pointer;font-weight:600;" onclick="closeDetail(); showCustomerDetail('${customer?.id}');">顧客情報を見る →</span>
    </div>
  </div>`;

  // 作業内容
  html += `<div class="detail-section">
    <div class="detail-label">作業内容 <span class="help-icon" onclick="toggleHelp(this)">?</span></div>
    <div class="help-tooltip">履き替え作業の手順: 1.ジャッキアップ 2.タイヤ取外し 3.保管タイヤ取付 4.トルク確認 5.空気圧調整</div>
    <div class="detail-value">${work.type}${work.memo ? ' ・ ' + work.memo : ''}</div>
  </div>`;

  // 予定・保管場所
  html += `<div class="info-row" style="margin-bottom:16px;">
    <div class="detail-section"><div class="detail-label">予定日</div><div class="detail-value">${work.scheduled_date || '—'}</div></div>
    <div class="detail-section"><div class="detail-label">保管場所</div><div class="detail-value">${tireSet?.storage_location_no || '—'}</div></div>
    <div class="detail-section"><div class="detail-label">ステータス</div><div class="detail-value">${work.status}</div></div>
  </div>`;

  // タイヤ情報
  if (tireSet?.tires && tireSet.tires.length > 0) {
    html += `<div class="detail-section">
      <div class="detail-label">タイヤ状態 <span class="help-icon" onclick="toggleHelp(this)">?</span></div>
      <div class="help-tooltip">残溝の判定基準:<br>🟢 良好 = 4mm以上<br>🟡 要注意 = 2〜4mm<br>🔴 交換推奨 = 2mm未満<br>⛔ 使用不可 = 1.6mm未満（法定基準）</div>
      <div class="tire-grid">`;

    const positions = ['左前', '右前', '左後', '右後'];
    positions.forEach(pos => {
      const tire = tireSet.tires.find(t => t.position === pos);
      if (tire) {
        const depthClass = tire.tread_depth >= 4 ? 'good' : tire.tread_depth >= 2 ? 'caution' : 'replace';
        const depthLabel = tire.tread_depth >= 4 ? '良好' : tire.tread_depth >= 2 ? '要注意' : '交換推奨';
        html += `<div class="tire-cell">
          <button class="tire-camera-btn" onclick="event.stopPropagation(); scanTireInfo('${pos}')">📷</button>
          <div class="tire-position">${pos}</div>
          ${tire.manufacturer ? `<div class="tire-maker">${tire.manufacturer}</div>` : ''}
          <div class="tire-size">${tire.size || '—'}</div>
          <div class="tire-depth">残溝 ${tire.tread_depth != null ? tire.tread_depth + 'mm' : '—'}</div>
          ${tire.tread_depth != null ? `<div class="tire-condition ${depthClass}">${depthLabel}</div>` : ''}
        </div>`;
      }
    });

    html += `</div></div>`;
  }

  // メモ
  if (work.memo) {
    html += `<div class="detail-section"><div class="detail-label">メモ</div><div class="memo-box">${work.memo}</div></div>`;
  }

  // ステータス変更ボタン
  html += '<div class="status-actions">';
  if (work.status === '予約') {
    html += `<button class="status-btn primary" onclick="updateWork('${work.id}','受付'); closeDetail();">📋 受付</button>`;
  }
  if (work.status === '予約' || work.status === '受付') {
    html += `<button class="status-btn primary" onclick="updateWork('${work.id}','作業中'); closeDetail();">🔧 作業開始</button>`;
  }
  if (work.status !== '完了' && work.status !== 'キャンセル') {
    html += `<button class="status-btn success" onclick="updateWork('${work.id}','完了'); closeDetail();">✅ 作業完了</button>`;
  }
  html += `<button class="status-btn secondary" onclick="closeDetail()">戻る</button>`;
  html += '</div>';

  modalBody.innerHTML = html;
}

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
