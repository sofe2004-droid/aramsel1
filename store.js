const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

function emptyDB() {
  return {
    students: [],      // {number, name, group}
    sessions: [],       // curriculum metadata (static, seeded)
    emotionChecks: [],  // {id, studentNumber, sessionNo, phase, emotion, intensity, note, createdAt}
    activities: [],      // {id, studentNumber, sessionNo, type, content, createdAt}
    feedbacks: [],        // {id, studentNumber, sessionNo, sourceText, feedbackText, tags, createdAt}
    reflections: [],      // {id, studentNumber, sessionNo, content, createdAt}
    progress: [],           // {studentNumber, sessionNo, status, updatedAt}
    chatLogs: []             // {id, studentId, message, answer, blocked, reason, createdAt}
  };
}

function load() {
  if (!fs.existsSync(DB_PATH)) {
    const db = emptyDB();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    return db;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    const defaults = emptyDB();
    for (const key of Object.keys(defaults)) {
      if (!parsed[key]) parsed[key] = defaults[key];
    }
    return parsed;
  } catch (e) {
    return emptyDB();
  }
}

function save(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

let db = load();
let nextId = 1;
(function initNextId() {
  const all = [...db.emotionChecks, ...db.activities, ...db.feedbacks, ...db.reflections, ...db.chatLogs];
  nextId = all.reduce((m, r) => Math.max(m, r.id || 0), 0) + 1;
})();

function genId() {
  return nextId++;
}

module.exports = { load: () => db, save: () => save(db), genId, emptyDB, _setDb: (newDb) => { db = newDb; } };
