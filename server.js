require('dotenv').config(); // .env 파일에서 OPENAI_API_KEY 등을 불러옵니다
const express = require('express');
const cors = require('cors');
const path = require('path');
const { load, save, genId, initStore, isDbMode } = require('./store');
const { seed } = require('./seed');
const { generateFeedback, generateFeedbackSmart } = require('./ai');
const { answerChat } = require('./chatbot');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const ADMIN_ID = 'admin';
const ADMIN_PW = process.env.ADMIN_PW || '4110';

function getStudent(studentId) {
  const db = load();
  return db.students.find(s => s.studentId === String(studentId));
}

// 저장 모드/데이터 현황 확인용 (배포 검증)
app.get('/api/health', (req, res) => {
  const db = load();
  res.json({
    ok: true,
    storage: isDbMode() ? 'postgres' : 'file',
    students: db.students.length,
    emotionChecks: db.emotionChecks.length,
    activities: db.activities.length,
    reflections: db.reflections.length
  });
});

// 응답에서 비밀번호를 제거한 안전한 학생 객체
function safeStudent(student) {
  const { password, ...rest } = student;
  return rest;
}

// ---------- 로그인 ----------
app.post('/api/login', (req, res) => {
  const { studentId, password } = req.body;
  const student = getStudent(studentId);
  if (!student) return res.status(404).json({ error: '해당 학번의 학생을 찾을 수 없습니다. 학번을 다시 확인해주세요.' });
  if (String(password || '') !== String(student.password)) {
    return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
  }
  res.json({ student: safeStudent(student), mustChangePassword: !!student.mustChangePassword });
});

// ---------- 비밀번호 변경 (최초 로그인 시 생년월일 8자리로 변경) ----------
app.post('/api/change-password', (req, res) => {
  const { studentId, currentPassword, newPassword } = req.body;
  const db = load();
  const student = db.students.find(s => s.studentId === String(studentId));
  if (!student) return res.status(404).json({ error: '학생을 찾을 수 없습니다.' });
  if (String(currentPassword || '') !== String(student.password)) {
    return res.status(401).json({ error: '현재 비밀번호가 올바르지 않습니다.' });
  }
  if (!/^\d{8}$/.test(String(newPassword || ''))) {
    return res.status(400).json({ error: '생년월일 8자리(숫자)를 정확히 입력해주세요. 예: 20090315' });
  }
  if (String(newPassword) === String(student.studentId)) {
    return res.status(400).json({ error: '학번과 동일한 비밀번호는 사용할 수 없습니다. 생년월일 8자리를 입력해주세요.' });
  }
  student.password = String(newPassword);
  student.mustChangePassword = false;
  save();
  res.json({ student: safeStudent(student) });
});

app.post('/api/admin-login', (req, res) => {
  const { id, password } = req.body;
  if (String(id || '').toLowerCase() !== ADMIN_ID || String(password || '') !== ADMIN_PW) {
    return res.status(401).json({ error: '관리자 ID 또는 비밀번호가 올바르지 않습니다.' });
  }
  res.json({ ok: true });
});

app.get('/api/students', (req, res) => {
  const db = load();
  res.json({ students: db.students });
});

// ---------- 차시(세션) ----------
app.get('/api/sessions', (req, res) => {
  const db = load();
  res.json({ sessions: db.sessions });
});

app.get('/api/sessions/:no', (req, res) => {
  const db = load();
  const session = db.sessions.find(s => s.no === Number(req.params.no));
  if (!session) return res.status(404).json({ error: '차시를 찾을 수 없습니다.' });
  res.json({ session });
});

