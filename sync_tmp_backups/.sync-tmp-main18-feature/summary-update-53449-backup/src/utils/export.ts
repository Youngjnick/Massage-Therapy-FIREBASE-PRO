// Utility to export data as CSV
export function exportToCSV(filename: string, rows: any[]) {
  if (!rows.length) return;
  const replacer = (key: string, value: any) => value === null ? '' : value;
  const header = Object.keys(rows[0]);
  const csv = [
    header.join(','),
    ...rows.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
  ].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Utility to export data as a simple PDF (text table)
export async function exportToPDF(filename: string, rows: any[]) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  if (!rows.length) return;
  const header = Object.keys(rows[0]);
  let y = 10;
  doc.text(header.join(' | '), 10, y);
  y += 8;
  rows.forEach(row => {
    doc.text(header.map(h => String(row[h])).join(' | '), 10, y);
    y += 8;
    if (y > 280) { doc.addPage(); y = 10; }
  });
  doc.save(filename);
}
