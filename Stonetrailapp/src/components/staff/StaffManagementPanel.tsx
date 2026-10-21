/**
 * StaffManagementPanel — admin-only view of all user accounts.
 * Allows add, edit (name/email/role/staffRoleId), delete, and password reset.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield, RefreshCw, ChevronDown, ChevronUp, KeyRound, Copy, Check,
  X, Mail, UserPlus, Eye, EyeOff, Pencil, Trash2, ShieldCheck, Users,
} from 'lucide-react';
import { useSession } from '@/lib/auth/auth-client';
import RolesPanel from './RolesPanel';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string | null;
  staffRoleId: string | null;
  createdAt: string;
}

interface StaffRole {
  id: string;
  name: string;
  tabPermissions: string[];
}

interface ResetResult {
  userId: string;
  resetUrl: string | null;
  emailSent: boolean;
  message: string;
}

interface AddUserForm {
  name: string;
  email: string;
  password: string;
  role: string;
  staffRoleId: string;
}

interface EditUserForm {
  name: string;
  email: string;
  role: string;
  staffRoleId: string;
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  staff: 'bg-white/10 text-white/60 border border-white/10',
};

// ── Combo-dropdown for employee name ────────────────────────────────────────
interface NameComboProps {
  value: string;
  onChange: (val: string) => void;
  employees: string[];
  placeholder?: string;
  required?: boolean;
}

function NameCombo({ value, onChange, employees, placeholder = 'Type or select…', required }: NameComboProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  // Sync query when value changes externally (e.g. form reset)
  useEffect(() => { setQuery(value); }, [value]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? employees.filter(n => n.toLowerCase().includes(query.toLowerCase()))
    : employees;

  function select(name: string) {
    onChange(name);
    setQuery(name);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <input
        required={required}
        value={query}
        placeholder={placeholder}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className="w-full bg-black/20 border border-white/10 text-white text-xs px-3 py-2 pr-7 focus:outline-none focus:border-[#C9A96E]/50 rounded placeholder:text-white/20"
      />
      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1B2A4A] border border-white/15 rounded shadow-xl max-h-48 overflow-y-auto">
          {filtered.map(name => (
            <li key={name}>
              <button
                type="button"
                onMouseDown={() => select(name)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-white/10 transition-colors ${name === value ? 'text-[#C9A96E]' : 'text-white/80'}`}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function StaffManagementPanel() {
  const { user: currentUser } = useSession();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Employee names for combo-dropdown
  const [employeeNames, setEmployeeNames] = useState<string[]>([]);

  // Reset PW state
  const [resetting, setResetting] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<ResetResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Add user state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<AddUserForm>({ name: '', email: '', password: '', role: 'staff', staffRoleId: '' });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Edit user state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm>({ name: '', email: '', role: 'staff', staffRoleId: '' });
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Roles state
  const [roles, setRoles] = useState<StaffRole[]>([]);

  // Delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [staffRes, empRes, rolesRes] = await Promise.all([
        fetch('/api/admin/staff'),
        fetch('/api/admin/employees'),
        fetch('/api/admin/roles'),
      ]);
      if (!staffRes.ok) throw new Error(await staffRes.text());
      const staffData = await staffRes.json();
      setUsers(staffData.staff ?? []);
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployeeNames((empData.employees ?? []).map((e: { name: string }) => e.name));
      }
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData.roles ?? []);
      }
    } catch {
      setError('Failed to load staff accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Add user ────────────────────────────────────────────────────────────────
  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addForm,
          staffRoleId: addForm.staffRoleId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error || 'Failed to create user.'); return; }
      setUsers(prev => [...prev, data.user].sort((a, b) => a.name.localeCompare(b.name)));
      setAddForm({ name: '', email: '', password: '', role: 'staff', staffRoleId: '' });
      setShowAddForm(false);
      flash(`Account created for ${data.user.name}.`);
    } catch {
      setAddError('Failed to create user.');
    } finally {
      setAddLoading(false);
    }
  }

  // ── Edit user ───────────────────────────────────────────────────────────────
  function startEdit(u: StaffUser) {
    setEditingId(u.id);
    setEditForm({ name: u.name, email: u.email, role: u.role ?? 'staff', staffRoleId: u.staffRoleId ?? '' });
    setEditError('');
    setResetResult(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError('');
  }

  async function handleEditUser(e: React.FormEvent, userId: string) {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    try {
      const res = await fetch(`/api/admin/staff/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          staffRoleId: editForm.staffRoleId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error || 'Failed to update user.'); return; }
      setUsers(prev => prev.map(u => u.id === userId ? data.user : u).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingId(null);
      flash(`${data.user.name} updated.`);
    } catch {
      setEditError('Failed to update user.');
    } finally {
      setEditLoading(false);
    }
  }

  // ── Delete user ─────────────────────────────────────────────────────────────
  async function handleDelete(userId: string) {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/staff/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to delete user.'); return; }
      setUsers(prev => prev.filter(u => u.id !== userId));
      setConfirmDeleteId(null);
      flash(`${data.name} has been removed.`);
    } catch {
      setError('Failed to delete user.');
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── Reset password ──────────────────────────────────────────────────────────
  async function handleResetPassword(u: StaffUser) {
    setResetting(u.id);
    setResetResult(null);
    setError('');
    try {
      const res = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u.email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to generate reset link.'); return; }
      setResetResult({ userId: u.id, resetUrl: data.resetUrl, emailSent: data.emailSent, message: data.message });
    } catch {
      setError('Failed to generate reset link.');
    } finally {
      setResetting(null);
    }
  }

  async function handleCopy() {
    if (!resetResult?.resetUrl) return;
    await navigator.clipboard.writeText(resetResult.resetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const [rolesExpanded, setRolesExpanded] = useState(false);
  const [staffExpanded, setStaffExpanded] = useState(false);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Custom Roles collapsible ─────────────────────────────────────────── */}
      <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]">
        <button
          type="button"
          onClick={() => setRolesExpanded(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#C8B89A]" />
            <span className="text-sm font-semibold text-white">Custom Roles</span>
            {roles.length > 0 && (
              <span className="text-[10px] bg-[#2C4A3E]/60 text-emerald-300 border border-emerald-900/40 rounded-full px-2 py-0.5">
                {roles.length}
              </span>
            )}
          </div>
          {rolesExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
        </button>
        {rolesExpanded && (
          <div className="px-4 pb-4 pt-1 border-t border-white/10">
            <RolesPanel />
          </div>
        )}
      </div>

      {/* ── Staff Accounts collapsible ───────────────────────────────────────── */}
      <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]">
        <button
          type="button"
          onClick={() => setStaffExpanded(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#C8B89A]" />
            <span className="text-sm font-semibold text-white">Staff Accounts</span>
            {users.length > 0 && (
              <span className="text-[10px] bg-white/10 text-white/50 border border-white/10 rounded-full px-2 py-0.5">
                {users.length}
              </span>
            )}
          </div>
          {staffExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
        </button>
        {staffExpanded && (
          <div className="px-4 pb-4 pt-1 border-t border-white/10">
            <div className="space-y-4 pt-2">
              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setShowAddForm(v => !v); setAddError(''); setEditingId(null); }}
                  className="flex items-center gap-1.5 text-xs text-[#C9A96E] border border-[#C9A96E]/40 hover:bg-[#C9A96E]/10 px-3 py-1.5 rounded transition-colors"
                >
                  <UserPlus size={13} />
                  Add User
                </button>
                <button
                  onClick={load}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors disabled:opacity-40"
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="bg-white/5 border border-white/10 rounded p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white text-sm font-medium">New Staff Account</h3>
            <button onClick={() => { setShowAddForm(false); setAddError(''); }} className="text-white/30 hover:text-white/60">
              <X size={14} />
            </button>
          </div>
          {addError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs px-3 py-2 rounded">{addError}</div>
          )}
          <form onSubmit={handleAddUser} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1.5">Full Name</label>
                <NameCombo
                  required
                  value={addForm.name}
                  onChange={val => setAddForm(f => ({ ...f, name: val }))}
                  employees={employeeNames}
                  placeholder="Type or select employee…"
                />
              </div>
              <div>
                <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1.5">Email</label>
                <input required type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="jane@stonetrailvillas.com"
                  className="w-full bg-black/20 border border-white/10 text-white text-xs px-3 py-2 focus:outline-none focus:border-[#C9A96E]/50 rounded placeholder:text-white/20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1.5">Password</label>
                <div className="relative">
                  <input required type={showPassword ? 'text' : 'password'} value={addForm.password}
                    onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min. 8 characters" minLength={8}
                    className="w-full bg-black/20 border border-white/10 text-white text-xs px-3 py-2 pr-8 focus:outline-none focus:border-[#C9A96E]/50 rounded placeholder:text-white/20" />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1.5">Role</label>
                <div className="relative">
                  <select value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value, staffRoleId: '' }))}
                    className="w-full appearance-none bg-black/20 border border-white/10 text-white text-xs px-3 py-2 pr-7 focus:outline-none focus:border-[#C9A96E]/50 rounded cursor-pointer">
                    <option value="staff" className="bg-[#1B2A4A]">Staff</option>
                    <option value="admin" className="bg-[#1B2A4A]">Admin</option>
                  </select>
                  <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                </div>
              </div>
            </div>
            {/* Custom Role — only shown when role is staff */}
            {addForm.role === 'staff' && roles.length > 0 && (
              <div>
                <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1.5">Custom Role</label>
                <div className="relative">
                  <select value={addForm.staffRoleId} onChange={e => setAddForm(f => ({ ...f, staffRoleId: e.target.value }))}
                    className="w-full appearance-none bg-black/20 border border-white/10 text-white text-xs px-3 py-2 pr-7 focus:outline-none focus:border-[#C9A96E]/50 rounded cursor-pointer">
                    <option value="" className="bg-[#1B2A4A]">— No custom role —</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id} className="bg-[#1B2A4A]">{r.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => { setShowAddForm(false); setAddError(''); }}
                className="text-xs text-white/40 hover:text-white/70 px-4 py-2 border border-white/10 rounded transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={addLoading}
                className="text-xs bg-[#C9A96E] text-[#1B2A4A] font-semibold px-4 py-2 rounded hover:bg-[#C9A96E]/80 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                {addLoading ? <RefreshCw size={11} className="animate-spin" /> : <UserPlus size={11} />}
                {addLoading ? 'Creating…' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feedback banners */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs px-4 py-3 rounded flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => setError('')}><X size={12} /></button>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Reset result banner */}
      {resetResult && (
        <div className={`border text-xs px-4 py-3 rounded space-y-2 ${resetResult.emailSent ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              {resetResult.emailSent ? <Mail size={13} className="mt-0.5 shrink-0" /> : <KeyRound size={13} className="mt-0.5 shrink-0" />}
              <span>{resetResult.message}</span>
            </div>
            <button onClick={() => setResetResult(null)} className="text-white/30 hover:text-white/60 shrink-0"><X size={13} /></button>
          </div>
          {resetResult.resetUrl && !resetResult.emailSent && (
            <div className="flex items-stretch gap-2 mt-1">
              <input readOnly value={resetResult.resetUrl}
                className="flex-1 bg-black/20 border border-white/10 text-white/70 font-mono text-[11px] px-3 py-1.5 truncate focus:outline-none rounded" />
              <button onClick={handleCopy}
                className="px-2.5 bg-white/10 border border-white/10 hover:bg-white/20 transition-colors rounded text-white/60 hover:text-white" title="Copy link">
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white/5 border border-white/10 overflow-hidden rounded">
        {loading ? (
          <div className="py-12 text-center text-white/30 text-sm">Loading accounts…</div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-white/30 text-sm">No accounts found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-5 py-3 text-white/40 font-medium text-xs tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-white/40 font-medium text-xs tracking-wide">Email</th>
                <th className="text-left px-5 py-3 text-white/40 font-medium text-xs tracking-wide">Role</th>
                <th className="text-left px-5 py-3 text-white/40 font-medium text-xs tracking-wide">Joined</th>
                <th className="px-5 py-3 text-white/40 font-medium text-xs tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const isCurrentUser = u.id === currentUser?.id;
                const role = u.role ?? 'staff';
                const isEditing = editingId === u.id;
                const isResetting = resetting === u.id;
                const isConfirmingDelete = confirmDeleteId === u.id;

                return (
                  <tr key={u.id} className={`border-b border-white/5 last:border-0 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                    {isEditing ? (
                      /* ── Edit row ── */
                      <td colSpan={5} className="px-5 py-4">
                        {editError && (
                          <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs px-3 py-2 rounded mb-3">{editError}</div>
                        )}
                        <form onSubmit={e => handleEditUser(e, u.id)} className="flex flex-wrap items-end gap-3">
                          <div>
                            <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1">Name</label>
                            <div className="w-44">
                              <NameCombo
                                required
                                value={editForm.name}
                                onChange={val => setEditForm(f => ({ ...f, name: val }))}
                                employees={employeeNames}
                                placeholder="Type or select…"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1">Email</label>
                            <input required type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                              className="bg-black/20 border border-white/10 text-white text-xs px-3 py-2 focus:outline-none focus:border-[#C9A96E]/50 rounded w-52 placeholder:text-white/20" />
                          </div>
                          {!isCurrentUser && (
                            <div>
                              <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1">Role</label>
                              <div className="relative">
                                <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                                  className="appearance-none bg-black/20 border border-white/10 text-white text-xs px-3 py-2 pr-7 focus:outline-none focus:border-[#C9A96E]/50 rounded cursor-pointer w-28">
                                  <option value="staff" className="bg-[#1B2A4A]">Staff</option>
                                  <option value="admin" className="bg-[#1B2A4A]">Admin</option>
                                </select>
                                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                              </div>
                            </div>
                          )}
                          {/* Custom role — only for staff */}
                          {!isCurrentUser && editForm.role === 'staff' && (
                            <div>
                              <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1">Custom Role</label>
                              <div className="relative">
                                <select
                                  value={editForm.staffRoleId}
                                  onChange={e => setEditForm(f => ({ ...f, staffRoleId: e.target.value }))}
                                  className="appearance-none bg-black/20 border border-white/10 text-white text-xs px-3 py-2 pr-7 focus:outline-none focus:border-[#C9A96E]/50 rounded cursor-pointer w-44"
                                >
                                  <option value="" className="bg-[#1B2A4A]">— No custom role —</option>
                                  {roles.map(r => (
                                    <option key={r.id} value={r.id} className="bg-[#1B2A4A]">{r.name}</option>
                                  ))}
                                </select>
                                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                              </div>
                            </div>
                          )}
                          <div className="flex gap-2 ml-auto">
                            <button type="button" onClick={cancelEdit}
                              className="text-xs text-white/40 hover:text-white/70 px-3 py-2 border border-white/10 rounded transition-colors">
                              Cancel
                            </button>
                            <button type="submit" disabled={editLoading}
                              className="text-xs bg-[#C9A96E] text-[#1B2A4A] font-semibold px-4 py-2 rounded hover:bg-[#C9A96E]/80 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                              {editLoading ? <RefreshCw size={11} className="animate-spin" /> : <Check size={11} />}
                              {editLoading ? 'Saving…' : 'Save'}
                            </button>
                          </div>
                        </form>
                      </td>
                    ) : isConfirmingDelete ? (
                      /* ── Delete confirm row ── */
                      <td colSpan={5} className="px-5 py-4">
                        <div className="flex items-center gap-4">
                          <span className="text-red-300 text-xs">Remove <strong>{u.name}</strong>? This cannot be undone.</span>
                          <div className="flex gap-2 ml-auto">
                            <button onClick={() => setConfirmDeleteId(null)}
                              className="text-xs text-white/40 hover:text-white/70 px-3 py-1.5 border border-white/10 rounded transition-colors">
                              Cancel
                            </button>
                            <button onClick={() => handleDelete(u.id)} disabled={deleteLoading}
                              className="text-xs bg-red-500/80 text-white font-semibold px-4 py-1.5 rounded hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                              {deleteLoading ? <RefreshCw size={11} className="animate-spin" /> : <Trash2 size={11} />}
                              {deleteLoading ? 'Removing…' : 'Remove'}
                            </button>
                          </div>
                        </div>
                      </td>
                    ) : (
                      /* ── Normal row ── */
                      <>
                        <td className="px-5 py-3.5 text-white text-xs font-medium">
                          {u.name}
                          {isCurrentUser && <span className="ml-2 text-[10px] text-white/30 font-normal">(you)</span>}
                        </td>
                        <td className="px-5 py-3.5 text-white/50 text-xs">{u.email}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium w-fit ${ROLE_COLORS[role] ?? ROLE_COLORS.staff}`}>
                              {role === 'admin' && <Shield size={10} />}
                              {role === 'admin' ? 'Admin' : 'Staff'}
                            </span>
                            {u.staffRoleId && role !== 'admin' && (() => {
                              const sr = roles.find(r => r.id === u.staffRoleId);
                              return sr ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-900/40 rounded px-1.5 py-0.5 w-fit">
                                  <ShieldCheck size={9} />{sr.name}
                                </span>
                              ) : null;
                            })()}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-white/40 text-xs">
                          {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            {/* Reset PW */}
                            <button onClick={() => handleResetPassword(u)} disabled={isResetting}
                              title="Send password reset link"
                              className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-[#C9A96E] border border-white/10 hover:border-[#C9A96E]/40 px-2.5 py-1.5 rounded transition-colors disabled:opacity-40">
                              {isResetting ? <RefreshCw size={11} className="animate-spin" /> : <KeyRound size={11} />}
                              {isResetting ? 'Sending…' : 'Reset PW'}
                            </button>
                            {/* Edit */}
                            <button onClick={() => startEdit(u)} title="Edit user"
                              className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white border border-white/10 hover:border-white/30 px-2.5 py-1.5 rounded transition-colors">
                              <Pencil size={11} />
                              Edit
                            </button>
                            {/* Delete — disabled icon for yourself, active for others */}
                            {isCurrentUser ? (
                              <span title="You cannot delete your own account"
                                className="relative inline-flex items-center justify-center w-[30px] h-[30px] text-white/20 border border-white/10 rounded cursor-not-allowed shrink-0">
                                <Trash2 size={11} />
                                {/* circle-slash overlay */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 30 30">
                                  <circle cx="15" cy="15" r="11" stroke="currentColor" strokeWidth="2.5" fill="none" />
                                  <line x1="7" y1="7" x2="23" y2="23" stroke="currentColor" strokeWidth="2.5" />
                                </svg>
                              </span>
                            ) : (
                              <button onClick={() => setConfirmDeleteId(u.id)} title="Remove user"
                                className="inline-flex items-center justify-center w-[30px] h-[30px] text-[11px] text-white/40 hover:text-red-400 border border-white/10 hover:border-red-500/40 rounded transition-colors shrink-0">
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-white/20 text-[11px]">
        Role changes take effect on the user's next page load. You cannot change or delete your own account.
      </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
