const path = require('path');
const { app } = require('electron');
const Database = require('better-sqlite3');

// ✅ Resolve a writable path for storing the DB
const dbPath = path.join(app.getPath('userData'), 'tasks.db');
const db = new Database(dbPath);

// ✅ Initialize the database and table
function initDB() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      datetime TEXT
    )
  `).run();
}

// ✅ Insert new task
function insertTask(task) {
  const stmt = db.prepare("INSERT INTO tasks (title, description, datetime) VALUES (?, ?, ?)");
  stmt.run(task.title, task.description, task.datetime);
}

// ✅ Fetch all tasks
function getTasks() {
  const stmt = db.prepare("SELECT * FROM tasks ORDER BY datetime ASC");
  return stmt.all();
}

// ✅ Update a task
function updateTask(task) {
  const stmt = db.prepare("UPDATE tasks SET title = ?, description = ?, datetime = ? WHERE id = ?");
  stmt.run(task.title, task.description, task.datetime, task.id);
}

// ✅ Delete a task
function deleteTask(id) {
  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
}

// ✅ Auto-delete past tasks
function deleteOldTasks() {
  const now = new Date().toISOString();
  db.prepare("DELETE FROM tasks WHERE datetime < ?").run(now);
}

module.exports = {
  initDB,
  insertTask,
  getTasks,
  updateTask,
  deleteTask,
  deleteOldTasks
};
