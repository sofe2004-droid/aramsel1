const NEGATIVE = ['답답함', '짜증남', '좌절감', '포기하고싶음', '당황스러움', '걱정됨'];

async function loadAlerts() {
  const res = await fetch('/api/teacher/alerts');
  const data = await res.json();
  const box = document.getElementById('alerts');
  if (data.alerts.length === 0) {
    box.innerHTML = '<p class="muted">현재 강한 부정 정서 신호가 없습니다.</p>';
    return;
  }
  box.innerHTML = data.alerts.map(a => `
    <div class="alert-item">
      <strong>${a.studentId} ${a.studentName}</strong> · ${a.sessionNo}차시 ·
      <strong>${a.emotion}</strong> (강도 ${a.intensity}) ·
      <span class="muted">${new Date(a.createdAt).toLocaleString('ko-KR')}</span>
      ${a.note ? `<div>"${a.note}"</div>` : ''}
    </div>
  `).join('');
}

function cellClass(sessInfo) {
  if (!sessInfo) return 'none';
  if (sessInfo.lastEmotion && NEGATIVE.includes(sessInfo.lastEmotion.emotion) && sessInfo.lastEmotion.intensity >= 4) return 'bad';
  if (sessInfo.steps.includes('emotion_post')) return 'ok';
  if (sessInfo.steps.length > 0) return 'warn';
  return 'none';
}

async function loadOverview() {
  const res = await fetch('/api/teacher/overview');
  const data = await res.json();
  const table = document.getElementById('overviewTable');
  let head = '<tr><th>학번</th><th>이름</th>' + [1,2,3,4,5,6,7].map(n => `<th>${n}차시</th>`).join('') + '</tr>';
  let rows = data.overview.map(st => {
    const cells = [1,2,3,4,5,6,7].map(n => {
      const sess = st.sessions.find(s => s.sessionNo === n);
      const cls = cellClass(sess);
      const rc = sess && sess.reviewCount ? `<span class="review-count" title="복습 ${sess.reviewCount}회">🔁${sess.reviewCount}</span>` : '';
      return `<td><span class="dot ${cls}"></span>${rc}</td>`;
    }).join('');
    return `<tr style="cursor:pointer" onclick="showDetail('${st.studentId}')"><td>${st.studentId}</td><td>${st.name}</td>${cells}</tr>`;
  }).join('');
  table.innerHTML = head + rows;
}

async function showDetail(studentId) {
  const res = await fetch(`/api/teacher/student/${studentId}`);
  const data = await res.json();
  document.getElementById('detailCard').style.display = '';
  document.getElementById('detailTitle').textContent = `${data.student.studentId} ${data.student.name} 상세 기록`;
  const body = document.getElementById('detailBody');

  // 학습 감정과 복습 감정을 분리
  const learnEmotions = data.emotionChecks.filter(e => e.mode !== 'review');
  const reviewEmotions = data.emotionChecks.filter(e => e.mode === 'review');

  const emotionRows = learnEmotions.map(e => `
    <tr><td>${e.sessionNo}차시</td><td>${e.phase === 'pre' ? '학습전' : '학습후'}</td><td>${e.emotion}</td><td>${e.intensity}</td><td style="text-align:left">${e.note || ''}</td></tr>
  `).join('') || '<tr><td colspan="5" class="muted">기록 없음</td></tr>';

  const reviewRows = reviewEmotions.map(e => `
    <tr class="review-row">
      <td>${e.sessionNo}차시</td>
      <td><span class="review-badge">${e.reviewLabel || '복습'}</span></td>
      <td>${e.phase === 'pre' ? '복습전' : '복습후'}</td>
      <td>${e.emotion}</td>
      <td>${e.intensity}</td>
      <td class="muted">${new Date(e.createdAt).toLocaleString('ko-KR')}</td>
    </tr>
  `).join('') || '<tr><td colspan="6" class="muted">복습 기록 없음</td></tr>';

  const feedbackList = data.feedbacks.map(f => `
    <div class="card" style="background:#fafbff;">
      <div class="muted">${f.sessionNo}차시 · ${new Date(f.createdAt).toLocaleString('ko-KR')}</div>
      <div class="feedback-box">${f.feedbackText}</div>
    </div>
  `).join('') || '<p class="muted">AI 피드백 기록 없음</p>';

  const reflectionList = data.reflections.map(r => `
    <div class="card" style="background:#fafbff;">
      <div class="muted">${r.sessionNo}차시 · ${new Date(r.createdAt).toLocaleString('ko-KR')}</div>
      <p>${r.content}</p>
    </div>
  `).join('') || '<p class="muted">성찰 기록 없음</p>';

  body.innerHTML = `
    <h4>정서 변화 추이 (학습)</h4>
    <table>
      <tr><th>차시</th><th>구분</th><th>감정</th><th>강도</th><th>메모</th></tr>
      ${emotionRows}
    </table>
    <h4 style="margin-top:18px;">🔁 복습 기록 (회차별)</h4>
    <table>
      <tr><th>차시</th><th>복습회차</th><th>구분</th><th>감정</th><th>강도</th><th>일시</th></tr>
      ${reviewRows}
    </table>
    <h4 style="margin-top:18px;">AI 피드백 이력</h4>
    ${feedbackList}
    <h4 style="margin-top:18px;">학습 성찰</h4>
    ${reflectionList}
  `;
  document.getElementById('detailCard').scrollIntoView({ behavior: 'smooth' });
}

loadAlerts();
loadOverview();
setInterval(() => { loadAlerts(); loadOverview(); }, 15000);
