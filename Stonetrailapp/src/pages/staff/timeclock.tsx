import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from "react-router";
import { useSession } from '@/lib/auth/auth-client';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Clock, Plus, Pencil, Trash2, Download, Upload, FileText, Search, X, ChevronDown, ChevronUp, TrendingUp, ChevronRight, Users, BarChart2, Zap, CheckCircle2, AlertCircle, Loader2, Wallet, Archive } from 'lucide-react';
import PayslipModal from '@/components/staff/PayslipModal';
import EmployeeRatesPanel from '@/components/staff/EmployeeRatesPanel';
import ArchivedEmployeesPanel from '@/components/staff/ArchivedEmployeesPanel';
// components moved to src/components/staff/ — EmployeeRatesPanel is not a page
import PayrollReports from '@/components/staff/PayrollReports';
import NisRatesPanel from '@/components/staff/NisRatesPanel';
import StaffHeader from '@/components/StaffHeader';
import DeductionsPanel from '@/components/staff/DeductionsPanel';
import AccountsPayables from '@/components/staff/AccountsPayables';
import PettyCash from '@/components/staff/PettyCash';
type FinanceTab = 'records' | 'rates' | 'reports' | 'payables' | 'petty-cash';

/** Fetch the current user's permitted finance tabs from the server */
async function fetchPermissions(): Promise<{
  tabs: FinanceTab[];
  isAdmin: boolean;
}> {
  try {
    const res = await fetch('/api/me/permissions');
    if (!res.ok) return {
      tabs: [],
      isAdmin: false
    };
    return await res.json();
  } catch {
    return {
      tabs: [],
      isAdmin: false
    };
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface TimeclockEntry {
  id: number;
  firstName: string;
  lastName: string;
  employeeName: string;
  department: string;
  position: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  regularHours: string;
  overtimeHours: string;
  holidayHours: string;
  hourlyRate: string;
  allowances: string;
  notes: string | null;
  bankName: string | null;
  bankAccount: string | null;
  payDate: string | null;
  nisExempt: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface YtdSummary {
  periods: number;
  regularHours: number;
  overtimeHours: number;
  holidayHours: number;
  regularPay: number;
  overtimePay: number;
  holidayPay: number;
  grossPay: number;
  nisEmployee: number;
  nisEmployer: number;
  nisTotal: number;
  payeTax: number;
  totalDeductions: number;
  netPay: number;
  /** YTD totals per custom deduction label: { [label]: totalEC$ } */
  customDeductionsYtd?: Record<string, number>;
}
export interface PayslipData {
  entry: TimeclockEntry;
  payslip: {
    employeeName: string;
    department: string;
    position: string;
    payPeriodStart: string;
    payPeriodEnd: string;
    regularHours: string;
    overtimeHours: string;
    holidayHours: string;
    hourlyRate: string;
    allowances: string;
    regularPay: number;
    overtimePay: number;
    holidayPay: number;
    grossPay: number;
    nisEmployee: number;
    nisEmployer: number;
    nisEmployeeRate?: number;
    nisEmployerRate?: number;
    payeTax: number;
    customDeductions?: {
      id: number;
      label: string;
      amount: number;
      isRecurring: boolean;
    }[];
    customDeductionsTotal?: number;
    totalDeductions: number;
    netPay: number;
    overtimeMultiplier: number;
    bankName: string | null;
    bankAccount: string | null;
    bankRouting: string | null;
    payDate: string | null;
    nisExempt?: boolean | number;
  };
  ytd?: YtdSummary;
}
interface YtdMonthData {
  grossPay: number;
  nisEmployee: number;
  nisEmployer: number;
  nisTotal: number;
  payeTax: number;
  totalDeductions: number;
  netPay: number;
  periods: number;
}
interface YtdEmployee {
  employeeName: string;
  department: string;
  position: string;
  periods: number;
  regularHours: number;
  overtimeHours: number;
  holidayHours: number;
  regularPay: number;
  overtimePay: number;
  holidayPay: number;
  allowances: number;
  grossPay: number;
  nisEmployee: number;
  nisEmployer: number;
  nisTotal: number;
  payeTax: number;
  totalDeductions: number;
  netPay: number;
  byMonth: Record<string, YtdMonthData>;
}
interface YtdData {
  year: number;
  employees: YtdEmployee[];
}
const DEPARTMENTS = ['General', 'Front Desk', 'Housekeeping', 'Food & Beverage', 'Maintenance', 'Management', 'Security', 'Grounds', 'Construction'];
const POSITIONS = ['Staff', 'Supervisor', 'Manager', 'Director', 'Chef', 'Housekeeper', 'Receptionist', 'Maintenance Tech', 'Security Officer', 'Groundskeeper'];
const emptyForm = {
  firstName: '',
  lastName: '',
  employeeName: '',
  department: DEPARTMENTS[0],
  position: POSITIONS[0],
  payPeriodStart: '',
  payPeriodEnd: '',
  regularHours: '',
  overtimeHours: '0',
  holidayHours: '0',
  hourlyRate: '',
  allowances: '0',
  notes: '',
  nisExempt: false,
  payDate: ''
};
function parseCSV(text: string): Partial<typeof emptyForm & {
  firstName: string;
  lastName: string;
}>[] {
  // Strip BOM and normalise line endings (Windows \r\n → \n)
  const cleaned = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleaned.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
  return lines.slice(1).map(line => {
    // Handle quoted fields with commas inside
    const vals: string[] = [];
    let cur = '',
      inQ = false;
    for (const ch of line) {
      if (ch === '"') {
        inQ = !inQ;
      } else if (ch === ',' && !inQ) {
        vals.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    vals.push(cur.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (vals[i] || '').replace(/"/g, '').trim();
    });

    // ── Connect Teams column mapping ──────────────────────────────────────────
    // Connect Teams exports: First name, Last name, Total paid hours, Regular,
    // Total overtime, Start date, End date, Room Attendant, Maintenance Technician, etc.
    const firstName = obj['first name'] || obj['firstname'] || '';
    const lastName = obj['last name'] || obj['lastname'] || '';
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : obj['employee name'] || obj['employeename'] || obj['name'] || `${firstName}${lastName}`;

    // Hours: Connect Teams uses "Regular" for regular hours, "Total overtime" for OT
    const regularHours = obj['regular'] || obj['regular hours'] || obj['regularhours'] || obj['total paid hours'] || obj['paid hours'] || obj['hours worked'] || obj['reg hours'] || obj['reg'] || '0';
    const overtimeHours = obj['total overtime'] || obj['overtime - ot'] || obj['overtime'] || obj['overtime hours'] || obj['overtimehours'] || obj['ot hours'] || obj['ot'] || '0';
    const holidayHours = obj['holiday hours'] || obj['holidayhours'] || obj['holiday'] || '0';

    // Dates: Connect Teams uses "Start date" / "End date" in M/D/YY format
    const rawStart = obj['start date'] || obj['pay period start'] || obj['periodstart'] || '';
    const rawEnd = obj['end date'] || obj['pay period end'] || obj['periodend'] || '';

    // Normalise M/D/YY → YYYY-MM-DD
    const normDate = (s: string) => {
      if (!s) return '';
      // Already ISO
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      // M/D/YY or M/D/YYYY
      const parts = s.split('/');
      if (parts.length === 3) {
        const [m, d, y] = parts;
        const year = y.length === 2 ? `20${y}` : y;
        return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
      return s;
    };

    // Position: Connect Teams has role columns (Room Attendant, Maintenance Technician, etc.)
    // Detect which role column has hours to infer position
    const roleColumns = [{
      col: 'room attendant',
      pos: 'Room Attendant',
      dept: 'Housekeeping'
    }, {
      col: 'maintenance technician',
      pos: 'Maintenance Technician',
      dept: 'Maintenance'
    }, {
      col: 'maintenance supervisor',
      pos: 'Maintenance Supervisor',
      dept: 'Maintenance'
    }, {
      col: 'comp-day',
      pos: 'Staff',
      dept: ''
    }];
    let inferredPosition = obj['position'] || obj['job title'] || POSITIONS[0];
    let inferredDepartment = obj['department'] || obj['dept'] || obj['team'] || obj['group'] || '';
    // Sum hours across role columns to find the dominant role
    let maxRoleHours = 0;
    for (const {
      col,
      pos,
      dept
    } of roleColumns) {
      const h = parseFloat(obj[col] || '0');
      if (h > maxRoleHours) {
        maxRoleHours = h;
        inferredPosition = pos;
        if (dept) inferredDepartment = dept;
      }
    }
    // If no role column had hours, keep position/job title fallback
    if (maxRoleHours === 0) inferredPosition = obj['position'] || obj['job title'] || POSITIONS[0];
    return {
      firstName,
      lastName,
      employeeName: fullName,
      // Send empty string when not in CSV so server falls back to rate card
      department: inferredDepartment,
      position: inferredPosition,
      payPeriodStart: normDate(rawStart),
      payPeriodEnd: normDate(rawEnd),
      regularHours,
      overtimeHours,
      holidayHours,
      hourlyRate: obj['hourly rate'] || obj['hourlyrate'] || obj['rate'] || obj['pay rate'] || obj['payrate'] || obj['wage'] || obj['hourly'] || obj['hour rate'] || '',
      allowances: obj['allowances'] || obj['allowance'] || obj['other pay'] || obj['other'] || obj['additional pay'] || obj['bonus'] || '',
      notes: obj['notes'] || ''
    };
  }).filter(r => r.employeeName);
}
const fmt = (n: number) => `EC$ ${n.toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── YTD Panel ────────────────────────────────────────────────────────────────
function YtdPanel() {
  const [ytdData, setYtdData] = useState<YtdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  useEffect(() => {
    setLoading(true);
    fetch(`/api/timeclock/ytd?year=${year}`).then(r => r.json()).then(d => {
      setYtdData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [year]);
  const currentYear = new Date().getFullYear();
  const years = Array.from({
    length: 4
  }, (_, i) => currentYear - i);
  if (loading) return <div className="bg-[#111E1A] border border-white/10 rounded-xl p-8 text-center text-white/40">
      Loading YTD data…
    </div>;
  if (!ytdData || ytdData.employees.length === 0) return <div className="bg-[#111E1A] border border-white/10 rounded-xl p-8 text-center">
      <TrendingUp className="w-8 h-8 text-white/20 mx-auto mb-2" />
      <p className="text-white/40 text-sm">No pay slip data for {year}. Generate pay slips to see YTD totals.</p>
    </div>;

  // Company-wide totals
  const totals = ytdData.employees.reduce((acc, e) => ({
    grossPay: acc.grossPay + e.grossPay,
    nisEmployee: acc.nisEmployee + e.nisEmployee,
    nisEmployer: acc.nisEmployer + e.nisEmployer,
    nisTotal: acc.nisTotal + e.nisTotal,
    payeTax: acc.payeTax + e.payeTax,
    netPay: acc.netPay + e.netPay
  }), {
    grossPay: 0,
    nisEmployee: 0,
    nisEmployer: 0,
    nisTotal: 0,
    payeTax: 0,
    netPay: 0
  });

  // True gross = net pay + employee NIS + employer NIS
  // (what the employee earned before deductions, plus the employer's NIS cost)
  const trueGross = parseFloat((totals.netPay + totals.nisEmployee + totals.nisEmployer).toFixed(2));
  return <div className="space-y-4">
      {/* Year selector + company totals */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#C8B89A]" />
          <span className="text-white font-semibold">Year-to-Date Summary</span>
        </div>
        <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="px-3 py-1.5 bg-[#0D1B17] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#C8B89A]/50">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Company-wide summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {[{
        label: 'Gross Pay',
        value: trueGross,
        color: 'text-white',
        sub: 'Net + NIS Emp + NIS Emplr'
      }, {
        label: 'NIS Employee',
        value: totals.nisEmployee,
        color: 'text-amber-400',
        sub: '6.5%'
      }, {
        label: 'NIS Employer',
        value: totals.nisEmployer,
        color: 'text-amber-300',
        sub: '7.0%'
      }, {
        label: 'Total NIS',
        value: totals.nisTotal,
        color: 'text-amber-200',
        sub: '13.5%'
      }, {
        label: 'Net Pay',
        value: totals.netPay,
        color: 'text-green-400'
      }].map(card => <div key={card.label} className="bg-[#0D1B17] border border-white/10 rounded-lg p-3">
            <div className={`text-sm font-bold ${card.color}`}>
              {fmt(card.value)}
            </div>
            <div className="text-[10px] text-white/40 mt-0.5 flex items-center gap-1">
              {card.label}
              {card.sub && <span className="text-white/25">· {card.sub}</span>}
            </div>
          </div>)}
      </div>

      {/* Per-employee breakdown */}
      <div className="space-y-2">
        {ytdData.employees.map(emp => {
        const isExpanded = expandedEmployee === emp.employeeName;
        const monthKeys = Object.keys(emp.byMonth);
        return <div key={emp.employeeName} className="bg-[#111E1A] border border-white/10 rounded-xl overflow-hidden">
              {/* Employee header row */}
              <button onClick={() => setExpandedEmployee(isExpanded ? null : emp.employeeName)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[#2C4A3E] flex items-center justify-center flex-shrink-0 text-[#C8B89A] text-xs font-bold">
                    {emp.employeeName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{emp.employeeName}</div>
                    <div className="text-[10px] text-white/40">{emp.department} · {emp.periods} period{emp.periods !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <div className="hidden sm:grid grid-cols-4 gap-4 text-right text-xs">
                    <div>
                      <div className="text-white/50 text-[10px]">NIS Emp</div>
                      <div className="text-amber-400 font-medium">{fmt(emp.nisEmployee)}</div>
                    </div>
                    <div>
                      <div className="text-white/50 text-[10px]">NIS Emplr</div>
                      <div className="text-amber-300 font-medium">{fmt(emp.nisEmployer)}</div>
                    </div>
                    <div>
                      <div className="text-white/50 text-[10px]">Net Pay</div>
                      <div className="text-green-400 font-medium">{fmt(emp.netPay)}</div>
                    </div>
                    <div>
                      <div className="text-white/50 text-[10px]">Gross Pay</div>
                      <div className="text-white font-medium">{fmt(parseFloat((emp.netPay + emp.nisEmployee + emp.nisEmployer).toFixed(2)))}</div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-white/30 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
              </button>

              {/* Expanded: month-by-month breakdown */}
              {isExpanded && <div className="border-t border-white/10 px-4 pb-4 pt-3">
                  {/* YTD totals row */}
                  <div className="grid grid-cols-5 gap-2 mb-3 pb-3 border-b border-white/10">
                    {[{
                label: 'YTD Gross',
                value: parseFloat((emp.netPay + emp.nisEmployee + emp.nisEmployer).toFixed(2)),
                color: 'text-white'
              }, {
                label: 'NIS Employee',
                value: emp.nisEmployee,
                color: 'text-amber-400'
              }, {
                label: 'NIS Employer',
                value: emp.nisEmployer,
                color: 'text-amber-300'
              }, {
                label: 'NIS Total',
                value: emp.nisTotal,
                color: 'text-amber-200'
              }, {
                label: 'Net Pay',
                value: emp.netPay,
                color: 'text-green-400'
              }].map(f => <div key={f.label} className="text-center">
                        <div className={`text-xs font-semibold ${f.color}`}>{fmt(f.value)}</div>
                        <div className="text-[10px] text-white/30 mt-0.5">{f.label}</div>
                      </div>)}
                  </div>

                  {/* Month-by-month table */}
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Monthly Breakdown</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[10px] text-white/30 uppercase">
                          <th className="text-left py-1.5 pr-3">Month</th>
                          <th className="text-right py-1.5 px-2">Periods</th>
                          <th className="text-right py-1.5 px-2">Gross</th>
                          <th className="text-right py-1.5 px-2">NIS Emp</th>
                          <th className="text-right py-1.5 px-2">NIS Emplr</th>
                          <th className="text-right py-1.5 px-2">NIS Total</th>
                          <th className="text-right py-1.5 pl-2">Net Pay</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthKeys.map(mk => {
                    const m = emp.byMonth[mk];
                    const [y, mo] = mk.split('-');
                    const label = `${MONTHS[parseInt(mo) - 1]} ${y}`;
                    return <tr key={mk} className="border-t border-white/5 hover:bg-white/5">
                              <td className="py-1.5 pr-3 text-white/70 font-medium">{label}</td>
                              <td className="py-1.5 px-2 text-right text-white/50">{m.periods}</td>
                              <td className="py-1.5 px-2 text-right text-white">{fmt(parseFloat((m.netPay + m.nisEmployee + m.nisEmployer).toFixed(2)))}</td>
                              <td className="py-1.5 px-2 text-right text-amber-400">{fmt(m.nisEmployee)}</td>
                              <td className="py-1.5 px-2 text-right text-amber-300">{fmt(m.nisEmployer)}</td>
                              <td className="py-1.5 px-2 text-right text-amber-200 font-medium">{fmt(m.nisTotal)}</td>
                              <td className="py-1.5 pl-2 text-right text-green-400 font-medium">{fmt(m.netPay)}</td>
                            </tr>;
                  })}
                        {/* Running total row */}
                        <tr className="border-t border-white/20 bg-white/5 font-semibold">
                          <td className="py-2 pr-3 text-white/60 text-[10px] uppercase tracking-wide">YTD Total</td>
                          <td className="py-2 px-2 text-right text-white/50">{emp.periods}</td>
                          <td className="py-2 px-2 text-right text-white">{fmt(parseFloat((emp.netPay + emp.nisEmployee + emp.nisEmployer).toFixed(2)))}</td>
                          <td className="py-2 px-2 text-right text-amber-400">{fmt(emp.nisEmployee)}</td>
                          <td className="py-2 px-2 text-right text-amber-300">{fmt(emp.nisEmployer)}</td>
                          <td className="py-2 px-2 text-right text-amber-200">{fmt(emp.nisTotal)}</td>
                          <td className="py-2 pl-2 text-right text-green-400">{fmt(emp.netPay)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>}
            </div>;
      })}
      </div>
    </div>;
}

// ─── Date formatting helper ───────────────────────────────────────────────────
function fmtPayDate(iso: string): string {
  // Parse YYYY-MM-DD without timezone shift
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
  const month = date.toLocaleString('en-US', {
    month: 'long'
  });
  return `${month} ${day}${suffix}, ${y}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TimeclockPage() {
  const {
    session,
    user,
    isPending
  } = useSession();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<TimeclockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState(''); // "YYYY-MM-DD|YYYY-MM-DD" or ''
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [sortField, setSortField] = useState<keyof TimeclockEntry>('payPeriodEnd');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<FinanceTab>('records');
  const [recordsSubTab, setRecordsSubTab] = useState<'records' | 'finance'>('records');
  const [reportsSubTab, setReportsSubTab] = useState<'reports' | 'ytd'>('reports');
  const [ratesSubTab, setRatesSubTab] = useState<'active' | 'archived'>('active');
  const [permittedTabs, setPermittedTabs] = useState<FinanceTab[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchParams] = useSearchParams();

  // Jump to tab from URL param e.g. ?tab=rates
  useEffect(() => {
    const tabParam = searchParams.get('tab') as FinanceTab | null;
    if (tabParam && ['records', 'rates', 'reports', 'payables', 'petty-cash'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Selection for bulk delete
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deletingBulk, setDeletingBulk] = useState(false);

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<TimeclockEntry | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Payslip
  const [payslipData, setPayslipData] = useState<PayslipData | null>(null);
  const [loadingPayslip, setLoadingPayslip] = useState<number | null>(null);
  const [activePayslipId, setActivePayslipId] = useState<number | null>(null);
  const [overtimeMultipliers, setOvertimeMultipliers] = useState<Record<number, string>>({});

  // Finance Functions — batch YTD processor
  const [batchStatus, setBatchStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [batchLogs, setBatchLogs] = useState<{
    id: number;
    employee: string;
    period: string;
    status: 'ok' | 'error';
    message?: string;
  }[]>([]);
  const [batchProgress, setBatchProgress] = useState({
    current: 0,
    total: 0
  });
  const [batchCurrentEmployee, setBatchCurrentEmployee] = useState('');
  const [batchOtMultiplier, setBatchOtMultiplier] = useState('1.5');
  const batchAbortRef = useRef(false);

  // Import
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  useEffect(() => {
    if (!isPending && !session) navigate('/staff/login');
  }, [session, isPending, navigate]);

  // Load permissions once session is confirmed
  useEffect(() => {
    if (!session) return;
    fetchPermissions().then(({
      tabs,
      isAdmin: admin
    }) => {
      setPermittedTabs(tabs);
      setIsAdmin(admin);
      // Set initial tab to first permitted tab if current isn't allowed
      setActiveTab(prev => {
        if (admin) return prev;
        if (tabs.includes(prev)) return prev;
        return tabs[0] ?? 'records';
      });
    });
  }, [session]);
  useEffect(() => {
    fetchEntries();
  }, []);
  async function fetchEntries() {
    setLoading(true);
    try {
      const res = await fetch('/api/timeclock');
      if (res.ok) setEntries(await res.json());
    } finally {
      setLoading(false);
    }
  }
  function openAdd() {
    setEditEntry(null);
    setForm(emptyForm);
    setFormError('');
    setShowForm(true);
  }
  function openEdit(e: TimeclockEntry) {
    setEditEntry(e);
    setForm({
      firstName: e.firstName || '',
      lastName: e.lastName || '',
      employeeName: e.employeeName,
      department: e.department,
      position: e.position,
      payPeriodStart: e.payPeriodStart.slice(0, 10),
      payPeriodEnd: e.payPeriodEnd.slice(0, 10),
      regularHours: e.regularHours,
      overtimeHours: e.overtimeHours,
      holidayHours: e.holidayHours,
      hourlyRate: e.hourlyRate,
      allowances: e.allowances,
      notes: e.notes || '',
      nisExempt: e.nisExempt ?? false,
      payDate: e.payDate ? String(e.payDate).slice(0, 10) : ''
    });
    setFormError('');
    setShowForm(true);
  }
  async function saveEntry() {
    if (!form.firstName.trim() && !form.lastName.trim() && !form.employeeName.trim()) return setFormError('Employee first and last name are required');
    if (!form.payPeriodStart || !form.payPeriodEnd) return setFormError('Pay period dates are required');
    if (!form.hourlyRate || parseFloat(form.hourlyRate) <= 0) return setFormError('Hourly rate is required');
    setSaving(true);
    setFormError('');
    // Derive employeeName from first/last if provided
    const payload = {
      ...form,
      employeeName: form.firstName && form.lastName ? `${form.firstName.trim()} ${form.lastName.trim()}` : form.employeeName.trim()
    };
    try {
      const url = editEntry ? `/api/timeclock/${editEntry.id}` : '/api/timeclock';
      const method = editEntry ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const d = await res.json();
        return setFormError(d.error || 'Save failed');
      }
      setShowForm(false);
      fetchEntries();
    } finally {
      setSaving(false);
    }
  }
  async function deleteEntry(id: number) {
    if (!confirm('Delete this pay slip entry?')) return;
    await fetch(`/api/timeclock/${id}`, {
      method: 'DELETE'
    });
    fetchEntries();
  }
  async function generatePayslip(id: number) {
    setLoadingPayslip(id);
    try {
      const multiplier = overtimeMultipliers[id] ?? '1';
      const res = await fetch(`/api/timeclock/${id}/payslip?overtimeMultiplier=${multiplier}`);
      if (!res.ok) return;
      const data = await res.json();
      // Fetch YTD for this employee: all periods in the same calendar year
      // up to and including this pay period's end date
      const year = new Date(data.payslip.payPeriodStart).getFullYear();
      const upTo = String(data.payslip.payPeriodEnd).slice(0, 10);
      const ytdRes = await fetch(`/api/timeclock/ytd?year=${year}&name=${encodeURIComponent(data.payslip.employeeName)}&upTo=${upTo}`);
      if (ytdRes.ok) {
        const ytdData = await ytdRes.json();
        const emp = ytdData.employees?.[0];
        if (emp) {
          // Fetch per-label YTD totals for custom deductions
          // (endpoint self-computes period count from the payslip table — no periods= param needed)
          let customDeductionsYtd: Record<string, number> = {};
          try {
            const cdYtdRes = await fetch(`/api/employee-deductions/ytd?employee_name=${encodeURIComponent(data.payslip.employeeName)}&year=${year}&upTo=${upTo}`);
            if (cdYtdRes.ok) customDeductionsYtd = await cdYtdRes.json();
          } catch {/* non-fatal */}
          data.ytd = {
            periods: emp.periods,
            regularHours: emp.regularHours,
            overtimeHours: emp.overtimeHours,
            holidayHours: emp.holidayHours,
            regularPay: emp.regularPay,
            overtimePay: emp.overtimePay,
            holidayPay: emp.holidayPay,
            grossPay: emp.grossPay,
            nisEmployee: emp.nisEmployee,
            nisEmployer: emp.nisEmployer,
            nisTotal: emp.nisTotal,
            payeTax: emp.payeTax,
            totalDeductions: emp.totalDeductions,
            netPay: emp.netPay,
            customDeductionsYtd
          };
        }
      }
      setPayslipData(data);
    } finally {
      setLoadingPayslip(null);
    }
  }
  async function runBatchYtdProcessor() {
    batchAbortRef.current = false;
    setBatchStatus('running');
    setBatchLogs([]);
    setBatchProgress({
      current: 0,
      total: 0
    });
    setBatchCurrentEmployee('');
    try {
      // Always fetch fresh from the API — do not rely on paginated component state
      const res = await fetch('/api/timeclock');
      if (!res.ok) throw new Error(`Failed to fetch entries: HTTP ${res.status}`);
      const allEntries: TimeclockEntry[] = await res.json();
      if (allEntries.length === 0) {
        setBatchStatus('done');
        setBatchProgress({
          current: 0,
          total: 0
        });
        return;
      }

      // Group by employee, sort each group oldest pay period first so YTD accumulates correctly
      const byEmployee: Record<string, TimeclockEntry[]> = {};
      for (const e of allEntries) {
        if (!byEmployee[e.employeeName]) byEmployee[e.employeeName] = [];
        byEmployee[e.employeeName].push(e);
      }
      for (const name of Object.keys(byEmployee)) {
        byEmployee[name].sort((a, b) => String(a.payPeriodStart).localeCompare(String(b.payPeriodStart)));
      }
      const employeeNames = Object.keys(byEmployee).sort();
      const total = allEntries.length;
      setBatchProgress({
        current: 0,
        total
      });
      let processed = 0;
      for (const name of employeeNames) {
        if (batchAbortRef.current) break;
        setBatchCurrentEmployee(name);
        for (const slip of byEmployee[name]) {
          if (batchAbortRef.current) break;
          const logEntry: {
            id: number;
            employee: string;
            period: string;
            status: 'ok' | 'error';
            message?: string;
          } = {
            id: slip.id,
            employee: name,
            period: `${String(slip.payPeriodStart).slice(0, 10)} → ${String(slip.payPeriodEnd).slice(0, 10)}`,
            status: 'ok'
          };
          try {
            const r = await fetch(`/api/timeclock/${slip.id}/payslip?overtimeMultiplier=${batchOtMultiplier}`);
            if (!r.ok) {
              logEntry.status = 'error';
              logEntry.message = `HTTP ${r.status}`;
            }
          } catch (err) {
            logEntry.status = 'error';
            logEntry.message = String(err);
          }
          processed++;
          setBatchProgress({
            current: processed,
            total
          });
          setBatchLogs(prev => [...prev, logEntry]);
        }
      }
      setBatchCurrentEmployee('');
      setBatchStatus(batchAbortRef.current ? 'idle' : 'done');
    } catch (err) {
      setBatchCurrentEmployee('');
      setBatchLogs(prev => [...prev, {
        id: 0,
        employee: '—',
        period: '—',
        status: 'error',
        message: String(err)
      }]);
      setBatchStatus('error');
    }
  }
  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        alert('No valid rows found. Check CSV format.');
        return;
      }
      const res = await fetch('/api/timeclock/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entries: parsed
        })
      });
      const d = await res.json();
      if (res.ok) {
        alert(`Imported ${d.imported} entries successfully.`);
        fetchEntries();
      } else if (res.status === 409 && d.duplicates?.length) {
        alert(`Import blocked — duplicate pay period(s) detected:\n\n${d.duplicates.join('\n')}\n\nRemove these rows from your file and try again.`);
      } else {
        alert(d.message || d.error || 'Import failed');
      }
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }
  function exportCSV() {
    const headers = ['First Name', 'Last Name', 'Employee Name', 'Department', 'Position', 'Pay Period Start', 'Pay Period End', 'Pay Date', 'Regular Hours', 'Overtime Hours', 'Holiday Hours', 'Hourly Rate', 'Allowances', 'Notes'];
    const rows = filtered.map(e => [e.firstName || '', e.lastName || '', e.employeeName, e.department, e.position, e.payPeriodStart.slice(0, 10), e.payPeriodEnd.slice(0, 10), e.payDate ? String(e.payDate).slice(0, 10) : '', e.regularHours, e.overtimeHours, e.holidayHours, e.hourlyRate, e.allowances, e.notes || '']);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], {
      type: 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslips-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function toggleSort(field: keyof TimeclockEntry) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  // Unique sorted employee names for the dropdown
  const employeeNames = Array.from(new Set(entries.map(e => e.employeeName))).sort();
  const departmentOptions = Array.from(new Set(entries.map(e => e.department).filter(Boolean))).sort();

  // Distinct pay periods derived from the data, newest first
  const periodOptions = Array.from(new Map(entries.map(e => {
    const start = e.payPeriodStart.slice(0, 10);
    const end = e.payPeriodEnd.slice(0, 10);
    return [`${start}|${end}`, {
      start,
      end
    }];
  })).values()).sort((a, b) => b.end.localeCompare(a.end));

  // Resolve active filter bounds from the selected period key
  const activePeriodStart = selectedPeriod ? selectedPeriod.split('|')[0] : '';
  const activePeriodEnd = selectedPeriod ? selectedPeriod.split('|')[1] : '';
  const filtered = entries.filter(e => {
    const matchesEmployee = !selectedEmployee || e.employeeName === selectedEmployee;
    const matchesDepartment = !selectedDepartment || e.department === selectedDepartment;
    const matchesSearch = !search || e.employeeName.toLowerCase().includes(search.toLowerCase()) || e.department.toLowerCase().includes(search.toLowerCase());
    // Pay period date range filter — entry's period must overlap [activePeriodStart, activePeriodEnd]
    const entryEnd = e.payPeriodEnd.slice(0, 10);
    const entryStart = e.payPeriodStart.slice(0, 10);
    const matchesPeriodStart = !activePeriodStart || entryEnd >= activePeriodStart;
    const matchesPeriodEnd = !activePeriodEnd || entryStart <= activePeriodEnd;
    return matchesEmployee && matchesDepartment && matchesSearch && matchesPeriodStart && matchesPeriodEnd;
  }).sort((a, b) => {
    const av = a[sortField] ?? '';
    const bv = b[sortField] ?? '';
    return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  // Selection helpers
  const allFilteredIds = filtered.map(e => e.id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.has(id));
  const someSelected = allFilteredIds.some(id => selectedIds.has(id));

  // Pagination derived values
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedEntries = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Reset to page 1 when filters/sort/pageSize change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedEmployee, selectedDepartment, selectedPeriod, sortField, sortDir, pageSize]);
  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        allFilteredIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => new Set([...prev, ...allFilteredIds]));
    }
  }
  function toggleSelectOne(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  async function deleteSelected() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected entr${selectedIds.size === 1 ? 'y' : 'ies'}? This cannot be undone.`)) return;
    setDeletingBulk(true);
    try {
      await Promise.all([...selectedIds].map(id => fetch(`/api/timeclock/${id}`, {
        method: 'DELETE'
      })));
      setSelectedIds(new Set());
      fetchEntries();
    } finally {
      setDeletingBulk(false);
    }
  }
  const SortIcon = ({
    field
  }: {
    field: keyof TimeclockEntry;
  }) => sortField === field ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" /> : null;
  if (isPending) return <div className="min-h-screen bg-[#0D1B17] flex items-center justify-center"><div className="text-white/50">Loading…</div></div>;
  return <div className="min-h-screen bg-[#0D1B17] text-white">
      <Helmet>
        <title>Finance — Stone Trail Villas Staff</title>
        <meta name="description" content="Finance management: payroll records, petty cash, accounts payable, and reports for Stone Trail Villas staff." />
        <link rel="canonical" href="https://stonetrailvillas.com/staff/timeclock" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <StaffHeader userName={user?.name || user?.email} userRole={user?.role} />
      <main className="w-full px-6 pt-[96px] pb-8">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Finance</h1>
        </div>

        {/* Two-column layout: main content + sidebar */}
        <div className="flex gap-6 items-start">

          {/* ── Main content column ── */}
          <div className="w-full min-w-0">

        {/* Tabs row + inline stats */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1 bg-[#111E1A] border border-white/10 rounded-lg p-1 w-fit">
          {(isAdmin || permittedTabs.includes('rates')) && <button onClick={() => setActiveTab('rates')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'rates' ? 'bg-[#2C4A3E] text-white' : 'text-white/50 hover:text-white'}`}>
            <Users className="w-4 h-4" /> Employee Rates & Deductions
          </button>}
          {(isAdmin || permittedTabs.includes('reports')) && <button onClick={() => setActiveTab('reports')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'reports' ? 'bg-[#2C4A3E] text-white' : 'text-white/50 hover:text-white'}`}>
            <BarChart2 className="w-4 h-4" /> Reports
          </button>}
          {(isAdmin || permittedTabs.includes('records')) && <button onClick={() => setActiveTab('records')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'records' ? 'bg-[#2C4A3E] text-white' : 'text-white/50 hover:text-white'}`}>
            <FileText className="w-4 h-4" /> Pay Slip Records
          </button>}
          {(isAdmin || permittedTabs.includes('payables')) && <button onClick={() => setActiveTab('payables')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'payables' ? 'bg-[#2C4A3E] text-white' : 'text-white/50 hover:text-white'}`}>
            <TrendingUp className="w-4 h-4" /> Accounts Payable
          </button>}
          {(isAdmin || permittedTabs.includes('petty-cash')) && <button onClick={() => setActiveTab('petty-cash')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'petty-cash' ? 'bg-[#2C4A3E] text-white' : 'text-white/50 hover:text-white'}`}>
            <Wallet className="w-4 h-4" /> Petty Cash
          </button>}
          </div>

          {/* Inline stats — right of tabs */}
          {(() => {
              const totalEntries = filtered.length;
              const uniqueEmployees = new Set(filtered.map(e => e.employeeName)).size;
              const regHours = filtered.reduce((s, e) => s + parseFloat(e.regularHours), 0);
              const otHours = filtered.reduce((s, e) => s + parseFloat(e.overtimeHours), 0);
              const totalHours = regHours + otHours || 1;
              const regPct = regHours / totalHours;
              const otPct = otHours / totalHours;
              const R = 18;
              const CX = 22;
              const CY = 22;
              const stroke = 7;
              const circ = 2 * Math.PI * R;
              const regDash = regPct * circ;
              const otDash = otPct * circ;
              return <div className="flex items-center gap-3">
                {/* Mini donut */}
                <div className="flex items-center gap-2 bg-[#111E1A] border border-white/10 rounded-lg px-3 py-2">
                  <svg width="44" height="44" viewBox="0 0 44 44">
                    <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
                    <circle cx={CX} cy={CY} r={R} fill="none" stroke="#2C4A3E" strokeWidth={stroke} strokeDasharray={`${regDash} ${circ - regDash}`} strokeDashoffset={circ / 4} strokeLinecap="butt" />
                    <circle cx={CX} cy={CY} r={R} fill="none" stroke="#C9A96E" strokeWidth={stroke} strokeDasharray={`${otDash} ${circ - otDash}`} strokeDashoffset={circ / 4 - regDash} strokeLinecap="butt" />
                    <text x={CX} y={CY + 4} textAnchor="middle" fill="white" fontSize="8" fontWeight="600">{(regHours + otHours).toFixed(0)}h</text>
                  </svg>
                  <div className="space-y-0.5 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-sm" style={{
                        background: '#2C4A3E',
                        border: '1px solid rgba(255,255,255,0.15)'
                      }} />
                      <span className="text-white/40">Reg</span>
                      <span className="text-[#C8B89A] font-semibold ml-1">{regHours.toFixed(0)}h</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-sm" style={{
                        background: '#C9A96E'
                      }} />
                      <span className="text-white/40">OT</span>
                      <span className="text-[#C8B89A] font-semibold ml-1">{otHours.toFixed(0)}h</span>
                    </div>
                  </div>
                </div>
                {/* Entries */}
                <div className="bg-[#111E1A] border border-white/10 rounded-lg px-4 py-2 text-center">
                  <div className="text-xl font-bold text-[#C8B89A]">{totalEntries}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest">Entries</div>
                </div>
                {/* Employees */}
                <div className="bg-[#111E1A] border border-white/10 rounded-lg px-4 py-2 text-center">
                  <div className="text-xl font-bold text-[#C8B89A]">{uniqueEmployees}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest">Employees</div>
                </div>
              </div>;
            })()}
        </div>

        {/* Records tab */}
        {activeTab === 'records' && (isAdmin || permittedTabs.includes('records')) && <>
            {/* Sub-tab bar */}
            <div className="flex gap-1 mb-5 border-b border-white/10 pb-0">
              <button onClick={() => setRecordsSubTab('records')} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${recordsSubTab === 'records' ? 'border-[#C8B89A] text-[#C8B89A]' : 'border-transparent text-white/40 hover:text-white'}`}>
                <FileText className="w-3.5 h-3.5" /> Records
              </button>
              <button onClick={() => setRecordsSubTab('finance')} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${recordsSubTab === 'finance' ? 'border-[#C8B89A] text-[#C8B89A]' : 'border-transparent text-white/40 hover:text-white'}`}>
                <Zap className="w-3.5 h-3.5" /> Finance Functions
              </button>
            </div>
            {/* Records sub-tab content */}
            {recordsSubTab === 'records' && <div>
            {/* Filter bar — single row: employee | pay period | search */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">

              {/* Employee filter */}
              <div className="relative sm:w-52 flex-shrink-0">
                <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className="w-full appearance-none pl-3 pr-8 py-2.5 bg-[#111E1A] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#C8B89A]/50">
                  <option value="">All Employees</option>
                  {employeeNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                {selectedEmployee && <button onClick={() => setSelectedEmployee('')} className="absolute right-7 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>}
              </div>

              {/* Department filter */}
              <div className="relative sm:w-48 flex-shrink-0">
                <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)} className="w-full appearance-none pl-3 pr-8 py-2.5 bg-[#111E1A] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#C8B89A]/50">
                  <option value="">All Departments</option>
                  {departmentOptions.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                {selectedDepartment && <button onClick={() => setSelectedDepartment('')} className="absolute right-7 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>}
              </div>

              {/* Pay period filter */}
              <div className="relative sm:w-60 flex-shrink-0">
                <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} className="w-full px-3 py-2.5 bg-[#111E1A] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#C8B89A]/50">
                  <option value="">All Pay Periods</option>
                  {periodOptions.map(p => <option key={`${p.start}|${p.end}`} value={`${p.start}|${p.end}`}>
                      {fmtPayDate(p.start)} – {fmtPayDate(p.end)}
                    </option>)}
                </select>
                {selectedPeriod && <button onClick={() => setSelectedPeriod('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>}
              </div>

              {/* Text search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or department…" className="w-full pl-9 pr-4 py-2.5 bg-[#111E1A] border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C8B89A]/50" />
                {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>}
              </div>

              {/* Inline action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#111E1A] border border-white/10 hover:border-white/20 text-white/70 hover:text-white text-sm font-medium transition-colors cursor-pointer ${importing ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Upload className="w-4 h-4" /> {importing ? 'Importing…' : 'Import CSV'}
                  <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileImport} disabled={importing} />
                </label>
                <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#111E1A] border border-white/10 hover:border-white/20 text-white/70 hover:text-white text-sm font-medium transition-colors">
                  <Download className="w-4 h-4" /> Export CSV
                </button>
                <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2C4A3E] hover:bg-[#3a5e50] text-white text-sm font-medium transition-colors">
                  <Plus className="w-4 h-4" /> Add Entry
                </button>
              </div>
            </div>

            {/* Bulk action bar — shown when rows are selected */}
            {someSelected && <div className="flex items-center justify-between gap-3 mb-3 px-4 py-2.5 bg-[#2C4A3E]/40 border border-[#2C4A3E] rounded-lg">
                <span className="text-sm text-white/80">
                  <span className="font-semibold text-[#C8B89A]">{selectedIds.size}</span> entr{selectedIds.size === 1 ? 'y' : 'ies'} selected
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 text-xs transition-colors">
                    Deselect all
                  </button>
                  <button onClick={deleteSelected} disabled={deletingBulk} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 text-xs font-medium transition-colors disabled:opacity-50">
                    <Trash2 className="w-3.5 h-3.5" />
                    {deletingBulk ? 'Deleting…' : `Delete ${selectedIds.size}`}
                  </button>
                </div>
              </div>}

            <div className="bg-[#111E1A] border border-white/10 rounded-xl overflow-hidden">
              {loading ? <div className="p-12 text-center text-white/40">Loading entries…</div> : filtered.length === 0 ? <div className="p-12 text-center">
                  <Clock className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40">{search ? 'No entries match your search' : 'No pay slip entries yet. Add one or import a CSV.'}</p>
                </div> : <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
                        {/* Select-all checkbox */}
                        <th className="pl-4 pr-2 py-3 w-8">
                          <input type="checkbox" checked={allSelected} ref={el => {
                            if (el) el.indeterminate = someSelected && !allSelected;
                          }} onChange={toggleSelectAll} className="w-3.5 h-3.5 rounded accent-[#C8B89A] cursor-pointer" />
                        </th>
                        {[{
                          label: 'Employee',
                          field: 'employeeName' as const
                        }, {
                          label: 'Department',
                          field: 'department' as const
                        }, {
                          label: 'Pay Period',
                          field: 'payPeriodStart' as const
                        }, {
                          label: 'Pay Date',
                          field: 'payDate' as const
                        }, {
                          label: 'Reg Hrs',
                          field: 'regularHours' as const
                        }, {
                          label: 'OT Hrs',
                          field: 'overtimeHours' as const
                        }, {
                          label: 'Hol Hrs',
                          field: 'holidayHours' as const
                        }, {
                          label: 'Rate (EC$)',
                          field: 'hourlyRate' as const
                        }, {
                          label: 'Notes',
                          field: 'notes' as const
                        }].map(col => <th key={col.field} onClick={() => toggleSort(col.field)} className="px-4 py-3 text-left cursor-pointer hover:text-white transition-colors select-none">
                            <span className="flex items-center gap-1">{col.label}<SortIcon field={col.field} /></span>
                          </th>)}
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedEntries.map((entry, idx) => <tr key={entry.id} className={`border-b border-white/5 transition-colors ${activePayslipId === entry.id ? 'bg-[#C8B89A]/10 border-l-2 border-l-[#C8B89A]/60' : selectedIds.has(entry.id) ? 'bg-[#2C4A3E]/20 hover:bg-white/5' : idx % 2 === 0 ? 'hover:bg-white/5' : 'bg-white/[0.02] hover:bg-white/5'}`}>
                          <td className="pl-4 pr-2 py-3">
                            <input type="checkbox" checked={selectedIds.has(entry.id)} onChange={() => toggleSelectOne(entry.id)} className="w-3.5 h-3.5 rounded accent-[#C8B89A] cursor-pointer" />
                          </td>
                          <td className="px-4 py-3 font-medium text-white">
                            <div className="flex items-center gap-2">
                              {entry.employeeName}
                              {!!entry.nisExempt && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wide">NIS Exempt</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-white/70">{entry.department}</td>
                          <td className="px-4 py-3 text-white/70 whitespace-nowrap">
                            {fmtPayDate(entry.payPeriodStart)} – {fmtPayDate(entry.payPeriodEnd)}
                          </td>
                          <td className="px-4 py-3 text-white/70 whitespace-nowrap">
                            <input type="date" value={entry.payDate ? String(entry.payDate).slice(0, 10) : ''} onChange={async e => {
                            const newDate = e.target.value;
                            await fetch(`/api/timeclock/${entry.id}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({
                                ...entry,
                                payDate: newDate || null
                              })
                            });
                            fetchEntries();
                          }} className="bg-transparent border border-white/20 rounded px-2 py-1 text-xs text-white/70 focus:outline-none focus:border-[#C8B89A]/60 cursor-pointer w-[120px]" />
                          </td>
                          <td className="px-4 py-3 text-white/70">{parseFloat(entry.regularHours).toFixed(1)}</td>
                          <td className="px-4 py-3 text-white/70">{parseFloat(entry.overtimeHours).toFixed(1)}</td>
                          <td className="px-4 py-3 text-white/70">{parseFloat(entry.holidayHours).toFixed(1)}</td>
                          <td className="px-4 py-3 text-white/70">{parseFloat(entry.hourlyRate).toFixed(2)}</td>
                          <td className="px-4 py-3 text-white/50 max-w-[180px]">
                            {entry.notes ? <span title={entry.notes} className="block truncate text-xs cursor-default">
                                {entry.notes}
                              </span> : <span className="text-white/20 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {/* Overtime multiplier selector — 0.5 increments */}
                              <select value={overtimeMultipliers[entry.id] ?? '1'} onChange={e => setOvertimeMultipliers(prev => ({
                              ...prev,
                              [entry.id]: e.target.value
                            }))} title="Overtime rate multiplier" className="h-7 px-1.5 rounded text-xs bg-[#1A2E28] border border-white/20 text-white/80 focus:outline-none focus:border-[#C8B89A] cursor-pointer">
                                {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].map(v => <option key={v} value={String(v)} className="bg-[#1A2E28]">OT ×{v}</option>)}
                              </select>
                              <button onClick={() => {
                              setActivePayslipId(entry.id);
                              generatePayslip(entry.id);
                            }} disabled={loadingPayslip === entry.id} className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 ${activePayslipId === entry.id ? 'bg-[#C8B89A] text-[#1A2E28] shadow-sm' : 'bg-[#2C4A3E] hover:bg-[#3a5e50] text-[#C8B89A]'}`}>
                                <FileText className="w-3.5 h-3.5" />
                                {loadingPayslip === entry.id ? '…' : activePayslipId === entry.id ? 'Viewing' : 'Pay Slip'}
                              </button>
                              <button onClick={() => openEdit(entry)} className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => deleteEntry(entry.id)} className="p-1.5 rounded hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>)}
                    </tbody>
                  </table>
                </div>}
            </div>
            {/* ── Pagination bar ─────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-3">
              {/* Left: record count + rows-per-page */}
              <div className="flex items-center gap-3 text-xs text-white/40">
                <span>
                  {filtered.length === 0 ? '0' : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)}`} of {filtered.length} entries
                  {selectedEmployee && <span className="text-[#C8B89A]/60"> · {selectedEmployee}</span>}
                  {selectedPeriod && <span className="text-[#C8B89A]/60"> · date filtered</span>}
                  {selectedIds.size > 0 && <span className="text-[#C8B89A]/80"> · {selectedIds.size} selected</span>}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-white/30">Rows:</span>
                  {[25, 50, 75, 100].map(n => <button key={n} onClick={() => setPageSize(n)} className={`px-2 py-0.5 rounded text-xs transition-colors ${pageSize === n ? 'bg-[#2C4A3E] text-[#C8B89A]' : 'text-white/40 hover:text-white hover:bg-white/10'}`}>
                      {n}
                    </button>)}
                </div>
              </div>

              {/* Right: page navigation */}
              {totalPages > 1 && <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage(1)} disabled={safePage === 1} className="px-2 py-1 rounded text-xs text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">«</button>
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="px-2 py-1 rounded text-xs text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">‹</button>

                  {/* Page number pills */}
                  {Array.from({
                    length: totalPages
                  }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2).reduce<(number | '…')[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, []).map((p, i) => p === '…' ? <span key={`ellipsis-${i}`} className="px-1 text-white/20 text-xs">…</span> : <button key={p} onClick={() => setCurrentPage(p as number)} className={`min-w-[28px] px-2 py-1 rounded text-xs transition-colors ${safePage === p ? 'bg-[#2C4A3E] text-[#C8B89A] font-semibold' : 'text-white/40 hover:text-white hover:bg-white/10'}`}>{p}</button>)}

                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="px-2 py-1 rounded text-xs text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">›</button>
                  <button onClick={() => setCurrentPage(totalPages)} disabled={safePage === totalPages} className="px-2 py-1 rounded text-xs text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">»</button>
                </div>}
            </div>
          </div>}

            {/* Finance Functions sub-tab content */}
            {recordsSubTab === 'finance' && <div className="space-y-6 py-2">
                <div className="bg-[#111E1A] border border-white/10 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
                    <Zap className="w-5 h-5 text-[#C8B89A]" />
                    <div>
                      <h3 className="text-sm font-semibold text-white">Batch YTD Processor</h3>
                      <p className="text-xs text-white/40 mt-0.5">Cycles through every employee and every pay slip, computing YTD calculations in chronological order.</p>
                    </div>
                  </div>
                  <div className="px-6 py-5 space-y-5">
                    {batchStatus === 'idle' && entries.length > 0 && <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white/50">
                        <Users className="w-4 h-4 text-white/30 flex-shrink-0" />
                        <span>Will process <span className="text-white/80 font-medium">{entries.length} pay slips</span> across <span className="text-white/80 font-medium">{new Set(entries.map(e => e.employeeName)).size} employees</span>, oldest period first per employee.</span>
                      </div>}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-white/50">Overtime multiplier</label>
                        <select value={batchOtMultiplier} onChange={e => setBatchOtMultiplier(e.target.value)} disabled={batchStatus === 'running'} className="h-8 px-2 rounded bg-[#1A2E28] border border-white/20 text-xs text-white/80 focus:outline-none focus:border-[#C8B89A] disabled:opacity-50">
                          {[0.5, 1, 1.5, 2, 2.5, 3].map(v => <option key={v} value={String(v)}>×{v}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        {batchStatus === 'running' && <button onClick={() => {
                        batchAbortRef.current = true;
                      }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors">Cancel</button>}
                        <button onClick={runBatchYtdProcessor} disabled={batchStatus === 'running'} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#2C4A3E] hover:bg-[#3a5e50] text-[#C8B89A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                          {batchStatus === 'running' ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : <><Zap className="w-4 h-4" /> Run Processor</>}
                        </button>
                      </div>
                    </div>
                    {(batchStatus === 'running' || batchStatus === 'done' || batchStatus === 'error') && batchProgress.total > 0 && <div className="space-y-2">
                        {batchStatus === 'running' && batchCurrentEmployee && <div className="flex items-center gap-2 text-xs text-white/50">
                            <Loader2 className="w-3 h-3 animate-spin text-[#C8B89A] flex-shrink-0" />
                            <span>Processing <span className="text-[#C8B89A] font-medium">{batchCurrentEmployee}</span></span>
                          </div>}
                        <div className="flex items-center justify-between text-xs text-white/40">
                          <span>{batchStatus === 'done' ? 'Complete' : batchStatus === 'error' ? 'Stopped with errors' : 'Running…'}</span>
                          <span>{batchProgress.current} / {batchProgress.total} pay slips <span className="ml-1.5 text-white/25">({Math.round(batchProgress.current / batchProgress.total * 100)}%)</span></span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-200 ${batchStatus === 'error' ? 'bg-red-500' : batchStatus === 'done' ? 'bg-green-500' : 'bg-[#C8B89A]'}`} style={{
                        width: `${Math.round(batchProgress.current / batchProgress.total * 100)}%`
                      }} />
                        </div>
                      </div>}
                    {batchStatus === 'done' && (() => {
                    const errCount = batchLogs.filter(l => l.status === 'error').length;
                    const okCount = batchLogs.filter(l => l.status === 'ok').length;
                    return errCount > 0 ? <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span>Completed with {errCount} error{errCount !== 1 ? 's' : ''}. {okCount} pay slip{okCount !== 1 ? 's' : ''} processed successfully.</span>
                        </div> : <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                          <span>All {batchProgress.total} pay slips processed successfully. YTD calculations are up to date.</span>
                        </div>;
                  })()}
                    {batchStatus === 'error' && <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" /><span>Job stopped with errors. Review the log below.</span>
                      </div>}
                    {batchLogs.length > 0 && <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Activity Log</span>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-green-400/70">{batchLogs.filter(l => l.status === 'ok').length} ok</span>
                            {batchLogs.some(l => l.status === 'error') && <span className="text-red-400">{batchLogs.filter(l => l.status === 'error').length} error{batchLogs.filter(l => l.status === 'error').length !== 1 ? 's' : ''}</span>}
                          </div>
                        </div>
                        <div className="bg-[#0D1B17] border border-white/5 rounded-lg max-h-80 overflow-y-auto font-mono text-[11px]" ref={el => {
                      if (el && batchStatus === 'running') el.scrollTop = el.scrollHeight;
                    }}>
                          {batchLogs.map((log, i) => <div key={i} className={`flex items-start gap-3 px-4 py-1.5 border-b border-white/5 last:border-0 ${log.status === 'error' ? 'bg-red-500/5' : ''}`}>
                              {log.status === 'ok' ? <CheckCircle2 className="w-3 h-3 text-green-500/50 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />}
                              <span className="text-white/20 flex-shrink-0 w-8 tabular-nums">{log.id}</span>
                              <span className="text-white/60 flex-shrink-0 w-36 truncate">{log.employee}</span>
                              <span className="text-white/30">{log.period}</span>
                              {log.message && <span className="text-red-400 ml-auto pl-2">{log.message}</span>}
                            </div>)}
                        </div>
                      </div>}
                  </div>
                </div>
              </div>}
          </>}

        {/* YTD tab — now a sub-tab under Reports */}

        {/* Reports tab */}
        {activeTab === 'reports' && (isAdmin || permittedTabs.includes('reports')) && <div className="py-2">
            {/* Sub-tab bar */}
            <div className="flex gap-1 mb-5 border-b border-white/10 pb-0">
              <button onClick={() => setReportsSubTab('reports')} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${reportsSubTab === 'reports' ? 'border-[#C8B89A] text-[#C8B89A]' : 'border-transparent text-white/40 hover:text-white'}`}>
                <BarChart2 className="w-3.5 h-3.5" /> Reports
              </button>
              <button onClick={() => setReportsSubTab('ytd')} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${reportsSubTab === 'ytd' ? 'border-[#C8B89A] text-[#C8B89A]' : 'border-transparent text-white/40 hover:text-white'}`}>
                <TrendingUp className="w-3.5 h-3.5" /> YTD Totals
              </button>
            </div>
            {reportsSubTab === 'reports' && <PayrollReports />}
            {reportsSubTab === 'ytd' && <YtdPanel />}
          </div>}
        {activeTab === 'rates' && (isAdmin || permittedTabs.includes('rates')) && <div className="py-2 space-y-8">
            {/* Rates sub-tabs: Active / Archived */}
            <div className="flex gap-1 border-b border-white/10 mb-6">
              <button
                onClick={() => setRatesSubTab('active')}
                style={ratesSubTab === 'active' ? { borderBottomColor: 'hsl(var(--staff-gold))', color: 'hsl(var(--staff-gold))' } : {}}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${ratesSubTab === 'active' ? '' : 'border-transparent text-white/40 hover:text-white'}`}
              >
                <Users className="w-3.5 h-3.5" /> Active Employees
              </button>
              <button
                onClick={() => setRatesSubTab('archived')}
                style={ratesSubTab === 'archived' ? { borderBottomColor: 'hsl(var(--staff-gold))', color: 'hsl(var(--staff-gold))' } : {}}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${ratesSubTab === 'archived' ? '' : 'border-transparent text-white/40 hover:text-white'}`}
              >
                <Archive className="w-3.5 h-3.5" /> Archived Employees
              </button>
            </div>

            {ratesSubTab === 'active' && <>
              <EmployeeRatesPanel onArchived={() => setRatesSubTab('archived')} />
              <div className="border-t border-white/10 pt-6">
                <DeductionsPanel employeeNames={employeeNames} />
              </div>
              <div className="border-t border-white/10 pt-6">
                <NisRatesPanel />
              </div>
            </>}

            {ratesSubTab === 'archived' && <ArchivedEmployeesPanel />}
          </div>}

        {/* Accounts Payable tab */}
        {activeTab === 'payables' && (isAdmin || permittedTabs.includes('payables')) && <div className="py-2">
            <AccountsPayables />
          </div>}

        {/* Petty Cash tab */}
        {activeTab === 'petty-cash' && (isAdmin || permittedTabs.includes('petty-cash')) && <div className="py-2">
            <PettyCash />
          </div>}

          </div>{/* end main content column */}

        </div>{/* end layout */}
      </main>

      {/* Add/Edit Modal */}
      {showForm && <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111E1A] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-lg font-semibold">{editEntry ? 'Edit Entry' : 'Add Pay Slip Entry'}</h2>
              <button onClick={() => setShowForm(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/50 mb-1.5">First Name *</label>
                <input value={form.firstName} onChange={e => setForm(f => ({
              ...f,
              firstName: e.target.value
            }))} placeholder="e.g. Ketisha" className="w-full px-3 py-2 bg-[#0D1B17] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#C8B89A]/50" />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Last Name *</label>
                <input value={form.lastName} onChange={e => setForm(f => ({
              ...f,
              lastName: e.target.value
            }))} placeholder="e.g. Hannaway" className="w-full px-3 py-2 bg-[#0D1B17] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#C8B89A]/50" />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Department</label>
                <select value={form.department} onChange={e => setForm(f => ({
              ...f,
              department: e.target.value
            }))} className="w-full px-3 py-2 bg-[#0D1B17] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#C8B89A]/50">
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Position</label>
                <select value={form.position} onChange={e => setForm(f => ({
              ...f,
              position: e.target.value
            }))} className="w-full px-3 py-2 bg-[#0D1B17] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#C8B89A]/50">
                  {POSITIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Pay Period Start *</label>
                <input type="date" value={form.payPeriodStart} onChange={e => setForm(f => ({
              ...f,
              payPeriodStart: e.target.value
            }))} className="w-full px-3 py-2 bg-[#0D1B17] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#C8B89A]/50" />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Pay Period End *</label>
                <input type="date" value={form.payPeriodEnd} onChange={e => setForm(f => ({
              ...f,
              payPeriodEnd: e.target.value
            }))} className="w-full px-3 py-2 bg-[#0D1B17] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#C8B89A]/50" />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Pay Date</label>
                <input type="date" value={form.payDate} onChange={e => setForm(f => ({
              ...f,
              payDate: e.target.value
            }))} className="w-full px-3 py-2 bg-[#0D1B17] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#C8B89A]/50" />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Regular Hours *</label>
                <input type="number" step="0.5" min="0" value={form.regularHours} onChange={e => setForm(f => ({
              ...f,
              regularHours: e.target.value
            }))} className="w-full px-3 py-2 bg-[#0D1B17] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#C8B89A]/50" />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Overtime Hours (1.5×)</label>
                <input type="number" step="0.5" min="0" value={form.overtimeHours} onChange={e => setForm(f => ({
              ...f,
              overtimeHours: e.target.value
            }))} className="w-full px-3 py-2 bg-[#0D1B17] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#C8B89A]/50" />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Holiday Hours (2×)</label>
                <input type="number" step="0.5" min="0" value={form.holidayHours} onChange={e => setForm(f => ({
              ...f,
              holidayHours: e.target.value
            }))} className="w-full px-3 py-2 bg-[#0D1B17] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#C8B89A]/50" />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Hourly Rate (EC$) *</label>
                <input type="number" step="0.01" min="0" value={form.hourlyRate} onChange={e => setForm(f => ({
              ...f,
              hourlyRate: e.target.value
            }))} className="w-full px-3 py-2 bg-[#0D1B17] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#C8B89A]/50" />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Allowances (EC$)</label>
                <input type="number" step="0.01" min="0" value={form.allowances} onChange={e => setForm(f => ({
              ...f,
              allowances: e.target.value
            }))} className="w-full px-3 py-2 bg-[#0D1B17] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#C8B89A]/50" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-white/50 mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({
              ...f,
              notes: e.target.value
            }))} rows={2} className="w-full px-3 py-2 bg-[#0D1B17] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#C8B89A]/50 resize-none" />
              </div>

              {/* NIS Exempt toggle */}
              <div className="sm:col-span-2">
                <button type="button" onClick={() => setForm(f => ({
              ...f,
              nisExempt: !f.nisExempt
            }))} className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg border transition-colors ${form.nisExempt ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}>
                  {/* Toggle pill */}
                  <div className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${form.nisExempt ? 'bg-amber-500' : 'bg-white/20'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.nisExempt ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">NIS Exempt</div>
                    <div className="text-xs opacity-70">
                      {form.nisExempt ? 'NIS will NOT be calculated — employee is exempt (over 60 or temporary)' : 'NIS will be calculated at standard rates (6.5% employee / 7.0% employer)'}
                    </div>
                  </div>
                </button>
              </div>
              {formError && <p className="sm:col-span-2 text-red-400 text-sm">{formError}</p>}
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 text-sm transition-colors">Cancel</button>
              <button onClick={saveEntry} disabled={saving} className="px-5 py-2 rounded-lg bg-[#2C4A3E] hover:bg-[#3a5e50] text-white text-sm font-medium transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : editEntry ? 'Save Changes' : 'Add Entry'}
              </button>
            </div>
          </div>
        </div>}

      {/* Pay Slip Modal */}
      {payslipData && <PayslipModal data={payslipData} onClose={() => {
      setPayslipData(null);
      setActivePayslipId(null);
    }} />}
    </div>;
}
