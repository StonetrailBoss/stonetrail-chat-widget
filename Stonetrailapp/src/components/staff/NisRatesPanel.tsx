import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';

interface NisRate {
  id: number;
  year: number;
  employee_rate: string | number;
  employer_rate: string | number;
  effective_note: string | null;
}

const pct = (v: string | number) => (parseFloat(String(v)) * 100).toFixed(2) + '%';
const toDecimal = (pctStr: string) => parseFloat(pctStr.replace('%', '')) / 100;

const emptyForm = { year: new Date().getFullYear() + 1, employeeRate: '', employerRate: '', effectiveNote: '' };

export default function NisRatesPanel() {
  const [rates, setRates] = useState<NisRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ year: 0, employeeRate: '', employerRate: '', effectiveNote: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/nis-rates')
      .then(r => r.json())
      .then(d => { setRates(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const startEdit = (r: NisRate) => {
    setEditId(r.id);
    setEditForm({
      year: r.year,
      employeeRate: (parseFloat(String(r.employee_rate)) * 100).toFixed(2),
      employerRate: (parseFloat(String(r.employer_rate)) * 100).toFixed(2),
      effectiveNote: r.effective_note || '',
    });
  };

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/nis-rates/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: editForm.year,
          employeeRate: toDecimal(editForm.employeeRate),
          employerRate: toDecimal(editForm.employerRate),
          effectiveNote: editForm.effectiveNote || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setEditId(null);
      load();
    } catch (e) { setError(String(e)); }
    setSaving(false);
  };

  const deleteRate = async (id: number) => {
    if (!confirm('Delete this NIS rate entry?')) return;
    await fetch(`/api/nis-rates/${id}`, { method: 'DELETE' });
    load();
  };

  const saveAdd = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/nis-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: addForm.year,
          employeeRate: toDecimal(String(addForm.employeeRate)),
          employerRate: toDecimal(String(addForm.employerRate)),
          effectiveNote: addForm.effectiveNote || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setShowAdd(false);
      setAddForm(emptyForm);
      load();
    } catch (e) { setError(String(e)); }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">NIS Contribution Rates</h3>
          <p className="text-xs text-white/40 mt-0.5">Rates are applied automatically based on the pay period year.</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setError(''); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2C4A3E] hover:bg-[#3a5e50] text-white text-xs rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Year
        </button>
      </div>

      {error && <p className="text-red-400 text-xs bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-[#C8B89A] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-[#111E1A] border border-white/10 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Year</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Effective</th>
                <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">Employee Rate</th>
                <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">Employer Rate</th>
                <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">Total</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {rates.map(r => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                  {editId === r.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input type="number" value={editForm.year}
                          onChange={e => setEditForm(f => ({ ...f, year: parseInt(e.target.value) }))}
                          className="w-20 px-2 py-1 bg-[#0D1B17] border border-white/20 rounded text-xs text-white focus:outline-none" />
                      </td>
                      <td className="px-4 py-2">
                        <input value={editForm.effectiveNote}
                          onChange={e => setEditForm(f => ({ ...f, effectiveNote: e.target.value }))}
                          placeholder="e.g. Effective January"
                          className="w-36 px-2 py-1 bg-[#0D1B17] border border-white/20 rounded text-xs text-white focus:outline-none" />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <input type="number" step="0.01" value={editForm.employeeRate}
                            onChange={e => setEditForm(f => ({ ...f, employeeRate: e.target.value }))}
                            className="w-16 px-2 py-1 bg-[#0D1B17] border border-white/20 rounded text-xs text-white text-right focus:outline-none" />
                          <span className="text-white/40 text-xs">%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <input type="number" step="0.01" value={editForm.employerRate}
                            onChange={e => setEditForm(f => ({ ...f, employerRate: e.target.value }))}
                            className="w-16 px-2 py-1 bg-[#0D1B17] border border-white/20 rounded text-xs text-white text-right focus:outline-none" />
                          <span className="text-white/40 text-xs">%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right text-white/40 text-xs">
                        {(parseFloat(editForm.employeeRate || '0') + parseFloat(editForm.employerRate || '0')).toFixed(2)}%
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={saveEdit} disabled={saving}
                            className="p-1.5 rounded bg-green-600/20 hover:bg-green-600/40 text-green-400 transition-colors">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditId(null)}
                            className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/40 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-white font-semibold">{r.year}</td>
                      <td className="px-4 py-3 text-white/50 text-xs">{r.effective_note || '—'}</td>
                      <td className="px-4 py-3 text-right text-[#C8B89A]">{pct(r.employee_rate)}</td>
                      <td className="px-4 py-3 text-right text-[#C8B89A]">{pct(r.employer_rate)}</td>
                      <td className="px-4 py-3 text-right text-white/60 text-xs">
                        {((parseFloat(String(r.employee_rate)) + parseFloat(String(r.employer_rate))) * 100).toFixed(2)}%
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => startEdit(r)}
                            className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteRate(r.id)}
                            className="p-1.5 rounded bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors">
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
                <tr className="border-t border-white/10 bg-white/5">
                  <td className="px-4 py-2">
                    <input type="number" value={addForm.year}
                      onChange={e => setAddForm(f => ({ ...f, year: parseInt(e.target.value) }))}
                      className="w-20 px-2 py-1 bg-[#0D1B17] border border-white/20 rounded text-xs text-white focus:outline-none" />
                  </td>
                  <td className="px-4 py-2">
                    <input value={addForm.effectiveNote}
                      onChange={e => setAddForm(f => ({ ...f, effectiveNote: e.target.value }))}
                      placeholder="e.g. Effective January"
                      className="w-36 px-2 py-1 bg-[#0D1B17] border border-white/20 rounded text-xs text-white focus:outline-none" />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <input type="number" step="0.01" value={addForm.employeeRate}
                        onChange={e => setAddForm(f => ({ ...f, employeeRate: e.target.value }))}
                        placeholder="6.50"
                        className="w-16 px-2 py-1 bg-[#0D1B17] border border-white/20 rounded text-xs text-white text-right focus:outline-none" />
                      <span className="text-white/40 text-xs">%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <input type="number" step="0.01" value={addForm.employerRate}
                        onChange={e => setAddForm(f => ({ ...f, employerRate: e.target.value }))}
                        placeholder="7.50"
                        className="w-16 px-2 py-1 bg-[#0D1B17] border border-white/20 rounded text-xs text-white text-right focus:outline-none" />
                      <span className="text-white/40 text-xs">%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right text-white/40 text-xs">
                    {(parseFloat(String(addForm.employeeRate) || '0') + parseFloat(String(addForm.employerRate) || '0')).toFixed(2)}%
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={saveAdd} disabled={saving}
                        className="p-1.5 rounded bg-green-600/20 hover:bg-green-600/40 text-green-400 transition-colors">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setShowAdd(false)}
                        className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/40 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {rates.length === 0 && !showAdd && (
            <p className="text-center text-white/30 text-xs py-8">No NIS rates configured.</p>
          )}
        </div>
      )}
    </div>
  );
}
