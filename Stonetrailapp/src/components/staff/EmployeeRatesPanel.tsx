// Employee Rate Card — extracted component (src/components/staff — NOT a page)
import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, X, Users, DollarSign, Save, Archive } from 'lucide-react';

const DEPARTMENTS = ['General', 'Front Desk', 'Housekeeping', 'Food & Beverage', 'Maintenance', 'Management', 'Security', 'Grounds'];
const POSITIONS = ['Staff', 'Supervisor', 'Manager', 'Director', 'Chef', 'Housekeeper', 'Receptionist', 'Maintenance Tech', 'Security Officer', 'Groundskeeper'];

// ── CSS variable shorthands (staff dark palette) ──────────────────────────────
const S = {
  surface:    'hsl(var(--staff-surface))',
  surfaceDeep:'hsl(var(--staff-surface-deep))',
  border:     '1px solid hsl(var(--staff-border))',
  gold:       'hsl(var(--staff-gold))',
  green:      'hsl(var(--staff-green))',
  greenHover: 'hsl(var(--staff-green-hover))',
} as const;

interface EmployeeRate {
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
  bankRouting: string | null;
  nisExempt: boolean;
}

const emptyRate = {
  firstName: '', lastName: '',
  department: DEPARTMENTS[0], position: POSITIONS[0],
  hourlyRate: '', allowances: '0',
  bankName: '', bankAccount: '', bankRouting: '',
  nisExempt: false,
};

