/* Export CSV (lisible par Excel) */
export const download = (name: string, text: string, mime = 'text/csv;charset=utf-8') => {
  const blob = new Blob(['﻿' + text], { type: mime })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = name
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}
export const csv = (rows: unknown[][]) => rows.map(r => r.map(c => {
  const s = String(c == null ? '' : c)
  return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}).join(';')).join('\n')
