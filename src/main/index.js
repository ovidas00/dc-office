import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'node:path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { getDB } from './db'
import { exportToExcel, exportToWord, exportToPDF, getDataFolder } from './utils'
import Seven from 'node-7z'
import { path7za } from '7zip-bin'
import fs from 'node:fs'
import bcrypt from 'bcryptjs'
import os from 'node:os'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      spellcheck: false,
      webgl: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

const db = getDB() // Initialize db

// This method will be called when Electron has finished
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.edulife.dcoffice')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers
ipcMain.handle('get-upazilas', async () => {
  const stmt = db.prepare('SELECT * FROM upazilas')
  const rows = stmt.all()

  return rows
})

ipcMain.handle('add-category', async (event, data) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO categories (name)
      VALUES (?)
    `)

    const result = stmt.run(data.name.trim())

    return { success: true, id: result.lastInsertRowid }
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return { success: false, error: 'Category with this name already exists.' }
    }

    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-categories', async () => {
  const stmt = db.prepare('SELECT * FROM categories')
  const rows = stmt.all()

  return rows
})

ipcMain.handle('update-category', async (event, data) => {
  try {
    const stmt = db.prepare(`
      UPDATE categories
      SET name = ?
      WHERE id = ?
    `)

    const result = stmt.run(data.name.trim(), parseInt(data.id))

    if (result.changes === 0) {
      return { success: false, error: 'Category not found.' }
    }

    return { success: true }
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return { success: false, error: 'Another category with this name already exists.' }
    }

    return { success: false, error: error.message }
  }
})

ipcMain.handle('delete-category', async (event, id) => {
  try {
    const categoryId = parseInt(id)

    const stmt = db.prepare(`
      DELETE FROM categories
      WHERE id = ?
    `)

    const result = stmt.run(categoryId)

    if (result.changes === 0) {
      return { success: false, error: 'Category not found.' }
    }

    return { success: true }
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      return { success: false, error: 'Cannot delete category.' }
    }

    return { success: false, error: error.message }
  }
})

ipcMain.handle('add-application', async (event, data) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO applications (
        name,
        parentName,
        nid,
        contactNumber,
        upazilaId,
        address,
        gender,
        categoryId,
        applicationDate,
        approvalDate,
        disbursementDate,
        paymentType,
        paymentReference
      ) VALUES (
        @name,
        @parentName,
        @nid,
        @contactNumber,
        @upazilaId,
        @address,
        @gender,
        @categoryId,
        @applicationDate,
        @approvalDate,
        @disbursementDate,
        @paymentType,
        @paymentReference
      )
    `)

    const result = stmt.run({
      name: data.name,
      parentName: data.parentName,
      nid: data.nidNumber,
      contactNumber: data.contactNumber,
      upazilaId: parseInt(data.upazila),
      address: data.address,
      gender: data.gender,
      categoryId: parseInt(data.category),
      applicationDate: data.applicationDate ?? new Date().toISOString(),
      approvalDate: data.approvalDate ?? null,
      disbursementDate: data.disbursementDate ?? null,
      paymentType: data.paymentType ?? null,
      paymentReference: data.paymentReference ?? null
    })

    return { success: true, id: result.lastInsertRowid }
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      if (error.message.includes('nid')) {
        return { success: false, error: 'An application with this NID already exists.' }
      } else if (error.message.includes('contactNumber')) {
        return { success: false, error: 'An application with this contact number already exists.' }
      }
    }

    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-applications', async (event, filters = {}) => {
  const { status, searchQuery, categoryId, fromDate, toDate, page = 1, pageSize = 50 } = filters

  const offset = (page - 1) * pageSize

  const conditions = []
  const params = []

  // Status filter
  if (status) {
    conditions.push('a.status = ?')
    params.push(status)
  }

  // Category filter
  if (categoryId) {
    conditions.push('a.categoryId = ?')
    params.push(categoryId)
  }

  // Search filter (name or NID)
  if (searchQuery) {
    const q = `%${searchQuery.toLowerCase()}%`
    conditions.push('(LOWER(a.name) LIKE ? OR LOWER(a.nid) LIKE ?)')
    params.push(q, q)
  }

  // Date range filter (assuming a.createdAt column)
  if (fromDate) {
    conditions.push('DATE(a.applicationDate) >= DATE(?)')
    params.push(fromDate)
  }

  if (toDate) {
    conditions.push('DATE(a.applicationDate) <= DATE(?)')
    params.push(toDate)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Fetch applications
  const applications = db
    .prepare(
      `
      SELECT
        a.*,
        u.name AS upazilaName,
        c.name AS categoryName
      FROM applications a
      LEFT JOIN upazilas u ON a.upazilaId = u.id
      LEFT JOIN categories c ON a.categoryId = c.id
      ${whereClause}
      ORDER BY a.id DESC
      LIMIT ? OFFSET ?
    `
    )
    .all(...params, pageSize, offset)

  // Total count
  const total = db
    .prepare(`SELECT COUNT(*) as count FROM applications a ${whereClause}`)
    .get(...params).count

  return { data: applications, total, page, pageSize }
})

