// ===== 状態管理 =====

function getReservations() {
  return JSON.parse(sessionStorage.getItem('reservations') || '[]');
}

function setReservations(data) {
  sessionStorage.setItem('reservations', JSON.stringify(data));
}

function updateReservation(id, updates) {
  var reservations = getReservations();
  var index = reservations.findIndex(function(r) { return r.id === id; });
  if (index !== -1) {
    Object.assign(reservations[index], updates);
    setReservations(reservations);
  }
}

function addReservation(reservation) {
  var reservations = getReservations();
  reservations.push(reservation);
  setReservations(reservations);
}

// ===== 初期化 =====

function initData() {
  if (!sessionStorage.getItem('reservations')) {
    setReservations(TODAY_RESERVATIONS);
  }
}

// ===== ヘルパー =====

function getStatusLabel(status) {
  var labels = {
    reserved: '◯ 予約',
    received: '● 受付済',
    working: '● 作業中',
    completed: '✓ 完了'
  };
  return labels[status] || status;
}

function getCurrentTime() {
  var now = new Date();
  var hh = String(now.getHours()).padStart(2, '0');
  var mm = String(now.getMinutes()).padStart(2, '0');
  return hh + ':' + mm;
}

function getTodayString() {
  var now = new Date();
  var days = ['日', '月', '火', '水', '木', '金', '土'];
  return now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日（' + days[now.getDay()] + '）';
}

function showToast(message, type) {
  type = type || 'success';
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML =
    '<div class="toast-icon">' + (type === 'success' ? '✓' : '!') + '</div>' +
    '<div class="toast-message">' +
      '<div class="toast-title">' + message.title + '</div>' +
      '<div class="toast-detail">' + (message.detail || '') + '</div>' +
    '</div>';
  document.body.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 5000);
}

// ===== モーダル =====

function showModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function hideModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

// ===== モニター =====

function updateClock() {
  var clockEl = document.getElementById('clock');
  if (clockEl) {
    clockEl.textContent = getCurrentTime();
  }
}

function loadMonitorData() {
  var reservations = getReservations();

  // 上層・中層を描画
  if (document.getElementById('summary-counters')) {
    renderSummary(reservations);
  }
  if (document.getElementById('timeline-bar')) {
    renderTimeline(reservations);
  }

  // 下層：個別カードグリッド
  var grid = document.getElementById('monitor-grid');
  if (!grid) return;

  grid.innerHTML = reservations.map(function(r) {
    var timesHtml = '';
    if (r.startTime || r.endTime) {
      timesHtml = '<div class="monitor-card-times">' +
        (r.startTime || '') + (r.endTime ? '-' + r.endTime : (r.startTime ? '-' : '')) +
        '</div>';
    }
    var subName = r.customerSubName ? '<br>' + r.customerSubName : '';
    return '<div class="monitor-card status-' + r.status + '">' +
      '<div class="monitor-card-time">' + r.time + '</div>' +
      '<div class="monitor-card-customer">' + r.customerName + subName + '</div>' +
      '<div class="monitor-card-vehicle">' + (r.contractIdentifier || r.vehicleNumber) + '</div>' +
      '<div class="monitor-card-status">' + getStatusLabel(r.status) + '</div>' +
      timesHtml +
      '</div>';
  }).join('');
}

function initMonitor() {
  initData();
  loadMonitorData();
}

// ===== 上層：ステータス別カウンター =====

