/**
 * RolesPanel — admin UI to create, edit, and delete custom staff roles.
 * Each role has a name, optional description, and a set of Finance tab permissions.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Plus, Pencil, Trash2, X, Loader2, Check,
  ChevronDown, ChevronUp, Info,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FinanceTab = 'records' | 'rates' | 'reports' | 'staff' | 'payables' | 'petty-cash';

const TAB_META: { key: FinanceTab; label: string; description: string }[] = [
  { key: 'records',  label: 'Pay Slip Records',          description: 'View and manage employee pay slips' },
  { key: 'rates',    label: 'Employee Rates & Deductions', description: 'View and edit employee rates and deductions' },
  { key: 'reports',  label: 'Reports',                   description: 'Access payroll reports and YTD summaries' },
  { key: 'staff',    label: 'Staff Access',              description: 'Manage staff accounts and roles (admin-level)' },
  { key: 'payables',    label: 'Accounts Payable',  description: 'View and manage vendor payables' },
  { key: 'petty-cash', label: 'Petty Cash',        description: 'View and manage petty cash entries' },
];

interface StaffRole {
  id: string;
  name: string;
  description: string | null;
  tabPermissions: FinanceTab[];
  createdAt: string;
}

// ─── Role form modal ──────────────────────────────────────────────────────────

interface RoleFormProps {
  initial?: StaffRole;
  onSave: (role: StaffRole) => void;
  onClose: () => void;
}

function RoleForm({ initial, onSave, onClose }: RoleFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [tabs, setTabs] = useState<Set<FinanceTab>>(new Set(initial?.tabPermissions ?? []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function toggleTab(tab: FinanceTab) {
    setTabs(prev => {
      const next = new Set(prev);
      next.has(tab) ? next.delete(tab) : next.add(tab);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Role name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const url = initial ? `/api/admin/roles/${initial.id}` : '/api/admin/roles';
      const method = initial ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          tabPermissions: [...tabs],
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to save role.'); return; }
      onSave(data.role);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111E1A] border border-white/10 rounded-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-base font-semibold text-white">
            {initial ? 'Edit Role' : 'Create Role'}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-300 text-sm">
              <Info className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Role Name <span className="text-red-400">*</span></label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Finance Viewer, Payroll Manager"
              className="w-full bg-[#0D1B17] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C8B89A]/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Description <span className="text-white/25">(optional)</span></label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of this role's responsibilities"
              className="w-full bg-[#0D1B17] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C8B89A]/50"
            />
          </div>

          {/* Tab permissions */}
          <div>
            <label className="block text-xs text-white/50 mb-2">Finance Tab Access</label>
            <div className="space-y-2">
              {TAB_META.map(t => {
                const checked = tabs.has(t.key);
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => toggleTab(t.key)}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                      checked
                        ? 'bg-[#2C4A3E]/60 border-[#2C4A3E] text-white'
                        : 'bg-[#0D1B17] border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${
                      checked ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'
                    }`}>
                      {checked && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight">{t.label}</p>
                      <p className="text-[11px] text-white/35 mt-0.5">{t.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-white/15 text-white/60 text-sm hover:text-white hover:border-white/30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-[#2C4A3E] text-white text-sm font-medium hover:bg-[#3a5f50] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {initial ? 'Save Changes' : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function RolesPanel() {
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffRole | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffRole | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/roles');
      const data = await res.json();
      setRoles(data.roles ?? []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function handleSaved(role: StaffRole) {
    setRoles(prev => {
      const idx = prev.findIndex(r => r.id === role.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = role;
        return next;
      }
      return [...prev, role].sort((a, b) => a.name.localeCompare(b.name));
    });
    setShowForm(false);
    setEditTarget(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/roles/${deleteTarget.id}`, { method: 'DELETE' });
      setRoles(prev => prev.filter(r => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch { /* ignore */ } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Custom Roles</h3>
          <p className="text-xs text-white/40 mt-0.5">Define roles with specific Finance tab access. Assign them to staff members below.</p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2C4A3E] hover:bg-[#3a5f50] text-white text-xs font-medium rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> New Role
        </button>
      </div>

      {/* Role list */}
      {loading ? (
        <div className="flex items-center justify-center py-10 text-white/30">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading roles…
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
          <ShieldCheck className="w-8 h-8 text-white/15 mx-auto mb-2" />
          <p className="text-sm text-white/30">No custom roles yet.</p>
          <p className="text-xs text-white/20 mt-1">Create a role to grant specific tab access to staff members.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {roles.map(role => {
            const expanded = expandedId === role.id;
            return (
              <div key={role.id} className="bg-[#0D1B17] border border-white/10 rounded-xl overflow-hidden">
                {/* Row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <ShieldCheck className="w-4 h-4 text-[#C8B89A] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{role.name}</p>
                    {role.description && (
                      <p className="text-xs text-white/35 truncate mt-0.5">{role.description}</p>
                    )}
                  </div>
                  {/* Tab badges */}
                  <div className="hidden sm:flex items-center gap-1 flex-wrap justify-end max-w-[260px]">
                    {role.tabPermissions.length === 0 ? (
                      <span className="text-[10px] text-white/25 italic">No tabs</span>
                    ) : role.tabPermissions.map(tab => (
                      <span key={tab} className="text-[10px] bg-[#2C4A3E]/60 text-emerald-300 border border-emerald-900/40 rounded px-1.5 py-0.5">
                        {TAB_META.find(t => t.key === tab)?.label ?? tab}
                      </span>
                    ))}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => setExpandedId(expanded ? null : role.id)}
                      className="p-1.5 text-white/30 hover:text-white/70 transition-colors"
                      title="Toggle details"
                    >
                      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => { setEditTarget(role); setShowForm(true); }}
                      className="p-1.5 text-white/30 hover:text-white/70 transition-colors"
                      title="Edit role"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(role)}
                      className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
                      title="Delete role"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded tab detail */}
                {expanded && (
                  <div className="border-t border-white/10 px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TAB_META.map(t => {
                      const granted = role.tabPermissions.includes(t.key);
                      return (
                        <div key={t.key} className={`flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5 ${granted ? 'text-emerald-300 bg-emerald-500/10' : 'text-white/25 bg-white/5'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${granted ? 'bg-emerald-400' : 'bg-white/15'}`} />
                          {t.label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit modal */}
      {showForm && (
        <RoleForm
          initial={editTarget ?? undefined}
          onSave={handleSaved}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111E1A] border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-base font-semibold text-white">Delete "{deleteTarget.name}"?</h3>
            <p className="text-sm text-white/50">
              This role will be removed from all staff members assigned to it. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-white/15 text-white/60 text-sm hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
