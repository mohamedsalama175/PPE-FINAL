/**
 * PDF / Printable Report Service for Employee Timeline (PPE-043)
 */
import { Employee, Issuance, PPEItem } from '../types';
import { format } from 'date-fns';

export function exportEmployeeTimelinePdf({
  employee,
  issuances,
  items
}: {
  employee: Employee;
  issuances: Issuance[];
  items: PPEItem[];
}) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate the PDF report.');
    return;
  }

  const sorted = [...issuances].sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

  const rowsHtml = sorted.map((iss) => {
    const item = items.find(i => i.id === iss.ppeItemId);
    const itemName = item ? `${item.nameEn} (${item.itemCode})` : (iss.kitId ? 'Job Position Kit' : 'PPE Item');
    const issueDateStr = iss.issueDate ? format(new Date(iss.issueDate), 'yyyy-MM-dd') : '-';
    const replaceDateStr = iss.expectedReplacementDate ? format(new Date(iss.expectedReplacementDate), 'yyyy-MM-dd') : (iss.expectedReturnDate ? format(new Date(iss.expectedReturnDate), 'yyyy-MM-dd') : '-');

    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace; font-size: 11px;">${iss.reference || iss.id}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 12px; font-weight: 500;">${itemName}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-size: 12px;">${iss.quantity}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 12px;">${issueDateStr}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 12px;">${replaceDateStr}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-size: 11px; text-transform: uppercase;">
          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: bold; background: ${iss.status === 'issued' ? '#dcfce7; color: #166534;' : '#f3f4f6; color: #4b5563;'}">${iss.status}</span>
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
          ${iss.receiverSignature ? `<img src="${iss.receiverSignature}" style="max-height: 35px; max-width: 90px; border: 1px solid #eee;" alt="Sign" />` : '<span style="color:#999;font-size:10px;">Not captured</span>'}
        </td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>PPE Issuance Timeline - ${employee.name} (${employee.employeeCode})</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111827; margin: 30px; }
          .header { border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
          .meta { font-size: 11px; color: #6b7280; text-align: right; }
          .employee-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin-bottom: 25px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
          .label { font-size: 10px; font-weight: bold; color: #6b7280; text-transform: uppercase; margin-bottom: 3px; }
          .val { font-size: 13px; font-weight: 600; color: #111827; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f3f4f6; border: 1px solid #ddd; padding: 8px; font-size: 11px; text-transform: uppercase; font-weight: 700; text-align: left; }
          .footer { margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 15px; font-size: 11px; color: #666; display: flex; justify-content: space-between; }
          @media print {
            body { margin: 15mm; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 15px; text-align: right;">
          <button onclick="window.print()" style="background: #2563eb; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 600; cursor: pointer;">Print / Save as PDF</button>
        </div>
        <div class="header">
          <div>
            <div class="title">PPE ISSUANCE TIMELINE & AUDIT RECORD</div>
            <div style="font-size: 12px; color: #4b5563; margin-top: 2px;">BITWISE Health, Safety & Environment Management System</div>
          </div>
          <div class="meta">
            <div>Report Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}</div>
            <div>Compliance Standard: ISO 45001 / EN 397</div>
          </div>
        </div>

        <div class="employee-card">
          <div>
            <div class="label">Employee Name</div>
            <div class="val">${employee.name}</div>
          </div>
          <div>
            <div class="label">Employee Code</div>
            <div class="val" style="font-family: monospace;">${employee.employeeCode}</div>
          </div>
          <div>
            <div class="label">Department / Site</div>
            <div class="val">${employee.department || 'Operations'} / ${employee.site || 'Main Campus'}</div>
          </div>
          <div>
            <div class="label">Status</div>
            <div class="val">${employee.status || 'Active'}</div>
          </div>
        </div>

        <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">PPE Transaction & Custody Log</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 15%;">Reference</th>
              <th style="width: 30%;">PPE Item</th>
              <th style="width: 8%; text-align: center;">Qty</th>
              <th style="width: 12%;">Issue Date</th>
              <th style="width: 12%;">Replacement Due</th>
              <th style="width: 11%; text-align: center;">Status</th>
              <th style="width: 12%; text-align: center;">Signature</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #6b7280;">No PPE issuances recorded for this employee.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <div>Verified By HSE Department</div>
          <div>Page 1 of 1 &middot; Immutable Record</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

