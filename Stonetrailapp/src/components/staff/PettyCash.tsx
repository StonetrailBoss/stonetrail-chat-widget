/**
 * PettyCash — double-entry petty cash ledger component.
 * Lives as a sub-tab under Finance → Records.
 */
import { useState, useEffect } from 'react';
import {
  Plus, Trash2, Archive, X, Wallet,
  AlertTriangle, BookOpen, Download, CheckCircle2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PettyCashAccount {
  id: number;
  name: string;
  openingBalance: string;
  currentBalance: string;
  currency: string;
  notes: string | null;
  isArchived: number;
  createdAt: string;
}

interface PettyCashEntry {
  id: number;
  accountId: number;
  txnRef: string;
  entryDate: string;
  description: string;
  category: string;
  debit: string;
  credit: string;
  runningBalance: string;
  reference: string | null;
  createdBy: string | null;
  isArchived: number;
  archiveRef: string | null;
  createdAt: string;
}

type TxnType = 'expense' | 'replenishment' | 'adjustment';

const CATEGORIES = [
  'General', 'Office Supplies', 'Meals & Entertainment', 'Travel',
  'Maintenance', 'Utilities', 'Cleaning', 'Postage', 'Miscellaneous',
];

const TXN_LABELS: Record<TxnType, string> = {
  expense: 'Expense (Cash Out)',
  replenishment: 'Replenishment (Cash In)',
  adjustment: 'Adjustment',
};
void TXN_LABELS; // referenced by type only — suppress unused warning

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val: string | number, currency = 'EC$') {
  const n = parseFloat(String(val));
  return `${currency} ${isNaN(n) ? '0.00' : n.toFixed(2)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// ─── New Account Modal ────────────────────────────────────────────────────────

function NewAccountModal({ onSave, onClose }: {
  onSave: (data: { name: string; openingBalance: string; openingDate: string; currency: string; notes: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ name: '', openingBalance: '0.00', openingDate: today(), currency: 'EC$', notes: '' });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-[#1A2E28] border border-white/10 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white">New Petty Cash Fund</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1.5">Fund Name *</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Main Office Fund"
              className="w-full bg-[#111E1A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1.5">Opening Balance</label>
              <input type="number" step="0.01" min="0" value={form.openingBalance}
                onChange={e => setForm({ ...form, openingBalance: e.target.value })}
                className="w-full bg-[#111E1A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50" />
            </div>
            <div>
              <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1.5">As of Date</label>
              <input type="date" value={form.openingDate}
                onChange={e => setForm({ ...form, openingDate: e.target.value })}
                className="w-full bg-[#111E1A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1.5">Currency</label>
            <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
              className="w-full bg-[#111E1A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50">
              {['EC$', 'USD', 'XCD'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1.5">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-[#111E1A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50 resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm text-white/50 hover:text-white hover:border-white/20 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-[#C8B89A] text-[#1A2E28] text-sm font-semibold hover:bg-[#d4c4a8] transition-colors disabled:opacity-60">
              {saving ? 'Creating…' : 'Create Fund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Funds Modal (replenishment — cash in) ────────────────────────────────

function AddFundsModal({ account, onSave, onClose }: {
  account: PettyCashAccount;
  onSave: (data: { entryDate: string; description: string; category: string; amount: string; type: TxnType; reference: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ entryDate: today(), description: 'Fund Replenishment', amount: '', reference: '' });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    setSaving(true);
    await onSave({ ...form, category: 'Fund Addition', type: 'replenishment' });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-[#1A2E28] border border-white/10 rounded-xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h3 className="text-sm font-semibold text-white">Add Funds</h3>
            <p className="text-[11px] text-white/40 mt-0.5">{account.name} · Current: {fmt(account.currentBalance, account.currency)}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1.5">Date *</label>
              <input type="date" required value={form.entryDate}
                onChange={e => setForm({ ...form, entryDate: e.target.value })}
                className="w-full bg-[#111E1A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50" />
            </div>
            <div>
              <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1.5">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/40">{account.currency}</span>
                <input type="number" step="0.01" min="0.01" required value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full bg-[#111E1A] border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1.5">Description</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full bg-[#111E1A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50" />
          </div>
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1.5">Reference / Voucher #</label>
            <input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })}
              placeholder="Optional"
              className="w-full bg-[#111E1A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50" />
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2.5 text-xs text-emerald-300/80">
            This will increase the fund balance by {account.currency} {form.amount ? parseFloat(form.amount).toFixed(2) : '0.00'}.
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm text-white/50 hover:text-white hover:border-white/20 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors disabled:opacity-60">
              {saving ? 'Posting…' : 'Add Funds'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Record Expense Modal (cash out) ─────────────────────────────────────────

function RecordExpenseModal({ account, onSave, onClose }: {
  account: PettyCashAccount;
  onSave: (data: { entryDate: string; description: string; category: string; amount: string; type: TxnType; reference: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    entryDate: today(), description: '', category: 'General', amount: '', reference: '', type: 'expense' as TxnType,
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  const remaining = parseFloat(account.currentBalance) - (parseFloat(form.amount) || 0);
  const overdrawn = remaining < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-[#1A2E28] border border-white/10 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h3 className="text-sm font-semibold text-white">Record Expense</h3>
            <p className="text-[11px] text-white/40 mt-0.5">{account.name} · Balance: {fmt(account.currentBalance, account.currency)}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1.5">Date *</label>
              <input type="date" required value={form.entryDate}
                onChange={e => setForm({ ...form, entryDate: e.target.value })}
                className="w-full bg-[#111E1A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50" />
            </div>
            <div>
              <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1.5">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/40">{account.currency}</span>
                <input type="number" step="0.01" min="0.01" required value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full bg-[#111E1A] border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1.5">Description *</label>
            <input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="What was purchased / paid for?"
              className="w-full bg-[#111E1A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1.5">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full bg-[#111E1A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1.5">Receipt / Ref #</label>
              <input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })}
                placeholder="Optional"
                className="w-full bg-[#111E1A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50" />
            </div>
          </div>
          {/* Type toggle for adjustment */}
          <div className="flex items-center gap-2">
            <button type="button"
              onClick={() => setForm({ ...form, type: form.type === 'adjustment' ? 'expense' : 'adjustment' })}
              className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                form.type === 'adjustment'
                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                  : 'border-white/10 text-white/30 hover:text-white/50'
              }`}>
              Mark as Adjustment
            </button>
            <span className="text-[10px] text-white/20">Use for corrections, not purchases</span>
          </div>
          {/* Balance preview */}
          <div className={`rounded-lg px-4 py-2.5 text-xs border ${
            overdrawn
              ? 'bg-red-500/10 border-red-500/20 text-red-300'
              : 'bg-[#111E1A] border-white/5 text-white/40'
          }`}>
            {overdrawn
              ? `⚠ This will overdraw the fund by ${account.currency} ${Math.abs(remaining).toFixed(2)}`
              : `Balance after: ${fmt(remaining, account.currency)}`}
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm text-white/50 hover:text-white hover:border-white/20 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-red-600/80 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60">
              {saving ? 'Posting…' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Archive Modal ────────────────────────────────────────────────────────────

function ArchiveModal({ account, onArchive, onClose }: {
  account: PettyCashAccount;
  onArchive: (archiveRef: string, upToDate: string) => Promise<void>;
  onClose: () => void;
}) {
  const [archiveRef, setArchiveRef] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-Q${Math.ceil((d.getMonth() + 1) / 3)}`;
  });
  const [upToDate, setUpToDate] = useState(today());
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onArchive(archiveRef, upToDate);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-[#1A2E28] border border-white/10 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white">Archive Ledger Period</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 flex gap-3">
            <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/80">
              All entries up to the selected date will be archived and locked. The closing balance becomes the new opening balance. This cannot be undone.
            </p>
          </div>
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1.5">Archive Reference *</label>
            <input required value={archiveRef} onChange={e => setArchiveRef(e.target.value)}
              placeholder="e.g. 2025-Q1"
              className="w-full bg-[#111E1A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50" />
          </div>
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-white/40 mb-1.5">Archive All Entries Up To *</label>
            <input type="date" required value={upToDate} onChange={e => setUpToDate(e.target.value)}
              className="w-full bg-[#111E1A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm text-white/50 hover:text-white transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-amber-500/80 text-white text-sm font-semibold hover:bg-amber-500 transition-colors disabled:opacity-60">
              {saving ? 'Archiving…' : 'Archive Period'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PettyCash() {
  const [accounts, setAccounts] = useState<PettyCashAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [entries, setEntries] = useState<PettyCashEntry[]>([]);
  const [archivedEntries, setArchivedEntries] = useState<PettyCashEntry[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [entriesLoading, setEntriesLoading] = useState(false);

  const [showNewAccount, setShowNewAccount] = useState(false);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showRecordExpense, setShowRecordExpense] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState<'' | 'debit' | 'credit'>('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [groupByMonth, setGroupByMonth] = useState(false);
  const selectedAccount = accounts.find(a => a.id === selectedAccountId) ?? null;

  // ── Toast helper ──────────────────────────────────────────────────────────
  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Fetch accounts ────────────────────────────────────────────────────────
  async function fetchAccounts() {
    setLoading(true);
    try {
      const res = await fetch('/api/petty-cash/accounts', { credentials: 'include' });
      if (res.ok) {
        const data: PettyCashAccount[] = await res.json();
        setAccounts(data);
        if (data.length > 0 && !selectedAccountId) {
          setSelectedAccountId(data[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Fetch entries ─────────────────────────────────────────────────────────
  async function fetchEntries(accountId: number) {
    setEntriesLoading(true);
    try {
      const [activeRes, archRes] = await Promise.all([
        fetch(`/api/petty-cash/entries?accountId=${accountId}`, { credentials: 'include' }),
        fetch(`/api/petty-cash/entries?accountId=${accountId}&archived=1`, { credentials: 'include' }),
      ]);
      if (activeRes.ok) setEntries(await activeRes.json());
      if (archRes.ok) setArchivedEntries(await archRes.json());
    } finally {
      setEntriesLoading(false);
    }
  }

  useEffect(() => { fetchAccounts(); }, []);
  useEffect(() => {
    if (selectedAccountId) fetchEntries(selectedAccountId);
    else { setEntries([]); setArchivedEntries([]); }
  }, [selectedAccountId]);

  // ── Create account ────────────────────────────────────────────────────────
  async function handleCreateAccount(data: { name: string; openingBalance: string; openingDate: string; currency: string; notes: string }) {
    const res = await fetch('/api/petty-cash/accounts', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const acc: PettyCashAccount = await res.json();
      setAccounts(prev => [...prev, acc]);
      setSelectedAccountId(acc.id);
      setShowNewAccount(false);
      showToast('Fund created');
    } else {
      showToast('Failed to create fund', 'err');
    }
  }

  // ── Post transaction ──────────────────────────────────────────────────────
  async function handlePostEntry(data: {
    entryDate: string; description: string; category: string;
    amount: string; type: TxnType; reference: string;
  }) {
    if (!selectedAccountId) return;
    const res = await fetch('/api/petty-cash/entries', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, accountId: selectedAccountId }),
    });
    if (res.ok) {
      const { entries: newEntries, newBalance } = await res.json();
      setEntries(newEntries.filter((e: PettyCashEntry) => !e.isArchived));
      setAccounts(prev => prev.map(a => a.id === selectedAccountId
        ? { ...a, currentBalance: String(newBalance) } : a));
      setShowAddFunds(false);
      setShowRecordExpense(false);
      showToast('Transaction posted');
    } else {
      showToast('Failed to post transaction', 'err');
    }
  }

  // ── Delete entry ──────────────────────────────────────────────────────────
  async function handleDeleteEntry(id: number) {
    const res = await fetch(`/api/petty-cash/entries/${id}`, {
      method: 'DELETE', credentials: 'include',
    });
    if (res.ok) {
      const { newBalance } = await res.json();
      setEntries(prev => prev.filter(e => e.id !== id));
      setAccounts(prev => prev.map(a => a.id === selectedAccountId
        ? { ...a, currentBalance: String(newBalance) } : a));
      setDeleteConfirm(null);
      showToast('Entry deleted');
    } else {
      showToast('Failed to delete entry', 'err');
    }
  }

  // ── Archive period ────────────────────────────────────────────────────────
  async function handleArchive(archiveRef: string, upToDate: string) {
    if (!selectedAccountId) return;
    const res = await fetch('/api/petty-cash/entries/archive', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: selectedAccountId, archiveRef, upToDate }),
    });
    if (res.ok) {
      const { archivedCount, newCurrentBalance } = await res.json();
      await fetchEntries(selectedAccountId);
      setAccounts(prev => prev.map(a => a.id === selectedAccountId
        ? { ...a, currentBalance: String(newCurrentBalance) } : a));
      setShowArchiveModal(false);
      showToast(`${archivedCount} entries archived`);
    } else {
      const { error } = await res.json().catch(() => ({ error: 'Archive failed' }));
      showToast(error || 'Archive failed', 'err');
    }
  }

  // ── CSV export ────────────────────────────────────────────────────────────
  function exportCSV() {
    if (!selectedAccount) return;
    const rows = showArchived ? archivedEntries : entries;
    const header = 'Date,Description,Category,Reference,Debit,Credit,Balance\n';
    const body = rows.map(e =>
      `${e.entryDate},"${e.description}","${e.category}","${e.reference || ''}",${e.debit},${e.credit},${e.runningBalance}`
    ).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `petty-cash-${selectedAccount.name.replace(/\s+/g, '-')}-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Filtered entries ──────────────────────────────────────────────────────
  const displayEntries = (showArchived ? archivedEntries : entries).filter(e => {
    if (filterCategory && e.category !== filterCategory) return false;
    if (filterType === 'debit' && parseFloat(e.debit) <= 0) return false;
    if (filterType === 'credit' && parseFloat(e.credit) <= 0) return false;
    if (filterFrom && e.entryDate < filterFrom) return false;
    if (filterTo && e.entryDate > filterTo) return false;
    return true;
  });

  // Group entries by YYYY-MM for the monthly summary view
  type MonthGroup = { month: string; label: string; entries: PettyCashEntry[]; totalIn: number; totalOut: number; closingBalance: number };
  const monthGroups: MonthGroup[] = (() => {
    const map = new Map<string, PettyCashEntry[]>();
    for (const e of displayEntries) {
      const key = e.entryDate.slice(0, 7); // YYYY-MM
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).map(([month, rows]) => {
      const [y, m] = month.split('-');
      const label = new Date(Number(y), Number(m) - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      const totalIn = rows.reduce((s, r) => s + parseFloat(r.debit), 0);
      const totalOut = rows.reduce((s, r) => s + parseFloat(r.credit), 0);
      const closingBalance = parseFloat(rows[rows.length - 1].runningBalance);
      return { month, label, entries: rows, totalIn, totalOut, closingBalance };
    });
  })();

  // ── Summary stats ─────────────────────────────────────────────────────────
  // Total funded = all debit (cash-in) entries: opening balance + replenishments
  const totalFunded = entries.reduce((s, e) => s + parseFloat(e.debit), 0);
  // Total expenses = all credit (cash-out) entries
  const totalExpenses = entries.reduce((s, e) => s + parseFloat(e.credit), 0);
  // Net balance = funded minus expenses (matches currentBalance on the account)
  const netBalance = totalFunded - totalExpenses;
  // Expense count (credit rows only, excluding opening/fund entries)
  const expenseCount = entries.filter(e => parseFloat(e.credit) > 0).length;
  // Fund additions count (debit rows excluding opening balance)
  const fundAddCount = entries.filter(e => parseFloat(e.debit) > 0 && e.category !== 'Opening Balance').length;
  const currency = selectedAccount?.currency || 'EC$';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 py-2">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-sm font-medium transition-all ${
          toast.type === 'ok' ? 'bg-emerald-900/90 border border-emerald-500/30 text-emerald-200' : 'bg-red-900/90 border border-red-500/30 text-red-200'
        }`}>
          {toast.type === 'ok' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Wallet className="w-5 h-5 text-[#C8B89A]" />
          <h2 className="text-base font-semibold text-white">Petty Cash</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selectedAccount ? (
            <>
              <button onClick={() => setShowAddFunds(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/80 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors">
                <Plus size={12} /> Add Funds
              </button>
              <button onClick={() => setShowRecordExpense(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-700/70 text-white text-xs font-semibold hover:bg-red-600/80 transition-colors">
                <Plus size={12} /> Record Expense
              </button>
              <button onClick={exportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/50 hover:text-white hover:border-white/20 transition-colors">
                <Download size={12} /> CSV
              </button>
              <button onClick={() => setShowArchiveModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/20 text-xs text-amber-400/70 hover:text-amber-300 hover:border-amber-500/40 transition-colors">
                <Archive size={12} /> Archive
              </button>
            </>
          ) : (
            <button onClick={() => setShowNewAccount(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C8B89A] text-[#1A2E28] text-xs font-semibold hover:bg-[#d4c4a8] transition-colors">
              <Plus size={12} /> Set Up Fund
            </button>
          )}
        </div>
      </div>

      {/* No fund state */}
      {!loading && accounts.length === 0 && (
        <div className="bg-[#111E1A] border border-white/10 rounded-xl px-8 py-12 text-center">
          <Wallet className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/50 mb-1">No petty cash fund set up yet.</p>
          <p className="text-xs text-white/30 mb-5">Create the fund once, then add money from multiple sources and record daily expenses against it.</p>
          <button onClick={() => setShowNewAccount(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C8B89A] text-[#1A2E28] text-sm font-semibold hover:bg-[#d4c4a8] transition-colors">
            <Plus size={14} /> Set Up Petty Cash Fund
          </button>
        </div>
      )}

      {/* Summary — single fund overview */}
      {selectedAccount && (
        <div className="bg-[#111E1A] border border-white/10 rounded-xl p-5">
          {/* Top row: big balance + fund name */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-[10px] tracking-widest uppercase text-white/40 mb-1">Current Balance</p>
              <p className="text-3xl font-bold text-[#C8B89A]">{fmt(netBalance, currency)}</p>
              <p className="text-xs text-white/30 mt-1">{selectedAccount.name}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] tracking-widest uppercase text-white/40 mb-1">Fund Health</p>
              {netBalance <= 0 ? (
                <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                  <AlertTriangle size={11} /> Overdrawn
                </span>
              ) : netBalance < totalFunded * 0.2 ? (
                <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  <AlertTriangle size={11} /> Low — replenish soon
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  <CheckCircle2 size={11} /> Healthy
                </span>
              )}
            </div>
          </div>
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#0D1812] rounded-lg px-4 py-3">
              <p className="text-[10px] tracking-widest uppercase text-emerald-400/60 mb-1">Total Funded</p>
              <p className="text-base font-bold text-emerald-400">{fmt(totalFunded, currency)}</p>
              <p className="text-[10px] text-white/30 mt-0.5">
                {fundAddCount} top-up{fundAddCount !== 1 ? 's' : ''}{entries.some(e => e.category === 'Opening Balance') ? ' + opening' : ''}
              </p>
            </div>
            <div className="bg-[#0D1812] rounded-lg px-4 py-3">
              <p className="text-[10px] tracking-widest uppercase text-red-400/60 mb-1">Total Expenses</p>
              <p className="text-base font-bold text-red-400">{fmt(totalExpenses, currency)}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{expenseCount} expense{expenseCount !== 1 ? 's' : ''} recorded</p>
            </div>
            <div className="bg-[#0D1812] rounded-lg px-4 py-3">
              <p className="text-[10px] tracking-widest uppercase text-white/30 mb-1">Archived</p>
              <p className="text-base font-bold text-white/60">{archivedEntries.length}</p>
              <p className="text-[10px] text-white/30 mt-0.5">historical entries</p>
            </div>
          </div>
        </div>
      )}

      {/* Ledger */}
      {selectedAccount && (
        <div className="bg-[#111E1A] border border-white/10 rounded-xl overflow-hidden">

          {/* Ledger header */}
          <div className="px-5 py-3 border-b border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#C8B89A]" />
                <span className="text-xs font-semibold text-white">
                  {showArchived ? 'Archived Ledger' : 'Active Ledger'}
                </span>
                <span className="text-[10px] text-white/30 ml-1">{displayEntries.length} entries</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Month group toggle */}
                <button onClick={() => setGroupByMonth(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                    groupByMonth
                      ? 'bg-[#C8B89A]/20 border-[#C8B89A]/30 text-[#C8B89A]'
                      : 'border-white/10 text-white/40 hover:text-white hover:border-white/20'
                  }`}>
                  Monthly View
                </button>
                {/* Toggle archived */}
                <button onClick={() => setShowArchived(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                    showArchived
                      ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                      : 'border-white/10 text-white/40 hover:text-white hover:border-white/20'
                  }`}>
                  <Archive size={11} />
                  {showArchived ? 'Viewing Archived' : 'View Archived'}
                </button>
              </div>
            </div>
            {/* Filter row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Date from */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-white/30 whitespace-nowrap">From</span>
                <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
                  className="bg-[#0D1812] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/70 focus:outline-none focus:border-[#C8B89A]/50 w-36" />
              </div>
              {/* Date to */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-white/30 whitespace-nowrap">To</span>
                <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
                  className="bg-[#0D1812] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/70 focus:outline-none focus:border-[#C8B89A]/50 w-36" />
              </div>
              {/* Category filter */}
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1.5 bg-[#0D1812] border border-white/10 rounded-lg text-xs text-white/60 focus:outline-none focus:border-[#C8B89A]/50">
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              {/* Type filter */}
              <select value={filterType} onChange={e => setFilterType(e.target.value as '' | 'debit' | 'credit')}
                className="appearance-none pl-3 pr-7 py-1.5 bg-[#0D1812] border border-white/10 rounded-lg text-xs text-white/60 focus:outline-none focus:border-[#C8B89A]/50">
                <option value="">All Types</option>
                <option value="debit">Cash In (Debit)</option>
                <option value="credit">Cash Out (Credit)</option>
              </select>
              {/* Clear filters */}
              {(filterFrom || filterTo || filterCategory || filterType) && (
                <button onClick={() => { setFilterFrom(''); setFilterTo(''); setFilterCategory(''); setFilterType(''); }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/10 text-xs text-white/40 hover:text-white hover:border-white/20 transition-colors">
                  <X size={10} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          {entriesLoading ? (
            <div className="px-6 py-10 text-center text-sm text-white/30">Loading…</div>
          ) : displayEntries.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-white/30">
                {showArchived ? 'No archived entries.' : filterFrom || filterTo || filterCategory || filterType ? 'No entries match the current filters.' : 'No transactions yet. Post the first transaction above.'}
              </p>
            </div>
          ) : groupByMonth ? (
            /* ── Monthly summary view ── */
            <div className="divide-y divide-white/5">
              {monthGroups.map(group => (
                <div key={group.month}>
                  <div className="px-5 py-2.5 bg-white/[0.03] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#C8B89A]">{group.label}</span>
                    <div className="flex items-center gap-5 text-xs">
                      <span className="text-emerald-400">+{fmt(group.totalIn, currency)}</span>
                      <span className="text-red-400">−{fmt(group.totalOut, currency)}</span>
                      <span className="text-white/50">Balance: <span className="text-white font-medium">{fmt(group.closingBalance, currency)}</span></span>
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      {group.entries.map((entry, idx) => {
                        const isDebit = parseFloat(entry.debit) > 0;
                        const isCredit = parseFloat(entry.credit) > 0;
                        const bal = parseFloat(entry.runningBalance);
                        const isLow = bal < parseFloat(selectedAccount!.openingBalance) * 0.2;
                        const isOpening = entry.category === 'Opening Balance';
                        const isFundAdd = entry.category === 'Fund Addition';
                        return (
                          <tr key={entry.id}
                            className={`border-b border-white/5 transition-colors hover:bg-white/5 ${
                              isOpening ? 'bg-[#C8B89A]/5' : isFundAdd ? 'bg-emerald-900/10' : idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.015]'
                            }`}>
                            <td className="px-4 py-2 text-xs text-white/50 whitespace-nowrap w-28">{entry.entryDate}</td>
                            <td className="px-4 py-2 text-xs max-w-[200px]">
                              <div className={`truncate ${isOpening ? 'text-[#C8B89A]/80 font-medium' : isFundAdd ? 'text-emerald-300/80 font-medium' : 'text-white/80'}`}>
                                {entry.description}
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${
                                isOpening ? 'bg-[#C8B89A]/10 text-[#C8B89A]/60' : isFundAdd ? 'bg-emerald-500/10 text-emerald-400/60' : 'bg-white/5 text-white/40'
                              }`}>{entry.category}</span>
                            </td>
                            <td className="px-4 py-2 text-xs text-white/30 whitespace-nowrap">{entry.reference || '—'}</td>
                            <td className="px-4 py-2 text-right text-xs whitespace-nowrap">
                              {isDebit ? <span className="text-emerald-400 font-medium">{fmt(entry.debit, currency)}</span> : <span className="text-white/20">—</span>}
                            </td>
                            <td className="px-4 py-2 text-right text-xs whitespace-nowrap">
                              {isCredit ? <span className="text-red-400 font-medium">{fmt(entry.credit, currency)}</span> : <span className="text-white/20">—</span>}
                            </td>
                            <td className="px-4 py-2 text-right text-xs whitespace-nowrap">
                              <span className={`font-semibold ${isLow ? 'text-amber-400' : 'text-[#C8B89A]'}`}>{fmt(entry.runningBalance, currency)}</span>
                            </td>
                            {!showArchived && (
                              <td className="px-4 py-2 w-10">
                                {!isOpening && (deleteConfirm === entry.id ? (
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => handleDeleteEntry(entry.id)} className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors whitespace-nowrap">Confirm</button>
                                    <button onClick={() => setDeleteConfirm(null)} className="text-white/30 hover:text-white"><X size={12} /></button>
                                  </div>
                                ) : (
                                  <button onClick={() => setDeleteConfirm(entry.id)} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                                ))}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
              <div className="px-5 py-3 bg-white/[0.02] flex items-center justify-between border-t border-white/10">
                <span className="text-[10px] tracking-widest uppercase text-white/30">Grand Total ({displayEntries.length} entries)</span>
                <div className="flex items-center gap-5 text-xs font-semibold">
                  <span className="text-emerald-400">+{fmt(displayEntries.reduce((s, e) => s + parseFloat(e.debit), 0), currency)}</span>
                  <span className="text-red-400">−{fmt(displayEntries.reduce((s, e) => s + parseFloat(e.credit), 0), currency)}</span>
                  <span className="text-[#C8B89A]">{displayEntries.length > 0 ? fmt(displayEntries[displayEntries.length - 1].runningBalance, currency) : '—'}</span>
                </div>
              </div>
            </div>
          ) : (
            /* ── Flat ledger view ── */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-2.5 text-[10px] tracking-widest uppercase text-white/30 whitespace-nowrap">Date</th>
                    <th className="text-left px-4 py-2.5 text-[10px] tracking-widest uppercase text-white/30">Description</th>
                    <th className="text-left px-4 py-2.5 text-[10px] tracking-widest uppercase text-white/30 whitespace-nowrap">Category</th>
                    <th className="text-left px-4 py-2.5 text-[10px] tracking-widest uppercase text-white/30 whitespace-nowrap">Ref #</th>
                    <th className="text-right px-4 py-2.5 text-[10px] tracking-widest uppercase text-emerald-400/60 whitespace-nowrap">Debit (In)</th>
                    <th className="text-right px-4 py-2.5 text-[10px] tracking-widest uppercase text-red-400/60 whitespace-nowrap">Credit (Out)</th>
                    <th className="text-right px-4 py-2.5 text-[10px] tracking-widest uppercase text-white/30 whitespace-nowrap">Balance</th>
                    {!showArchived && <th className="px-4 py-2.5 w-10" />}
                  </tr>
                </thead>
                <tbody>
                  {displayEntries.map((entry, idx) => {
                    const isDebit = parseFloat(entry.debit) > 0;
                    const isCredit = parseFloat(entry.credit) > 0;
                    const bal = parseFloat(entry.runningBalance);
                    const isLow = bal < parseFloat(selectedAccount!.openingBalance) * 0.2;
                    const isOpening = entry.category === 'Opening Balance';
                    const isFundAdd = entry.category === 'Fund Addition';
                    return (
                      <tr key={entry.id}
                        className={`border-b border-white/5 transition-colors hover:bg-white/5 ${
                          isOpening ? 'bg-[#C8B89A]/5' : isFundAdd ? 'bg-emerald-900/10' : idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.015]'
                        }`}>
                        <td className="px-4 py-2.5 text-xs text-white/50 whitespace-nowrap">{entry.entryDate}</td>
                        <td className="px-4 py-2.5 text-xs max-w-[220px]">
                          <div className={`truncate ${isOpening ? 'text-[#C8B89A]/80 font-medium' : isFundAdd ? 'text-emerald-300/80 font-medium' : 'text-white/80'}`}>
                            {entry.description}
                          </div>
                          {entry.archiveRef && (
                            <div className="text-[10px] text-amber-400/50 mt-0.5">Archive: {entry.archiveRef}</div>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${
                            isOpening ? 'bg-[#C8B89A]/10 text-[#C8B89A]/60' : isFundAdd ? 'bg-emerald-500/10 text-emerald-400/60' : 'bg-white/5 text-white/40'
                          }`}>{entry.category}</span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-white/30 whitespace-nowrap">{entry.reference || '—'}</td>
                        <td className="px-4 py-2.5 text-right text-xs whitespace-nowrap">
                          {isDebit ? <span className="text-emerald-400 font-medium">{fmt(entry.debit, currency)}</span> : <span className="text-white/20">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs whitespace-nowrap">
                          {isCredit ? <span className="text-red-400 font-medium">{fmt(entry.credit, currency)}</span> : <span className="text-white/20">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs whitespace-nowrap">
                          <span className={`font-semibold ${isLow ? 'text-amber-400' : 'text-[#C8B89A]'}`}>
                            {fmt(entry.runningBalance, currency)}
                          </span>
                        </td>
                        {!showArchived && (
                          <td className="px-4 py-2.5">
                            {!isOpening && (deleteConfirm === entry.id ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleDeleteEntry(entry.id)}
                                  className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors whitespace-nowrap">
                                  Confirm
                                </button>
                                <button onClick={() => setDeleteConfirm(null)} className="text-white/30 hover:text-white">
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteConfirm(entry.id)} className="text-white/20 hover:text-red-400 transition-colors">
                                <Trash2 size={13} />
                              </button>
                            ))}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/10 bg-white/[0.02]">
                    <td colSpan={4} className="px-4 py-2.5 text-[10px] tracking-widest uppercase text-white/30">
                      {showArchived ? 'Period Totals' : 'Active Totals'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs font-semibold text-emerald-400 whitespace-nowrap">
                      {fmt(displayEntries.reduce((s, e) => s + parseFloat(e.debit), 0), currency)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs font-semibold text-red-400 whitespace-nowrap">
                      {fmt(displayEntries.reduce((s, e) => s + parseFloat(e.credit), 0), currency)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs font-bold text-[#C8B89A] whitespace-nowrap">
                      {displayEntries.length > 0 ? fmt(displayEntries[displayEntries.length - 1].runningBalance, currency) : '—'}
                    </td>
                    {!showArchived && <td />}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showNewAccount && (
        <NewAccountModal onSave={handleCreateAccount} onClose={() => setShowNewAccount(false)} />
      )}
      {showAddFunds && selectedAccount && (
        <AddFundsModal account={selectedAccount} onSave={handlePostEntry} onClose={() => setShowAddFunds(false)} />
      )}
      {showRecordExpense && selectedAccount && (
        <RecordExpenseModal account={selectedAccount} onSave={handlePostEntry} onClose={() => setShowRecordExpense(false)} />
      )}
      {showArchiveModal && selectedAccount && (
        <ArchiveModal account={selectedAccount} onArchive={handleArchive} onClose={() => setShowArchiveModal(false)} />
      )}
    </div>
  );
}
