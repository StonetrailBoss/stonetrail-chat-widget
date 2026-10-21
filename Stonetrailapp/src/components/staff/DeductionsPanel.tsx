import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X, RefreshCw } from 'lucide-react';

export interface EmployeeDeduction {
  id: number;
  employee_name: string;
  label: string;
  amount: string | number;
  is_recurring: number;
  effective_date: string | null;
  end_date: string | null;
  notes: string | null;
}

interface Props {
  /** Pre-filter to a specific employee. If omitted, shows all employees with a selector. */
  employeeName?: string;
  /** List of employee names for the selector — if omitted, fetched from /api/employee-rates */
  employeeNames?: string[];
}

const emptyForm = {
  employeeName: '',
  label: '',
  amount: '',
  isRecurring: true,
  effectiveDate: '',
  endDate: '',
  notes: '',
};

export default function DeductionsPanel({ employeeName: propEmployee, employeeNames: propNames }: Props) {
  const [selectedEmployee, setSelectedEmployee] = useState(propEmployee ?? '');
  const [deductions, setDeductions] = useState<EmployeeDeduction[]>([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [employeeNames, setEmployeeNames] = useState<string[]>(propNames ?? []);
  // ytdMap[employeeName][label] = YTD total for current year
  const [ytdMap, setYtdMap] = useState<Record<string, Record<string, number>>>({});
  const currentYear = new Date().getFullYear();

  // Fetch employee names from rate cards if not provided
  useEffect(() => {
    if (propNames && propNames.length > 0) return;
    fetch('/api/employee-rates')
      .then(r => r.json())
      .then((data: { employeeName?: string }[]) => {
        if (Array.isArray(data)) {
          const names = data
            .map(e => e.employeeName ?? '')
            .filter(Boolean)
            .sort();
          setEmployeeNames(Array.from(new Set(names)));
        }
      })
      .catch(() => {});
  }, [propNames]);

  const load = async (emp: string) => {
    setLoading(true);
    setYtdMap({});
    try {
      const url = emp
        ? `/api/employee-deductions?employee_name=${encodeURIComponent(emp)}`
        : `/api/employee-deductions`;
      const res = await fetch(url);
      const data: EmployeeDeduction[] = await res.json();
      const list = Array.isArray(data) ? data : [];
      setDeductions(list);

      // Fetch YTD totals for each unique employee in the results
      const uniqueEmployees = Array.from(new Set(list.map(d => d.employee_name)));
      if (uniqueEmployees.length === 0) { setYtdMap({}); return; }

      const upTo = `${currentYear}-12-31`;
      const ytdEntries = await Promise.all(
        uniqueEmployees.map(async name => {
          try {
            const cdRes = await fetch(
              `/api/employee-deductions/ytd?employee_name=${encodeURIComponent(name)}&year=${currentYear}&upTo=${upTo}`
            );
            const cdData: Record<string, number> = cdRes.ok ? await cdRes.json() : {};
            return [name, cdData] as [string, Record<string, number>];
          } catch {
            return [name, {}] as [string, Record<string, number>];
          }
        })
      );
      setYtdMap(Object.fromEntries(ytdEntries));
    } catch {
      setDeductions([]);
      setYtdMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(selectedEmployee); }, [selectedEmployee]); // eslint-disable-line react-hooks/exhaustive-deps

  const startEdit = (d: EmployeeDeduction) => {
    setEditId(d.id);
    setEditForm({
      employeeName: d.employee_name,
      label: d.label,
      amount: parseFloat(String(d.amount)).toFixed(2),
      isRecurring: d.is_recurring === 1,
      effectiveDate: d.effective_date ? String(d.effective_date).slice(0, 10) : '',
      endDate: d.end_date ? String(d.end_date).slice(0, 10) : '',
      notes: d.notes ?? '',
    });
  };

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/employee-deductions/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeName: editForm.employeeName,
          label: editForm.label,
          amount: parseFloat(editForm.amount),
          isRecurring: editForm.isRecurring,
          effectiveDate: editForm.effectiveDate || null,
          endDate: editForm.endDate || null,
          notes: editForm.notes || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setEditId(null);
      load(selectedEmployee);
    } catch (e) { setError(String(e)); }
    setSaving(false);
  };

  const saveAdd = async () => {
    setSaving(true); setError('');
    try {
      const emp = addForm.employeeName || selectedEmployee;
      if (!emp || !addForm.label || !addForm.amount) {
        setError('Employee, label and amount are required.');
        setSaving(false); return;
      }
      const res = await fetch('/api/employee-deductions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeName: emp,
          label: addForm.label,
          amount: parseFloat(addForm.amount),
          isRecurring: addForm.isRecurring,
          effectiveDate: addForm.effectiveDate || null,
          endDate: addForm.endDate || null,
          notes: addForm.notes || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setShowAdd(false);
      setAddForm({ ...emptyForm });
      load(selectedEmployee);
    } catch (e) { setError(String(e)); }
    setSaving(false);
  };

  const deleteDeduction = async (id: number) => {
    if (!confirm('Remove this deduction?')) return;
    await fetch(`/api/employee-deductions/${id}`, { method: 'DELETE' });
    load(selectedEmployee);
  };

  function fmtDate(iso: string | null): string {
    if (!iso) return '—';
    const s = String(iso).slice(0, 10);
    const [y, m, d] = s.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Custom Deductions</h3>
          <p className="text-xs text-white/40 mt-0.5">Garnishments, personal deductions, and other per-employee withholdings.</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setAddForm({ ...emptyForm, employeeName: selectedEmployee }); setError(''); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2C4A3E] hover:bg-[#3a5e50] text-white text-xs rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Deduction
        </button>
      </div>

      {/* Employee selector (when not pre-filtered) */}
      {!propEmployee && (
        <div className="flex items-center gap-3">
          <label className="text-xs text-white/50 shrink-0">Filter by employee</label>
          <select
            value={selectedEmployee}
            onChange={e => setSelectedEmployee(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-[#0D1B17] border border-white/20 rounded-lg text-xs text-white focus:outline-none"
          >
            <option value="">— All employees —</option>
            {employeeNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <button onClick={() => load(selectedEmployee)} className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/40 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && <p className="text-red-400 text-xs bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 border-2 border-[#C8B89A] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-[#111E1A] border border-white/10 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Employee</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Label</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Type</th>
                <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">Amount</th>
                <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">YTD {currentYear}</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Effective Date</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">End Date</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Notes</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {deductions.map(d => (
                <tr key={d.id} className="border-b border-white/5 hover:bg-white/5">
                  {editId === d.id ? (
                    <EditRow
                      form={editForm}
                      setForm={setEditForm}
                      employeeNames={employeeNames}
                      onSave={saveEdit}
                      onCancel={() => setEditId(null)}
                      saving={saving}
                    />
                  ) : (
                    <>
                      <td className="px-4 py-3 text-white/80 text-xs">{d.employee_name}</td>
                      <td className="px-4 py-3 text-white font-medium text-xs">{d.label}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${d.is_recurring ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'}`}>
                          {d.is_recurring ? 'Recurring' : 'One-time'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-[#C8B89A] font-semibold text-xs">
                        EC$ {parseFloat(String(d.amount)).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-white/50 text-xs">
                        {ytdMap[d.employee_name]?.[d.label] != null
                          ? `EC$ ${ytdMap[d.employee_name][d.label].toFixed(2)}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-white/50 text-xs whitespace-nowrap">{fmtDate(d.effective_date)}</td>
                      <td className="px-4 py-3 text-white/50 text-xs whitespace-nowrap">{fmtDate(d.end_date)}</td>
                      <td className="px-4 py-3 text-white/40 text-xs max-w-[120px] truncate">{d.notes || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => startEdit(d)} className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteDeduction(d.id)} className="p-1.5 rounded bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}

              {/* Add row */}
              {showAdd && (
                <EditRow
                  form={addForm}
                  setForm={setAddForm}
                  employeeNames={employeeNames}
                  onSave={saveAdd}
                  onCancel={() => setShowAdd(false)}
                  saving={saving}
                  isNew
                />
              )}
            </tbody>
          </table>

          {deductions.length === 0 && !showAdd && (
            <p className="text-center text-white/30 text-xs py-8">
              {selectedEmployee ? `No custom deductions for ${selectedEmployee}.` : 'No custom deductions found.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Inline edit/add row ───────────────────────────────────────────────────────
interface EditRowProps {
  form: typeof emptyForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  employeeNames: string[];
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isNew?: boolean;
}

function EditRow({ form, setForm, employeeNames, onSave, onCancel, saving }: EditRowProps) {
  const inp = 'px-2 py-1 bg-[#0D1B17] border border-white/20 rounded text-xs text-white focus:outline-none w-full';
  return (
    <tr className="border-b border-white/10 bg-white/5">
      {/* Employee */}
      <td className="px-3 py-2">
        {employeeNames.length > 0 ? (
          <select value={form.employeeName} onChange={e => setForm(f => ({ ...f, employeeName: e.target.value }))} className={inp}>
            <option value="">Select…</option>
            {employeeNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        ) : (
          <input value={form.employeeName} onChange={e => setForm(f => ({ ...f, employeeName: e.target.value }))} placeholder="Employee name" className={inp} />
        )}
      </td>
      {/* Label */}
      <td className="px-3 py-2">
        <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Garnishment" className={inp} />
      </td>
      {/* Type */}
      <td className="px-3 py-2">
        <select value={form.isRecurring ? '1' : '0'} onChange={e => setForm(f => ({ ...f, isRecurring: e.target.value === '1' }))} className={inp}>
          <option value="1">Recurring</option>
          <option value="0">One-time</option>
        </select>
      </td>
      {/* Amount */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <span className="text-white/40 text-xs shrink-0">EC$</span>
          <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" className={`${inp} text-right`} />
        </div>
      </td>
      {/* YTD — blank in edit mode */}
      <td className="px-3 py-2" />
      {/* Effective date */}
      <td className="px-3 py-2">
        <input
          type="date"
          value={form.effectiveDate}
          onChange={e => setForm(f => ({ ...f, effectiveDate: e.target.value }))}
          className={inp}
          title="Date from which this deduction starts applying"
        />
      </td>
      {/* End date */}
      <td className="px-3 py-2">
        <input
          type="date"
          value={form.endDate}
          onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
          className={inp}
          title="Date after which this deduction stops applying (leave blank for ongoing)"
          placeholder="Ongoing"
        />
      </td>
      {/* Notes */}
      <td className="px-3 py-2">
        <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional note" className={inp} />
      </td>
      {/* Actions */}
      <td className="px-3 py-2">
        <div className="flex items-center justify-end gap-1">
          <button onClick={onSave} disabled={saving} className="p-1.5 rounded bg-green-600/20 hover:bg-green-600/40 text-green-400 transition-colors">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={onCancel} className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/40 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
