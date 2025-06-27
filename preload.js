const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveTask: (task) => ipcRenderer.invoke('save-task', task),
  getTasks: () => ipcRenderer.invoke('get-tasks'),
  updateTask: (task) => ipcRenderer.invoke('update-task', task),
  deleteTask: (id) => ipcRenderer.invoke('delete-task', id),
  setReminderInterval: (minutes) => ipcRenderer.send('set-reminder-interval', minutes),
  onPlaySound: (callback) => ipcRenderer.on('play-sound', callback),
  receiveInitInterval: (callback) => ipcRenderer.on('init-interval', (event, minutes) => callback(minutes))
});
