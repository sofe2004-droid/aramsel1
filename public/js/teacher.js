const NEGATIVE = ['답답함', '짜증남', '좌절감', '포기하고싶음', '당황스러움', '걱정됨'];

let DATA = null;            // /api/teacher/analytics 응답
let selectedClass = 'all';  // 'all' | 1 | 2 | 6 | 7
let searchId = '';           // 학번 검색

function classLabel(c) { return c === 'all' ? '전체' : `${c}반`; }

async function loadAnalytics() {
  const res = await fetch('/api/teacher/analytics');
  DATA = await res.json();
  renderRiskBanner();
  renderClassFilter();
  renderAll();
}

// 🚨 상단 경고 배너
function renderRiskBanner() {
  const banner = document.getElementById('riskBanner');
  const risks = DATA.atRisk || [];
  if (!risks.length) { banner.style.display = 'none'; return; }
  banner.style.display = 'block';
  const items = risks.slice(0, 8).map(a =>
    `<span class="risk-chip">${a.classNo ? a.classNo + '반 ' : ''}${a.studentId} · ${a.emotion}(강도${a.intensity}) · ${a.sessionNo}차시</span>`
  ).join('');
  banner.innerHTML = `
    <div class="risk-head">🚨 정서 이상 신호 — 즉시 확인이 필요한 학생 ${risks.length}명 (강도 4 이상 부정 정서)</div>
    <div class="risk-list">${items}${risks.length > 8 ? `<span class="risk-chip">외 ${risks.length - 8}명</span>` : ''}</div>`;
}

// 반 검색 버튼
function renderClassFilter() {
  const wrap = document.getElementById('classFilter');
  const opts = ['all', ...DATA.classes];
  wrap.innerHTML = opts.map(c =>
    `<button class="class-btn ${String(c) === String(selectedClass) ? 'active' : ''}" data-class="${c}">${classLabel(c)}</button>`
  ).join('');
  wrap.querySelectorAll('.class-btn').forEach(btn => {
    btn.onclick = () => {
      selectedClass = btn.dataset.class === 'all' ? 'all' : Number(btn.dataset.class);
      searchId = '';
      document.getElementById('studentSearch').value = '';
      document.getElementById('clearSearchBtn').style.display = 'none';
      renderClassFilter();
      renderAll();
    };
  });
}

function scopeData() {
  if (selectedClass === 'all') return DATA.overall;
  return DATA.byClass[selectedClass] || DATA.overall;
}

function renderAll() {
  const scope = scopeData();
  document.getElementById('scopeLabel').textContent =
    searchId ? `🔎 학번 ${searchId} 검색 결과` : `현재 보기: ${classLabel(selectedClass)} · 대상 ${scope.students}명`;

  // 학급별 학습현황 비교 (전체 보기 & 검색 아닐 때만)
  const compareCard = document.getElementById('classCompareCard');
  if (selectedClass === 'all' && !searchId) {
    compareCard.style.display = '';
    renderClassCompare();
  } else {
    compareCard.style.display = 'none';
  }

  renderKPIs(scope);
  renderCompletion(scope);
  renderTrend(scope);
  renderStudentTable();
}

// 🏫 학급별 학습현황
function renderClassCompare() {
  const rows = DATA.classes.map(c => {
    const d = DATA.byClass[c];
    const cur = d.current;
    return `<tr style="cursor:pointer" onclick="selectClass(${c})">
      <td><strong>${c}반</strong></td>
      <td>${d.students}명</td>
      <td>${d.avgCompletedSessions} / ${d.totalSessions}차시</td>
      <td>${d.improvement.rate}%</td>
      <td>${d.code.avgPerStudent}</td>
      <td><span class="mini pos">${cur.positive}</span> <span class="mini neg">${cur.negative}</span> <span class="mini risk">${cur.atRisk}</span></td>
    </tr>`;
  }).join('');
  document.getElementById('classCompare').innerHTML = `
    <table>
      <tr><th>반</th><th>인원</th><th>평균 이수</th><th>정서 개선율</th><th>학생당 코드</th><th>현재정서(긍/부/위험)</th></tr>
      ${rows}
    </table>
    <p class="muted" style="margin-top:6px;">행을 클릭하면 해당 반만 볼 수 있어요.</p>`;
}
function selectClass(c) { selectedClass = c; renderClassFilter(); renderAll(); window.scrollTo(0, 0); }

