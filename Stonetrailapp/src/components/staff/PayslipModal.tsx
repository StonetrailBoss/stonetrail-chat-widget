/**
 * PayslipModal — compact single-page payslip with PDF download.
 *
 * UI (screen modal):
 *  - No rounded corners on cards/tables — sharp, document-like
 *  - Section labels (Earnings, Deductions, Payment Check) are plain text, no colored badges
 *  - "NOT VALID FOR DEPOSIT" banner on the check section
 *
 * PDF printout:
 *  - Same sharp/flat aesthetic
 *  - "DIRECT DEPOSIT" watermark scoped to check section only
 *  - "NOT VALID FOR DEPOSIT" printed prominently on the check
 *  - Fits on one letter-size page
 */
import { useRef, useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import type { PayslipData } from '@/pages/staff/timeclock';

interface Props {
  data: PayslipData;
  onClose: () => void;
}

// ── Brand colors ──────────────────────────────────────────────────────────────
const BLUE      = '#C3E1F3';   // light blue — check background/accent
const BLUE_DARK = '#1A5276';   // dark blue — check text/borders
const SLATE     = '#36393D';   // payslip (non-check) primary color
const TAN   = '#8B7355';
const CREAM = '#F5F0E8';
const GOLD  = '#C8B89A';

const fmt = (n: number | string) =>
  `EC$ ${parseFloat(String(n)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const maskAccount = (acct: string | null) => {
  if (!acct) return '—';
  if (acct.length <= 3) return '***';
  return acct.slice(0, -3) + '***';
};

function numberToWords(n: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (n === 0) return 'Zero';
  const chunk = (num: number): string => {
    if (num === 0) return '';
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? '-' + ones[num % 10] : '');
    return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + chunk(num % 100) : '');
  };
  const dollars = Math.floor(n);
  const cents = Math.round((n - dollars) * 100);
  let result = '';
  if (dollars >= 1000000) result += chunk(Math.floor(dollars / 1000000)) + ' Million ';
  if (dollars >= 1000) result += chunk(Math.floor((dollars % 1000000) / 1000)) + ' Thousand ';
  result += chunk(dollars % 1000);
  result = result.trim();
  return result + (cents > 0 ? ` and ${cents}/100` : ' and 00/100');
}

async function toDataUrl(src: string): Promise<string> {
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

export default function PayslipModal({ data, onClose }: Props) {
  const slipRef = useRef<HTMLDivElement>(null);
  const { payslip: p, ytd } = data;

  // Defensive coercions — MySQL decimal columns arrive as strings over JSON
  const regularHours    = isFinite(parseFloat(String(p.regularHours)))    ? parseFloat(String(p.regularHours))    : 0;
  const overtimeHours   = isFinite(parseFloat(String(p.overtimeHours)))   ? parseFloat(String(p.overtimeHours))   : 0;
  const holidayHours    = isFinite(parseFloat(String((p as any).holidayHours)))  ? parseFloat(String((p as any).holidayHours))  : 0;
  const regularPay      = isFinite(parseFloat(String(p.regularPay)))      ? parseFloat(String(p.regularPay))      : 0;
  const overtimePay     = isFinite(parseFloat(String(p.overtimePay)))     ? parseFloat(String(p.overtimePay))     : 0;
  const holidayPay      = isFinite(parseFloat(String((p as any).holidayPay)))    ? parseFloat(String((p as any).holidayPay))    : 0;
  const grossPay        = isFinite(parseFloat(String(p.grossPay)))        ? parseFloat(String(p.grossPay))        : 0;
  const netPay          = isFinite(parseFloat(String(p.netPay)))          ? parseFloat(String(p.netPay))          : 0;
  const nisEmployee     = isFinite(parseFloat(String(p.nisEmployee)))     ? parseFloat(String(p.nisEmployee))     : 0;
  const nisEmployer     = isFinite(parseFloat(String(p.nisEmployer)))     ? parseFloat(String(p.nisEmployer))     : 0;
  const payeTax         = isFinite(parseFloat(String(p.payeTax)))         ? parseFloat(String(p.payeTax))         : 0;
  const totalDeductions = isFinite(parseFloat(String(p.totalDeductions))) ? parseFloat(String(p.totalDeductions)) : 0;
  const hourlyRate      = isFinite(parseFloat(String(p.hourlyRate)))      ? parseFloat(String(p.hourlyRate))      : 0;

  // Custom deductions (garnishments, personal, etc.)
  const customDeductions: { id: number; label: string; amount: number }[] =
    Array.isArray((p as any).customDeductions) ? (p as any).customDeductions : [];

  // NIS rates — returned by the payslip API when available, else derive from insurable earnings
  const allowances     = isFinite(parseFloat(String(p.allowances)))      ? parseFloat(String(p.allowances))      : 0;
  const insurableEarnings = Math.max(grossPay - allowances, 0); // NIS is on gross excl. allowances
  const nisEmployeeRatePct = isFinite(parseFloat(String((p as any).nisEmployeeRate)))
    ? (parseFloat(String((p as any).nisEmployeeRate)) * 100).toFixed(2)
    : (nisEmployee > 0 && insurableEarnings > 0) ? ((nisEmployee / insurableEarnings) * 100).toFixed(2) : '6.50';
  const nisEmployerRatePct = isFinite(parseFloat(String((p as any).nisEmployerRate)))
    ? (parseFloat(String((p as any).nisEmployerRate)) * 100).toFixed(2)
    : (nisEmployer > 0 && insurableEarnings > 0) ? ((nisEmployer / insurableEarnings) * 100).toFixed(2) : '7.00';

  // Safe YTD reader — guards against undefined fields
  const y = (val: number | undefined) => (isFinite(val as number) ? (val as number) : 0);

  const nisExempt = !!(p.nisExempt);
  const ytdYear = new Date(p.payPeriodStart).getFullYear();
  const periodStart = p.payPeriodStart.slice(0, 10);
  const periodEnd   = p.payPeriodEnd.slice(0, 10);
  const generatedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const otMultiplier = p.overtimeMultiplier ?? 1;

  // Format "2026-04-26" → "April 26th, 2026"
  const fmtLongDate = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const day = d;
    const suffix = day === 1 || day === 21 || day === 31 ? 'st'
                 : day === 2 || day === 22 ? 'nd'
                 : day === 3 || day === 23 ? 'rd' : 'th';
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    return `${month} ${day}${suffix}, ${y}`;
  };
  const periodStartLong = fmtLongDate(periodStart);
  const periodEndLong   = fmtLongDate(periodEnd);
  const showYtd = !!ytd;

  const [logoDataUrl, setLogoDataUrl] = useState('');

  useEffect(() => {
    toDataUrl('/assets/Nlogo.png').then(setLogoDataUrl);
  }, []);

  async function downloadPDF() {
    const win = window.open('', '_blank', 'width=860,height=1100');
    if (!win) { alert('Please allow popups to download the payslip PDF.'); return; }

    const logo   = logoDataUrl || await toDataUrl('/assets/Nlogo.png');


    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pay Statement - ${p.employeeName} - ${p.payPeriodEnd ? String(p.payPeriodEnd).slice(0, 10) : 'unknown'}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter','Segoe UI',system-ui,Arial,sans-serif;font-size:10.5px;color:#1a1a1a;background:#fff;padding:24px 28px}

    /* ── HEADER ── */
    .header{display:flex;justify-content:space-between;align-items:center;
      background:${CREAM};border-bottom:2px solid ${SLATE};
      padding:10px 14px;margin:-24px -28px 14px;
    }
    .logo-wrap{display:flex;align-items:center;gap:10px}
    .logo-wrap img{height:80px;width:auto;object-fit:contain}
    .company-name{font-size:16px;font-weight:800;color:${SLATE}}
    .company-sub{font-size:9px;color:${TAN};margin-top:1px}
    .slip-badge{background:transparent;color:${SLATE};padding:5px 12px;text-align:right}
    .slip-badge-title{font-size:13px;font-weight:700;letter-spacing:2px}
    .slip-badge-sub{font-size:9px;opacity:0.75;margin-top:1px}

    /* ── EMPLOYEE CARD ── */
    .emp-card{background:${CREAM};border:1px solid ${GOLD};
      padding:7px 12px;margin-bottom:10px;display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px}
    .field-label{font-size:8px;color:${TAN};text-transform:uppercase;letter-spacing:0.6px}
    .field-value{font-size:11px;font-weight:700;color:#1a1a1a;margin-top:1px}

    /* ── SECTION LABEL (plain, no badge) ── */
    .section-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;
      color:${SLATE};border-bottom:1px solid #ccc;padding-bottom:3px;margin-bottom:6px;margin-top:10px}

    /* ── TABLES ── */
    table{width:100%;border-collapse:collapse;margin-bottom:10px}
    th{text-align:left;font-size:8px;color:${TAN};text-transform:uppercase;letter-spacing:0.4px;
      padding:4px 6px;border-bottom:1.5px solid ${GOLD};background:${CREAM}}
    th:not(:first-child){text-align:right}
    td{padding:4px 6px;font-size:10.5px;border-bottom:1px solid #f0ece4}
    td:not(:first-child){text-align:right}
    tr:last-child td{border-bottom:none}
    .subtotal td{font-weight:700;background:${CREAM};color:${SLATE}}
    .deduct td:nth-child(3){color:#c0392b}
    .deduct td:nth-child(4){color:${SLATE};font-style:italic}
    .ytd{color:${SLATE}!important;font-style:italic}

    /* ── NET PAY BOX ── */
    .net-box{background:${SLATE};color:#fff;padding:8px 14px;
      display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
    .net-label{font-size:10px;font-weight:600;opacity:0.85}
    .net-amount{font-size:20px;font-weight:800}
    .net-ytd-label{font-size:8px;opacity:0.6;text-transform:uppercase;letter-spacing:0.4px}
    .net-ytd-val{font-size:14px;font-weight:700;opacity:0.9;text-align:right}

    /* ── NIS NOTE ── */
    .nis-note{background:#fffbeb;border:1px solid #f59e0b;
      padding:5px 10px;font-size:9px;color:#92400e;margin-bottom:8px}

    /* ── TAX NOTE ── */
    .tax-note{background:${CREAM};border-left:3px solid ${TAN};padding:6px 10px;
      font-size:9px;color:#555;margin-bottom:12px}

    /* ── CHECK ── */
    .check-section{position:relative;overflow:hidden}
    .check-watermark{
      position:absolute;top:50%;left:50%;
      transform:translate(-50%,-50%) rotate(-35deg);
      font-size:64px;font-weight:900;letter-spacing:6px;
      color:${BLUE_DARK};opacity:0.07;white-space:nowrap;pointer-events:none;
      z-index:0;user-select:none;
    }
    .check-wrap{border:2px solid ${BLUE_DARK};overflow:hidden;
      font-family:'Courier New',monospace;background:#fffef8;position:relative;z-index:1}
    .check-invalid{background:#b91c1c;color:#fff;text-align:center;
      font-size:9px;font-weight:800;letter-spacing:2px;padding:3px 0;text-transform:uppercase}
    .check-header{background:${BLUE};color:${BLUE_DARK};display:flex;justify-content:space-between;
      align-items:center;padding:7px 12px}
    .check-header-logo{display:flex;align-items:center;gap:8px}
    .check-header-logo img{height:26px;width:auto;object-fit:contain}
    .check-co{font-size:12px;font-weight:700;color:${BLUE_DARK}}
    .check-co-sub{font-size:8px;color:${TAN}}
    .check-no-wrap{text-align:right}
    .check-no-label{font-size:8px;color:${TAN};text-transform:uppercase;letter-spacing:0.4px}
    .check-no{font-size:12px;font-weight:700;color:${BLUE_DARK}}
    .check-date{font-size:9px;color:${BLUE_DARK};margin-top:1px}
    .check-payto{display:flex;align-items:flex-end;gap:8px;padding:8px 12px;border-bottom:1px dashed ${GOLD}}
    .check-label{font-size:8px;color:${TAN};text-transform:uppercase;letter-spacing:0.4px;white-space:nowrap}
    .check-line{flex:1;border-bottom:1px solid #666;padding-bottom:1px;font-size:12px;font-weight:700;color:#1a1a1a}
    .check-amt-box{border:2px solid ${BLUE_DARK};padding:3px 10px;
      font-size:13px;font-weight:800;white-space:nowrap;background:${BLUE};color:${BLUE_DARK}}
    .check-words{display:flex;align-items:flex-end;gap:8px;padding:5px 12px;border-bottom:1px dashed ${GOLD}}
    .check-words-line{flex:1;border-bottom:1px solid #aaa;padding-bottom:1px;font-size:10px;font-style:italic;color:#333}
    .check-bottom{display:flex;justify-content:space-between;align-items:flex-end;padding:8px 12px}
    .check-bank{font-size:10px;line-height:1.8}
    .check-bank span{color:${TAN};font-size:8px;text-transform:uppercase;letter-spacing:0.4px}
    .check-sig-wrap{text-align:right;min-width:160px}
    .check-sig-name{font-family:"Brush Script MT","Brush Script Std",cursive;font-style:normal;font-size:19px;color:${BLUE_DARK};letter-spacing:0.5px;height:40px;display:flex;align-items:flex-end;justify-content:flex-end;margin-bottom:2px}
    .check-sig-line{border-top:1px solid ${BLUE_DARK};padding-top:3px;font-size:8px;color:#999;
      text-transform:uppercase;letter-spacing:0.4px;margin-top:3px}
    .check-micr{background:#f5f5f5;border-top:1px solid #ddd;padding:4px 12px;
      display:flex;justify-content:space-between;font-size:9px;color:#999;letter-spacing:1.5px}

    .footer{text-align:center;font-size:9px;color:#aaa;padding-top:8px;
      border-top:1px solid ${GOLD};margin-top:10px}
    @media print{
      @page{size:letter;margin:0.5in}
      body{padding:0}
      .header{margin:0 0 14px}
    }
  </style>
</head>
<body>
  <!-- HEADER -->
  <div class="header">
    <div class="logo-wrap">
      ${logo ? `<img src="${logo}" alt="Stonetrail Villas logo">` : ''}
      <div>
        <div class="company-name">Stonetrail Villas</div>
        <div class="company-sub">Boutique Luxury Hotel · St. Vincent &amp; the Grenadines</div>
      </div>
    </div>
    <div class="slip-badge">
      <div class="slip-badge-title">Employee Payment Statement</div>
      <div class="slip-badge-sub">${periodStartLong} – ${periodEndLong}</div>
      <div class="slip-badge-sub" style="opacity:0.55;font-size:8px">Generated: ${generatedDate}</div>
    </div>
  </div>

  <!-- EMPLOYEE INFO ROW -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:0;font-size:10.5px">
    <tbody>
      <tr>
        <td style="padding:4px 8px;border:1px solid #ccc;font-weight:600;color:#555;width:14%">Employee</td>
        <td style="padding:4px 8px;border:1px solid #ccc;width:22%">${p.employeeName}</td>
        <td style="padding:4px 8px;border:1px solid #ccc;font-weight:600;color:#555;width:12%">department</td>
        <td style="padding:4px 8px;border:1px solid #ccc;width:20%">${p.department}</td>
        <td style="padding:4px 8px;border:1px solid #ccc;font-weight:600;color:#555;width:12%">position</td>
        <td style="padding:4px 8px;border:1px solid #ccc;width:10%">${p.position}</td>
        <td style="padding:4px 8px;border:1px solid #ccc;font-weight:600;color:#555;width:10%">hourly rate</td>
        <td style="padding:4px 8px;border:1px solid #ccc">${fmt(hourlyRate)}</td>
      </tr>
    </tbody>
  </table>

  <!-- EARNINGS + DEDUCTIONS TABLE -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:10px;border:1px solid #ccc;border-top:none;font-size:10.5px">
    <thead>
      <!-- Section headings -->
      <tr>
        <td colspan="3" style="text-align:center;padding:5px 0;font-size:13px;font-weight:700;border-bottom:1px solid #ccc;border-right:1px solid #ccc;width:40%">Earnings</td>
        <td colspan="3" style="text-align:center;padding:5px 0;font-size:13px;font-weight:700;border-bottom:1px solid #ccc;width:60%">Deductions</td>
      </tr>
      <!-- Sub-headers -->
      <tr style="font-size:8px;font-weight:600">
        <th style="text-align:left;padding:3px 8px;border-bottom:1px solid #ccc;border-right:1px solid #ccc;width:18%"></th>
        <th style="text-align:right;padding:3px 8px;border-bottom:1px solid #ccc;border-right:1px solid #ccc;color:${SLATE};width:11%">Current Period</th>
        <th style="text-align:right;padding:3px 8px;border-bottom:1px solid #ccc;border-right:2px solid #ccc;color:#c0392b;width:11%">YTD</th>
        <th style="text-align:left;padding:3px 8px;border-bottom:1px solid #ccc;border-right:1px solid #ccc;width:18%"></th>
        <th style="text-align:right;padding:3px 8px;border-bottom:1px solid #ccc;border-right:1px solid #ccc;color:${SLATE};width:21%">Current Period</th>
        <th style="text-align:right;padding:3px 8px;border-bottom:1px solid #ccc;color:#c0392b;width:21%">YTD</th>
      </tr>
    </thead>
    <tbody>
      <!-- Regular hours | NIS -->
      <tr>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;color:#555">Regular hours</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;text-align:right">${regularHours.toFixed(2)}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:2px solid #ccc;text-align:right">${showYtd ? (ytd!.regularHours ?? 0).toFixed(2) : ''}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;color:#555">NIS <span style="color:#999;font-size:9px">(${nisEmployeeRatePct}%)</span></td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;text-align:right;color:#c0392b">(EC$ ${nisEmployee.toFixed(2)})</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;color:#c0392b">${showYtd ? `(EC$ ${(ytd!.nisEmployee ?? 0).toFixed(2)})` : ''}</td>
      </tr>
      <!-- Overtime hours | PAYE -->
      <tr>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;color:#555">Overtime hours</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;text-align:right">${overtimeHours.toFixed(2)}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:2px solid #ccc;text-align:right">${showYtd ? (ytd!.overtimeHours ?? 0).toFixed(2) : ''}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;color:#555">PAYE <span style="color:#999;font-size:9px">(Exempt)</span></td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;text-align:right;color:#c0392b">(EC$ ${payeTax.toFixed(2)})</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;color:#c0392b">${showYtd ? `(EC$ ${(ytd!.payeTax ?? 0).toFixed(2)})` : ''}</td>
      </tr>
      <!-- Holiday hours | first custom deduction or Total Deductions -->
      <tr>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;color:#555">Holiday hours</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;text-align:right">${holidayHours.toFixed(2)}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:2px solid #ccc;text-align:right">${showYtd ? (ytd!.holidayHours ?? 0).toFixed(2) : ''}</td>
        ${customDeductions.length > 0 ? `
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;color:#555">${customDeductions[0].label}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;text-align:right;color:#c0392b">(EC$ ${parseFloat(String(customDeductions[0].amount)).toFixed(2)})</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;color:#c0392b">${showYtd && ytd?.customDeductionsYtd?.[customDeductions[0].label] != null ? `(EC$ ${ytd.customDeductionsYtd[customDeductions[0].label].toFixed(2)})` : ''}</td>
        ` : `
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;font-weight:600;color:${SLATE}">Total Deductions</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;text-align:right;font-weight:600;color:#c0392b">(EC$ ${totalDeductions.toFixed(2)})</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:600;color:#c0392b">${showYtd ? `(EC$ ${(ytd!.totalDeductions ?? 0).toFixed(2)})` : ''}</td>
        `}
      </tr>
      <!-- Regular pay | second custom deduction or Total Deductions -->
      <tr>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;color:#555">Regular pay</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;text-align:right">${fmt(regularPay)}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:2px solid #ccc;text-align:right">${showYtd ? fmt(ytd!.regularPay ?? 0) : ''}</td>
        ${customDeductions.length > 1 ? `
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;color:#555">${customDeductions[1].label}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;text-align:right;color:#c0392b">(EC$ ${parseFloat(String(customDeductions[1].amount)).toFixed(2)})</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;color:#c0392b">${showYtd && ytd?.customDeductionsYtd?.[customDeductions[1].label] != null ? `(EC$ ${ytd.customDeductionsYtd[customDeductions[1].label].toFixed(2)})` : ''}</td>
        ` : customDeductions.length === 1 ? `
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;font-weight:600;color:${SLATE}">Total Deductions</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;text-align:right;font-weight:600;color:#c0392b">(EC$ ${totalDeductions.toFixed(2)})</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:600;color:#c0392b">${showYtd ? `(EC$ ${(ytd!.totalDeductions ?? 0).toFixed(2)})` : ''}</td>
        ` : `
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc"></td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc"></td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee"></td>
        `}
      </tr>
      <!-- Overtime pay | empty -->
      <tr>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;color:#555">Overtime pay${otMultiplier !== 1 ? ` ×${otMultiplier}` : ''}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;text-align:right">${fmt(overtimePay)}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:2px solid #ccc;text-align:right">${showYtd ? fmt(ytd!.overtimePay ?? 0) : ''}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc"></td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc"></td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee"></td>
      </tr>
      <!-- Holiday pay | empty -->
      <tr>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;color:#555">Holiday pay</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;text-align:right">${fmt(holidayPay)}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:2px solid #ccc;text-align:right">${showYtd ? fmt(ytd!.holidayPay ?? 0) : ''}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc"></td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc"></td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee"></td>
      </tr>
      ${customDeductions.slice(2).map((d, i) => `
      <tr>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc"></td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc"></td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:2px solid #ccc"></td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;color:#555">${d.label}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;text-align:right;color:#c0392b">(EC$ ${parseFloat(String(d.amount)).toFixed(2)})</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;color:#c0392b">${showYtd && ytd?.customDeductionsYtd?.[d.label] != null ? `(EC$ ${ytd.customDeductionsYtd[d.label].toFixed(2)})` : ''}</td>
      </tr>
      ${i === customDeductions.slice(2).length - 1 ? `
      <tr>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc"></td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc"></td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:2px solid #ccc"></td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;font-weight:600;color:${SLATE}">Total Deductions</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc;text-align:right;font-weight:600;color:#c0392b">(EC$ ${totalDeductions.toFixed(2)})</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:600;color:#c0392b">${showYtd ? `(EC$ ${(ytd!.totalDeductions ?? 0).toFixed(2)})` : ''}</td>
      </tr>
      ` : ''}
      `).join('')}
      <!-- Blank spacer -->
      <tr>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc">&nbsp;</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc"></td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:2px solid #ccc"></td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc"></td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;border-right:1px solid #ccc"></td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee"></td>
      </tr>
      <!-- Gross Earnings -->
      <tr>
        <td style="padding:5px 8px;border-bottom:1px solid #ccc;border-right:1px solid #ccc;font-weight:700;color:${SLATE}">Gross Earnings</td>
        <td style="padding:5px 8px;border-bottom:1px solid #ccc;border-right:1px solid #ccc;text-align:right;font-weight:700;color:${SLATE}">EC$ ${grossPay.toFixed(2)}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #ccc;border-right:2px solid #ccc;text-align:right;font-weight:700;color:${SLATE}">${showYtd ? `EC$ ${(ytd!.grossPay ?? 0).toFixed(2)}` : ''}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #ccc;border-right:1px solid #ccc"></td>
        <td style="padding:5px 8px;border-bottom:1px solid #ccc;border-right:1px solid #ccc"></td>
        <td style="padding:5px 8px;border-bottom:1px solid #ccc"></td>
      </tr>
      <!-- Net Earnings -->
      <tr>
        <td style="padding:5px 8px;border-right:1px solid #ccc;font-weight:700;color:${SLATE}">Net Earnings</td>
        <td style="padding:5px 8px;border-right:1px solid #ccc;text-align:right;font-weight:700;color:${SLATE}">EC$ ${netPay.toFixed(2)}</td>
        <td style="padding:5px 8px;border-right:2px solid #ccc;text-align:right;font-weight:700;color:${SLATE}">${showYtd ? `EC$ ${(ytd!.netPay ?? 0).toFixed(2)}` : ''}</td>
        <td style="padding:5px 8px;border-right:1px solid #ccc"></td>
        <td style="padding:5px 8px;border-right:1px solid #ccc"></td>
        <td style="padding:5px 8px"></td>
      </tr>
    </tbody>
  </table>

  <!-- NET PAY -->
  <div class="net-box">
    <div>
      <div class="net-label">NET PAY — This Period</div>
      <div style="font-size:9px;opacity:0.6">After all deductions</div>
    </div>
    <div style="display:flex;gap:24px;align-items:center">
      <div class="net-amount">${fmt(netPay)}</div>
      ${showYtd ? `<div style="border-left:1px solid rgba(255,255,255,0.25);padding-left:20px"><div class="net-ytd-label">YTD (${ytdYear})</div><div class="net-ytd-val">${fmt(ytd!.netPay ?? 0)}</div></div>` : ''}
    </div>
  </div>

  <!-- TAX NOTE -->
  <div class="tax-note">
    <strong>St. Vincent and the Grenadines Tax Reference:</strong> NIS Employee ${nisEmployeeRatePct}% · NIS Employer ${nisEmployerRatePct}% · PAYE: Exempt ·
    Overtime 1× | 1.5× with approval · Holidays 1× · ${showYtd ? `YTD: ${ytd!.periods} period${ytd!.periods!==1?'s':''} in ${ytdYear}` : ''}
  </div>
  ${nisExempt ? `<div style="margin-bottom:10px;padding:6px 10px;border:1px solid #f59e0b;background:#fffbeb;color:#92400e;font-size:9px;display:flex;align-items:center;gap:8px"><span style="font-weight:700;font-size:8px;text-transform:uppercase;letter-spacing:.05em;padding:2px 5px;background:#fde68a">NIS Exempt</span><span>No NIS contributions apply — employee is exempt (over 60 or temporary).</span></div>` : ''}

  <!-- CHECK with watermark scoped inside -->
  <div class="section-label">Payment Check</div>
  <div class="check-section">
    <div class="check-watermark">DIRECT DEPOSIT</div>
    <div class="check-wrap">
      <!-- NOT VALID banner -->
      <div class="check-invalid">&#9888; NOT VALID FOR DEPOSIT — FOR PAYROLL RECORD PURPOSES ONLY &#9888;</div>
      <div class="check-header">
        <div class="check-header-logo">
          ${logo ? `<img src="${logo}" alt="logo">` : ''}
          <div>
            <div class="check-co">Stonetrail Villas</div>
            <div class="check-co-sub">Boutique Luxury Hotel · St. Vincent and the Grenadines</div>
          </div>
        </div>
        <div class="check-no-wrap">
          <div class="check-no-label">Check No.</div>
          <div class="check-no">#${String(data.entry.id).padStart(6,'0')}</div>
          <div class="check-date">Pay Date: ${periodEndLong}</div>
        </div>
      </div>
      <div class="check-payto">
        <div class="check-label">Pay to the order of</div>
        <div class="check-line">${p.employeeName}</div>
        <div class="check-amt-box">${fmt(netPay)}</div>
      </div>
      <div class="check-words">
        <div class="check-label">Amount</div>
        <div class="check-words-line">${numberToWords(netPay)} Dollars (EC$)</div>
      </div>
      <div class="check-bottom">
        <div class="check-bank">
          <div><span>Bank: </span><strong>${p.bankName ?? '—'}</strong></div>
          <div><span>Account No.: </span><strong style="letter-spacing:2px">${maskAccount(p.bankAccount)}</strong></div>
          <div><span>Memo: </span>Salary — ${periodStartLong} – ${periodEndLong}</div>
        </div>
        <div class="check-sig-wrap">
          <div class="check-sig-name">ADBallantyne</div>
          <div class="check-sig-line">Authorized Signature</div>
        </div>
      </div>
      <div class="check-micr">
        <span>⑆${String(data.entry.id).padStart(8,'0')}⑆&nbsp;&nbsp;⑈${maskAccount(p.bankAccount)}⑈</span>
        <span>${p.bankRouting ? `Routing: <strong>${p.bankRouting}</strong>&nbsp;&nbsp;` : ''}${p.bankAccount ? `Acct: <strong>${maskAccount(p.bankAccount)}</strong>` : ''}</span>
      </div>
    </div>
  </div>

  <div class="footer">This payslip is generated by Stonetrail Villas Staff Portal · Confidential</div>
  <script>window.onload=function(){window.print()}</script>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    win.location.href = blobUrl;
    // Revoke after a short delay to allow the window to load
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  }

  // ── Screen render ────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-gray-900">Pay Slip</h2>
          <div className="flex items-center gap-2">
            <button onClick={downloadPDF}
              className="flex items-center gap-2 px-3 py-1.5 text-white text-sm font-medium transition-colors"
              style={{ background: SLATE }}>
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 text-gray-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Payslip body */}
        <div ref={slipRef} className="px-5 py-4">

          {/* ── Missing data warning ── */}
          {(regularHours === 0 && hourlyRate === 0) && (
            <div className="mb-4 px-4 py-3 border border-amber-400 bg-amber-50 text-amber-800 text-xs">
              <strong>Missing pay data:</strong> This entry has no regular hours or hourly rate recorded.
              Close this modal and click <strong>Edit</strong> on the entry to fill in the hours and rate, then regenerate the payslip.
            </div>
          )}

          {/* ── Header ── */}
          <div className="flex justify-between items-center mb-4 px-4 py-3"
            style={{ background: CREAM, borderBottom: `2px solid ${SLATE}` }}>
            <div className="flex items-center gap-3">
              <img src="/assets/Nlogo.png" alt="Stonetrail Villas" className="h-11 w-auto object-contain" />
              <div>
                <div className="text-lg font-extrabold" style={{ color: SLATE }}>Stonetrail Villas</div>
                <div className="text-[10px]" style={{ color: TAN }}>Boutique Luxury Hotel · St. Vincent &amp; the Grenadines</div>
              </div>
            </div>
            <div className="text-right px-3 py-1.5">
              <div className="text-sm font-bold tracking-widest" style={{ color: SLATE }}>Employee Payment Statement</div>
              <div className="text-[10px]" style={{ color: SLATE, opacity: 0.7 }}>{periodStartLong} – {periodEndLong}</div>
              <div className="text-[9px]" style={{ color: SLATE, opacity: 0.45 }}>Generated: {generatedDate}</div>
            </div>
          </div>

          {/* ── Employee info row ── */}
          <table className="w-full text-xs border-collapse mb-0" style={{ borderBottom: 'none' }}>
            <tbody>
              <tr>
                <td className="px-3 py-1.5 border border-gray-300 font-semibold text-gray-600 w-[14%]">Employee</td>
                <td className="px-3 py-1.5 border border-gray-300 text-gray-900 w-[22%]">{p.employeeName}</td>
                <td className="px-3 py-1.5 border border-gray-300 font-semibold text-gray-600 w-[12%]">department</td>
                <td className="px-3 py-1.5 border border-gray-300 text-gray-900 w-[20%]">{p.department}</td>
                <td className="px-3 py-1.5 border border-gray-300 font-semibold text-gray-600 w-[12%]">position</td>
                <td className="px-3 py-1.5 border border-gray-300 text-gray-900 w-[10%]">{p.position}</td>
                <td className="px-3 py-1.5 border border-gray-300 font-semibold text-gray-600 w-[10%]">hourly rate</td>
                <td className="px-3 py-1.5 border border-gray-300 text-gray-900">{fmt(hourlyRate)}</td>
              </tr>
            </tbody>
          </table>

          {/* ── Main earnings / deductions table ── */}
          <div className="mb-3 border border-gray-300" style={{ borderTop: 'none' }}>
            {/* Section headings row */}
            <div className="grid border-b border-gray-300" style={{ gridTemplateColumns: '40% 60%' }}>
              <div className="text-center py-1.5 text-sm font-bold border-r border-gray-300" style={{ color: '#1a1a1a' }}>Earnings</div>
              <div className="text-center py-1.5 text-sm font-bold" style={{ color: '#1a1a1a' }}>Deductions</div>
            </div>

            {/* Sub-header row */}
            <div className="grid border-b border-gray-300 text-[10px] font-semibold" style={{ gridTemplateColumns: '18% 11% 11% 18% 21% 21%' }}>
              <div className="px-3 py-1 border-r border-gray-300"></div>
              <div className="px-2 py-1 text-right border-r border-gray-300 whitespace-nowrap" style={{ color: '#000' }}>Current Period</div>
              <div className="px-2 py-1 text-right border-r border-gray-300 whitespace-nowrap" style={{ color: '#000' }}>YTD</div>
              <div className="px-3 py-1 border-r border-gray-300"></div>
              <div className="px-2 py-1 text-right border-r border-gray-300 whitespace-nowrap" style={{ color: '#000' }}>Current Period</div>
              <div className="px-2 py-1 text-right whitespace-nowrap" style={{ color: '#000' }}>YTD</div>
            </div>

            {/* Row: Regular hours | NIS */}
            <div className="grid border-b border-gray-200 text-xs" style={{ gridTemplateColumns: '18% 11% 11% 18% 21% 21%' }}>
              <div className="px-3 py-1.5 text-gray-700 border-r border-gray-300">Regular hours</div>
              <div className="px-2 py-1.5 text-right border-r border-gray-300 whitespace-nowrap" style={{ color: '#000000', fontWeight: 500 }}>{regularHours.toFixed(2)}</div>
              <div className="px-2 py-1.5 text-right border-r border-gray-300 whitespace-nowrap" style={{ color: '#000000' }}>{showYtd ? y(ytd!.regularHours).toFixed(2) : ''}</div>
              <div className="px-3 py-1.5 text-gray-700 border-r border-gray-300">NIS <span className="text-gray-400 text-[9px]">({nisEmployeeRatePct}%)</span></div>
              <div className="px-2 py-1.5 text-right border-r border-gray-300 whitespace-nowrap" style={{ color: '#c0392b' }}>(EC$ {nisEmployee.toFixed(2)})</div>
              <div className="px-2 py-1.5 text-right whitespace-nowrap" style={{ color: '#000' }}>{showYtd ? `(EC$ ${y(ytd!.nisEmployee).toFixed(2)})` : ''}</div>
            </div>

            {/* Row: Overtime hours | PAYE */}
            <div className="grid border-b border-gray-200 text-xs" style={{ gridTemplateColumns: '18% 11% 11% 18% 21% 21%' }}>
              <div className="px-3 py-1.5 text-gray-700 border-r border-gray-300">Overtime hours</div>
              <div className="px-2 py-1.5 text-right border-r border-gray-300 whitespace-nowrap" style={{ color: '#000000', fontWeight: 500 }}>{overtimeHours.toFixed(2)}</div>
              <div className="px-2 py-1.5 text-right border-r border-gray-300 whitespace-nowrap" style={{ color: '#000000' }}>{showYtd ? y(ytd!.overtimeHours).toFixed(2) : ''}</div>
              <div className="px-3 py-1.5 text-gray-700 border-r border-gray-300">PAYE <span className="text-gray-400 text-[9px]">(Exempt)</span></div>
              <div className="px-2 py-1.5 text-right border-r border-gray-300 whitespace-nowrap" style={{ color: '#c0392b' }}>(EC$ {payeTax.toFixed(2)})</div>
              <div className="px-2 py-1.5 text-right whitespace-nowrap" style={{ color: '#000' }}>{showYtd ? `(EC$ ${y(ytd!.payeTax).toFixed(2)})` : ''}</div>
            </div>

            {/* Row: Holiday hours | first custom deduction or Total Deductions */}
            <div className="grid border-b border-gray-200 text-xs" style={{ gridTemplateColumns: '18% 11% 11% 18% 21% 21%' }}>
              <div className="px-3 py-1.5 text-gray-700 border-r border-gray-300">Holiday hours</div>
              <div className="px-2 py-1.5 text-right border-r border-gray-300 whitespace-nowrap" style={{ color: '#000000', fontWeight: 500 }}>{holidayHours.toFixed(2)}</div>
              <div className="px-2 py-1.5 text-right border-r border-gray-300 whitespace-nowrap" style={{ color: '#000000' }}>{showYtd ? y(ytd!.holidayHours).toFixed(2) : ''}</div>
              {customDeductions.length > 0 ? <>
                <div className="px-3 py-1.5 text-gray-700 border-r border-gray-300">{customDeductions[0].label}</div>
                <div className="px-2 py-1.5 text-right border-r border-gray-300 whitespace-nowrap" style={{ color: '#c0392b' }}>(EC$ {parseFloat(String(customDeductions[0].amount)).toFixed(2)})</div>
                <div className="px-2 py-1.5 text-right whitespace-nowrap" style={{ color: '#c0392b' }}>
                  {showYtd && ytd?.customDeductionsYtd?.[customDeductions[0].label] != null
                    ? `(EC$ ${ytd.customDeductionsYtd[customDeductions[0].label].toFixed(2)})`
                    : ''}
                </div>
              </> : <>
                <div className="px-3 py-1.5 font-semibold border-r border-gray-300" style={{ color: SLATE }}>Total Deductions</div>
                <div className="px-2 py-1.5 text-right font-semibold border-r border-gray-300 whitespace-nowrap" style={{ color: '#c0392b' }}>(EC$ {totalDeductions.toFixed(2)})</div>
                <div className="px-2 py-1.5 text-right font-semibold whitespace-nowrap" style={{ color: '#000' }}>{showYtd ? `(EC$ ${y(ytd!.totalDeductions).toFixed(2)})` : ''}</div>
              </>}
            </div>

            {/* Row: Regular pay | second custom deduction or Total Deductions */}
            <div className="grid border-b border-gray-200 text-xs" style={{ gridTemplateColumns: '18% 11% 11% 18% 21% 21%' }}>
              <div className="px-3 py-1.5 text-gray-700 border-r border-gray-300">Regular pay</div>
              <div className="px-2 py-1.5 text-right border-r border-gray-300 whitespace-nowrap" style={{ color: '#000000', fontWeight: 500 }}>{fmt(regularPay)}</div>
              <div className="px-2 py-1.5 text-right border-r border-gray-300 whitespace-nowrap" style={{ color: '#000000' }}>{showYtd ? fmt(y(ytd!.regularPay)) : ''}</div>
              {customDeductions.length > 1 ? <>
                <div className="px-3 py-1.5 text-gray-700 border-r border-gray-300">{customDeductions[1].label}</div>
                <div className="px-2 py-1.5 text-right border-r border-gray-300 whitespace-nowrap" style={{ color: '#c0392b' }}>(EC$ {parseFloat(String(customDeductions[1].amount)).toFixed(2)})</div>
                <div className="px-2 py-1.5 text-right whitespace-nowrap" style={{ color: '#c0392b' }}>
                  {showYtd && ytd?.customDeductionsYtd?.[customDeductions[1].label] != null
                    ? `(EC$ ${ytd.customDeductionsYtd[customDeductions[1].label].toFixed(2)})`
                    : ''}
                </div>
              </> : customDeductions.length === 1 ? <>
                <div className="px-3 py-1.5 font-semibold border-r border-gray-300" style={{ color: SLATE }}>Total Deductions</div>
                <div className="px-2 py-1.5 text-right font-semibold border-r border-gray-300 whitespace-nowrap" style={{ color: '#c0392b' }}>(EC$ {totalDeductions.toFixed(2)})</div>
                <div className="px-2 py-1.5 text-right font-semibold whitespace-nowrap" style={{ color: '#000' }}>{showYtd ? `(EC$ ${y(ytd!.totalDeductions).toFixed(2)})` : ''}</div>
              </> : <>
                <div className="border-r border-gray-300"></div>
                <div className="border-r border-gray-300"></div>
                <div></div>
              </>}
            </div>

            {/* Row: Overtime pay | empty */}
            <div className="grid border-b border-gray-200 text-xs" style={{ gridTemplateColumns: '18% 11% 11% 18% 21% 21%' }}>
              <div className="px-3 py-1.5 text-gray-700 border-r border-gray-300">
                Overtime pay{otMultiplier !== 1 ? <span className="text-gray-400 text-[9px]"> ×{otMultiplier}</span> : ''}
              </div>
              <div className="px-2 py-1.5 text-right border-r border-gray-300 whitespace-nowrap" style={{ color: '#000000', fontWeight: 500 }}>{fmt(overtimePay)}</div>
              <div className="px-2 py-1.5 text-right border-r border-gray-300 whitespace-nowrap" style={{ color: '#000000' }}>{showYtd ? fmt(y(ytd!.overtimePay)) : ''}</div>
              <div className="border-r border-gray-300"></div>
              <div className="border-r border-gray-300"></div>
              <div></div>
            </div>

            {/* Row: Holiday pay | empty */}
            <div className="grid border-b border-gray-200 text-xs" style={{ gridTemplateColumns: '18% 11% 11% 18% 21% 21%' }}>
              <div className="px-3 py-1.5 text-gray-700 border-r border-gray-300">Holiday pay</div>
              <div className="px-2 py-1.5 text-right border-r border-gray-300 whitespace-nowrap" style={{ color: '#000000', fontWeight: 500 }}>{fmt(holidayPay)}</div>
              <div className="px-2 py-1.5 text-right border-r border-gray-300 whitespace-nowrap" style={{ color: '#000000' }}>{showYtd ? fmt(y(ytd!.holidayPay)) : ''}</div>
              <div className="border-r border-gray-300"></div>
              <div className="border-r border-gray-300"></div>
              <div></div>
            </div>

            {/* Extra custom deduction rows (3rd onwards) + Total Deductions at end */}
            {customDeductions.slice(2).map((d, i) => (
              <div key={d.id} className="grid border-b border-gray-200 text-xs" style={{ gridTemplateColumns: '18% 11% 11% 18% 21% 21%' }}>
                <div className="px-3 py-1.5 border-r border-gray-300">&nbsp;</div>
                <div className="border-r border-gray-300"></div>
                <div className="border-r border-gray-300"></div>
                <div className="px-3 py-1.5 text-gray-700 border-r border-gray-300">{d.label}</div>
                <div className="px-2 py-1.5 text-right border-r border-gray-300 whitespace-nowrap" style={{ color: '#c0392b' }}>(EC$ {parseFloat(String(d.amount)).toFixed(2)})</div>
                <div className="px-2 py-1.5 text-right whitespace-nowrap" style={{ color: '#c0392b' }}>
                  {showYtd && ytd?.customDeductionsYtd?.[d.label] != null
                    ? `(EC$ ${ytd.customDeductionsYtd[d.label].toFixed(2)})`
                    : ''}
                </div>
              </div>
            ))}
            {customDeductions.length >= 2 && (
              <div className="grid border-b border-gray-200 text-xs" style={{ gridTemplateColumns: '18% 11% 11% 18% 21% 21%' }}>
                <div className="px-3 py-1.5 border-r border-gray-300">&nbsp;</div>
                <div className="border-r border-gray-300"></div>
                <div className="border-r border-gray-300"></div>
                <div className="px-3 py-1.5 font-semibold border-r border-gray-300" style={{ color: SLATE }}>Total Deductions</div>
                <div className="px-2 py-1.5 text-right font-semibold border-r border-gray-300 whitespace-nowrap" style={{ color: '#c0392b' }}>(EC$ {totalDeductions.toFixed(2)})</div>
                <div className="px-2 py-1.5 text-right font-semibold whitespace-nowrap" style={{ color: '#000' }}>{showYtd ? `(EC$ ${y(ytd!.totalDeductions).toFixed(2)})` : ''}</div>
              </div>
            )}

            {/* Blank spacer row */}
            <div className="grid border-b border-gray-200 text-xs" style={{ gridTemplateColumns: '18% 11% 11% 18% 21% 21%' }}>
              <div className="px-3 py-1.5 border-r border-gray-300">&nbsp;</div>
              <div className="border-r border-gray-300"></div>
              <div className="border-r border-gray-300"></div>
              <div className="border-r border-gray-300"></div>
              <div className="border-r border-gray-300"></div>
              <div></div>
            </div>

            {/* Row: Gross Earnings */}
            <div className="grid border-b border-gray-200 text-xs font-semibold" style={{ gridTemplateColumns: '18% 11% 11% 18% 21% 21%' }}>
              <div className="px-3 py-1.5 border-r border-gray-300" style={{ color: SLATE }}>Gross Earnings</div>
              <div className="px-2 py-1.5 text-right border-r border-gray-300 whitespace-nowrap" style={{ color: '#000000', fontWeight: 600 }}>EC$ {grossPay.toFixed(2)}</div>
              <div className="px-2 py-1.5 text-right border-r border-gray-300 whitespace-nowrap" style={{ color: '#000000' }}>{showYtd ? `EC$ ${y(ytd!.grossPay).toFixed(2)}` : ''}</div>
              <div className="border-r border-gray-300"></div>
              <div className="border-r border-gray-300"></div>
              <div></div>
            </div>

            {/* Row: Net Earnings */}
            <div className="grid text-xs font-semibold" style={{ gridTemplateColumns: '18% 11% 11% 18% 21% 21%' }}>
              <div className="px-3 py-1.5 border-r border-gray-300" style={{ color: SLATE }}>Net Earnings</div>
              <div className="px-2 py-1.5 text-right border-r border-gray-300 whitespace-nowrap" style={{ color: '#000000', fontWeight: 600 }}>EC$ {netPay.toFixed(2)}</div>
              <div className="px-2 py-1.5 text-right border-r border-gray-300 whitespace-nowrap" style={{ color: '#000000' }}>{showYtd ? `EC$ ${y(ytd!.netPay).toFixed(2)}` : ''}</div>
              <div className="border-r border-gray-300"></div>
              <div className="border-r border-gray-300"></div>
              <div></div>
            </div>
          </div>


          {/* ── Net Pay ── */}
          <div className="px-5 py-3 flex justify-between items-center mb-3"
            style={{ background: SLATE }}>
            <div>
              <div className="text-white/75 text-[10px] uppercase tracking-widest">Net Pay — This Period</div>
              <div className="text-white/50 text-[9px]">After all deductions</div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-2xl font-bold text-white">{fmt(netPay)}</div>
              {showYtd && (
                <div className="text-right border-l border-white/20 pl-6">
                  <div className="text-white/60 text-[9px] uppercase tracking-widest">YTD ({ytdYear})</div>
                  <div className="text-lg font-bold text-white">{fmt(y(ytd!.netPay))}</div>
                </div>
              )}
            </div>
          </div>

          {/* ── Tax reference ── */}
          <div className="px-3 py-2 text-[9px] text-gray-500 leading-relaxed mb-4"
            style={{ background: CREAM, borderLeft: `3px solid ${TAN}` }}>
            <span className="font-semibold text-gray-700">St. Vincent and the Grenadines Tax Reference:</span>{' '}
            NIS Employee {nisEmployeeRatePct}% · NIS Employer {nisEmployerRatePct}% · PAYE: Exempt ·
            Overtime 1× | 1.5× with approval · Holidays 1×
            {showYtd && <> · YTD: {ytd!.periods} period{ytd!.periods !== 1 ? 's' : ''} in {ytdYear}</>}
          </div>

          {/* ── NIS Exempt notice ── */}
          {nisExempt && (
            <div className="mb-4 px-3 py-2.5 border border-amber-400 bg-amber-50 text-amber-800 text-xs flex items-center gap-2">
              <span className="font-bold text-amber-700 text-[10px] uppercase tracking-wide px-1.5 py-0.5 bg-amber-200">NIS Exempt</span>
              <span>No NIS contributions apply — employee is exempt (over 60 or temporary).</span>
            </div>
          )}

          {/* ── Payment Check ── */}
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600 border-b border-gray-300 pb-1 mb-2">
            Payment Check
          </div>

          {/* Wrapper with scoped watermark */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
              style={{ transform: 'rotate(-35deg)' }}>
              <span className="font-black tracking-widest whitespace-nowrap"
                style={{ fontSize: '56px', color: BLUE, opacity: 0.07 }}>DIRECT DEPOSIT</span>
            </div>

            {/* Check card — no rounded corners */}
            <div className="relative z-10 overflow-hidden font-mono border-2" style={{ borderColor: BLUE_DARK, background: '#fffef8' }}>

              {/* NOT VALID banner */}
              <div className="text-center py-1 text-[9px] font-extrabold uppercase tracking-widest text-white"
                style={{ background: '#b91c1c', letterSpacing: '2px' }}>
                ⚠ NOT VALID FOR DEPOSIT — FOR PAYROLL RECORD PURPOSES ONLY ⚠
              </div>

              {/* Check header */}
              <div className="flex justify-between items-center px-4 py-2.5" style={{ background: BLUE }}>
                <div className="flex items-center gap-2.5">
                  <img src="/assets/Nlogo.png" alt="logo" className="h-14 w-auto object-contain" />
                  <div>
                    <div className="text-sm font-bold" style={{ color: BLUE_DARK }}>Stonetrail Villas</div>
                    <div className="text-[8px]" style={{ color: TAN }}>Boutique Luxury Hotel · St. Vincent and the Grenadines</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[8px] uppercase tracking-widest" style={{ color: TAN }}>Check No.</div>
                  <div className="text-sm font-bold" style={{ color: BLUE_DARK }}>#{String(data.entry.id).padStart(6, '0')}</div>
                  <div className="text-[9px]" style={{ color: BLUE_DARK }}>Pay Date: <strong>{periodEndLong}</strong></div>
                </div>
              </div>

              {/* Pay to */}
              <div className="px-4 py-2 flex items-end gap-3 border-b border-dashed" style={{ borderColor: GOLD }}>
                <div className="text-[8px] uppercase tracking-widest whitespace-nowrap" style={{ color: TAN }}>Pay to the order of</div>
                <div className="flex-1 border-b border-gray-400 pb-0.5 text-sm font-bold text-gray-900">{p.employeeName}</div>
                <div className="border-2 px-2.5 py-0.5 text-sm font-bold whitespace-nowrap"
                  style={{ borderColor: BLUE_DARK, color: BLUE_DARK, background: BLUE }}>
                  {fmt(netPay)}
                </div>
              </div>

              {/* Amount in words */}
              <div className="px-4 py-2 flex items-end gap-3 border-b border-dashed" style={{ borderColor: GOLD }}>
                <div className="text-[8px] uppercase tracking-widest whitespace-nowrap" style={{ color: TAN }}>Amount</div>
                <div className="flex-1 border-b border-gray-400 pb-0.5 text-[10px] text-gray-800 italic">
                  {numberToWords(netPay)} Dollars (EC$)
                </div>
              </div>

              {/* Bank info + signature */}
              <div className="px-4 py-3 flex justify-between items-end">
                <div className="flex flex-col gap-1 text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] uppercase tracking-widest w-20" style={{ color: TAN }}>Bank</span>
                    <span className="font-semibold text-gray-800">{p.bankName ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] uppercase tracking-widest w-20" style={{ color: TAN }}>Account No.</span>
                    <span className="font-semibold text-gray-800 tracking-widest">{maskAccount(p.bankAccount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] uppercase tracking-widest w-20" style={{ color: TAN }}>Memo</span>
                    <span className="text-gray-600">Salary — {periodStartLong} – {periodEndLong}</span>
                  </div>
                </div>

                {/* Signature */}
                <div className="text-right min-w-[160px]">
                  <div className="block ml-auto mb-1 flex items-end justify-end" style={{ height: '44px' }}>
                    <span style={{ fontFamily: '"Brush Script MT", "Brush Script Std", cursive', fontStyle: 'normal', fontSize: '19px', color: BLUE_DARK, letterSpacing: '0.5px' }}>
                      ADBallantyne
                    </span>
                  </div>
                  <div className="border-t pt-1 text-[8px] uppercase tracking-widest" style={{ borderColor: BLUE_DARK, color: TAN }}>
                    Authorized Signature
                  </div>
                </div>
              </div>

              {/* MICR strip */}
              <div className="px-4 py-1.5 flex justify-between items-center border-t"
                style={{ background: '#f5f5f5', borderColor: GOLD }}>
                <div className="text-[9px] tracking-widest" style={{ color: TAN }}>
                  ⑆{String(data.entry.id).padStart(8, '0')}⑆&nbsp;&nbsp;⑈{maskAccount(p.bankAccount)}⑈
                </div>
                <div className="text-[9px] text-right" style={{ color: TAN }}>
                  {p.bankRouting && <span>Routing: <strong>{p.bankRouting}</strong>&nbsp;&nbsp;</span>}
                  {p.bankAccount && <span>Acct: <strong>{maskAccount(p.bankAccount)}</strong></span>}
                </div>
              </div>
            </div>
          </div>

        </div>{/* /payslip body */}

        <div className="px-5 pb-4 text-center text-[10px] text-gray-400">
          This payslip is generated by Stonetrail Villas Staff Portal · Confidential
        </div>
      </div>
    </div>
  );
}
