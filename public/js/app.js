const student = JSON.parse(localStorage.getItem('student') || 'null');
if (!student) location.href = 'index.html';
else if (student.mustChangePassword) location.href = 'changepw.html';

document.getElementById('studentLabel').textContent = `${student.name} (학번 ${student.studentId})`;

let SESSIONS = [];
let PROGRESS = [];           // [{sessionNo, status, ...}]
let currentSessionNo = null;
let currentMode = 'learn';    // 'learn' | 'review'
let state = { emotion: null, intensity: 3 };

const EMOTIONS_PRE = ['기대됨', '자신있음', '편안함', '걱정됨', '당황스러움', '답답함'];
const EMOTIONS_POST = ['성취감', '즐거움', '편안함', '답답함', '짜증남', '좌절감', '포기하고싶음'];

const STATUS_INFO = {
  completed:  { label: '✅ 완료',   cls: 'st-done' },
  inprogress: { label: '⏳ 진행중', cls: 'st-prog' },
  notstarted: { label: '🔲 미시작', cls: 'st-none' }
};

function logout() {
  localStorage.removeItem('student');
  location.href = 'index.html';
}

async function loadProgress() {
  const res = await fetch('/api/progress/' + student.studentId);
  const data = await res.json();
  PROGRESS = data.progress || [];
}

function statusOf(no) {
  const p = PROGRESS.find(x => x.sessionNo === no);
  return p ? p.status : 'notstarted';
}

async function init() {
  const res = await fetch('/api/sessions');
  const data = await res.json();
  SESSIONS = data.sessions;
  await loadProgress();
  renderNav();
  renderSessionList();
}

function renderNav() {
  const nav = document.getElementById('sessionNav');
  nav.innerHTML = '';
  // 차시 목록으로 돌아가는 버튼
  const home = document.createElement('button');
  home.className = 'session-pill' + (currentSessionNo === null ? ' active' : '');
  home.textContent = '📋 차시목록';
  home.onclick = () => renderSessionList();
  nav.appendChild(home);

  SESSIONS.forEach(s => {
    const st = statusOf(s.no);
    const pill = document.createElement('button');
    pill.className = 'session-pill' + (s.no === currentSessionNo ? ' active' : '') + (st === 'completed' ? ' done' : '');
    pill.textContent = `${s.no}차시`;
    pill.onclick = () => {
      const mode = statusOf(s.no) === 'completed' ? 'review' : 'learn';
      enterSession(s.no, mode);
    };
    nav.appendChild(pill);
  });
}

