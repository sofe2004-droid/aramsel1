// 저장소: 로컬은 파일(data.json), 배포는 PostgreSQL(DATABASE_URL 설정 시)
// - load(): 메모리에 적재된 전체 상태를 동기 반환 (읽기)
// - save(): 변경을 영속화 (파일 즉시 기록 / DB는 직렬화된 비동기 기록으로 동시성 안전)
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');
const USE_DB = !!process.env.DATABASE_URL;

function emptyDB() {
  return {
    students: [],       // {studentId, grade, classNo, number, name, group, password, mustChangePassword}
    sessions: [],       // curriculum metadata (static, seeded)
    emotionChecks: [],  // {id, studentId, sessionNo, phase, emotion, intensity, note, mode, reviewRound, ...}
    activities: [],     // {id, studentId, sessionNo, type, content, createdAt}
    feedbacks: [],      // {id, studentId, sessionNo, sourceText, feedbackText, tags, createdAt}
    reflections: [],    // {id, studentId, sessionNo, content, createdAt}
    progress: [],       // {studentId, sessionNo, steps, updatedAt}
    chatLogs: []        // {id, studentId, message, answer, blocked, reason, createdAt}
  };
}

function mergeDefaults(parsed) {
  const defaults = emptyDB();
  for (const key of Object.keys(defaults)) {
    if (!parsed[key]) parsed[key] = defaults[key];
  }
  return parsed;
}

let db = emptyDB();
let nextId = 1;

function initNextId() {
  const all = [...db.emotionChecks, ...db.activities, ...db.feedbacks, ...db.reflections, ...db.chatLogs];
  nextId = all.reduce((m, r) => Math.max(m, r.id || 0), 0) + 1;
}

function genId() {
  return nextId++;
}

// ---------------- 파일 모드 ----------------
function fileLoad() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(emptyDB(), null, 2));
    return emptyDB();
  }
  try {
    return mergeDefaults(JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')));
  } catch (e) {
    return emptyDB();
  }
}

function fileSave() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// ---------------- PostgreSQL 모드 ----------------
let pool = null;
let dirty = false;
let writing = false;

function makePool() {
  const { Pool } = require('pg');
  const connectionString = process.env.DATABASE_URL;
  const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
  return new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false }
  });
}

// save() 호출 시 dirty 표시 후, 항상 "현재 메모리 전체"를 기록하는 단일 writer를 돌린다.
// 여러 요청이 동시에 메모리를 수정해도, 마지막 기록은 모든 변경을 포함하므로 유실이 없다.
async function flushLoop() {
  writing = true;
  try {
    while (dirty) {
      dirty = false;
      const snapshot = JSON.stringify(db);
      await pool.query('UPDATE app_state SET data = $1, updated_at = now() WHERE id = 1', [snapshot]);
    }
  } catch (e) {
    console.error('DB 저장 오류:', e.message);
    dirty = true; // 실패 시 다음 기회에 재시도
  } finally {
    writing = false;
  }
}

function dbSave() {
  dirty = true;
  if (!writing) flushLoop();
}

// 모든 대기 중인 쓰기가 끝날 때까지 대기 (시드 직후 등에 사용)
async function flush() {
  if (!USE_DB) return;
  while (writing || dirty) {
    await new Promise(r => setTimeout(r, 30));
  }
}

// ---------------- 초기화 ----------------
// 서버 시작 시 1회 호출. 파일 모드면 파일 로드, DB 모드면 테이블 생성 후 로드.
async function initStore() {
  if (!USE_DB) {
    db = fileLoad();
    initNextId();
    return;
  }
  pool = makePool();

  // Neon 등 서버리스 DB는 첫 연결(깨우기)에 시간이 걸릴 수 있어 몇 차례 재시도
  let lastErr = null;
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      await pool.query('SELECT 1');
      lastErr = null;
      break;
    } catch (e) {
      lastErr = e;
      console.log(`DB 연결 시도 ${attempt}/6 실패: ${e.message} — 3초 후 재시도`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  if (lastErr) {
    throw new Error('DATABASE_URL로 PostgreSQL에 연결하지 못했습니다. 접속 주소를 확인하세요. 원인: ' + lastErr.message);
  }

  await pool.query('CREATE TABLE IF NOT EXISTS app_state (id INT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT now())');
  const res = await pool.query('SELECT data FROM app_state WHERE id = 1');
  if (res.rows.length) {
    db = mergeDefaults(res.rows[0].data);
  } else {
    db = emptyDB();
    await pool.query('INSERT INTO app_state (id, data) VALUES (1, $1)', [JSON.stringify(db)]);
  }
  initNextId();
  console.log('저장소: PostgreSQL 모드 (데이터 영속 보장)');
}

module.exports = {
  initStore,
  flush,
  load: () => db,
  save: () => (USE_DB ? dbSave() : fileSave()),
  genId,
  emptyDB,
  _setDb: (newDb) => { db = newDb; },
  isDbMode: () => USE_DB
};