// ---------- 정서 체크 ----------
app.post('/api/emotion', (req, res) => {
  const { studentId, sessionNo, phase, emotion, intensity, note, mode } = req.body;
  if (!getStudent(studentId)) return res.status(404).json({ error: '학생을 찾을 수 없습니다.' });
  const db = load();
  const id = String(studentId), no = Number(sessionNo);
  const isReview = mode === 'review';

  // 복습 회차 서버 계산: 1차부터 시작, 복습을 시작(pre)할 때마다 +1 자동 증가
  let reviewRound = null;
  if (isReview) {
    const prev = db.emotionChecks.filter(e => e.studentId === id && e.sessionNo === no && e.mode === 'review');
    const maxRound = prev.reduce((m, e) => Math.max(m, e.reviewRound || 0), 0);
    reviewRound = (phase === 'pre') ? maxRound + 1 : (maxRound || 1);
  }

  const record = {
    id: genId(),
    studentId: id,
    sessionNo: no,
    phase: phase || 'pre', // pre | post
    emotion,
    intensity: Number(intensity) || 3,
    note: note || '',
    mode: isReview ? 'review' : 'learn',              // learn | review
    reviewRound,                                       // 1차, 2차, ... (학습이면 null)
    reviewLabel: isReview ? `${reviewRound}차 복습` : null,
    createdAt: new Date().toISOString()
  };
  db.emotionChecks.push(record);
  save();
  // 복습 모드의 감정 기록은 최초 학습 완료 상태를 바꾸지 않도록 진행상태를 갱신하지 않는다
  if (!isReview) {
    upsertProgress(db, studentId, sessionNo, phase === 'post' ? 'emotion_post' : 'emotion_pre');
  }
  res.json({ record });
});

// ---------- 학생 본인 진행현황 (차시 목록용) ----------
app.get('/api/progress/:studentId', (req, res) => {
  const id = req.params.studentId;
  const db = load();
  if (!db.students.find(s => s.studentId === id)) {
    return res.status(404).json({ error: '학생을 찾을 수 없습니다.' });
  }
  const list = db.sessions.map(sess => {
    const p = db.progress.find(pr => pr.studentId === id && pr.sessionNo === sess.no);
    const steps = p ? p.steps : [];
    let status = 'notstarted';
    if (steps.includes('emotion_post')) status = 'completed';
    else if (steps.length > 0) status = 'inprogress';
    return { sessionNo: sess.no, title: sess.title, goal: sess.goal, steps, status };
  });
  res.json({ progress: list });
});

// ---------- 코드/활동 제출 ----------
app.post('/api/activity', (req, res) => {
  const { studentId, sessionNo, type, content } = req.body;
  if (!getStudent(studentId)) return res.status(404).json({ error: '학생을 찾을 수 없습니다.' });
  const db = load();
  const record = {
    id: genId(),
    studentId: String(studentId),
    sessionNo: Number(sessionNo),
    type: type || 'code', // code | error | design | final
    content: content || '',
    createdAt: new Date().toISOString()
  };
  db.activities.push(record);
  save();
  upsertProgress(db, studentId, sessionNo, 'activity');
  res.json({ record });
});

// ---------- AI 정서지원 피드백 생성 (생성형 LLM 우선, 실패 시 규칙 기반 폴백) ----------
app.post('/api/feedback', async (req, res) => {
  const { studentId, sessionNo, emotion, intensity, errorNote, code } = req.body;
  if (!getStudent(studentId)) return res.status(404).json({ error: '학생을 찾을 수 없습니다.' });
  const db = load();
  const sess = db.sessions.find(s => s.no === Number(sessionNo));
  const result = await generateFeedbackSmart({
    emotion, intensity, errorNote, code, sessionNo,
    sessionTitle: sess ? sess.title : '',
    task: sess ? sess.task : ''
  });
  const record = {
    id: genId(),
    studentId: String(studentId),
    sessionNo: Number(sessionNo),
    sourceText: `${errorNote || ''}`.slice(0, 500),
    feedbackText: result.feedbackText,
    tags: result.tags,
    source: result.source || 'rule', // llm | rule
    createdAt: new Date().toISOString()
  };
  db.feedbacks.push(record);
  save();
  upsertProgress(db, studentId, sessionNo, 'feedback');
  res.json({ feedback: record });
});

// ---------- 성찰 ----------
app.post('/api/reflection', (req, res) => {
  const { studentId, sessionNo, content } = req.body;
  if (!getStudent(studentId)) return res.status(404).json({ error: '학생을 찾을 수 없습니다.' });
  const db = load();
  const record = {
    id: genId(),
    studentId: String(studentId),
    sessionNo: Number(sessionNo),
    content: content || '',
    createdAt: new Date().toISOString()
  };
  db.reflections.push(record);
  save();
  upsertProgress(db, studentId, sessionNo, 'reflection');
  res.json({ record });
});

// ---------- 학생 본인 이력 조회 ----------
app.get('/api/history/:studentId/:sessionNo', (req, res) => {
  const { studentId, sessionNo } = req.params;
  const db = load();
  const s = Number(sessionNo);
  res.json({
    emotionChecks: db.emotionChecks.filter(r => r.studentId === studentId && r.sessionNo === s),
    activities: db.activities.filter(r => r.studentId === studentId && r.sessionNo === s),
    feedbacks: db.feedbacks.filter(r => r.studentId === studentId && r.sessionNo === s),
    reflections: db.reflections.filter(r => r.studentId === studentId && r.sessionNo === s)
  });
});

