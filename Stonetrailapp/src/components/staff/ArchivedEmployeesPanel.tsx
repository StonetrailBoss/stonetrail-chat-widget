/**
 * ArchivedEmployeesPanel
 *
 * Shows all archived (departed) employees with their full pay history.
 * Accessible from the "Archived" tab in the Employee Rates section.
 */
import { useState, useEffect, useCallback } from 'react';
import { Archive, RotateCcw, ChevronDown, ChevronUp, User, FileText, Calendar } from 'lucide-react';

// ── CSS variable shorthands (staff dark palette) ──────────────────────────────
const S = {
  surface:     'hsl(var(--staff-surface))',
  surfaceDeep: 'hsl(var(--staff-surface-deep))',
  border:      '1px solid hsl(var(--staff-border))',
  gold:        'hsl(var(--staff-gold))',
  green:       'hsl(var(--staff-green))',
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

interface TimeclockEntry {
  id: number;
  payPeriodStart: string;
  payPeriodEnd: string;
  regularHours: string;
  overtimeHours: string;
  holidayHours: string;
  hourlyRate: string;
  allowances: string;
  department: string;
  position: string;
}

interface Payslip {
  id: number;
  payPeriodStart: string;
  payPeriodEnd: string;
  grossPay: string;
  netPay: string;
  nisEmployee: string;
  payeTax: string;
}

interface ArchivedEmployee {
  id: number;
  firstName: string;
  lastName: string;
  employeeName: string;
  department: string;
  position: string;
  hourlyRate: string;
  allowances: string;
  bankName: string | null;
  bankAccount: string | null;
  archivedAt: string | null;
  nisExempt: number;
  timeclockEntries: TimeclockEntry[];
  payslips: Payslip[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(val: string | number) {
  const n = parseFloat(String(val));
  return isFinite(n) ? `EC$ ${n.toFixed(2)}` : '—';
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

// ── Employee row ──────────────────────────────────────────────────────────────

function EmployeeRow({ emp, onRestore }: { emp: ArchivedEmployee; onRestore: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const totalGross = emp.payslips.reduce((s, p) => s + parseFloat(p.grossPay || '0'), 0);
  const totalNet   = emp.payslips.reduce((s, p) => s + parseFloat(p.netPay   || '0'), 0);

  const doRestore = async () => {
    if (!confirm(`Restore ${emp.employeeName} to the active rate card?`)) return;
    setRestoring(true);
    try {
      const res = await fetch(`/api/employee-rates/${emp.id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archive: false }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || 'Restore failed');
        return;
      }
      onRestore();
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="rounded-xl overflow-hidden mb-3" style={{ background: S.surface, border: S.border }}>
      {/* ── Summary row ── */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-white/50" />
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white text-sm">{emp.employeeName}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wide">
              Archived
            </span>
          </div>
          <div className="text-xs text-white/40 mt-0.5 flex items-center gap-3 flex-wrap">
            <span>{emp.department} · {emp.position}</span>
            {emp.archivedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Archived {fmtDate(emp.archivedAt)}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-6 text-xs text-right">
          <div>
            <div className="text-white/40">Pay periods</div>
            <div className="text-white font-medium">{emp.timeclockEntries.length}</div>
          </div>
          <div>
            <div className="text-white/40">Total gross</div>
            <div className="font-medium" style={{ color: S.gold }}>{totalGross > 0 ? `EC$ ${totalGross.toFixed(2)}` : '—'}</div>
          </div>
          <div>
            <div className="text-white/40">Total net</div>
            <div className="text-white font-medium">{totalNet > 0 ? `EC$ ${totalNet.toFixed(2)}` : '—'}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={doRestore}
            disabled={restoring}
            title="Restore to active rate card"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{restoring ? 'Restoring…' : 'Restore'}</span>
          </button>
          <button
            onClick={() => setExpanded(v => !v)}
            title={expanded ? 'Collapse records' : 'View pay records'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Records</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Expanded pay records ── */}
      {expanded && (
        <div style={{ borderTop: S.border }}>
          {/* Rate card snapshot */}
          <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs" style={{ borderBottom: S.border }}>
            <div>
              <div className="text-white/40 mb-0.5">Hourly Rate</div>
              <div className="text-white font-medium">{fmt(emp.hourlyRate)}</div>
            </div>
            <div>
              <div className="text-white/40 mb-0.5">Allowances</div>
              <div className="text-white">{parseFloat(emp.allowances) > 0 ? fmt(emp.allowances) : '—'}</div>
            </div>
            <div>
              <div className="text-white/40 mb-0.5">Bank</div>
              <div className="text-white">{emp.bankName || '—'}</div>
            </div>
            <div>
              <div className="text-white/40 mb-0.5">Account</div>
              <div className="text-white">{emp.bankAccount ? `****${emp.bankAccount.slice(-4)}` : '—'}</div>
            </div>
          </div>

          {/* Pay period table */}
          {emp.timeclockEntries.length === 0 ? (
            <div className="px-4 py-6 text-center text-white/30 text-sm">No pay period records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-white/40 uppercase tracking-wide" style={{ borderBottom: S.border }}>
                    <th className="px-4 py-2.5 text-left">Pay Period</th>
                    <th className="px-4 py-2.5 text-right">Reg Hrs</th>
                    <th className="px-4 py-2.5 text-right">OT Hrs</th>
                    <th className="px-4 py-2.5 text-right">Hol Hrs</th>
                    <th className="px-4 py-2.5 text-right">Gross Pay</th>
                    <th className="px-4 py-2.5 text-right">NIS</th>
                    <th className="px-4 py-2.5 text-right">PAYE</th>
                    <th className="px-4 py-2.5 text-right">Net Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {emp.timeclockEntries.map(entry => {
                    const slip = emp.payslips.find(p =>
                      p.payPeriodStart === entry.payPeriodStart &&
                      p.payPeriodEnd   === entry.payPeriodEnd
                    );
                    return (
                      <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-2.5 text-white/70">
                          {fmtDate(entry.payPeriodStart)} – {fmtDate(entry.payPeriodEnd)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-white/60">{parseFloat(entry.regularHours).toFixed(1)}</td>
                        <td className="px-4 py-2.5 text-right text-white/60">{parseFloat(entry.overtimeHours).toFixed(1)}</td>
                        <td className="px-4 py-2.5 text-right text-white/60">{parseFloat(entry.holidayHours).toFixed(1)}</td>
                        <td className="px-4 py-2.5 text-right font-medium" style={{ color: S.gold }}>
                          {slip ? fmt(slip.grossPay) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right text-white/50">{slip ? fmt(slip.nisEmployee) : '—'}</td>
                        <td className="px-4 py-2.5 text-right text-white/50">{slip ? fmt(slip.payeTax) : '—'}</td>
                        <td className="px-4 py-2.5 text-right text-white font-medium">{slip ? fmt(slip.netPay) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Totals footer */}
                {emp.payslips.length > 0 && (
                  <tfoot>
                    <tr className="text-xs font-semibold" style={{ borderTop: `1px solid hsl(var(--staff-gold) / 0.2)` }}>
                      <td className="px-4 py-2.5 text-white/50" colSpan={4}>Totals ({emp.payslips.length} periods)</td>
                      <td className="px-4 py-2.5 text-right" style={{ color: S.gold }}>
                        EC$ {emp.payslips.reduce((s, p) => s + parseFloat(p.grossPay || '0'), 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-white/50">
                        EC$ {emp.payslips.reduce((s, p) => s + parseFloat(p.nisEmployee || '0'), 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-white/50">
                        EC$ {emp.payslips.reduce((s, p) => s + parseFloat(p.payeTax || '0'), 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-white">
                        EC$ {emp.payslips.reduce((s, p) => s + parseFloat(p.netPay || '0'), 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function ArchivedEmployeesPanel() {
  const [employees, setEmployees] = useState<ArchivedEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    fetch('/api/employee-rates/archived')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => { setEmployees(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(err => { setError(String(err)); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-white font-semibold text-lg flex items-center gap-2">
            <Archive className="w-5 h-5" style={{ color: S.gold }} />
            Archived Employees
          </h2>
          <p className="text-white/40 text-xs mt-0.5">
            Former employees — all pay records retained for compliance. Click any row to expand pay history.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-white/40 text-sm py-10 text-center">Loading archived employees…</div>
      ) : error ? (
        <div className="text-red-400 text-sm py-10 text-center">
          Failed to load: {error}
          <button onClick={load} className="ml-3 underline text-white/50 hover:text-white">Retry</button>
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <Archive className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No archived employees yet.</p>
          <p className="text-xs mt-1 text-white/20">
            When an employee leaves, use the Archive button on the Rate Card tab to move them here.
          </p>
        </div>
      ) : (
        <div>
          {employees.map(emp => (
            <EmployeeRow key={emp.id} emp={emp} onRestore={load} />
          ))}
        </div>
      )}
    </div>
  );
}
