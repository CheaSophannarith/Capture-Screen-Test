import { app, BrowserWindow, ipcMain, Menu, nativeTheme } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import started from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, '../assets/icon.png'), // Window icon
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Menu.setApplicationMenu(null); // Remove default menu

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

ipcMain.handle('dark-mode:toggle', () => {
  if (nativeTheme.shouldUseDarkColors) {
    nativeTheme.themeSource = 'light'
  } else {
    nativeTheme.themeSource = 'dark'
  }
  return nativeTheme.shouldUseDarkColors
})

ipcMain.handle('dark-mode:system', () => {
  nativeTheme.themeSource = 'system'
})


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Define the path to store tasks data
  const tasksFilePath = path.join(app.getPath('userData'), 'tasks.json');
  console.log('Tasks file path:', tasksFilePath);

  // IPC Handler: Load tasks from file
  ipcMain.handle('load-tasks', async () => {
    try {
      console.log('Loading tasks from:', tasksFilePath);
      if (fs.existsSync(tasksFilePath)) {
        const data = fs.readFileSync(tasksFilePath, 'utf-8');
        console.log('Tasks loaded:', data);
        return JSON.parse(data);
      }
      console.log('No tasks file found, returning empty array');
      return [];
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  });

  // IPC Handler: Save tasks to file
  ipcMain.handle('save-tasks', async (event, tasks) => {
    try {
      console.log('Saving tasks:', tasks);
      fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2), 'utf-8');
      console.log('Tasks saved successfully to:', tasksFilePath);
      return { success: true };
    } catch (error) {
      console.error('Error saving tasks:', error);
      return { success: false, error: error.message };
    }
  });

  // IPC Handler: Delete a specific task
  ipcMain.handle('delete-task', async (event, taskId) => {
    try {
      if (fs.existsSync(tasksFilePath)) {
        const data = fs.readFileSync(tasksFilePath, 'utf-8');
        let tasks = JSON.parse(data);
        tasks = tasks.filter(task => task.id !== taskId);
        fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2), 'utf-8');
        return { success: true };
      }
      return { success: false, error: 'File not found' };
    } catch (error) {
      console.error('Error deleting task:', error);
      return { success: false, error: error.message };
    }
  });

  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
