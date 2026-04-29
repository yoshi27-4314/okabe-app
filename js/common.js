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