ipcMain.handle('get-application-by-id', async (event, id) => {
  const application = db
    .prepare(
      `
      SELECT
        a.*,
        u.name AS upazilaName,
        c.name AS categoryName
      FROM applications a
      LEFT JOIN upazilas u ON a.upazilaId = u.id
      LEFT JOIN categories c ON a.categoryId = c.id
      WHERE a.id = ?
      LIMIT 1
    `
    )
    .get(id)

  if (!application) {
    return { error: 'Application not found' }
  }

  return { data: application }
})

ipcMain.handle('update-application', async (event, id, formData) => {
  try {
    const {
      masterPassword,
      name,
      parentName,
      nidNumber,
      contactNumber,
      upazila,
      gender,
      category,
      address
    } = formData

    const row = db.prepare('SELECT passwordHash FROM master_password WHERE id = 1').get()
    if (!row) {
      return { success: false, error: 'Master password is not set. Cannot update.' }
    }

    // Verify master password
    const match = await bcrypt.compare(masterPassword || '', row.passwordHash)
    if (!match) {
      return { success: false, error: 'Master password is incorrect' }
    }

    const stmt = db.prepare(`
      UPDATE applications
      SET
        name = ?,
        parentName = ?,
        nid = ?,
        contactNumber = ?,
        upazilaId = ?,
        gender = ?,
        categoryId = ?,
        address = ?
      WHERE id = ?
    `)

    const result = stmt.run(
      name,
      parentName,
      nidNumber,
      contactNumber,
      upazila,
      gender,
      category,
      address,
      id
    )

    if (result.changes === 0) {
      return { success: false, error: 'Application not found' }
    }

    return { success: true }
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      if (error.message.includes('nid')) {
        return { success: false, error: 'Another application with this NID already exists.' }
      } else if (error.message.includes('contactNumber')) {
        return {
          success: false,
          error: 'Another application with this contact number already exists.'
        }
      }
    }

    return { success: false, error: error.message }
  }
})