function renderSummary(reservations) {
  var total = reservations.length;
  var counts = {
    completed: reservations.filter(function(r) { return r.status === 'completed'; }).length,
    working: reservations.filter(function(r) { return r.status === 'working'; }).length,
    received: reservations.filter(function(r) { return r.status === 'received'; }).length,
    reserved: reservations.filter(function(r) { return r.status === 'reserved'; }).length
  };
  var completedPercent = total > 0 ? Math.round(counts.completed / total * 100) : 0;

  document.getElementById('summary-counters').innerHTML =
    '<div class="summary-counter status-completed">' +
      '<div class="summary-counter-number">' + counts.completed + '</div>' +
      '<div class="summary-counter-label">✓ 完了</div>' +
    '</div>' +
    '<div class="summary-counter status-working">' +
      '<div class="summary-counter-number">' + counts.working + '</div>' +
      '<div class="summary-counter-label">● 作業中</div>' +
    '</div>' +
    '<div class="summary-counter status-received">' +
      '<div class="summary-counter-number">' + counts.received + '</div>' +
      '<div class="summary-counter-label">● 受付済</div>' +
    '</div>' +
    '<div class="summary-counter status-reserved">' +
      '<div class="summary-counter-number">' + counts.reserved + '</div>' +
      '<div class="summary-counter-label">◯ 予約</div>' +
    '</div>';

  document.getElementById('summary-total').innerHTML =
    '合計: ' + total + '件 ／ 完了: ' + counts.completed + '件 ' +
    '<span class="summary-total-percent">(' + completedPercent + '%)</span>';
}

// ===== 中層：時系列プログレスバー =====

function renderTimeline(reservations) {
  var startHour = 8;
  var endHour = 18;
  var blockMinutes = 30;
  var totalBlocks = ((endHour - startHour) * 60) / blockMinutes;

  var blocks = [];
  for (var i = 0; i < totalBlocks; i++) {
    var hour = startHour + Math.floor(i * blockMinutes / 60);
    var min = (i * blockMinutes) % 60;

    var matched = reservations.find(function(r) {
      var parts = r.time.split(':');
      var rTotalMin = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      var blockStartMin = hour * 60 + min;
      var blockEndMin = blockStartMin + blockMinutes;
      return rTotalMin >= blockStartMin && rTotalMin < blockEndMin;
    });

    blocks.push({
      time: String(hour).padStart(2, '0') + ':' + String(min).padStart(2, '0'),
      status: matched ? matched.status : 'empty'
    });
  }

  var icons = {
    completed: '✓',
    working: '●',
    received: '●',
    reserved: '◯',
    empty: ''
  };

  document.getElementById('timeline-bar').innerHTML = blocks.map(function(b) {
    return '<div class="timeline-block status-' + b.status + '" title="' + b.time + '">' + (icons[b.status] || '') + '</div>';
  }).join('');

  // 現在時刻マーカー
  var now = new Date();
  var nowMinutes = now.getHours() * 60 + now.getMinutes();
  var startMinutes = startHour * 60;
  var endMinutes = endHour * 60;

  var nowEl = document.getElementById('timeline-now');
  if (nowMinutes >= startMinutes && nowMinutes <= endMinutes) {
    var percent = (nowMinutes - startMinutes) / (endMinutes - startMinutes) * 100;
    nowEl.style.left = 'calc(24px + (100% - 48px) * ' + percent + ' / 100)';
    nowEl.setAttribute('data-time', String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'));
    nowEl.style.display = 'block';
  } else {
    nowEl.style.display = 'none';
  }
}

// ===== ロール管理 =====

function getCurrentRole() {
  var params = new URLSearchParams(window.location.search);
  return params.get('role') || 'front';
}

function getRoleName(role) {
  var names = {
    service: 'サービススタッフ',
    front: 'フロントメンバー',
    manager: '工場長 山田',
    sales: '営業 寺嶋',
    'sales-manager': '営業部長 藤井',
    president: '社長 岡部'
  };
  return names[role] || role;
}

function getVisibleTasks(role, allReservations) {
  if (role === 'service') {
    return allReservations.filter(function(r) {
      return ['received', 'working', 'completed'].indexOf(r.status) !== -1;
    });
  }
  return allReservations;
}

// ===== ページ初期化 =====

document.addEventListener('DOMContentLoaded', function() {
  initData();

  // ヘッダーのロール名を設定
  var roleEl = document.querySelector('.user-role');
  if (roleEl) {
    roleEl.textContent = getRoleName(getCurrentRole());
  }

  // 今日の日付を設定
  var dateEls = document.querySelectorAll('.today-date');
  dateEls.forEach(function(el) {
    el.textContent = getTodayString();
  });
});