// ---------- 진행 상태 헬퍼 ----------
function upsertProgress(db, studentId, sessionNo, step) {
  const id = String(studentId), s = Number(sessionNo);
  let p = db.progress.find(p => p.studentId === id && p.sessionNo === s);
  if (!p) {
    p = { studentId: id, sessionNo: s, steps: [], updatedAt: new Date().toISOString() };
    db.progress.push(p);
  }
  if (!p.steps.includes(step)) p.steps.push(step);
  p.updatedAt = new Date().toISOString();
  save();
}

// ---------- 코딩 도우미 챗봇 ----------
app.post('/api/chatbot', async (req, res) => {
  const { studentId, message, sessionNo } = req.body;
  const db = load();
  // 현재 차시 과제 맥락을 챗봇에 전달 (있으면)
  let ctx = null;
  if (sessionNo) {
    const sess = db.sessions.find(s => s.no === Number(sessionNo));
    if (sess) {
      ctx = { sessionNo: sess.no, title: sess.title, task: sess.task, concept: sess.concept, example: sess.example };
    }
  }
  const result = await answerChat(message, ctx);
  db.chatLogs.push({
    id: genId(),
    studentId: String(studentId || ''),
    message: message || '',
    answer: result.answer,
    blocked: !!result.blocked,
    reason: result.reason || null,
    createdAt: new Date().toISOString()
  });
  save();
  res.json(result);
});

// ---------- 교사 대시보드 ----------
app.get('/api/teacher/overview', (req, res) => {
  const db = load();
  const overview = db.students.map(st => {
    const studentProgress = db.sessions.map(sess => {
      const p = db.progress.find(pr => pr.studentId === st.studentId && pr.sessionNo === sess.no);
      // 완료 상태 판단에는 학습(learn) 감정만 사용 (복습이 완료 표시를 흔들지 않도록)
      const lastEmotion = [...db.emotionChecks]
        .filter(e => e.studentId === st.studentId && e.sessionNo === sess.no && e.mode !== 'review')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      // 복습 회차 수 = 이 학생/차시의 복습 pre 기록 개수(각 회차 시작 지점)
      const reviewCount = db.emotionChecks
        .filter(e => e.studentId === st.studentId && e.sessionNo === sess.no && e.mode === 'review' && e.phase === 'pre').length;
      return {
        sessionNo: sess.no,
        steps: p ? p.steps : [],
        reviewCount,
        lastEmotion: lastEmotion ? { emotion: lastEmotion.emotion, intensity: lastEmotion.intensity, phase: lastEmotion.phase } : null
      };
    });
    return { studentId: st.studentId, name: st.name, classNo: st.classNo, number: st.number, group: st.group, sessions: studentProgress };
  });
  res.json({ overview });
});

app.get('/api/teacher/student/:studentId', (req, res) => {
  const id = req.params.studentId;
  const db = load();
  const student = db.students.find(s => s.studentId === id);
  if (!student) return res.status(404).json({ error: '학생을 찾을 수 없습니다.' });
  res.json({
    student,
    emotionChecks: db.emotionChecks.filter(r => r.studentId === id).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    activities: db.activities.filter(r => r.studentId === id).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    feedbacks: db.feedbacks.filter(r => r.studentId === id).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    reflections: db.reflections.filter(r => r.studentId === id).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    chatLogs: db.chatLogs.filter(r => r.studentId === id).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  });
});

// 반 전체 정서 현황·추이 (교사 대시보드 요약)
const POSITIVE_EMOTIONS = ['기대됨', '자신있음', '편안함', '성취감', '즐거움'];
const NEGATIVE_EMOTIONS = ['답답함', '짜증남', '좌절감', '포기하고싶음', '당황스러움', '걱정됨'];