async function renderSessionList() {
  currentSessionNo = null;
  currentMode = 'learn';
  window.__currentSessionNo = null;
  await loadProgress();
  renderNav();
  document.getElementById('sessionLabel').textContent = '차시를 선택하세요';

  const completedCount = PROGRESS.filter(p => p.status === 'completed').length;
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="card">
      <h3>📚 나의 학습 차시</h3>
      <p class="muted">전체 ${SESSIONS.length}차시 중 <strong>${completedCount}차시</strong> 완료 · 차시를 눌러 학습하거나 복습하세요.</p>
      <div class="progress-bar"><div class="progress-fill" style="width:${(completedCount/SESSIONS.length*100).toFixed(0)}%"></div></div>
    </div>
    <div class="session-list">
      ${SESSIONS.map(s => {
        const st = statusOf(s.no);
        const info = STATUS_INFO[st];
        const isDone = st === 'completed';
        return `
        <div class="session-item ${info.cls}">
          <div class="session-item-head">
            <span class="badge">${s.no}차시</span>
            <span class="status-chip ${info.cls}">${info.label}</span>
          </div>
          <h4>${s.title}</h4>
          <p class="muted">${s.goal}</p>
          <div class="btn-row">
            ${isDone
              ? `<button class="btn btn-success" onclick="enterSession(${s.no}, 'review')">🔁 복습하기</button>
                 <button class="btn btn-outline" onclick="enterSession(${s.no}, 'learn')">다시 학습</button>`
              : `<button class="btn btn-primary" onclick="enterSession(${s.no}, 'learn')">▶ 학습 시작</button>`}
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
  window.scrollTo(0, 0);
}

function enterSession(no, mode) {
  currentSessionNo = no;
  currentMode = mode || 'learn';
  window.__currentSessionNo = no; // 챗봇이 현재 차시 맥락을 알 수 있도록 노출
  localStorage.setItem('lastSession_' + student.studentId, no);
  renderNav();
  renderSession(no);
}

async function renderSession(no) {
  const session = SESSIONS.find(s => s.no === no);
  const reviewing = currentMode === 'review';
  document.getElementById('sessionLabel').textContent = `${no}차시 · ${session.title}${reviewing ? ' · 🔁 복습 모드' : ''}`;
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="btn-row" style="margin-bottom:12px;">
      <button class="btn btn-outline" onclick="renderSessionList()">← 차시 목록으로</button>
    </div>
    ${reviewing ? `<div class="review-banner">🔁 <strong>복습 모드</strong>입니다. 이번 감정 기록은 <strong>복습 회차(1차, 2차 …)</strong>로 자동 저장되며, 처음 학습 완료 기록은 그대로 유지됩니다.</div>` : ''}
    <div class="card">
      <span class="badge">${no}차시</span>
      <h3>${session.title}</h3>
      <p class="muted">${session.standard}</p>
      <p><strong>학습목표:</strong> ${session.goal}</p>
    </div>

    <div class="card" id="preEmotionCard">
      <h3>1️⃣ 학습 전 정서 체크</h3>
      <p class="muted">오늘 학습을 시작하기 전, 지금 느끼는 감정을 선택해주세요.</p>
      <div class="emotion-grid" id="preEmotionGrid"></div>
      <div class="intensity-row">
        <span class="muted">약하게</span>
        <input type="range" id="preIntensity" min="1" max="5" value="3">
        <span class="muted">강하게</span>
      </div>
      <textarea id="preNote" placeholder="오늘 학습에 대한 기대나 걱정을 자유롭게 적어보세요."></textarea>
      <div class="btn-row"><button class="btn btn-primary" onclick="submitEmotion('pre')">정서 체크 저장</button></div>
    </div>

    <div class="card">
      <h3>2️⃣ 핵심 개념 + 예시 코드</h3>
      <p>${session.concept}</p>
      <label>예시 코드</label>
      <pre class="example">${escapeHtml(session.example)}</pre>
    </div>

    <div class="card">
      <h3>3️⃣ 코딩 실습 (직접 실행해보기)</h3>
      <div class="problem-box">
        <div class="problem-label">📌 문제 상황</div>
        <p>${session.task}</p>
      </div>
      <label>아래 코드는 일부가 이미 작성되어 있어요. <code>TODO</code> 표시가 있는 빈 부분(<code>?</code>)을 직접 채워 문제를 해결하고 ▶ 실행하기를 눌러보세요.</label>
      <textarea id="codeArea">${escapeHtml(session.taskTemplate)}</textarea>
      <div class="btn-row">
        <button class="btn btn-primary" onclick="runCode()">▶ 실행하기</button>
        <button class="btn btn-outline" onclick="saveActivity('code')">코드 저장</button>
      </div>
      <div id="runResult" class="run-result"></div>
    </div>

    <div class="card">
      <h3>4️⃣ 오류/어려움에 대한 정서 지원 받기</h3>
      <p class="muted">실행 결과에서 오류가 있었다면 내용이 자동으로 채워져요. 그때 느낀 감정도 함께 선택해주세요.</p>
      <textarea id="errorNote" placeholder="예) SyntaxError가 났는데 어디가 잘못된지 모르겠어요. 답답해요."></textarea>
      <label>지금 느끼는 감정</label>
      <div class="emotion-grid" id="errorEmotionGrid"></div>
      <div class="btn-row"><button class="btn btn-primary" onclick="requestFeedback()">AI 정서지원 피드백 받기</button></div>
    </div>

    <div class="card" id="feedbackCard" style="display:none;">
      <h3>5️⃣ AI 피드백 확인</h3>
      <div class="feedback-box" id="feedbackBox"></div>
    </div>

    <div class="card">
      <h3>6️⃣ 코드 수정 및 재도전</h3>
      <p class="muted">피드백을 반영하여 코드를 수정하고 최종본을 저장하세요.</p>
      <textarea id="finalCodeArea"></textarea>
      <div class="btn-row">
        <button class="btn btn-primary" onclick="runFinalCode()">▶ 다시 실행해보기</button>
        <button class="btn btn-success" onclick="saveActivity('final')">최종 코드 저장</button>
      </div>
      <div id="finalRunResult" class="run-result"></div>
    </div>

    <div class="card">
      <h3>7️⃣ 성찰 및 학습 후 정서 체크</h3>
      <textarea id="reflectionArea" placeholder="오늘 학습 과정, 오류 수정 과정, 느낀 점을 적어보세요."></textarea>
      <div class="btn-row"><button class="btn btn-outline" onclick="saveReflection()">성찰 저장</button></div>

      <hr style="margin:16px 0; border:none; border-top:1px solid #eee;">
      <p class="muted">학습을 마친 지금, 느끼는 감정을 선택해주세요.</p>
      <div class="emotion-grid" id="postEmotionGrid"></div>
      <div class="intensity-row">
        <span class="muted">약하게</span>
        <input type="range" id="postIntensity" min="1" max="5" value="3">
        <span class="muted">강하게</span>
      </div>
      <div class="btn-row"><button class="btn btn-primary" onclick="submitEmotion('post')">학습 후 정서 저장 · 차시 완료</button></div>
    </div>
  `;

  buildEmotionGrid('preEmotionGrid', EMOTIONS_PRE, 'pre');
  buildEmotionGrid('errorEmotionGrid', EMOTIONS_POST, 'error');
  buildEmotionGrid('postEmotionGrid', EMOTIONS_POST, 'post');
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const emotionSelections = { pre: null, error: null, post: null };

function buildEmotionGrid(containerId, emotions, key) {
  const grid = document.getElementById(containerId);
  grid.innerHTML = '';
  emotions.forEach(em => {
    const btn = document.createElement('button');
    btn.className = 'emotion-btn';
    btn.textContent = em;
    btn.onclick = () => {
      grid.querySelectorAll('.emotion-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      emotionSelections[key] = em;
    };
    grid.appendChild(btn);
  });
}

async function submitEmotion(phase) {
  const emotion = emotionSelections[phase];
  if (!emotion) { alert('감정을 선택해주세요.'); return; }
  const intensity = phase === 'pre'
    ? document.getElementById('preIntensity').value
    : document.getElementById('postIntensity').value;
  const note = phase === 'pre' ? document.getElementById('preNote').value : '';
  const reviewing = currentMode === 'review';
  const resp = await fetch('/api/emotion', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      studentId: student.studentId, sessionNo: currentSessionNo, phase, emotion, intensity, note,
      mode: reviewing ? 'review' : 'learn'
    })
  });
  const saved = (await resp.json()).record || {};
  const roundLabel = saved.reviewLabel || '복습';

  if (phase === 'pre') {
    alert(reviewing ? `복습 전 정서(${roundLabel})가 저장되었습니다.` : '학습 전 정서가 저장되었습니다.');
    return;
  }
  // 학습/복습 후 정서 저장 완료
  if (reviewing) {
    alert(`복습 후 정서(${roundLabel})가 저장되었습니다. 복습을 마쳤어요! 🔁`);
  } else {
    alert('학습 후 정서가 저장되었습니다. 이 차시를 완료했어요! 🎉');
  }
  await renderSessionList();
}

async function runCode() {
  const code = document.getElementById('codeArea').value;
  const outEl = document.getElementById('runResult');
  const result = await runStudentCode(code, outEl);
  if (result && result.success === false) {
    const noteText = `[자동 감지된 오류]\n${result.lineNo ? result.lineNo + '번째 줄: ' : ''}${result.codeLine || ''}\n오류 종류: ${result.errorTitle}\n\n[원본 오류 메시지]\n${result.rawTraceback || result.rawError}`;
    document.getElementById('errorNote').value = noteText;
  }
}

async function runFinalCode() {
  const code = document.getElementById('finalCodeArea').value;
  const outEl = document.getElementById('finalRunResult');
  await runStudentCode(code, outEl);
}

async function saveActivity(type) {
  const content = type === 'code'
    ? document.getElementById('codeArea').value
    : document.getElementById('finalCodeArea').value;
  await fetch('/api/activity', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ studentId: student.studentId, sessionNo: currentSessionNo, type, content })
  });
  alert('저장되었습니다.');
}

async function requestFeedback() {
  const errorNote = document.getElementById('errorNote').value;
  const emotion = emotionSelections.error || '답답함';
  const code = document.getElementById('codeArea').value;

  // 오류 기록을 활동으로도 저장
  await fetch('/api/activity', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ studentId: student.studentId, sessionNo: currentSessionNo, type: 'error', content: errorNote })
  });

  const res = await fetch('/api/feedback', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ studentId: student.studentId, sessionNo: currentSessionNo, emotion, intensity: 3, errorNote, code })
  });
  const data = await res.json();
  document.getElementById('feedbackCard').style.display = '';
  document.getElementById('feedbackBox').textContent = data.feedback.feedbackText;
  document.getElementById('finalCodeArea').value = code;
  document.getElementById('feedbackCard').scrollIntoView({ behavior: 'smooth' });
}

async function saveReflection() {
  const content = document.getElementById('reflectionArea').value;
  await fetch('/api/reflection', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ studentId: student.studentId, sessionNo: currentSessionNo, content })
  });
  alert('성찰이 저장되었습니다.');
}

init();
