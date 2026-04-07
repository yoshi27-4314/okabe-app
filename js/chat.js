/* ===== チャットBot ===== */

// Edge Function経由でチャット
async function sendChatToEdgeFunction(message) {
  const res = await fetch(SUPABASE_URL + '/functions/v1/tire-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ message }),
  });
  const data = await res.json();
  return data;
}

// テキスト送信
async function sendChatMessage() {
  const input = document.querySelector('.chat-input');
  const message = input.value.trim();
  if (!message) return;

  const chatMessages = document.querySelector('.chat-messages');

  // ユーザーバブル
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user';
  userBubble.textContent = message;
  chatMessages.appendChild(userBubble);
  input.value = '';

  // ローディング
  const loadingBubble = document.createElement('div');
  loadingBubble.className = 'chat-bubble bot';
  loadingBubble.innerHTML = '<span style="opacity:0.5;">考え中...</span>';
  chatMessages.appendChild(loadingBubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const data = await sendChatToEdgeFunction(message);
    if (data.error) {
      loadingBubble.innerHTML = 'エラー: ' + data.error;
    } else if (data.result?.answer) {
      loadingBubble.innerHTML = data.result.answer.replace(/\n/g, '<br>');
    } else if (data.answer) {
      loadingBubble.innerHTML = data.answer.replace(/\n/g, '<br>');
    } else {
      loadingBubble.innerHTML = '回答を取得できませんでした。';
    }
  } catch (err) {
    console.error('Chat error:', err);
    loadingBubble.innerHTML = '通信エラーが発生しました。もう一度お試しください。';
  }

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Enterキーで送信
document.addEventListener('DOMContentLoaded', function() {
  const chatInput = document.querySelector('.chat-input');
  if (chatInput) {
    chatInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }

  const sendBtn = document.querySelector('.chat-send-btn');
  if (sendBtn) {
    sendBtn.addEventListener('click', sendChatMessage);
  }
});