app.get('/api/teacher/emotion-summary', (req, res) => {
  const db = load();
  const learn = db.emotionChecks.filter(e => e.mode !== 'review');

  // 학생별 "가장 최근 정서" → 현재 반 정서 분포
  const current = { positive: 0, negative: 0, atRisk: 0, neutralOrNone: 0 };
  const totalStudents = db.students.length;
  let withData = 0;
  for (const st of db.students) {
    const mine = learn.filter(e => e.studentId === st.studentId);
    if (!mine.length) continue;
    withData++;
    const latest = mine.reduce((a, b) => new Date(a.createdAt) >= new Date(b.createdAt) ? a : b);
    const isNeg = NEGATIVE_EMOTIONS.includes(latest.emotion);
    const isPos = POSITIVE_EMOTIONS.includes(latest.emotion);
    if (isNeg && latest.intensity >= 4) current.atRisk++;
    else if (isNeg) current.negative++;
    else if (isPos) current.positive++;
    else current.neutralOrNone++;
  }
  current.noData = totalStudents - withData;

  // 차시별 정서 추이 (학습 후 정서 기준: 긍정/부정 인원, 평균 강도)
  const bySession = db.sessions.map(sess => {
    const post = learn.filter(e => e.sessionNo === sess.no && e.phase === 'post');
    const pos = post.filter(e => POSITIVE_EMOTIONS.includes(e.emotion)).length;
    const neg = post.filter(e => NEGATIVE_EMOTIONS.includes(e.emotion)).length;
    const avgIntensity = post.length
      ? Number((post.reduce((s, e) => s + (e.intensity || 0), 0) / post.length).toFixed(1))
      : null;
    return { sessionNo: sess.no, title: sess.title, positive: pos, negative: neg, responses: post.length, avgIntensity };
  });

  res.json({ totalStudents, current, bySession });
});

// ── 교사 대시보드 통합 분석 (학급별 현황·이수율·향상도·코드·감정추이·경고·학생목록) ──
function emotionScore(e) {
  if (POSITIVE_EMOTIONS.includes(e.emotion)) return (e.intensity || 3);
  if (NEGATIVE_EMOTIONS.includes(e.emotion)) return -(e.intensity || 3);
  return 0;
}

