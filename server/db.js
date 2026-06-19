const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(
  process.pkg ? path.dirname(process.execPath) : __dirname,
  'hackathon.db'
);

let db = null;

function saveDB() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function run(sql, params = []) { db.run(sql, params); saveDB(); }

function get(sql, params = []) {
  const stmt   = db.prepare(sql);
  const result = stmt.getAsObject(params);
  stmt.free();
  return Object.keys(result).length === 0 ? null : result;
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  const rows = [];
  stmt.bind(params);
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function lastInsertId() { return get('SELECT last_insert_rowid() as id').id; }

async function initDB() {
  // FIX: Explicitly load the WASM binary for pkg compatibility
  const wasmPath = path.join(__dirname, 'node_modules/sql.js/dist/sql-wasm.wasm');
  const SQL = await initSqlJs({
    wasmBinary: fs.readFileSync(wasmPath)
  });

  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
    console.log('[DB] Loaded existing database from:', DB_PATH);
  } else {
    db = new SQL.Database();
    console.log('[DB] Created new database at:', DB_PATH);
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      label       TEXT NOT NULL,
      date_label  TEXT NOT NULL,
      difficulty  TEXT NOT NULL,
      team_count  INTEGER NOT NULL,
      phase       TEXT NOT NULL DEFAULT 'SETUP',
      created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS teams (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id    INTEGER NOT NULL,
      name          TEXT NOT NULL,
      strikes       INTEGER NOT NULL DEFAULT 0,
      use_case_num  INTEGER,
      draft_order   INTEGER,
      present_order INTEGER,
      is_drafted    INTEGER NOT NULL DEFAULT 0,
      waiting       INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS question_pool (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id  INTEGER NOT NULL,
      question    TEXT NOT NULL,
      options     TEXT NOT NULL,
      correct_idx INTEGER NOT NULL,
      used        INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS draft_log (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id    INTEGER NOT NULL,
      team_id       INTEGER NOT NULL,
      question_id   INTEGER,
      selected_idx  INTEGER,
      correct       INTEGER,
      use_case_num  INTEGER,
      attempt_num   INTEGER,
      created_at    TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
  `);

  try {
    db.run(`ALTER TABLE teams ADD COLUMN waiting INTEGER NOT NULL DEFAULT 0`);
    console.log('[DB] Migration: added waiting column to teams.');
    saveDB();
  } catch (e) {
    // Column already exists — safe to ignore
  }

  saveDB();
  console.log('[DB] Schema ready.');
}

module.exports = { run, get, all, lastInsertId, saveDB, initDB };