export default function EmployeeRatesPanel({ onArchived }: { onArchived?: () => void }) {
  const [rates, setRates] = useState<EmployeeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState(emptyRate);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [archiveConfirm, setArchiveConfirm] = useState<EmployeeRate | null>(null);
  const [archiving, setArchiving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setFetchError('');
    fetch('/api/employee-rates')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => { setRates(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(err => { setFetchError(String(err)); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(emptyRate); setEditingId('new'); };

  const openEdit = (r: EmployeeRate) => {
    setForm({
      firstName: r.firstName,
      lastName: r.lastName,
      department: r.department,
      position: r.position,
      hourlyRate: r.hourlyRate,
      allowances: r.allowances,
      bankName: r.bankName || '',
      bankAccount: r.bankAccount || '',
      bankRouting: r.bankRouting || '',
      nisExempt: Boolean(r.nisExempt),
    });
    setEditingId(r.id);
  };

  const cancel = () => setEditingId(null);

  const save = async () => {
    if (!form.firstName || !form.lastName || !form.hourlyRate) return;
    setSaving(true);
    const url = editingId === 'new' ? '/api/employee-rates' : `/api/employee-rates/${editingId}`;
    const method = editingId === 'new' ? 'POST' : 'PUT';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { alert(d.error || 'Save failed'); return; }
    setEditingId(null);
    load();
  };

  const del = async (id: number, name: string) => {
    if (!confirm(`Permanently remove ${name} from the rate card? This cannot be undone.\n\nTo keep their records, use Archive instead.`)) return;
    await fetch(`/api/employee-rates/${id}`, { method: 'DELETE' });
    load();
  };

  const confirmArchive = (r: EmployeeRate) => setArchiveConfirm(r);

  const doArchive = async () => {
    if (!archiveConfirm) return;
    setArchiving(true);
    try {
      const res = await fetch(`/api/employee-rates/${archiveConfirm.id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archive: true }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || 'Archive failed');
        return;
      }
      setArchiveConfirm(null);
      load();
      onArchived?.();
    } finally {
      setArchiving(false);
    }
  };

  const filtered = rates.filter(r =>
    !search ||
    r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    r.department.toLowerCase().includes(search.toLowerCase())
  );

  const inputCls = 'w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none';
  const inputStyle = { background: S.surfaceDeep, border: S.border };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-white font-semibold text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5" style={{ color: S.gold }} /> Employee Rate Card
          </h2>
          <p className="text-white/40 text-xs mt-0.5">
            Set each employee's hourly rate once — automatically applied on every CSV import.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90"
          style={{ background: S.green }}
        >
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or department…"
          className="w-full pl-9 pr-4 py-2 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none"
          style={{ background: S.surface, border: S.border }}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Info banner */}
      <div
        className="mb-4 px-4 py-2.5 rounded-lg text-xs flex items-start gap-2"
        style={{ background: `hsl(var(--staff-green) / 0.3)`, border: `1px solid hsl(var(--staff-gold) / 0.2)`, color: `hsl(var(--staff-gold) / 0.8)` }}
      >
        <DollarSign className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <span>
          When you import a Connect Teams CSV, each employee's{' '}
          <strong>hourly rate, bank details, department, position, and NIS exempt status</strong>{' '}
          are pulled from this rate card automatically — no manual entry needed per pay period.
          Use <strong>Archive</strong> (not Delete) when an employee leaves — their pay records are retained.
        </span>
      </div>

      {/* Table / States */}
      {loading ? (
        <div className="text-white/40 text-sm py-8 text-center">Loading…</div>
      ) : fetchError ? (
        <div className="text-red-400 text-sm py-8 text-center">
          Failed to load rate card: {fetchError}
          <button onClick={load} className="ml-3 underline text-white/50 hover:text-white">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-white/30">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {rates.length === 0
              ? 'No employees in the rate card yet. Add one to get started.'
              : 'No employees match your search.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: S.surface, border: S.border }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Employee</th>
                <th className="px-4 py-3 text-left">Department / Position</th>
                <th className="px-4 py-3 text-right">Hourly Rate</th>
                <th className="px-4 py-3 text-right">Allowances</th>
                <th className="px-4 py-3 text-left">Bank</th>
                <th className="px-4 py-3 text-center">NIS Exempt</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{r.employeeName}</td>
                  <td className="px-4 py-3 text-white/60">
                    <div>{r.department}</div>
                    <div className="text-xs text-white/40">{r.position}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold" style={{ color: S.gold }}>
                    EC$ {parseFloat(r.hourlyRate).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-white/60">
                    {parseFloat(r.allowances) > 0 ? `EC$ ${parseFloat(r.allowances).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-white/60">
                    {r.bankName ? (
                      <>
                        <div>{r.bankName}</div>
                        <div className="text-xs text-white/40">
                          {r.bankAccount ? `****${r.bankAccount.slice(-4)}` : ''}
                        </div>
                      </>
                    ) : (
                      <span className="text-white/25">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {Boolean(r.nisExempt) ? (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wide">
                        Exempt
                      </span>
                    ) : (
                      <span className="text-white/25 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(r)}
                        title="Edit rate"
                        className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => confirmArchive(r)}
                        title="Archive employee (keeps all records)"
                        className="p-1.5 rounded hover:bg-amber-500/20 text-white/50 hover:text-amber-400 transition-colors"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => del(r.id, r.employeeName)}
                        title="Permanently delete"
                        className="p-1.5 rounded hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Archive Confirmation Dialog ── */}
      {archiveConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl w-full max-w-md" style={{ background: S.surface, border: S.border }}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <Archive className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Archive Employee</h3>
                  <p className="text-white/50 text-sm">{archiveConfirm.employeeName}</p>
                </div>
              </div>
              <p className="text-white/70 text-sm leading-relaxed mb-2">
                This will move <strong className="text-white">{archiveConfirm.employeeName}</strong> to the
                employee archive. They will no longer appear in the active rate card or CSV import lookups.
              </p>
              <p className="text-white/50 text-sm leading-relaxed mb-6">
                All timeclock entries, pay slips, and deduction records are{' '}
                <strong className="text-white/80">fully preserved</strong> and accessible from the{' '}
                <strong className="text-white/80">Archived Employees</strong> tab. You can restore them at any time.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setArchiveConfirm(null)}
                  disabled={archiving}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-sm transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={doArchive}
                  disabled={archiving}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Archive className="w-4 h-4" />
                  {archiving ? 'Archiving…' : 'Archive Employee'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {editingId !== null && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: S.surface, border: S.border }}>
            <div className="flex items-center justify-between p-6" style={{ borderBottom: S.border }}>
              <h3 className="font-semibold text-white">
                {editingId === 'new' ? 'Add Employee to Rate Card' : 'Edit Employee Rate'}
              </h3>
              <button onClick={cancel} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/50 mb-1.5">First Name</label>
                <input
                  value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Last Name</label>
                <input
                  value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Department</label>
                <select
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  className={inputCls}
                  style={inputStyle}
                >
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Position</label>
                <select
                  value={form.position}
                  onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                  className={inputCls}
                  style={inputStyle}
                >
                  {POSITIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Hourly Rate (EC$)</label>
                <input
                  type="number" step="0.01" min="0"
                  value={form.hourlyRate}
                  onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Allowances (EC$)</label>
                <input
                  type="number" step="0.01" min="0"
                  value={form.allowances}
                  onChange={e => setForm(f => ({ ...f, allowances: e.target.value }))}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-white/50 mb-1.5">Bank Name</label>
                <input
                  value={form.bankName}
                  onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Account Number</label>
                <input
                  value={form.bankAccount}
                  onChange={e => setForm(f => ({ ...f, bankAccount: e.target.value }))}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Routing Number</label>
                <input
                  value={form.bankRouting}
                  onChange={e => setForm(f => ({ ...f, bankRouting: e.target.value }))}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div className="col-span-2">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, nisExempt: !f.nisExempt }))}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg border transition-colors ${
                    form.nisExempt
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <div className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${form.nisExempt ? 'bg-amber-500' : 'bg-white/20'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.nisExempt ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">NIS Exempt</div>
                    <div className="text-xs opacity-70">
                      {form.nisExempt ? 'No NIS deducted (over 60 or temporary)' : 'NIS calculated at standard rates'}
                    </div>
                  </div>
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button
                onClick={cancel}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !form.firstName || !form.lastName || !form.hourlyRate}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 hover:opacity-90"
                style={{ background: S.green }}
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