// 📊 핵심 지표
function renderKPIs(scope) {
  document.getElementById('kpiTitle').textContent = `📊 ${searchId ? '학번 ' + searchId : classLabel(selectedClass)} 학습 지표`;
  const c = scope.current;
  const tiles = [
    { num: `${scope.avgCompletedSessions}<span class="tile-unit">/${scope.totalSessions}</span>`, label: '평균 이수 차시', cls: 'sum-neutral' },
    { num: `${scope.improvement.rate}<span class="tile-unit">%</span>`, label: `학습 향상도(정서 개선)<br><span class="muted">${scope.improvement.improved}/${scope.improvement.pairs}쌍</span>`, cls: 'sum-pos' },
    { num: scope.code.totalSubmissions, label: `코드 입력<br><span class="muted">학생당 ${scope.code.avgPerStudent}건</span>`, cls: 'sum-neutral' },
    { num: c.positive, label: '😊 긍정', cls: 'sum-pos' },
    { num: c.negative, label: '😟 부정', cls: 'sum-neg' },
    { num: c.atRisk, label: '🚨 위험', cls: 'sum-risk' }
  ];
  document.getElementById('kpiTiles').innerHTML = tiles.map(t =>
    `<div class="summary-tile ${t.cls}"><div class="tile-num">${t.num}</div><div class="tile-label">${t.label}</div></div>`
  ).join('');
}

// ✅ 차시별 이수율
function renderCompletion(scope) {
  document.getElementById('completionBars').innerHTML = scope.completionBySession.map(s => `
    <div class="bar-row">
      <div class="bar-label">${s.sessionNo}차시 <span class="muted">${s.title}</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${s.rate}%"></div></div>
      <div class="bar-val">${s.rate}% <span class="muted">(${s.completed}/${s.total})</span></div>
    </div>`).join('');
}

// 📈 감정 변화 추이
function renderTrend(scope) {
  const rows = scope.emotionTrend.map(s => {
    const total = s.positive + s.negative;
    const posPct = total ? Math.round(s.positive / total * 100) : 0;
    return `<tr>
      <td>${s.sessionNo}차시</td>
      <td>${s.responses}</td>
      <td style="color:#1f9d6f;font-weight:700">${s.positive}</td>
      <td style="color:#d6336c;font-weight:700">${s.negative}</td>
      <td>${s.avgIntensity ?? '-'}</td>
      <td style="min-width:110px"><div class="trend-bar"><div class="trend-fill" style="width:${posPct}%"></div></div><span class="muted" style="font-size:0.72rem">긍정 ${posPct}%</span></td>
    </tr>`;
  }).join('');
  document.getElementById('emotionTrend').innerHTML = `
    <table><tr><th>차시</th><th>응답</th><th>긍정</th><th>부정</th><th>평균강도</th><th>긍정 비율</th></tr>${rows}</table>`;
}

// 👩‍🎓 학생 목록 (반 필터 + 학번 검색)
function emotionCell(ce) {
  if (!ce) return '<span class="muted">-</span>';
  const isNeg = NEGATIVE.includes(ce.emotion);
  const risk = isNeg && ce.intensity >= 4;
  const cls = risk ? 'chip-risk' : isNeg ? 'chip-neg' : 'chip-pos';
  return `<span class="emo-chip ${cls}">${ce.emotion} ${ce.intensity}</span>`;
}
function renderStudentTable() {
  let list = DATA.students.slice();
  if (searchId) list = list.filter(s => s.studentId === searchId);
  else if (selectedClass !== 'all') list = list.filter(s => s.classNo === selectedClass);
  list.sort((a, b) => a.studentId.localeCompare(b.studentId));

  document.getElementById('studentListTitle').textContent =
    `👩‍🎓 학생 목록 (${list.length}명)`;

  if (!list.length) {
    document.getElementById('studentTable').innerHTML = '<tr><td class="muted" style="padding:14px">해당하는 학생이 없습니다.</td></tr>';
    return;
  }
  const head = `<tr><th>학번</th><th>반</th><th>이수차시</th><th>코드입력</th><th>현재정서</th></tr>`;
  const rows = list.map(s => `
    <tr style="cursor:pointer" onclick="showDetail('${s.studentId}')">
      <td>${s.studentId}</td>
      <td>${s.classNo}반</td>
      <td>${s.completedSessions}/7</td>
      <td>${s.codeCount}건</td>
      <td>${emotionCell(s.currentEmotion)}</td>
    </tr>`).join('');
  document.getElementById('studentTable').innerHTML = head + rows;

  if (searchId && list.length === 1) showDetail(list[0].studentId);
}