ipcMain.handle('update-payment', async (event, id, data) => {
  try {
    const {
      masterPassword,
      approvalDate,
      disbursementDate,
      paymentType,
      paymentAmount,
      paymentReference
    } = data

    const row = db.prepare('SELECT passwordHash FROM master_password WHERE id = 1').get()
    if (!row) {
      return { success: false, error: 'Master password is not set. Cannot update payment.' }
    }

    // Verify master password
    const match = await bcrypt.compare(masterPassword || '', row.passwordHash)
    if (!match) {
      return { success: false, error: 'Master password is incorrect' }
    }

    let status = 'pending'
    if (disbursementDate) {
      status = 'disbursed'
    } else if (approvalDate) {
      status = 'approved'
    }

    const stmt = db.prepare(`
      UPDATE applications
      SET
        approvalDate = ?,
        disbursementDate = ?,
        paymentType = ?,
        paymentAmount = ?,
        paymentReference = ?,
        status = ?
      WHERE id = ?
    `)

    const result = stmt.run(
      approvalDate,
      disbursementDate,
      paymentType,
      paymentAmount,
      paymentReference,
      status,
      id
    )

    if (result.changes === 0) {
      return { success: false, error: 'Application not found' }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('delete-application', async (event, id, { masterPassword }) => {
  try {
    const row = db.prepare('SELECT passwordHash FROM master_password WHERE id = 1').get()
    if (!row) {
      return { success: false, error: 'Master password is not set. Cannot delete.' }
    }

    // Verify master password
    const match = await bcrypt.compare(masterPassword || '', row.passwordHash)
    if (!match) {
      return { success: false, error: 'Master password is incorrect' }
    }

    const stmt = db.prepare('DELETE FROM applications WHERE id = ?')
    const result = stmt.run(id)

    if (result.changes === 0) {
      return { success: false, error: 'Application not found' }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('export-applications', async (event, filters) => {
  const { exportType, status, categoryId, fromDate, toDate } = filters
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  const defaultName =
    exportType === 'excel'
      ? `applications-${timestamp}.xlsx`
      : exportType === 'word'
        ? `applications-${timestamp}.docx`
        : `applications-${timestamp}.pdf`

  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save applications export',
    defaultPath: join(app.getPath('downloads'), defaultName)
  })

  if (canceled || !filePath) return { success: false }

  try {
    const conditions = ['DATE(a.applicationDate) >= DATE(?)', 'DATE(a.applicationDate) <= DATE(?)']
    const params = [fromDate, toDate]

    // Optional filters
    if (status) {
      conditions.push('a.status = ?')
      params.push(status)
    }
    if (categoryId) {
      conditions.push('a.categoryId = ?')
      params.push(categoryId)
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ')

    const applications = db
      .prepare(
        `
        SELECT
          a.id,
          a.name,
          a.parentName,
          a.nid,
          a.contactNumber,
          u.name AS upazila,
          a.address,
          a.gender,
          c.name AS category,
          a.status,
          a.applicationDate,
          a.approvalDate,
          a.disbursementDate,
          a.paymentType,
          a.paymentReference
        FROM applications a
        JOIN upazilas u ON a.upazilaId = u.id
        JOIN categories c ON a.categoryId = c.id
        ${whereClause}
        ORDER BY a.applicationDate ASC
        `
      )
      .all(...params)

    if (!applications.length) {
      return { success: false, message: 'No data found for selected filters.' }
    }

    const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : 'N/A')
    const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : '')

    let success = false

    if (exportType === 'excel' || exportType === 'word') {
      const tableData = [
        [
          'ID',
          'Name',
          'Parent Name',
          'NID',
          'Contact Number',
          'Upazila',
          'Address',
          'Gender',
          'Category',
          'Status',
          'Application Date',
          'Approval Date',
          'Disbursement Date',
          'Payment Type',
          'Payment Reference'
        ],
        ...applications.map((app) => [
          app.id,
          app.name,
          app.parentName,
          app.nid,
          app.contactNumber,
          app.upazila,
          app.address,
          app.gender,
          app.category,
          capitalize(app.status),
          formatDate(app.applicationDate),
          formatDate(app.approvalDate),
          formatDate(app.disbursementDate),
          app.paymentType || 'N/A',
          app.paymentReference || 'N/A'
        ])
      ]

      if (exportType === 'excel') {
        await exportToExcel(tableData, filePath)
      } else {
        await exportToWord(tableData, filePath)
      }

      success = true
    } else {
      const tableData = [
        [
          '#',
          'Name',
          'NID',
          'Contact No.',
          'Upazila',
          'Category',
          'App. Date',
          'Appr. Date',
          'Dis. Date',
          'P. Type'
        ],
        ...applications.map((app) => [
          app.id,
          app.name,
          app.nid,
          app.contactNumber,
          app.upazila,
          app.category,
          formatDate(app.applicationDate),
          formatDate(app.approvalDate),
          formatDate(app.disbursementDate),
          app.paymentType || 'N/A'
        ])
      ]

      success = await exportToPDF({
        outDir: filePath,
        tableData,
        columnWidths: [40, '*', 100, 85, 75, 70, 65, 65, 65, 65],
        fromDate,
        toDate
      })
    }

    return { success, filePath }
  } catch (err) {
    console.error('Export failed:', err)
    return { success: false }
  }
})

ipcMain.handle('get-dashboard-stats', async (event) => {
  const db = getDB()

  // Compute fiscal year start & end
  const today = new Date()
  const year = today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1
  const startDate = `${year}-07-01`
  const endDate = `${year + 1}-06-30`

  // Overall totals within fiscal year
  const totals = db
    .prepare(
      `
      SELECT
        COUNT(*) AS totalApplications,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS totalApproved,
        SUM(CASE WHEN status = 'disbursed' THEN 1 ELSE 0 END) AS totalDisbursement,
        COALESCE(SUM(CASE WHEN status = 'disbursed' THEN paymentAmount ELSE 0 END), 0) AS totalAmount
      FROM applications
      WHERE DATE(applicationDate) BETWEEN ? AND ?
    `
    )
    .get(startDate, endDate)

  // Stats grouped by upazila within fiscal year
  const byUpazila = db
    .prepare(
      `
      SELECT 
        u.id AS upazilaId,
        u.name AS upazilaName,
        COUNT(a.id) AS totalApplications,
        SUM(CASE WHEN a.status = 'approved' THEN 1 ELSE 0 END) AS totalApproved,
        SUM(CASE WHEN a.status = 'disbursed' THEN 1 ELSE 0 END) AS totalDisbursement,
        COALESCE(SUM(CASE WHEN a.status = 'disbursed' THEN a.paymentAmount ELSE 0 END), 0) AS totalAmount
      FROM upazilas u
      LEFT JOIN applications a 
        ON a.upazilaId = u.id AND DATE(a.applicationDate) BETWEEN ? AND ?
      GROUP BY u.id, u.name
      ORDER BY u.name
    `
    )
    .all(startDate, endDate)

  // Latest 10 disbursed applications within fiscal year
  const latestDisbursed = db
    .prepare(
      `
      SELECT 
        a.id,
        a.name,
        a.nid,
        a.contactNumber,
        a.upazilaId,
        u.name AS upazilaName,
        a.paymentAmount,
        a.disbursementDate
      FROM applications a
      LEFT JOIN upazilas u ON a.upazilaId = u.id
      WHERE a.status = 'disbursed' 
        AND a.disbursementDate BETWEEN ? AND ?
      ORDER BY a.disbursementDate DESC
      LIMIT 10
    `
    )
    .all(startDate, endDate)

  // Normalize numeric fields
  const normalized = byUpazila.map((u) => ({
    ...u,
    totalApplications: u.totalApplications || 0,
    totalApproved: u.totalApproved || 0,
    totalDisbursement: u.totalDisbursement || 0,
    totalAmount: u.totalAmount || 0
  }))

  return { totals, byUpazila: normalized, latestDisbursed }
})

ipcMain.handle('start-backup', async (event, password = null) => {
  const dbPath = join(getDataFolder(), 'app.db')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save Database Backup',
    defaultPath: join(app.getPath('downloads'), `dc-office-${timestamp}.7z`),
    filters: [{ name: '7zip Archive', extensions: ['7z'] }]
  })

  if (canceled || !filePath) return { success: false, canceled: true }

  try {
    if (!fs.existsSync(dbPath)) throw new Error('Database file not found.')

    let bin

    if (app.isPackaged) {
      const nm = path7za.indexOf('node_modules')
      const relative = path7za.slice(nm + 'node_modules'.length + 1)
      bin = join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', relative)
    } else {
      bin = path7za
    }

    const options = {
      $bin: bin,
      password: password || undefined
    }

    const tempDir = join(os.tmpdir(), `backup-temp-${Date.now()}`)
    fs.mkdirSync(tempDir, { recursive: true })
    const tempDbPath = join(tempDir, 'app.db')
    fs.copyFileSync(dbPath, tempDbPath)

    await new Promise((resolve, reject) => {
      const archive = Seven.add(filePath, tempDbPath, options)

      archive.on('end', resolve)
      archive.on('error', reject)
    })

    return { success: true, path: filePath }
  } catch (err) {
    console.error('Backup failed:', err)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('update-master-password', async (event, oldPassword, newPassword) => {
  try {
    const row = db.prepare('SELECT passwordHash FROM master_password WHERE id = 1').get()

    // Hash the new password
    const newHash = await bcrypt.hash(newPassword, 10)

    if (!row) {
      db.prepare(
        `
        INSERT INTO master_password (id, passwordHash, updatedAt)
        VALUES (1, ?, ?)
      `
      ).run(newHash, new Date().toISOString())

      return { success: true, message: 'Master password set successfully' }
    }

    // If password exists, verify old password
    const match = await bcrypt.compare(oldPassword, row.passwordHash)
    if (!match) {
      return { success: false, error: 'Old password is incorrect' }
    }

    // Update existing password
    db.prepare(
      `
      UPDATE master_password
      SET passwordHash = ?, updatedAt = ?
      WHERE id = 1
    `
    ).run(newHash, new Date().toISOString())

    return { success: true, message: 'Master password updated successfully' }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
