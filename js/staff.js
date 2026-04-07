/* ===== スタッフ画面JavaScript ===== */

// タブ切替
function switchTab(tab) {
  document.querySelectorAll('.screen').forEach(el => {
    el.classList.remove('active');
  });
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelector('.chat-input-area').style.display = 'none';

  const screens = {
    work: { screen: 'workScreen', nav: 'navWork' },
    search: { screen: 'searchScreen', nav: 'navSearch' },
    chat: { screen: 'chatScreen', nav: 'navChat' },
    terms: { screen: 'termsScreen', nav: 'navTerms' }
  };

  if (screens[tab]) {
    document.getElementById(screens[tab].screen).classList.add('active');
    document.getElementById(screens[tab].nav).classList.add('active');
    if (tab === 'chat') {
      document.querySelector('.chat-input-area').style.display = 'flex';
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

// モーダル外クリックで閉じる
document.getElementById('detailModal').addEventListener('click', function(e) {
  if (e.target === this) closeDetail();
});

// 初期表示
document.querySelector('.chat-input-area').style.display = 'none';
