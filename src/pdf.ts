import { allocationStatusHistory, money, totals } from './core';
import type { Job } from './types';

/**
 * PDF strings are encoded as UTF-16BE hex strings. The previous ASCII-only
 * conversion silently changed names such as Café 改装 into question marks.
 * A BOM makes the text portable to PDF consumers and keeps the source text
 * intact for copy/search/accessibility tools.
 */
function pdfText(value: string): string {
  let hex = 'FEFF';
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    hex += unit.toString(16).padStart(4, '0').toUpperCase();
  }
  return `<${hex}>`;
}

function wrap(value: string, width = 78): string[] {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  words.forEach((word) => {
    if (`${line} ${word}`.trim().length > width) { if (line) lines.push(line); line = word; }
    else line = `${line} ${word}`.trim();
  });
  if (line) lines.push(line);
  return lines;
}

export function jobPdf(job: Job): ArrayBuffer {
  const t = totals(job);
  const lines = [
    'SCOPE DEPOSIT ALLOCATION TRAIL', '',
    `Job: ${job.title}`, `Client: ${job.client}`,
    `Reference: ${job.reference || '-'}`, `Deposit received: ${job.receivedDate}`,
    `Original deposit: ${money(job.deposit, job.currency)}`, '',
    'ALLOCATION TRAIL',
    ...job.allocations.flatMap((a, i) => [
      `${i + 1}. ${a.title} — ${money(a.amount, job.currency)}`,
      `   Status: ${a.status.toUpperCase()} | Status date: ${a.statusDate || '-'} | Due: ${a.dueDate || '-'}`,
      `   Status trail: ${allocationStatusHistory(a).map((event) => `${event.status} ${event.date}`).join(' → ')}`,
      ...(a.note ? wrap(`   Note: ${a.note}`, 86) : [])
    ]), '',
    `Still held: ${money(t.held, job.currency)}`,
    `Earned / billable: ${money(t.earned, job.currency)}`,
    `Returned: ${money(t.returned, job.currency)}`,
    `Not yet allocated: ${money(t.unallocated, job.currency)}`, '',
    `Tax jurisdiction / assumption: ${job.jurisdiction || 'Not specified by the operator.'}`,
    ...(job.notes ? ['', ...wrap(`Scope note: ${job.notes}`)] : []), '',
    'This is a factual scope-allocation record. It is not an invoice, receipt,',
    'tax calculation, general ledger, or accounting advice.', '',
    `Generated locally on ${new Date().toLocaleDateString()} by Scope Deposit Ledger.`
  ];

  const pageChunks: string[][] = [];
  for (let i = 0; i < lines.length; i += 48) pageChunks.push(lines.slice(i, i + 48));
  const objects: string[] = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  const pageIds = pageChunks.map((_, i) => 4 + i * 2);
  objects.push(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  pageChunks.forEach((chunk, i) => {
    const pageId = 4 + i * 2;
    const contentId = pageId + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
    const commands = ['BT', '/F1 10 Tf', '54 742 Td', '14 TL'];
    chunk.forEach((line, lineIndex) => {
      if (lineIndex > 0) commands.push('T*');
      commands.push(`${pdfText(line)} Tj`);
    });
    commands.push('ET');
    const stream = commands.join('\n');
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });

  let output = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(output.length);
    output += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = output.length;
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { output += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(output).buffer as ArrayBuffer;
}
