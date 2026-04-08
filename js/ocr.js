/* ===== OCR・カメラ機能 ===== */

const OCR_ENDPOINT = SUPABASE_URL + '/functions/v1/tire-ocr';

// 撮影/ファイル選択モーダルを表示
function openCamera(mode, callback) {
  showImagePickerModal(mode, callback);
}

// 画像取り込みモーダル
function showImagePickerModal(mode, callback) {
  const labels = {
    plate_number: 'ナンバープレート',
    tire_info: 'タイヤ情報',
    tread_depth: '残溝測定',
    tire_chat: 'タイヤ画像',
    shaken: '車検証',
    delivery_slip: '納品書',
    delivery_tire: '納品タイヤ',
  };
  const label = labels[mode] || '画像';

  const el = document.createElement('div');
  el.id = 'imagePickerModal';
  el.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:998;';
  el.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:24px;width:calc(100% - 48px);max-width:340px;text-align:center;">
      <div style="font-size:15px;font-weight:700;margin-bottom:20px;">${label}を取り込む</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button onclick="pickImage('camera','${mode}')" style="
          padding:16px;border-radius:12px;border:none;background:var(--accent);color:#fff;
          font-size:15px;font-weight:700;font-family:inherit;cursor:pointer;
          display:flex;align-items:center;justify-content:center;gap:8px;
          box-shadow:0 2px 8px rgba(37,99,235,0.3);">
          <span style="font-size:20px;">📸</span> カメラで撮影
        </button>
        <button onclick="pickImage('file','${mode}')" style="
          padding:16px;border-radius:12px;border:1.5px solid var(--border);background:#fff;color:var(--text);
          font-size:15px;font-weight:700;font-family:inherit;cursor:pointer;
          display:flex;align-items:center;justify-content:center;gap:8px;">
          <span style="font-size:20px;">📁</span> ファイルから選択
        </button>
      </div>
      <button onclick="closeImagePickerModal()" style="
        margin-top:14px;padding:10px;border:none;background:none;
        color:var(--sub);font-size:13px;font-family:inherit;cursor:pointer;">
        キャンセル
      </button>
    </div>`;
  document.body.appendChild(el);

  // グローバルにcallbackを保持
  window._ocrCallback = callback;
}

function closeImagePickerModal() {
  const el = document.getElementById('imagePickerModal');
  if (el) el.remove();
}

function pickImage(source, mode) {
  closeImagePickerModal();

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  if (source === 'camera') {
    input.capture = 'environment';
  }

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    showOcrLoading(mode);
    const base64 = await fileToBase64(file);
    const result = await callOcr(base64, mode);
    hideOcrLoading();

    if (window._ocrCallback) window._ocrCallback(result);
  };
  input.click();
}

// ファイル→Base64変換
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// OCR API呼び出し
async function callOcr(base64Image, mode) {
  try {
    const res = await fetch(OCR_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ image: base64Image, mode: mode }),
    });
    const data = await res.json();
    if (data.error) {
      alert('読み取りエラー: ' + data.error);
      return null;
    }
    return data.result;
  } catch (err) {
    console.error('OCR error:', err);
    alert('通信エラーが発生しました。もう一度お試しください。');
    return null;
  }
}

// ===== ナンバー読取 =====
function scanPlateNumber() {
  openCamera('plate_number', async (result) => {
    if (!result) return;

    const vehicles = await searchVehicleByPlate(result.plate_number);
    if (vehicles.length > 0) {
      const v = vehicles[0];
      const customerName = v.customers?.name || '不明';
      alert(`車両が見つかりました\n\n${customerName}\n${v.maker} ${v.model}\n${v.plate_number}`);
      showCustomerDetail(v.customer_id);
    } else {
      alert(`ナンバー: ${result.plate_number}\n\n該当する車両が登録されていません。新規登録しますか？`);
    }
  });
}

// ===== タイヤ情報読取 =====
function scanTireInfo(position) {
  openCamera('tire_info', (result) => {
    if (!result) return;
    const info = `メーカー: ${result.manufacturer || '—'}\nパターン: ${result.pattern || '—'}\nサイズ: ${result.size || '—'}`;
    alert(`タイヤ情報読取結果（${position}）\n\n${info}\n\n確度: ${result.confidence}`);
  });
}

// ===== 残溝読取 =====
function scanTreadDepth(position) {
  openCamera('tread_depth', (result) => {
    if (!result) return;
    const conditionEmoji = {
      '良好': '🟢', '要注意': '🟡', '交換推奨': '🔴', '使用不可': '⛔'
    };
    const emoji = conditionEmoji[result.condition] || '';
    let info = `残溝: ${result.tread_depth_mm}mm\n判定: ${emoji} ${result.condition}\n理由: ${result.condition_reason || ''}`;
    if (result.crack_visible) info += '\n⚠ ひび割れあり';
    if (result.wear_pattern && result.wear_pattern !== '均一' && result.wear_pattern !== '不明') {
      info += `\n⚠ ${result.wear_pattern}`;
    }
    alert(`残溝読取結果（${position}）\n\n${info}\n\n確度: ${result.confidence}`);
  });
}

// ===== 車検証読取 =====
function scanShaken(callback) {
  openCamera('shaken', (result) => {
    if (!result) return;
    if (callback) callback(result);
  });
}

// ===== チャットBot画像送信 =====
function sendChatImage() {
  openCamera('tire_chat', (result) => {
    if (!result) return;

    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
      const userBubble = document.createElement('div');
      userBubble.className = 'chat-bubble user';
      userBubble.textContent = '画像を送信しました';
      chatMessages.appendChild(userBubble);

      const botBubble = document.createElement('div');
      botBubble.className = 'chat-bubble bot';
      let html = result.answer || '分析結果を取得できませんでした。';
      if (result.action_needed === 'yes') {
        html += `<br><br>⚠ <b>管理者への報告が必要です</b><br>${result.action_reason || ''}`;
      }
      botBubble.innerHTML = html;
      chatMessages.appendChild(botBubble);

      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  });
}

// ===== ローディング表示 =====
function showOcrLoading(mode) {
  const labels = {
    plate_number: 'ナンバーを読み取り中...',
    tire_info: 'タイヤ情報を読み取り中...',
    tread_depth: '残溝を測定中...',
    tire_chat: '画像を分析中...',
    shaken: '車検証を読み取り中...',
    delivery_slip: '納品書を読み取り中...',
    delivery_tire: 'タイヤ情報を読み取り中...',
  };
  const el = document.createElement('div');
  el.id = 'ocrLoading';
  el.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:999;';
  el.innerHTML = `<div style="background:#fff;padding:24px 32px;border-radius:12px;text-align:center;">
    <div style="font-size:24px;margin-bottom:8px;">📷</div>
    <div style="font-size:14px;font-weight:700;">${labels[mode] || '処理中...'}</div>
  </div>`;
  document.body.appendChild(el);
}

function hideOcrLoading() {
  const el = document.getElementById('ocrLoading');
  if (el) el.remove();
}
