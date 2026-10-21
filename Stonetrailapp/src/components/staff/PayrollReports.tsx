import { useState, useEffect, useMemo } from 'react';
import { Download, ChevronDown, ChevronUp, BarChart2, Users, TrendingUp, X, Filter } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MonthData {
  grossPay: number;
  nisEmployee: number;
  nisEmployer: number;
  nisTotal: number;
  payeTax: number;
  totalDeductions: number;
  netPay: number;
  periods: number;
}

interface EmployeeYtd {
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
  byMonth: Record<string, MonthData>;
}

interface YtdResponse {
  year: number;
  employees: EmployeeYtd[];
}

type ReportView = 'monthly' | 'quarterly';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const QUARTERS = ['Q1 (Jan–Mar)', 'Q2 (Apr–Jun)', 'Q3 (Jul–Sep)', 'Q4 (Oct–Dec)'];
const QUARTER_MONTHS: Record<number, number[]> = { 0: [1,2,3], 1: [4,5,6], 2: [7,8,9], 3: [10,11,12] };

function monthNum(key: string) { return parseInt(key.slice(5, 7)); }

function aggregateMonths(byMonth: Record<string, MonthData>, monthNums: number[]): MonthData {
  const zero = (): MonthData => ({ grossPay:0, nisEmployee:0, nisEmployer:0, nisTotal:0, payeTax:0, totalDeductions:0, netPay:0, periods:0 });
  const acc = zero();
  for (const [key, m] of Object.entries(byMonth)) {
    if (monthNums.includes(monthNum(key))) {
      acc.grossPay       += m.grossPay;
      acc.nisEmployee    += m.nisEmployee;
      acc.nisEmployer    += m.nisEmployer;
      acc.nisTotal       += m.nisTotal;
      acc.payeTax        += m.payeTax;
      acc.totalDeductions+= m.totalDeductions;
      acc.netPay         += m.netPay;
      acc.periods        += m.periods;
    }
  }
  return acc;
}

