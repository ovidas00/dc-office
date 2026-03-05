import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getUpazilas: () => ipcRenderer.invoke('get-upazilas'),
  addCategory: (data) => ipcRenderer.invoke('add-category', data),
  getCategories: () => ipcRenderer.invoke('get-categories'),
  updateCategory: (data) => ipcRenderer.invoke('update-category', data),
  deleteCategory: (id) => ipcRenderer.invoke('delete-category', id),
  addApplication: (data) => ipcRenderer.invoke('add-application', data),
  getApplications: (filters) => ipcRenderer.invoke('get-applications', filters),
  getApplicationById: (id) => ipcRenderer.invoke('get-application-by-id', id),
  updateApplication: (id, data) => ipcRenderer.invoke('update-application', id, data),
  updatePayment: (id, data) => ipcRenderer.invoke('update-payment', id, data),
  deleteApplication: (id, data) => ipcRenderer.invoke('delete-application', id, data),
  exportApplications: (filters) => ipcRenderer.invoke('export-applications', filters),
  getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),
  startBackup: (password = null) => ipcRenderer.invoke('start-backup', password),
  updateMasterPassword: (oldPassword, newPassword) =>
    ipcRenderer.invoke('update-master-password', oldPassword, newPassword)
})
