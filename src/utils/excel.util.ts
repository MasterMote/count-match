import * as xlsx from 'xlsx'
import type { WorkBook, JSON2SheetOpts, WritingOptions, BookType, WorkSheet } from 'xlsx'

export interface ExcelData<T = any> {
  header: string[]
  results: T[]
  meta: { sheetName: string }
}

export interface JsonToSheet<T = any> {
  data: T[]
  header?: T
  filename?: string
  json2sheetOpts?: JSON2SheetOpts
  write2excelOpts?: WritingOptions
}

export interface AoAToSheet<T = any> {
  data: T[][]
  header?: T[]
  filename?: string
  write2excelOpts?: WritingOptions
}

export interface ExportModalResult {
  filename: string
  bookType: BookType
}

const { utils, read, writeFile } = xlsx
const DEF_FILE_NAME = 'excel.xlsx'

/**
 * 创建一个输入元素，将其类型设置为文件，将其接受属性设置为 .xlsx 和 .xls，然后侦听 onchange 事件。
 * 触发onchange事件时，将文件作为数组缓冲区读取，然后使用xlsx库解析文件
 * @returns 解析为对象数组的 Promise。
 */
export async function importExcel2json() {
  return new Promise((resolve, reject) => {
    const inputEl = document.createElement('input')
    inputEl.style.display = 'none'
    inputEl.type = 'file'
    inputEl.accept = '.xlsx, .xls'
    inputEl.onchange = (e) => {
      const files = e && (e.target as HTMLInputElement).files
      const rawFile = files && files[0] // only setting files[0]
      if (!rawFile) return
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target && e.target.result
          const workbook = read(data, { type: 'array', cellDates: true })
          const excelData = getExcelData(workbook)
          resolve(excelData)
        } catch (err) {
          reject(err)
        }
      }
      reader.readAsArrayBuffer(rawFile)
    }
    document.body.appendChild(inputEl)
    inputEl.click()
  })
}

/**
 * 接受一个工作簿对象并返回一个 ExcelData 对象数组
 * @param {WorkBook} workbook - WorkBook - 这是我们从 xlsx 库中获得的工作簿对象。
 * @returns 对象数组。
 */
function getExcelData(workbook: WorkBook) {
  const excelData: ExcelData[] = []
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName]
    const header: string[] = getHeaderRow(worksheet)
    const results = utils.sheet_to_json(worksheet, {
      raw: true,
    }) as object[]
    excelData.push({
      header,
      results,
      meta: {
        sheetName,
      },
    })
  }
  return excelData
}

/**
 * 接受一个工作表对象并返回一个字符串数组
 * @param {WorkSheet} sheet - WorkSheet - 工作簿中的工作表对象
 * @returns 字符串数组。
 */
function getHeaderRow(sheet: WorkSheet) {
  if (!sheet || !sheet['!ref']) return []
  const headers: string[] = []
  // A3:B7=>{s:{c:0, r:2}, e:{c:1, r:6}}
  const range = utils.decode_range(sheet['!ref'])
  const R = range.s.r
  /* start in the first row */
  for (let C = range.s.c; C <= range.e.c; ++C) {
    /* walk every column in the range */
    const cell = sheet[utils.encode_cell({ c: C, r: R })]
    /* find the cell in the first row */
    let hdr = `UNKNOWN ${C}` // <-- replace with your desired default
    if (cell && cell.t) hdr = utils.format_cell(cell)
    headers.push(hdr)
  }
  return headers
}

/**
 * 接收一个 JSON 数组，将其转换为 Excel 工作表，然后将其写入文件
 * @param  - `data` - 要写入工作表的数据。
 */
export function json2SheetXlsx<T = any>({
  data,
  header,
  filename = DEF_FILE_NAME,
  json2sheetOpts = {},
  write2excelOpts = { bookType: 'xlsx' },
}: JsonToSheet<T>) {
  const arrData = [...data]
  if (header) {
    arrData.unshift(header)
    json2sheetOpts.skipHeader = true
  }

  const worksheet = utils.json_to_sheet(arrData, json2sheetOpts)

  const workbook: WorkBook = {
    SheetNames: [filename],
    Sheets: {
      [filename]: worksheet,
    },
  }

  writeFile(workbook, filename, write2excelOpts)
}

/**
 * 将数组数组转换为 excel 文件。
 * @param  - data - 要写入 excel 文件的数据。
 */
export function aoa2SheetXlsx<T = any>({
  data,
  header,
  filename = DEF_FILE_NAME,
  write2excelOpts = { bookType: 'xlsx' },
}: AoAToSheet<T>) {
  const arrData = [...data]
  if (header) {
    arrData.unshift(header)
  }

  const worksheet = utils.aoa_to_sheet(arrData)

  const workbook: WorkBook = {
    SheetNames: [filename],
    Sheets: {
      [filename]: worksheet,
    },
  }

  writeFile(workbook, filename, write2excelOpts)
}