// 🔎 학번 검색
function doSearch() {
  const v = document.getElementById('studentSearch').value.trim();
  if (!/^\d{5}$/.test(v)) { alert('학번 5자리를 입력해주세요. (예: 20601)'); return; }
  const found = DATA.students.find(s => s.studentId === v);
  if (!found) { alert('해당 학번의 학생을 찾을 수 없습니다.'); return; }
  searchId = v;
  selectedClass = 'all';
  document.getElementById('clearSearchBtn').style.display = '';
  renderClassFilter();
  renderAll();
}
function clearSearch() {
  searchId = '';
  document.getElementById('studentSearch').value = '';
  document.getElementById('clearSearchBtn').style.display = 'none';
  renderAll();
}

// 학생 상세 (기존 유지)
async function showDetail(studentId) {
  const res = await fetch(`/api/teacher/student/${studentId}`);
  const data = await res.json();
  document.getElementById('detailCard').style.display = '';
  document.getElementById('detailTitle').textContent = `${data.student.studentId} ${data.student.name} 상세 기록`;
  const body = document.getElementById('detailBody');

  const learnEmotions = data.emotionChecks.filter(e => e.mode !== 'review');
  const reviewEmotions = data.emotionChecks.filter(e => e.mode === 'review');

  const emotionRows = learnEmotions.map(e => `
    <tr><td>${e.sessionNo}차시</td><td>${e.phase === 'pre' ? '학습전' : '학습후'}</td><td>${e.emotion}</td><td>${e.intensity}</td><td style="text-align:left">${e.note || ''}</td></tr>
  `).join('') || '<tr><td colspan="5" class="muted">기록 없음</td></tr>';

  const reviewRows = reviewEmotions.map(e => `
    <tr class="review-row">
      <td>${e.sessionNo}차시</td><td><span class="review-badge">${e.reviewLabel || '복습'}</span></td>
      <td>${e.phase === 'pre' ? '복습전' : '복습후'}</td><td>${e.emotion}</td><td>${e.intensity}</td>
      <td class="muted">${new Date(e.createdAt).toLocaleString('ko-KR')}</td>
    </tr>
  `).join('') || '<tr><td colspan="6" class="muted">복습 기록 없음</td></tr>';

  const codeList = data.activities.filter(a => a.type === 'code' || a.type === 'final').map(a => `
    <div class="card" style="background:#fafbff;">
      <div class="muted">${a.sessionNo}차시 · ${a.type === 'final' ? '최종 코드' : '코드'} · ${new Date(a.createdAt).toLocaleString('ko-KR')}</div>
      <pre class="example" style="margin-top:6px;">${(a.content || '').replace(/&/g,'&amp;').replace(/</g,'&lt;')}</pre>
    </div>`).join('') || '<p class="muted">코드 입력 기록 없음</p>';

  const feedbackList = data.feedbacks.map(f => `
    <div class="card" style="background:#fafbff;">
      <div class="muted">${f.sessionNo}차시 · ${f.source === 'llm' ? 'AI(LLM)' : '규칙'} · ${new Date(f.createdAt).toLocaleString('ko-KR')}</div>
      <div class="feedback-box">${f.feedbackText}</div>
    </div>`).join('') || '<p class="muted">AI 피드백 기록 없음</p>';

  const reflectionList = data.reflections.map(r => `
    <div class="card" style="background:#fafbff;">
      <div class="muted">${r.sessionNo}차시 · ${new Date(r.createdAt).toLocaleString('ko-KR')}</div>
      <p>${r.content}</p>
    </div>`).join('') || '<p class="muted">성찰 기록 없음</p>';

  body.innerHTML = `
    <h4>정서 변화 추이 (학습)</h4>
    <table><tr><th>차시</th><th>구분</th><th>감정</th><th>강도</th><th>메모</th></tr>${emotionRows}</table>
    <h4 style="margin-top:18px;">🔁 복습 기록 (회차별)</h4>
    <table><tr><th>차시</th><th>복습회차</th><th>구분</th><th>감정</th><th>강도</th><th>일시</th></tr>${reviewRows}</table>
    <h4 style="margin-top:18px;">💻 코드 입력 기록</h4>
    ${codeList}
    <h4 style="margin-top:18px;">AI 정서지원 피드백 이력</h4>
    ${feedbackList}
    <h4 style="margin-top:18px;">학습 성찰</h4>
    ${reflectionList}`;
  document.getElementById('detailCard').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('searchBtn').onclick = doSearch;
document.getElementById('clearSearchBtn').onclick = clearSearch;
document.getElementById('studentSearch').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
document.getElementById('studentSearch').addEventListener('input', e => { e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 5); });

loadAnalytics();
setInterval(loadAnalytics, 20000);
