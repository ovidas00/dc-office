import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import PDFDocument from 'pdfkit'
import ExcelJs from 'exceljs'
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType } from 'docx'
import { TableLayoutType } from 'docx'
import { PageOrientation } from 'docx'

export const getDataFolder = () => {
  let basePath

  switch (process.platform) {
    case 'win32':
      basePath = process.env.LOCALAPPDATA || path.join(app.getPath('home'), 'AppData', 'Local')
      break
    case 'darwin':
      basePath = path.join(app.getPath('home'), 'Library', 'Application Support')
      break
    case 'linux':
    default:
      basePath = process.env.XDG_DATA_HOME || path.join(app.getPath('home'), '.local', 'share')
      break
  }

  const folder = path.join(basePath, app.getName())

  // Ensure folder exists
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true })
  }

  return folder
}

export function exportToPDF({ tableData = [], columnWidths = [], outDir, fromDate, toDate } = {}) {
  return new Promise((resolve) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, left: 50, right: 50, bottom: 50 },
        layout: 'landscape'
      })

      doc.registerFont(
        'IBMPlexSans-Regular',
        path.join(process.cwd(), 'src/main/assets/fonts/IBMPlexSans-Regular.ttf')
      )

      doc.registerFont(
        'NotoSansBengali-Regular',
        path.join(process.cwd(), 'src/main/assets/fonts/NotoSansBengali-Regular.ttf')
      )

      const stream = fs.createWriteStream(outDir)
      doc.pipe(stream)
      doc.font('IBMPlexSans-Regular')

      // Generated date
      const now = new Date()
      doc
        .fontSize(9)
        .fillColor('#555555')
        .text(
          'Generated: ' +
            now.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }),
          { align: 'right' }
        )
        .moveDown(0.2)

      doc
        .fontSize(8)
        .fillColor('#666666')
        .text(
          'Date: ' +
            new Date(fromDate).toLocaleDateString() +
            ' - ' +
            new Date(toDate).toLocaleDateString(),
          { align: 'right' }
        )

      doc.moveDown(0.5)

      // Table
      if (tableData.length) {
        doc
          .moveDown(2)
          .font('NotoSansBengali-Regular')
          .fontSize(10)
          .text(`Total Items (${tableData.length - 1})`)
          .moveDown(0.5)

        doc.fontSize(10).table({
          defaultStyle: { border: 0.5 },
          rowStyles: (i) => (i === 0 ? { backgroundColor: 'black', textColor: 'white' } : {}),
          columnStyles: columnWidths,
          data: tableData
        })
      }

      doc.end()

      stream.on('finish', () => resolve(true))
      stream.on('error', (err) => {
        console.error('Stream error:', err)
        resolve(false)
      })
    } catch (err) {
      console.error('PDF generation error:', err)
      resolve(false)
    }
  })
}

export async function exportToExcel(tableData = [], outPath) {
  const workbook = new ExcelJs.Workbook()
  const sheet = workbook.addWorksheet('DC Office Applications')

  // Add rows
  tableData.forEach((row) => sheet.addRow(row))

  if (tableData.length > 0) {
    const headerRow = sheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.alignment = { horizontal: 'center' }
  }

  sheet.columns.forEach((column, i) => {
    let maxLength = 0
    column.eachCell({ includeEmpty: true }, (cell) => {
      const cellValue = cell.value ? cell.value.toString() : ''
      maxLength = Math.max(maxLength, cellValue.length)
    })
    // Add some padding
    column.width = maxLength + 2
  })

  // Save file
  await workbook.xlsx.writeFile(outPath)
  return outPath
}

export async function exportToWord(tableData = [], outPath) {
  const columnCount = tableData[0]?.length || 1
  const columnWidthPercent = Math.floor(100 / columnCount)

  const tableRows = tableData.map(
    (row, rowIndex) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              width: {
                size: columnWidthPercent,
                type: WidthType.PERCENTAGE
              },
              children: [
                new Paragraph({
                  text: cell ? cell.toString() : '',
                  bold: rowIndex === 0
                })
              ]
            })
        )
      })
  )

  const table = new Table({
    rows: tableRows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    },
    layout: TableLayoutType.FIXED
  })

  const doc = new Document({
    creator: 'DC Office',
    title: 'Applications',
    description: 'Exported application data',
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE
            },
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720
            }
          }
        },
        children: [table]
      }
    ]
  })

  const buffer = await Packer.toBuffer(doc)
  fs.writeFileSync(outPath, buffer)

  return outPath
}
