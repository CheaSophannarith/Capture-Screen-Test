// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('electronAPI', {
  tasks: {
    load: () => ipcRenderer.invoke('load-tasks'),
    save: (tasks) => ipcRenderer.invoke('save-tasks', tasks),
    delete: (taskId) => ipcRenderer.invoke('delete-task', taskId),
    getScreenSources: async () => {
    return await desktopCapturer.getSources({ types: ['screen'] })
  }
  },
  darkMode: {
    toggle: () => ipcRenderer.invoke('dark-mode:toggle'),
    system: () => ipcRenderer.invoke('dark-mode:system')
  }
});
