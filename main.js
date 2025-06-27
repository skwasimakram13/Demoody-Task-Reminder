const { app, BrowserWindow, ipcMain, Notification, Menu, Tray } = require('electron');
const path = require('path');
const AutoLaunch = require('auto-launch');
const {
  initDB,
  insertTask,
  getTasks,
  updateTask,
  deleteTask
} = require('./db');

let win;
let tray = null;
let reminderIntervalMinutes = 5;
let reminderTimer = null;

// ✅ Create main window
function createWindow() {
  win = new BrowserWindow({
    width: 500,
    height: 700,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
  Menu.setApplicationMenu(null);

  win.on('close', (e) => {
    if (!app.isQuiting) {
      e.preventDefault();
      win.hide();
    }
  });

  win.webContents.on('did-finish-load', () => {
    win.webContents.send('init-interval', reminderIntervalMinutes);
  });
}

// ✅ Auto launch
function setupAutoLaunch() {
  const autoLauncher = new AutoLaunch({
    name: 'Demoody Task Reminder',
    path: app.getPath('exe')
  });

  autoLauncher.isEnabled().then((enabled) => {
    if (!enabled) autoLauncher.enable();
  }).catch(console.error);
}

// ✅ Tray icon
function setupTray() {
  tray = new Tray(path.join(__dirname, 'icon-tray.png'));
  tray.setToolTip('Demoody Task Reminder');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => win.show() },
    {
      label: 'Quit', click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => win.show());
}

// ✅ Check for due task notifications
async function checkReminders() {
  const tasks = await getTasks();
  const now = new Date();
  const nowStr = now.toISOString().slice(0, 16); // format: yyyy-MM-ddTHH:mm

  tasks.forEach(task => {
    const taskTime = new Date(task.datetime).toISOString().slice(0, 16);

    if (taskTime === nowStr) {
      new Notification({
        title: `⏰ ${task.title}`,
        body: task.description,
        icon: path.join(__dirname, 'icon.ico')
      }).show();

      if (win) win.webContents.send('play-sound');
    }

    if (taskTime < nowStr) {
      deleteTask(task.id); // Optional: remove expired
    }
  });
}

// ✅ Custom interval reminder
function startReminderInterval() {
  if (reminderTimer) clearInterval(reminderTimer);

  reminderTimer = setInterval(() => {
    new Notification({
      title: "🔔 Reminder",
      body: `This is your reminder every ${reminderIntervalMinutes} minute(s).`,
      icon: path.join(__dirname, 'icon.ico')
    }).show();

    if (win) win.webContents.send('play-sound');
  }, reminderIntervalMinutes * 60 * 1000);
}

// ✅ App ready
app.whenReady().then(() => {
  app.setName("Demoody Task Reminder");
  app.setAppUserModelId("com.demoody.taskreminder");

  initDB();
  setupAutoLaunch();
  createWindow();
  setupTray();

  setInterval(checkReminders, 60 * 1000); // Every 1 minute
  startReminderInterval();

  // 🔔 Test notification after launch
  setTimeout(() => {
    new Notification({
      title: "✅ Test Notification",
      body: "Sound should play now!",
      icon: path.join(__dirname, 'icon.ico')
    }).show();

    if (win) win.webContents.send('play-sound');
  }, 5000);
});

// ✅ IPC Handlers
ipcMain.handle('save-task', (event, task) => insertTask(task));
ipcMain.handle('get-tasks', () => getTasks());
ipcMain.handle('update-task', (event, task) => updateTask(task));
ipcMain.handle('delete-task', (event, id) => deleteTask(id));

ipcMain.on('set-reminder-interval', (event, minutes) => {
  reminderIntervalMinutes = minutes;
  startReminderInterval();
});

// ✅ MacOS: reactivate window when clicked on dock
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
  else win.show();
});

// ✅ Prevent full exit unless quit
app.on('window-all-closed', () => {});
