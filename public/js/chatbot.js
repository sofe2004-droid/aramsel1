// 코딩 도우미 챗봇 UI 로직
(function () {
  function getStudentId() {
    const s = JSON.parse(localStorage.getItem('student') || 'null');
    return s ? s.studentId : '';
  }

  function appendBubble(text, role, blocked) {
    const box = document.getElementById('chatMessages');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}` + (blocked ? ' blocked' : '');
    bubble.textContent = text;
    box.appendChild(bubble);
    box.scrollTop = box.scrollHeight;
  }

  async function sendChat() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;
    appendBubble(message, 'user');
    input.value = '';

    const res = await fetch('/api/chatbot', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: getStudentId(), message })
    });
    const data = await res.json();
    appendBubble(data.answer, 'bot', data.blocked);
  }

  document.addEventListener('DOMContentLoaded', () => {
    appendBubble('안녕! 나는 파이썬 학습을 도와주는 코딩 도우미야. 변수, 조건문, 반복문, 오류 해결 등 수업과 관련된 질문을 자유롭게 물어봐줘 🌷', 'bot');

    document.getElementById('chatSendBtn').onclick = sendChat;
    document.getElementById('chatInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });

    const toggleBtn = document.getElementById('chatToggleBtn');
    const panel = document.getElementById('chatPanel');
    if (toggleBtn) {
      toggleBtn.onclick = () => {
        panel.classList.toggle('open');
        toggleBtn.textContent = panel.classList.contains('open') ? '✕ 닫기' : '🤖 도우미';
      };
    }
  });
})();