function exportCSV(rows: string[][], filename: string) {
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Monthly summary table ────────────────────────────────────────────────────
function MonthlyTable({ employees, year }: { employees: EmployeeYtd[]; year: number }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (name: string) => setExpanded(prev => {
    const s = new Set(prev);
    s.has(name) ? s.delete(name) : s.add(name);
    return s;
  });

  // Collect all months present across all employees
  const allMonthKeys = Array.from(
    new Set(employees.flatMap(e => Object.keys(e.byMonth)))
  ).sort();

  // Company-wide monthly totals
  const companyByMonth: Record<string, MonthData> = {};
  for (const key of allMonthKeys) {
    companyByMonth[key] = aggregateMonths(
      Object.fromEntries(employees.flatMap(e => Object.entries(e.byMonth).filter(([k]) => k === key))),
      [monthNum(key)]
    );
    // Re-aggregate properly
    companyByMonth[key] = { grossPay:0, nisEmployee:0, nisEmployer:0, nisTotal:0, payeTax:0, totalDeductions:0, netPay:0, periods:0 };
    for (const emp of employees) {
      const m = emp.byMonth[key];
      if (!m) continue;
      companyByMonth[key].grossPay        += m.grossPay;
      companyByMonth[key].nisEmployee     += m.nisEmployee;
      companyByMonth[key].nisEmployer     += m.nisEmployer;
      companyByMonth[key].nisTotal        += m.nisTotal;
      companyByMonth[key].payeTax         += m.payeTax;
      companyByMonth[key].totalDeductions += m.totalDeductions;
      companyByMonth[key].netPay          += m.netPay;
      companyByMonth[key].periods         += m.periods;
    }
  }

  function handleExport() {
    const headers = ['Employee', 'Department', 'Month', 'Pay Periods', 'Gross Pay', 'NIS Employee', 'NIS Employer', 'Total Deductions', 'Net Pay'];
    const rows: string[][] = [headers];
    for (const emp of employees) {
      for (const key of allMonthKeys) {
        const m = emp.byMonth[key];
        if (!m) continue;
        const label = `${MONTHS[monthNum(key)-1]} ${year}`;
        rows.push([emp.employeeName, emp.department, label, String(m.periods), fmt(m.grossPay), fmt(m.nisEmployee), fmt(m.nisEmployer), fmt(m.totalDeductions), fmt(m.netPay)]);
      }
    }
    exportCSV(rows, `payroll-monthly-${year}.csv`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white/70">Monthly Breakdown — {year}</h3>
        <button onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-colors">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Company totals row */}
      <div className="bg-[#1A2E28] border border-white/10 rounded-lg overflow-hidden mb-3">
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[#C8B89A]" />
          <span className="text-sm font-semibold text-white">Company Total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-2.5 text-white/40 font-medium">Month</th>
                <th className="text-right px-4 py-2.5 text-white/40 font-medium">Periods</th>
                <th className="text-right px-4 py-2.5 text-white/40 font-medium">Gross Pay</th>
                <th className="text-right px-4 py-2.5 text-white/40 font-medium">NIS Employee</th>
                <th className="text-right px-4 py-2.5 text-white/40 font-medium">NIS Employer</th>
                <th className="text-right px-4 py-2.5 text-white/40 font-medium">Deductions</th>
                <th className="text-right px-4 py-2.5 text-white/40 font-medium">Net Pay</th>
              </tr>
            </thead>
            <tbody>
              {allMonthKeys.map(key => {
                const m = companyByMonth[key];
                const label = `${MONTHS[monthNum(key)-1]} ${year}`;
                return (
                  <tr key={key} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-2.5 text-white/80 font-medium">{label}</td>
                    <td className="px-4 py-2.5 text-right text-white/50">{m.periods}</td>
                    <td className="px-4 py-2.5 text-right text-[#C8B89A]">EC$ {fmt(m.grossPay)}</td>
                    <td className="px-4 py-2.5 text-right text-white/60">EC$ {fmt(m.nisEmployee)}</td>
                    <td className="px-4 py-2.5 text-right text-white/60">EC$ {fmt(m.nisEmployer)}</td>
                    <td className="px-4 py-2.5 text-right text-red-400/80">EC$ {fmt(m.totalDeductions)}</td>
                    <td className="px-4 py-2.5 text-right text-green-400 font-medium">EC$ {fmt(m.netPay)}</td>
                  </tr>
                );
              })}
              {/* Grand total row */}
              <tr className="border-t border-white/20 bg-white/5">
                <td className="px-4 py-2.5 text-white font-semibold">Year Total</td>
                <td className="px-4 py-2.5 text-right text-white/60">{Object.values(companyByMonth).reduce((s,m)=>s+m.periods,0)}</td>
                <td className="px-4 py-2.5 text-right text-[#C8B89A] font-semibold">EC$ {fmt(Object.values(companyByMonth).reduce((s,m)=>s+m.grossPay,0))}</td>
                <td className="px-4 py-2.5 text-right text-white/60">EC$ {fmt(Object.values(companyByMonth).reduce((s,m)=>s+m.nisEmployee,0))}</td>
                <td className="px-4 py-2.5 text-right text-white/60">EC$ {fmt(Object.values(companyByMonth).reduce((s,m)=>s+m.nisEmployer,0))}</td>
                <td className="px-4 py-2.5 text-right text-red-400/80">EC$ {fmt(Object.values(companyByMonth).reduce((s,m)=>s+m.totalDeductions,0))}</td>
                <td className="px-4 py-2.5 text-right text-green-400 font-semibold">EC$ {fmt(Object.values(companyByMonth).reduce((s,m)=>s+m.netPay,0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-employee accordion */}
      <div className="space-y-2">
        {employees.map(emp => {
          const isOpen = expanded.has(emp.employeeName);
          const empMonths = allMonthKeys.filter(k => emp.byMonth[k]);
          return (
            <div key={emp.employeeName} className="bg-[#111E1A] border border-white/10 rounded-lg overflow-hidden">
              <button
                onClick={() => toggle(emp.employeeName)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-white/30" />
                  <div>
                    <span className="text-sm font-medium text-white">{emp.employeeName}</span>
                    <span className="ml-2 text-xs text-white/40">{emp.department}</span>
                  </div>
                  <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded">
                    {empMonths.length} {empMonths.length === 1 ? 'month' : 'months'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[#C8B89A]">EC$ {fmt(emp.grossPay)}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-white/10 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="text-left px-4 py-2 text-white/40 font-medium">Month</th>
                        <th className="text-right px-4 py-2 text-white/40 font-medium">Periods</th>
                        <th className="text-right px-4 py-2 text-white/40 font-medium">Gross Pay</th>
                        <th className="text-right px-4 py-2 text-white/40 font-medium">NIS Emp.</th>
                        <th className="text-right px-4 py-2 text-white/40 font-medium">NIS Empr.</th>
                        <th className="text-right px-4 py-2 text-white/40 font-medium">Deductions</th>
                        <th className="text-right px-4 py-2 text-white/40 font-medium">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empMonths.map(key => {
                        const m = emp.byMonth[key];
                        return (
                          <tr key={key} className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-4 py-2 text-white/70">{MONTHS[monthNum(key)-1]} {year}</td>
                            <td className="px-4 py-2 text-right text-white/40">{m.periods}</td>
                            <td className="px-4 py-2 text-right text-[#C8B89A]">EC$ {fmt(m.grossPay)}</td>
                            <td className="px-4 py-2 text-right text-white/50">EC$ {fmt(m.nisEmployee)}</td>
                            <td className="px-4 py-2 text-right text-white/50">EC$ {fmt(m.nisEmployer)}</td>
                            <td className="px-4 py-2 text-right text-red-400/70">EC$ {fmt(m.totalDeductions)}</td>
                            <td className="px-4 py-2 text-right text-green-400">EC$ {fmt(m.netPay)}</td>
                          </tr>
                        );
                      })}
                      <tr className="border-t border-white/10 bg-white/5">
                        <td className="px-4 py-2 text-white/60 font-semibold">Total</td>
                        <td className="px-4 py-2 text-right text-white/40">{emp.periods}</td>
                        <td className="px-4 py-2 text-right text-[#C8B89A] font-semibold">EC$ {fmt(emp.grossPay)}</td>
                        <td className="px-4 py-2 text-right text-white/50">EC$ {fmt(emp.nisEmployee)}</td>
                        <td className="px-4 py-2 text-right text-white/50">EC$ {fmt(emp.nisEmployer)}</td>
                        <td className="px-4 py-2 text-right text-red-400/70">EC$ {fmt(emp.totalDeductions)}</td>
                        <td className="px-4 py-2 text-right text-green-400 font-semibold">EC$ {fmt(emp.netPay)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Quarterly summary table ──────────────────────────────────────────────────
function QuarterlyTable({ employees, year }: { employees: EmployeeYtd[]; year: number }) {
  function handleExport() {
    const headers = ['Employee', 'Department', 'Quarter', 'Pay Periods', 'Gross Pay', 'NIS Employee', 'NIS Employer', 'Total Deductions', 'Net Pay'];
    const rows: string[][] = [headers];
    for (const emp of employees) {
      for (let q = 0; q < 4; q++) {
        const m = aggregateMonths(emp.byMonth, QUARTER_MONTHS[q]);
        if (m.periods === 0) continue;
        rows.push([emp.employeeName, emp.department, QUARTERS[q], String(m.periods), fmt(m.grossPay), fmt(m.nisEmployee), fmt(m.nisEmployer), fmt(m.totalDeductions), fmt(m.netPay)]);
      }
    }
    exportCSV(rows, `payroll-quarterly-${year}.csv`);
  }

  // Company quarterly totals
  const companyQ = QUARTER_MONTHS;
  const companyTotals = Object.entries(companyQ).map(([qi, months]) => {
    const acc = { grossPay:0, nisEmployee:0, nisEmployer:0, nisTotal:0, payeTax:0, totalDeductions:0, netPay:0, periods:0 };
    for (const emp of employees) {
      const m = aggregateMonths(emp.byMonth, months);
      acc.grossPay        += m.grossPay;
      acc.nisEmployee     += m.nisEmployee;
      acc.nisEmployer     += m.nisEmployer;
      acc.nisTotal        += m.nisTotal;
      acc.totalDeductions += m.totalDeductions;
      acc.netPay          += m.netPay;
      acc.periods         += m.periods;
    }
    return { q: parseInt(qi), ...acc };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white/70">Quarterly Breakdown — {year}</h3>
        <button onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-colors">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Company quarterly totals */}
      <div className="bg-[#1A2E28] border border-white/10 rounded-lg overflow-hidden mb-3">
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#C8B89A]" />
          <span className="text-sm font-semibold text-white">Company Total by Quarter</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-2.5 text-white/40 font-medium">Quarter</th>
                <th className="text-right px-4 py-2.5 text-white/40 font-medium">Periods</th>
                <th className="text-right px-4 py-2.5 text-white/40 font-medium">Gross Pay</th>
                <th className="text-right px-4 py-2.5 text-white/40 font-medium">NIS Employee</th>
                <th className="text-right px-4 py-2.5 text-white/40 font-medium">NIS Employer</th>
                <th className="text-right px-4 py-2.5 text-white/40 font-medium">Deductions</th>
                <th className="text-right px-4 py-2.5 text-white/40 font-medium">Net Pay</th>
              </tr>
            </thead>
            <tbody>
              {companyTotals.map(qt => (
                <tr key={qt.q} className={`border-b border-white/5 hover:bg-white/5 ${qt.periods === 0 ? 'opacity-30' : ''}`}>
                  <td className="px-4 py-2.5 text-white/80 font-medium">{QUARTERS[qt.q]}</td>
                  <td className="px-4 py-2.5 text-right text-white/50">{qt.periods}</td>
                  <td className="px-4 py-2.5 text-right text-[#C8B89A]">EC$ {fmt(qt.grossPay)}</td>
                  <td className="px-4 py-2.5 text-right text-white/60">EC$ {fmt(qt.nisEmployee)}</td>
                  <td className="px-4 py-2.5 text-right text-white/60">EC$ {fmt(qt.nisEmployer)}</td>
                  <td className="px-4 py-2.5 text-right text-red-400/80">EC$ {fmt(qt.totalDeductions)}</td>
                  <td className="px-4 py-2.5 text-right text-green-400 font-medium">EC$ {fmt(qt.netPay)}</td>
                </tr>
              ))}
              <tr className="border-t border-white/20 bg-white/5">
                <td className="px-4 py-2.5 text-white font-semibold">Year Total</td>
                <td className="px-4 py-2.5 text-right text-white/60">{companyTotals.reduce((s,q)=>s+q.periods,0)}</td>
                <td className="px-4 py-2.5 text-right text-[#C8B89A] font-semibold">EC$ {fmt(companyTotals.reduce((s,q)=>s+q.grossPay,0))}</td>
                <td className="px-4 py-2.5 text-right text-white/60">EC$ {fmt(companyTotals.reduce((s,q)=>s+q.nisEmployee,0))}</td>
                <td className="px-4 py-2.5 text-right text-white/60">EC$ {fmt(companyTotals.reduce((s,q)=>s+q.nisEmployer,0))}</td>
                <td className="px-4 py-2.5 text-right text-red-400/80">EC$ {fmt(companyTotals.reduce((s,q)=>s+q.totalDeductions,0))}</td>
                <td className="px-4 py-2.5 text-right text-green-400 font-semibold">EC$ {fmt(companyTotals.reduce((s,q)=>s+q.netPay,0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-employee quarterly grid */}
      <div className="bg-[#111E1A] border border-white/10 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <Users className="w-4 h-4 text-white/40" />
          <span className="text-sm font-semibold text-white/70">By Employee</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-4 py-2.5 text-white/40 font-medium sticky left-0 bg-[#111E1A]">Employee</th>
                {QUARTERS.map(q => (
                  <th key={q} colSpan={2} className="text-center px-4 py-2.5 text-white/40 font-medium border-l border-white/5">{q}</th>
                ))}
              </tr>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-2 text-white/30 font-medium sticky left-0 bg-[#111E1A]">Department</th>
                {QUARTERS.map(q => (
                  <>
                    <th key={`${q}-gross`} className="text-right px-3 py-2 text-white/30 font-medium border-l border-white/5">Gross</th>
                    <th key={`${q}-net`} className="text-right px-3 py-2 text-white/30 font-medium">Net</th>
                  </>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.employeeName} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-2.5 sticky left-0 bg-[#111E1A]">
                    <div className="font-medium text-white/80">{emp.employeeName}</div>
                    <div className="text-white/30">{emp.department}</div>
                  </td>
                  {Object.entries(QUARTER_MONTHS).map(([qi, months]) => {
                    const m = aggregateMonths(emp.byMonth, months);
                    return (
                      <>
                        <td key={`${qi}-gross`} className={`px-3 py-2.5 text-right border-l border-white/5 ${m.periods > 0 ? 'text-[#C8B89A]' : 'text-white/20'}`}>
                          {m.periods > 0 ? `EC$ ${fmt(m.grossPay)}` : '—'}
                        </td>
                        <td key={`${qi}-net`} className={`px-3 py-2.5 text-right ${m.periods > 0 ? 'text-green-400' : 'text-white/20'}`}>
                          {m.periods > 0 ? `EC$ ${fmt(m.netPay)}` : '—'}
                        </td>
                      </>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PayrollReports() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [view, setView] = useState<ReportView>('monthly');
  const [data, setData] = useState<YtdResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Employee filter state
  const [excludedEmployees, setExcludedEmployees] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [deptFilter, setDeptFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`/api/timeclock/ytd?year=${year}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError('Failed to load report data.'); setLoading(false); });
  }, [year]);

  // Reset exclusions when year changes
  useEffect(() => { setExcludedEmployees(new Set()); }, [year]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // All employees from data
  const allEmployees = data?.employees ?? [];

  // Unique departments for the filter panel
  const departments = useMemo(() =>
    Array.from(new Set(allEmployees.map(e => e.department))).sort(),
    [allEmployees]
  );

  // Employees visible in filter panel (dept filter)
  const panelEmployees = useMemo(() =>
    deptFilter ? allEmployees.filter(e => e.department === deptFilter) : allEmployees,
    [allEmployees, deptFilter]
  );

  // Final filtered list passed to tables
  const filteredEmployees = useMemo(() =>
    allEmployees.filter(e => !excludedEmployees.has(e.employeeName)),
    [allEmployees, excludedEmployees]
  );

  const toggleEmployee = (name: string) => {
    setExcludedEmployees(prev => {
      const s = new Set(prev);
      s.has(name) ? s.delete(name) : s.add(name);
      return s;
    });
  };

  const toggleAll = (names: string[], include: boolean) => {
    setExcludedEmployees(prev => {
      const s = new Set(prev);
      names.forEach(n => include ? s.delete(n) : s.add(n));
      return s;
    });
  };

  const panelNames = panelEmployees.map(e => e.employeeName);
  const allPanelIncluded = panelNames.every(n => !excludedEmployees.has(n));
  const somePanelIncluded = panelNames.some(n => !excludedEmployees.has(n));

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Year picker */}
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="px-3 py-2 bg-[#111E1A] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#C8B89A]/50"
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          {/* View toggle */}
          <div className="flex bg-[#111E1A] border border-white/10 rounded-lg p-1">
            {(['monthly', 'quarterly'] as ReportView[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${view === v ? 'bg-[#2C4A3E] text-white' : 'text-white/40 hover:text-white'}`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Employee filter toggle */}
          {allEmployees.length > 0 && (
            <button
              onClick={() => setFilterOpen(o => !o)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                excludedEmployees.size > 0
                  ? 'bg-[#C8B89A]/10 border-[#C8B89A]/40 text-[#C8B89A]'
                  : 'bg-[#111E1A] border-white/10 text-white/50 hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Employees
              {excludedEmployees.size > 0 && (
                <span className="ml-1 bg-[#C8B89A] text-[#1A2E28] rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none">
                  {allEmployees.length - excludedEmployees.size}/{allEmployees.length}
                </span>
              )}
            </button>
          )}
        </div>

        {data && (
          <p className="text-xs text-white/30">
            {filteredEmployees.length} of {allEmployees.length} {allEmployees.length === 1 ? 'employee' : 'employees'} · {filteredEmployees.reduce((s, e) => s + e.periods, 0)} pay periods
          </p>
        )}
      </div>

      {/* Employee filter panel */}
      {filterOpen && allEmployees.length > 0 && (
        <div className="bg-[#0D1B17] border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Filter Employees</span>
            <button onClick={() => setFilterOpen(false)} className="text-white/30 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Dept filter pills */}
          {departments.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setDeptFilter('')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${!deptFilter ? 'bg-[#2C4A3E] text-white' : 'bg-white/5 text-white/40 hover:text-white'}`}
              >
                All Depts
              </button>
              {departments.map(d => (
                <button
                  key={d}
                  onClick={() => setDeptFilter(prev => prev === d ? '' : d)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${deptFilter === d ? 'bg-[#2C4A3E] text-white' : 'bg-white/5 text-white/40 hover:text-white'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          {/* Select all / none for current panel */}
          <div className="flex items-center gap-3 pb-1 border-b border-white/5">
            <button
              onClick={() => toggleAll(panelNames, true)}
              disabled={allPanelIncluded}
              className="text-[11px] text-[#C8B89A] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Include all
            </button>
            <span className="text-white/20">·</span>
            <button
              onClick={() => toggleAll(panelNames, false)}
              disabled={!somePanelIncluded}
              className="text-[11px] text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Exclude all
            </button>
          </div>

          {/* Employee checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
            {panelEmployees.map(emp => {
              const included = !excludedEmployees.has(emp.employeeName);
              return (
                <button
                  key={emp.employeeName}
                  onClick={() => toggleEmployee(emp.employeeName)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                    included ? 'bg-[#2C4A3E]/60 hover:bg-[#2C4A3E]' : 'bg-white/5 hover:bg-white/10 opacity-50'
                  }`}
                >
                  {/* Checkbox indicator */}
                  <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                    included ? 'bg-[#C8B89A] border-[#C8B89A]' : 'border-white/20'
                  }`}>
                    {included && (
                      <svg className="w-2.5 h-2.5 text-[#1A2E28]" fill="none" viewBox="0 0 10 10">
                        <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-white truncate">{emp.employeeName}</div>
                    <div className="text-[10px] text-white/30 truncate">{emp.position}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {excludedEmployees.size > 0 && (
            <button
              onClick={() => setExcludedEmployees(new Set())}
              className="text-[11px] text-[#C8B89A]/60 hover:text-[#C8B89A] transition-colors"
            >
              ↺ Reset — include all {allEmployees.length} employees
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#C8B89A] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {error && <p className="text-red-400 text-sm py-8 text-center">{error}</p>}
      {!loading && !error && data && filteredEmployees.length === 0 && (
        <div className="text-center py-16 text-white/30 text-sm">
          {allEmployees.length === 0 ? `No payroll data found for ${year}.` : 'All employees excluded — use the filter to include employees.'}
        </div>
      )}
      {!loading && !error && data && filteredEmployees.length > 0 && (
        view === 'monthly'
          ? <MonthlyTable employees={filteredEmployees} year={year} />
          : <QuarterlyTable employees={filteredEmployees} year={year} />
      )}
    </div>
  );
}