app.get('/api/teacher/analytics', (req, res) => {
  const db = load();
  const learn = db.emotionChecks.filter(e => e.mode !== 'review');
  const classes = [...new Set(db.students.map(s => s.classNo))].sort((a, b) => a - b);

  function analyzeScope(students) {
    const ids = new Set(students.map(s => s.studentId));
    const emo = learn.filter(e => ids.has(e.studentId));
    const acts = db.activities.filter(a => ids.has(a.studentId));

    // 차시별 이수율 (학습 후 정서까지 완료 = 이수)
    const completionBySession = db.sessions.map(sess => {
      let completed = 0;
      for (const st of students) {
        const p = db.progress.find(pr => pr.studentId === st.studentId && pr.sessionNo === sess.no);
        if (p && p.steps.includes('emotion_post')) completed++;
      }
      return { sessionNo: sess.no, title: sess.title, completed, total: students.length,
               rate: students.length ? Math.round(completed / students.length * 100) : 0 };
    });

    // 현재 정서 분포 (학생별 최근 정서)
    const current = { positive: 0, negative: 0, atRisk: 0, neutralOrNone: 0, noData: 0 };
    for (const st of students) {
      const mine = emo.filter(e => e.studentId === st.studentId);
      if (!mine.length) { current.noData++; continue; }
      const latest = mine.reduce((a, b) => new Date(a.createdAt) >= new Date(b.createdAt) ? a : b);
      const neg = NEGATIVE_EMOTIONS.includes(latest.emotion), pos = POSITIVE_EMOTIONS.includes(latest.emotion);
      if (neg && latest.intensity >= 4) current.atRisk++;
      else if (neg) current.negative++;
      else if (pos) current.positive++;
      else current.neutralOrNone++;
    }

    // 차시별 감정 변화 추이 (학습 후 정서 기준)
    const emotionTrend = db.sessions.map(sess => {
      const post = emo.filter(e => e.sessionNo === sess.no && e.phase === 'post');
      const pos = post.filter(e => POSITIVE_EMOTIONS.includes(e.emotion)).length;
      const neg = post.filter(e => NEGATIVE_EMOTIONS.includes(e.emotion)).length;
      const avgIntensity = post.length ? Number((post.reduce((s, e) => s + (e.intensity || 0), 0) / post.length).toFixed(1)) : null;
      return { sessionNo: sess.no, positive: pos, negative: neg, responses: post.length, avgIntensity };
    });

    // 학습 향상도 (같은 차시 pre→post 정서 점수 개선 비율)
    let improved = 0, pairs = 0;
    for (const st of students) {
      for (const sess of db.sessions) {
        const pre = emo.find(e => e.studentId === st.studentId && e.sessionNo === sess.no && e.phase === 'pre');
        const post = emo.find(e => e.studentId === st.studentId && e.sessionNo === sess.no && e.phase === 'post');
        if (pre && post) { pairs++; if (emotionScore(post) > emotionScore(pre)) improved++; }
      }
    }

    // 코드 입력 정도
    const codeActs = acts.filter(a => a.type === 'code' || a.type === 'final');
    const studentsWithCode = new Set(codeActs.map(a => a.studentId)).size;

    // 평균 이수 차시
    let totalCompleted = 0;
    for (const st of students) {
      totalCompleted += db.progress.filter(p => p.studentId === st.studentId && p.steps.includes('emotion_post')).length;
    }

    return {
      students: students.length,
      completionBySession,
      current,
      emotionTrend,
      improvement: { pairs, improved, rate: pairs ? Math.round(improved / pairs * 100) : 0 },
      code: { totalSubmissions: codeActs.length, studentsWithCode,
              avgPerStudent: students.length ? Number((codeActs.length / students.length).toFixed(1)) : 0 },
      avgCompletedSessions: students.length ? Number((totalCompleted / students.length).toFixed(1)) : 0,
      totalSessions: db.sessions.length
    };
  }

  const byClass = {};
  for (const c of classes) byClass[c] = analyzeScope(db.students.filter(s => s.classNo === c));
  const overall = analyzeScope(db.students);

  // 정서 이상(위험) 학생 — 강도 4 이상 부정 정서, 최근순
  const atRisk = learn
    .filter(e => NEGATIVE_EMOTIONS.includes(e.emotion) && e.intensity >= 4)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 50)
    .map(e => {
      const st = db.students.find(s => s.studentId === e.studentId);
      return { studentId: e.studentId, studentName: st ? st.name : '?', classNo: st ? st.classNo : null,
               sessionNo: e.sessionNo, emotion: e.emotion, intensity: e.intensity, note: e.note, createdAt: e.createdAt };
    });

  // 학생 목록 (표·검색용)
  const students = db.students.map(st => {
    const completed = db.progress.filter(p => p.studentId === st.studentId && p.steps.includes('emotion_post')).length;
    const codeCount = db.activities.filter(a => a.studentId === st.studentId && (a.type === 'code' || a.type === 'final')).length;
    const mine = learn.filter(e => e.studentId === st.studentId);
    let currentEmotion = null;
    if (mine.length) {
      const l = mine.reduce((a, b) => new Date(a.createdAt) >= new Date(b.createdAt) ? a : b);
      currentEmotion = { emotion: l.emotion, intensity: l.intensity };
    }
    return { studentId: st.studentId, name: st.name, classNo: st.classNo, number: st.number,
             completedSessions: completed, codeCount, currentEmotion };
  });

  res.json({ classes, totalStudents: db.students.length, overall, byClass, atRisk, students });
});

// 부정적 정서 강도 높은 학생 알림용 (교사 대시보드 경고)
app.get('/api/teacher/alerts', (req, res) => {
  const db = load();
  const NEGATIVE = ['답답함', '짜증남', '좌절감', '포기하고싶음', '당황스러움', '걱정됨'];
  const alerts = db.emotionChecks
    .filter(e => NEGATIVE.includes(e.emotion) && e.intensity >= 4)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 50)
    .map(e => {
      const st = db.students.find(s => s.studentId === e.studentId);
      return { ...e, studentName: st ? st.name : '알수없음' };
    });
  res.json({ alerts });
});

const PORT = process.env.PORT || 3000;

// 저장소 초기화(파일/DB) → 최초 시드 → 서버 시작
(async () => {
  try {
    await initStore();
    seed(false); // 학생/차시 데이터가 없으면 시드 (있으면 유지)
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`AI 정서지원 학습지원 프로그램 서버 실행: http://localhost:${PORT}`);
      console.log(`태블릿 접속용: http://<이 PC의 IP주소>:${PORT}`);
      if (process.env.OPENAI_API_KEY) {
        console.log(`챗봇: OpenAI 생성형 AI 모드 (모델: ${process.env.OPENAI_MODEL || 'gpt-4o-mini'})`);
      } else {
        console.log('챗봇: 규칙 기반(FAQ) 모드 — OPENAI_API_KEY가 설정되지 않았습니다.');
      }
    });
  } catch (e) {
    console.error('서버 시작 실패:', e);
    process.exit(1);
  }
})();
