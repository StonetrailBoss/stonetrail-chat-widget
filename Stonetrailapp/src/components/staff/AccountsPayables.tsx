import { useState, useEffect, useRef } from 'react';
import {
  Plus, Pencil, Trash2, CheckCircle2, Circle, X, Upload,
  FileText, ExternalLink, ChevronDown, Loader2, AlertCircle,
  Banknote, Calendar, Tag, Building2, StickyNote, RefreshCw,
  Clock, XCircle, History, CreditCard, MoreVertical, Check,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Payable {
  id: number;
  vendor: string;
  description: string | null;
  amount: string;
  amountPaid: string;
  billDate: string | null;
  dueDate: string;
  datePaid: string | null;
  category: string;
  status: string; // unpaid | paid | overdue | void
  reconciled: number;
  bankTransactionId: string | null;
  bankTransactionDate: string | null;
  bankTransactionNote: string | null;
  receiptFilename: string | null;
  receiptUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Late payment helpers ─────────────────────────────────────────────────────

/** Returns number of days the payment was late (positive = late, 0 = on time, negative = early) */
function daysLate(dueDate: string, datePaid: string | null): number | null {
  if (!datePaid) return null;
  const due  = new Date(dueDate);
  const paid = new Date(datePaid);
  if (isNaN(due.getTime()) || isNaN(paid.getTime())) return null;
  // Strip time component — compare calendar dates only
  due.setUTCHours(0, 0, 0, 0);
  paid.setUTCHours(0, 0, 0, 0);
  return Math.round((paid.getTime() - due.getTime()) / 86_400_000);
}

/** Returns how many days past due an unpaid/overdue item is (relative to today) */
function daysPastDue(dueDate: string): number {
  const due   = new Date(dueDate);
  const today = new Date();
  due.setUTCHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - due.getTime()) / 86_400_000);
}

const CATEGORIES = [
  'General', 'Utilities', 'Maintenance', 'Supplies', 'Payroll',
  'Insurance', 'Rent / Lease', 'Food & Beverage', 'Marketing',
  'Professional Services', 'Equipment', 'Travel', 'Other',
];

const STATUS_COLORS: Record<string, string> = {
  unpaid:  'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  paid:    'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  overdue: 'bg-red-500/15 text-red-300 border-red-500/30',
  void:    'bg-white/10 text-white/40 border-white/20',
};

function fmt(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function fmtAmt(val: string | number | null | undefined) {
  const n = parseFloat(String(val ?? 0));
  return isFinite(n) ? `EC$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'EC$0.00';
}

// ─── Empty form state ─────────────────────────────────────────────────────────

function emptyForm() {
  return {
    vendor: '',
    description: '',
    amount: '',
    amountPaid: '',
    billDate: '',
    dueDate: '',
    datePaid: '',
    category: 'General',
    status: 'unpaid',
    notes: '',
  };
}

// ─── Reconcile Modal ──────────────────────────────────────────────────────────

interface ReconcileModalProps {
  payable: Payable;
  onClose: () => void;
  onSave: (data: { reconciled: boolean; bankTransactionId: string; bankTransactionDate: string; bankTransactionNote: string }) => Promise<void>;
}

function ReconcileModal({ payable, onClose, onSave }: ReconcileModalProps) {
  const [reconciled, setReconciled] = useState(!!payable.reconciled);
  const [txId, setTxId] = useState(payable.bankTransactionId ?? '');
  const [txDate, setTxDate] = useState(payable.bankTransactionDate ? payable.bankTransactionDate.slice(0, 10) : '');
  const [txNote, setTxNote] = useState(payable.bankTransactionNote ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ reconciled, bankTransactionId: txId, bankTransactionDate: txDate, bankTransactionNote: txNote });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1A2E28] border border-white/10 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Bank Reconciliation
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-[#111E1A] rounded-lg p-3 text-sm">
            <p className="text-white/50 text-xs mb-1">Payable</p>
            <p className="text-white font-medium">{payable.vendor}</p>
            <p className="text-[#C8B89A]">{fmtAmt(payable.amount)} · Due {fmt(payable.dueDate)}</p>
          </div>

          {/* Reconciled toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-white/70">Mark as reconciled with bank</label>
            <button
              onClick={() => setReconciled(!reconciled)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                reconciled
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-white/5 border-white/15 text-white/50'
              }`}
            >
              {reconciled ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              {reconciled ? 'Reconciled' : 'Not reconciled'}
            </button>
          </div>

          {/* Bank transaction fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-white/50 mb-1">Bank Transaction ID / Reference</label>
              <input
                value={txId}
                onChange={e => setTxId(e.target.value)}
                placeholder="e.g. TXN-20240115-001"
                className="w-full bg-[#111E1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C8B89A]/50"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Transaction Date</label>
              <input
                type="date"
                value={txDate}
                onChange={e => setTxDate(e.target.value)}
                className="w-full bg-[#111E1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Bank Statement Note / Memo</label>
              <textarea
                value={txNote}
                onChange={e => setTxNote(e.target.value)}
                rows={2}
                placeholder="As it appears on the bank statement…"
                className="w-full bg-[#111E1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C8B89A]/50 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-white/10">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-white/15 text-white/60 text-sm hover:text-white hover:border-white/30 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-[#2C4A3E] text-white text-sm font-medium hover:bg-[#3a5f50] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Payment history types ────────────────────────────────────────────────────

interface PaymentRecord {
  id: number;
  payableId: number;
  amount: string;
  datePaid: string;
  method: string | null;
  reference: string | null;
  notes: string | null;
  receiptFilename: string | null;
  receiptUrl: string | null;
  createdAt: string;
}

// ─── Payment History Modal ────────────────────────────────────────────────────

interface PaymentHistoryModalProps {
  payable: Payable;
  onClose: () => void;
  onAddPayment: () => void;
}

const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'Cheque', 'Credit Card', 'Online', 'Other'];

interface EditDraft {
  amount: string;
  datePaid: string;
  method: string;
  reference: string;
  notes: string;
}

function PaymentHistoryModal({ payable, onClose, onAddPayment }: PaymentHistoryModalProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<EditDraft>({ amount: '', datePaid: '', method: '', reference: '', notes: '' });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [rowError, setRowError] = useState('');

  function loadPayments() {
    setLoading(true);
    fetch(`/api/payables/${payable.id}/payments`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setPayments(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { loadPayments(); }, [payable.id]);

  const totalPaid = payments.reduce((s, p) => s + parseFloat(String(p.amount)), 0);
  const balance = Math.max(0, parseFloat(payable.amount) - totalPaid);

  function startEdit(p: PaymentRecord) {
    setEditingId(p.id);
    setRowError('');
    setReceiptFile(null);
    setConfirmDeleteId(null);
    setDraft({
      amount: parseFloat(String(p.amount)).toFixed(2),
      datePaid: p.datePaid,
      method: p.method ?? '',
      reference: p.reference ?? '',
      notes: p.notes ?? '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setRowError('');
    setReceiptFile(null);
  }

  // Upload a receipt for a specific payment row
  async function uploadPaymentReceipt(paymentId: number, file: File) {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const res = await fetch(`/api/payables/${payable.id}/payments/${paymentId}/receipt`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, data: base64, mimeType: file.type }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? 'Receipt upload failed');
    }
  }

  async function saveEdit(p: PaymentRecord) {
    if (!draft.amount || isNaN(parseFloat(draft.amount)) || parseFloat(draft.amount) <= 0) {
      return setRowError('Enter a valid amount');
    }
    if (!draft.datePaid) return setRowError('Date paid is required');
    setRowError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/payables/${payable.id}/payments/${p.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: draft.amount,
          datePaid: draft.datePaid,
          method: draft.method || null,
          reference: draft.reference || null,
          notes: draft.notes || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save');
      // Upload receipt after the row is saved
      if (receiptFile) await uploadPaymentReceipt(p.id, receiptFile);
      setEditingId(null);
      setReceiptFile(null);
      loadPayments();
    } catch (err) {
      setRowError(String(err));
    } finally {
      setSaving(false);
    }
  }

  async function deletePayment(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/payables/${payable.id}/payments/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to delete');
      setConfirmDeleteId(null);
      setEditingId(null);
      loadPayments();
    } catch (err) {
      setRowError(String(err));
    } finally {
      setDeletingId(null);
    }
  }

  // Shared styles for edit-mode fields — use CSS vars to stay within the dark palette
  const editFieldCls = 'w-full border border-white/15 rounded-md px-2 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/40';
  const editFieldStyle: React.CSSProperties = { background: 'hsl(var(--chart-4))' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1A2E28] border border-white/10 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h3 className="text-white font-semibold flex items-center gap-2">
              <History className="w-4 h-4 text-[#C8B89A]" /> Payment History
            </h3>
            <p className="text-white/40 text-xs mt-0.5">{payable.vendor} · {fmtAmt(payable.amount)} due</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-px bg-white/5 border-b border-white/10">
          {[
            { label: 'Total Due', value: fmtAmt(payable.amount), color: 'text-[#C8B89A]' },
            { label: 'Total Paid', value: fmtAmt(totalPaid), color: 'text-emerald-300' },
            { label: 'Balance', value: fmtAmt(balance), color: balance > 0.005 ? 'text-yellow-300' : 'text-emerald-300' },
          ].map(s => (
            <div key={s.label} className="bg-[#111E1A] px-4 py-3 text-center">
              <p className="text-[9px] text-white/35 uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Payment rows */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-white/40">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-10 text-white/30 text-sm">No payments recorded yet.</div>
          ) : (
            <div className="space-y-2">
              {payments.map(p => {
                const isEditing = editingId === p.id;
                const isConfirmingDelete = confirmDeleteId === p.id;

                return (
                  <div
                    key={p.id}
                    className="border rounded-lg transition-colors"
                    style={{
                      background: isEditing ? 'hsl(var(--chart-4))' : 'hsl(var(--secondary))',
                      borderColor: isEditing ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    {isEditing ? (
                      /* ── Edit mode ── */
                      <div className="px-4 py-3 space-y-3">
                        {rowError && (
                          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-300 text-xs">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{rowError}
                          </div>
                        )}

                        {/* Amount + Date */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-white/40 mb-1">Amount (EC$) <span className="text-red-400">*</span></label>
                            <div className="relative">
                              <Banknote className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
                              <input
                                type="number" step="0.01" min="0.01"
                                value={draft.amount}
                                onChange={e => setDraft(d => ({ ...d, amount: e.target.value }))}
                                className={`${editFieldCls} pl-7`}
                                style={editFieldStyle}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] text-white/40 mb-1">Date Paid <span className="text-red-400">*</span></label>
                            <div className="relative">
                              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 pointer-events-none" />
                              <input
                                type="date"
                                value={draft.datePaid}
                                onChange={e => setDraft(d => ({ ...d, datePaid: e.target.value }))}
                                className={`${editFieldCls} pl-7`}
                                style={editFieldStyle}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Method + Reference */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-white/40 mb-1">Method</label>
                            <div className="relative">
                              <select
                                value={draft.method}
                                onChange={e => setDraft(d => ({ ...d, method: e.target.value }))}
                                className={`${editFieldCls} appearance-none pr-7`}
                                style={editFieldStyle}
                              >
                                <option value="">— Select —</option>
                                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 pointer-events-none" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] text-white/40 mb-1">Reference / Cheque #</label>
                            <input
                              value={draft.reference}
                              onChange={e => setDraft(d => ({ ...d, reference: e.target.value }))}
                              placeholder="e.g. CHQ-1042"
                              className={editFieldCls}
                              style={editFieldStyle}
                            />
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="block text-[10px] text-white/40 mb-1">Notes</label>
                          <textarea
                            value={draft.notes}
                            onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
                            rows={2}
                            placeholder="Optional notes…"
                            className={`${editFieldCls} resize-none`}
                            style={editFieldStyle}
                          />
                        </div>

                        {/* Receipt upload */}
                        <div>
                          <label className="block text-[10px] text-white/40 mb-1">Receipt / Payment Proof</label>
                          <label
                            className="flex items-center gap-2 w-full border border-dashed border-white/15 rounded-md px-3 py-2 cursor-pointer hover:border-white/30 transition-colors"
                            style={editFieldStyle}
                          >
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,application/pdf"
                              className="sr-only"
                              onChange={e => setReceiptFile(e.target.files?.[0] ?? null)}
                            />
                            {receiptFile ? (
                              <>
                                <FileText className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                <span className="text-xs text-white/70 flex-1 truncate">{receiptFile.name}</span>
                                <button
                                  type="button"
                                  onClick={e => { e.preventDefault(); setReceiptFile(null); }}
                                  className="text-white/30 hover:text-white transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : p.receiptFilename ? (
                              <>
                                <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'hsl(var(--accent))' }} />
                                <span className="text-xs text-white/50 flex-1 truncate">{p.receiptFilename}</span>
                                <span className="text-[10px] text-white/30">Replace</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                                <span className="text-xs text-white/30">Upload receipt, cheque, or PDF</span>
                              </>
                            )}
                          </label>
                        </div>

                        {/* Action row */}
                        <div className="flex items-center gap-2 pt-1">
                          {/* Delete side */}
                          {isConfirmingDelete ? (
                            <div className="flex items-center gap-2 mr-auto">
                              <span className="text-xs text-red-300">Delete this payment?</span>
                              <button
                                onClick={() => deletePayment(p.id)}
                                disabled={deletingId === p.id}
                                className="px-2.5 py-1 rounded bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                              >
                                {deletingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                Yes, delete
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2.5 py-1 rounded border border-white/15 text-white/50 text-xs hover:text-white transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(p.id)}
                              className="mr-auto flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          )}

                          {/* Save / Cancel */}
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1.5 rounded-md border border-white/15 text-white/50 text-xs hover:text-white hover:border-white/30 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveEdit(p)}
                            disabled={saving}
                            className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 hover:bg-primary/90"
                          >
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── Read mode ── */
                      <div className="flex items-start justify-between gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-semibold text-emerald-300">{fmtAmt(p.amount)}</span>
                            <span className="text-white/40 text-xs">{fmt(p.datePaid)}</span>
                            {p.method && (
                              <span className="text-[10px] bg-white/8 text-white/50 px-2 py-0.5 rounded">{p.method}</span>
                            )}
                          </div>
                          {p.reference && <p className="text-white/40 text-xs mt-1">Ref: {p.reference}</p>}
                          {p.notes && <p className="text-white/35 text-xs mt-0.5 italic">{p.notes}</p>}
                          {p.receiptUrl && (
                            <a
                              href={p.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-white/70 transition-colors mt-1"
                            >
                              <FileText className="w-3 h-3" />
                              {p.receiptFilename ?? 'View receipt'}
                            </a>
                          )}
                        </div>
                        <button
                          onClick={() => startEdit(p)}
                          className="flex-shrink-0 p-1.5 rounded-md text-white/30 hover:text-accent hover:bg-white/5 transition-colors"
                          title="Edit payment"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-white/10">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-white/15 text-white/60 text-sm hover:text-white hover:border-white/30 transition-colors">
            Close
          </button>
          <button
            onClick={onAddPayment}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" /> Add Payment
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Partial Payment Modal ────────────────────────────────────────────────────

interface PartialPaymentModalProps {
  payable: Payable;
  onClose: () => void;
  onSaved: () => void;
}

function PartialPaymentModal({ payable, onClose, onSaved }: PartialPaymentModalProps) {
  const balance = Math.max(0, parseFloat(payable.amount) - parseFloat(payable.amountPaid ?? '0'));
  const [amount, setAmount] = useState(balance > 0 ? balance.toFixed(2) : '');
  const [datePaid, setDatePaid] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) return setError('Enter a valid amount');
    if (!datePaid) return setError('Date paid is required');
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/payables/${payable.id}/payments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, datePaid, method: method || null, reference: reference || null, notes: notes || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
      onSaved();
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1A2E28] border border-white/10 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#C8B89A]" /> Record Payment
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Payable summary */}
          <div className="bg-[#111E1A] rounded-lg p-3 text-sm">
            <p className="text-white font-medium">{payable.vendor}</p>
            <div className="flex gap-4 mt-1 text-xs">
              <span className="text-white/40">Due: <span className="text-[#C8B89A]">{fmtAmt(payable.amount)}</span></span>
              <span className="text-white/40">Paid: <span className="text-emerald-300">{fmtAmt(payable.amountPaid)}</span></span>
              <span className="text-white/40">Balance: <span className="text-yellow-300">{fmtAmt(balance)}</span></span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1">Amount (EC$) <span className="text-red-400">*</span></label>
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input
                  type="number" step="0.01" min="0.01"
                  value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full bg-[#111E1A] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C8B89A]/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Date Paid <span className="text-red-400">*</span></label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                <input
                  type="date" value={datePaid} onChange={e => setDatePaid(e.target.value)}
                  className="w-full bg-[#111E1A] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50"
                />
              </div>
            </div>
          </div>

          {/* Method + Reference */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1">Payment Method</label>
              <div className="relative">
                <select
                  value={method} onChange={e => setMethod(e.target.value)}
                  className="w-full appearance-none bg-[#111E1A] border border-white/10 rounded-lg px-3 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50"
                >
                  <option value="">— Select —</option>
                  {['Bank Transfer', 'Cash', 'Cheque', 'Credit Card', 'Online', 'Other'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Reference / Cheque #</label>
              <input
                value={reference} onChange={e => setReference(e.target.value)}
                placeholder="e.g. CHQ-1042"
                className="w-full bg-[#111E1A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C8B89A]/50"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-white/50 mb-1">Notes</label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              rows={2} placeholder="Optional notes…"
              className="w-full bg-[#111E1A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C8B89A]/50 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-white/15 text-white/60 text-sm hover:text-white hover:border-white/30 transition-colors">
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg bg-[#2C4A3E] text-white text-sm font-medium hover:bg-[#3a5f50] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

interface PayableFormModalProps {
  initial?: Payable | null;
  onClose: () => void;
  onSave: (data: ReturnType<typeof emptyForm>, receiptFile?: File | null) => Promise<void>;
  onAddPayment?: () => void;
}

function PayableFormModal({ initial, onClose, onSave, onAddPayment }: PayableFormModalProps) {
  const [form, setForm] = useState(() => initial ? {
    vendor: initial.vendor,
    description: initial.description ?? '',
    amount: initial.amount,
    amountPaid: initial.amountPaid ?? '',
    billDate: initial.billDate ? initial.billDate.slice(0, 10) : '',
    dueDate: initial.dueDate ? initial.dueDate.slice(0, 10) : '',
    datePaid: initial.datePaid ? initial.datePaid.slice(0, 10) : '',
    category: initial.category,
    status: initial.status,
    notes: initial.notes ?? '',
  } : emptyForm());

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vendor.trim()) return setError('Vendor is required');
    if (!form.amount || isNaN(parseFloat(form.amount))) return setError('Valid amount is required');
    if (!form.dueDate) return setError('Due date is required');
    setError('');
    setSaving(true);
    try {
      await onSave(form, receiptFile);
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1A2E28] border border-white/10 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#1A2E28] z-10">
          <h3 className="text-white font-semibold">{initial ? 'Edit Payable' : 'Add Payable'}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <form id="payable-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          {/* Vendor */}
          <div>
            <label className="block text-xs text-white/50 mb-1">Vendor / Payee <span className="text-red-400">*</span></label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                value={form.vendor}
                onChange={e => set('vendor', e.target.value)}
                placeholder="e.g. VINLEC, Flow, Supplier Name"
                className="w-full bg-[#111E1A] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C8B89A]/50"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-white/50 mb-1">Description</label>
            <input
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Brief description of what this is for"
              className="w-full bg-[#111E1A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C8B89A]/50"
            />
          </div>

          {/* Amount + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1">Amount Due (EC$) <span className="text-red-400">*</span></label>
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={e => set('amount', e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#111E1A] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C8B89A]/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Category</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                <select
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  className="w-full appearance-none bg-[#111E1A] border border-white/10 rounded-lg pl-9 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Amount Paid + Balance */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1">Amount Paid (EC$)</label>
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500/50" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amountPaid}
                  onChange={e => set('amountPaid', e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#111E1A] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/40"
                />
              </div>
            </div>
            <div className="flex flex-col justify-end">
              {(() => {
                const due  = parseFloat(form.amount  || '0');
                const paid = parseFloat(form.amountPaid || '0');
                const bal  = due - paid;
                if (!form.amount) return null;
                return (
                  <div className={`rounded-lg px-3 py-2.5 border text-sm ${bal <= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'}`}>
                    <p className="text-[10px] text-white/40 mb-0.5">Balance Due</p>
                    <p className="font-semibold font-mono">{fmtAmt(Math.max(0, bal))}</p>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Bill Date + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1">Bill Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                <input
                  type="date"
                  value={form.billDate}
                  onChange={e => set('billDate', e.target.value)}
                  className="w-full bg-[#111E1A] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Due Date <span className="text-red-400">*</span></label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => set('dueDate', e.target.value)}
                  className="w-full bg-[#111E1A] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs text-white/50 mb-1">Status</label>
            <div className="relative">
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className="w-full appearance-none bg-[#111E1A] border border-white/10 rounded-lg px-3 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50"
              >
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="void">Void</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            </div>
          </div>

          {/* Date Paid */}
          <div>
            <label className="block text-xs text-white/50 mb-1">Date Paid</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
              <input
                type="date"
                value={form.datePaid}
                onChange={e => set('datePaid', e.target.value)}
                className="w-full bg-[#111E1A] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-white/50 mb-1">Notes</label>
            <div className="relative">
              <StickyNote className="absolute left-3 top-3 w-3.5 h-3.5 text-white/30" />
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                rows={2}
                placeholder="Any additional notes…"
                className="w-full bg-[#111E1A] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C8B89A]/50 resize-none"
              />
            </div>
          </div>

          {/* Receipt upload */}
          <div>
            <label className="block text-xs text-white/50 mb-1">Receipt / Payment Proof</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={e => setReceiptFile(e.target.files?.[0] ?? null)}
            />
            {receiptFile ? (
              <div className="flex items-center gap-2 bg-[#111E1A] border border-white/10 rounded-lg px-3 py-2.5">
                <FileText className="w-4 h-4 text-[#C8B89A]" />
                <span className="text-sm text-white/70 flex-1 truncate">{receiptFile.name}</span>
                <button type="button" onClick={() => setReceiptFile(null)} className="text-white/30 hover:text-white transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : initial?.receiptFilename ? (
              <div className="flex items-center gap-2 bg-[#111E1A] border border-white/10 rounded-lg px-3 py-2.5">
                <FileText className="w-4 h-4 text-[#C8B89A]" />
                <span className="text-sm text-white/70 flex-1 truncate">{initial.receiptFilename}</span>
                <a href={initial.receiptUrl ?? '#'} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-[#C8B89A] transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-white/40 hover:text-white transition-colors ml-1">Replace</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 bg-[#111E1A] border border-dashed border-white/15 rounded-lg px-3 py-3 text-sm text-white/40 hover:text-white/70 hover:border-white/30 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload receipt, check, or PDF
              </button>
            )}
          </div>
        </form>

        <div className="flex gap-3 px-6 py-4 border-t border-white/10 sticky bottom-0 bg-[#1A2E28]">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-white/15 text-white/60 text-sm hover:text-white hover:border-white/30 transition-colors">
            Cancel
          </button>
          {initial && onAddPayment && (() => {
            const balance = Math.max(0, parseFloat(initial.amount) - parseFloat(initial.amountPaid ?? '0'));
            return balance > 0 ? (
              <button
                type="button"
                onClick={() => { onClose(); onAddPayment(); }}
                className="flex-1 px-4 py-2 rounded-lg bg-[#3a3010] border border-yellow-500/30 text-yellow-300 text-sm font-medium hover:bg-[#4a3f10] transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Add Payment
              </button>
            ) : null;
          })()}
          <button
            type="submit"
            form="payable-form"
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-[#2C4A3E] text-white text-sm font-medium hover:bg-[#3a5f50] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {initial ? 'Save Changes' : 'Add Payable'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AccountsPayables() {
  const [payables, setPayables] = useState<Payable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Payable | null>(null);
  const [reconcileTarget, setReconcileTarget] = useState<Payable | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Payable | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<Payable | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payables');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setPayables(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Upload receipt helper
  async function uploadReceipt(id: number, file: File) {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const res = await fetch(`/api/payables/${id}/receipt`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, data: base64, mimeType: file.type }),
    });
    if (!res.ok) throw new Error('Receipt upload failed');
  }

  async function handleSave(form: ReturnType<typeof emptyForm>, receiptFile?: File | null) {
    const body = {
      vendor: form.vendor,
      description: form.description || null,
      amount: form.amount,
      amountPaid: form.amountPaid || '0',
      billDate: form.billDate || null,
      dueDate: form.dueDate,
      datePaid: form.datePaid || null,
      category: form.category,
      status: form.status,
      notes: form.notes || null,
    };

    if (editTarget) {
      const res = await fetch(`/api/payables/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to update');
      if (receiptFile) await uploadReceipt(editTarget.id, receiptFile);
    } else {
      const res = await fetch('/api/payables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to create');
      const created = await res.json();
      if (receiptFile && created?.id) await uploadReceipt(created.id, receiptFile);
    }
    await load();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/payables/${id}`, { method: 'DELETE' });
    setDeleteConfirm(null);
    await load();
  }

  async function handleReconcile(data: { reconciled: boolean; bankTransactionId: string; bankTransactionDate: string; bankTransactionNote: string }) {
    if (!reconcileTarget) return;
    const res = await fetch(`/api/payables/${reconcileTarget.id}/reconcile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to reconcile');
    await load();
  }

  // Filtered list
  const filtered = payables.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterCategory !== 'all' && p.category !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.vendor.toLowerCase().includes(q) && !(p.description ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Summary stats
  const totalUnpaid = payables.filter(p => p.status === 'unpaid').reduce((s, p) => s + parseFloat(p.amount), 0);
  const totalPaid = payables.filter(p => p.status === 'paid').reduce((s, p) => s + parseFloat(p.amount), 0);
  const totalOverdue = payables.filter(p => p.status === 'overdue').reduce((s, p) => s + parseFloat(p.amount), 0);
  const unreconciledCount = payables.filter(p => !p.reconciled && p.status === 'paid').length;
  // Balance due = sum of (amount - amountPaid) for all non-void items
  const totalBalanceDue = payables
    .filter(p => p.status !== 'void' && p.status !== 'paid')
    .reduce((s, p) => s + Math.max(0, parseFloat(p.amount) - parseFloat(p.amountPaid ?? '0')), 0);

  const usedCategories = Array.from(new Set(payables.map(p => p.category)));

  return (
    <div className="space-y-5">

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Unpaid',      value: fmtAmt(totalUnpaid),      color: 'text-yellow-300',  bg: 'bg-yellow-500/10 border-yellow-500/20' },
          { label: 'Paid',        value: fmtAmt(totalPaid),        color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Overdue',     value: fmtAmt(totalOverdue),     color: 'text-red-300',     bg: 'bg-red-500/10 border-red-500/20' },
          { label: 'Balance Due', value: fmtAmt(totalBalanceDue),  color: 'text-[#C8B89A]',   bg: 'bg-[#C8B89A]/10 border-[#C8B89A]/20' },
        ].map(card => (
          <div key={card.label} className={`rounded-lg border px-4 py-3 ${card.bg}`}>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">{card.label}</p>
            <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
        {unreconciledCount > 0 && (
          <div className="col-span-2 lg:col-span-4 flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg px-4 py-2 text-orange-300 text-sm">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span><strong>{unreconciledCount}</strong> paid {unreconciledCount === 1 ? 'item has' : 'items have'} not been reconciled with the bank account.</span>
          </div>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search vendor…"
              className="bg-[#111E1A] border border-white/10 rounded-lg pl-3 pr-8 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C8B89A]/50 w-44"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="appearance-none bg-[#111E1A] border border-white/10 rounded-lg pl-3 pr-7 py-2 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50"
            >
              <option value="all">All Statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="void">Void</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>

          {/* Category filter */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="appearance-none bg-[#111E1A] border border-white/10 rounded-lg pl-3 pr-7 py-2 text-sm text-white focus:outline-none focus:border-[#C8B89A]/50"
            >
              <option value="all">All Categories</option>
              {usedCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>

          <button onClick={load} className="p-2 text-white/40 hover:text-white transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => { setEditTarget(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#2C4A3E] text-white text-sm font-medium rounded-lg hover:bg-[#3a5f50] transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Payable
        </button>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/40">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-sm">
          {payables.length === 0 ? 'No payables yet. Click "Add Payable" to get started.' : 'No results match your filters.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-[#111E1A]">
                <th className="text-left px-4 py-3 text-[10px] text-white/40 uppercase tracking-widest font-medium">Vendor</th>
                <th className="text-left px-4 py-3 text-[10px] text-white/40 uppercase tracking-widest font-medium">Category</th>
                <th className="text-right px-4 py-3 text-[10px] text-white/40 uppercase tracking-widest font-medium">Amount / Paid</th>
                <th className="text-left px-4 py-3 text-[10px] text-white/40 uppercase tracking-widest font-medium">Bill Date</th>
                <th className="text-left px-4 py-3 text-[10px] text-white/40 uppercase tracking-widest font-medium">Due Date</th>
                <th className="text-left px-4 py-3 text-[10px] text-white/40 uppercase tracking-widest font-medium">Date Paid</th>
                <th className="text-left px-4 py-3 text-[10px] text-white/40 uppercase tracking-widest font-medium">Status</th>
                <th className="text-center px-4 py-3 text-[10px] text-white/40 uppercase tracking-widest font-medium">Reconciled</th>
                <th className="text-left px-4 py-3 text-[10px] text-white/40 uppercase tracking-widest font-medium">Receipt</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr
                  key={p.id}
                  className={`border-b border-white/6 transition-colors hover:bg-white/3 ${i % 2 === 0 ? '' : 'bg-white/[0.015]'}`}
                >
                  {/* Vendor + description */}
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{p.vendor}</p>
                    {p.description && <p className="text-white/40 text-xs mt-0.5 truncate max-w-[180px]">{p.description}</p>}
                    {p.notes && <p className="text-white/30 text-xs mt-0.5 italic truncate max-w-[180px]">{p.notes}</p>}
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 text-white/55 whitespace-nowrap">{p.category}</td>

                  {/* Amount */}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <p className="font-mono text-[#C8B89A] font-semibold">{fmtAmt(p.amount)}</p>
                    {(() => {
                      const due  = parseFloat(p.amount);
                      const paid = parseFloat(p.amountPaid ?? '0');
                      const bal  = due - paid;
                      if (paid <= 0) return null;
                      return (
                        <div className="mt-0.5 text-right">
                          <span className="text-[10px] text-emerald-400">Paid {fmtAmt(paid)}</span>
                          {bal > 0.005 && <span className="ml-1 text-[10px] text-yellow-300">· Bal {fmtAmt(bal)}</span>}
                        </div>
                      );
                    })()}
                  </td>

                  {/* Bill date */}
                  <td className="px-4 py-3 text-white/55 whitespace-nowrap">{fmt(p.billDate)}</td>

                  {/* Due date */}
                  <td className="px-4 py-3 text-white/55 whitespace-nowrap">{fmt(p.dueDate)}</td>

                  {/* Date paid */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-white/55">{fmt(p.datePaid)}</p>
                    {(() => {
                      const late = daysLate(p.dueDate, p.datePaid);
                      if (late === null) {
                        // Not yet paid — show days past due if overdue
                        if (p.status === 'void') return null;
                        const past = daysPastDue(p.dueDate);
                        if (past > 0) {
                          return (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-red-300 mt-0.5">
                              <Clock className="w-3 h-3" />{past}d past due
                            </span>
                          );
                        }
                        return null;
                      }
                      if (late > 0) {
                        return (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-orange-300 mt-0.5">
                            <Clock className="w-3 h-3" />{late}d late
                          </span>
                        );
                      }
                      if (late === 0) {
                        return <span className="text-[10px] text-emerald-400 mt-0.5 block">On time</span>;
                      }
                      return (
                        <span className="text-[10px] text-emerald-400 mt-0.5 block">{Math.abs(late)}d early</span>
                      );
                    })()}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-medium uppercase tracking-wide ${STATUS_COLORS[p.status] ?? STATUS_COLORS.unpaid}`}>
                      {p.status}
                    </span>
                  </td>

                  {/* Reconciled */}
                  <td className="px-4 py-3 text-center">
                    {p.reconciled ? (
                      <div className="flex flex-col items-center gap-0.5" title={`Reconciled${p.bankTransactionId ? ` · ${p.bankTransactionId}` : ''}`}>
                        <XCircle className="w-5 h-5 text-white/25" />
                        {p.bankTransactionId && (
                          <p className="text-[9px] text-white/25 truncate max-w-[80px]">{p.bankTransactionId}</p>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setReconcileTarget(p)}
                        title="Not reconciled — click to reconcile"
                        className="text-white/20 hover:text-white/50 transition-colors"
                      >
                        <Circle className="w-5 h-5" />
                      </button>
                    )}
                  </td>

                  {/* Receipt */}
                  <td className="px-4 py-3">
                    {p.receiptUrl ? (
                      <a
                        href={p.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[#C8B89A] hover:text-white transition-colors text-xs"
                        title={p.receiptFilename ?? 'View receipt'}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[80px]">{p.receiptFilename ?? 'View'}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    ) : (
                      <span className="text-white/20 text-xs">—</span>
                    )}
                  </td>

                  {/* Actions dropdown */}
                  <td className="px-4 py-3">
                    <div className="relative flex justify-end">
                      <button
                        onClick={() => setOpenMenu(openMenu === p.id ? null : p.id)}
                        className="p-1.5 text-white/30 hover:text-white transition-colors rounded"
                        title="Actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenu === p.id && (
                        <div className="absolute right-0 top-8 z-20 bg-[#1A2E28] border border-white/15 rounded-xl shadow-2xl w-48 py-1 text-sm">
                          <button
                            onClick={() => { setOpenMenu(null); setEditTarget(p); setShowForm(true); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => { setOpenMenu(null); setPaymentTarget(p); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Add Payment
                          </button>
                          <button
                            onClick={() => { setOpenMenu(null); setHistoryTarget(p); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <History className="w-3.5 h-3.5" /> Payment History
                          </button>
                          <button
                            onClick={() => { setOpenMenu(null); setReconcileTarget(p); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Reconcile
                          </button>
                          <div className="border-t border-white/8 my-1" />
                          {deleteConfirm === p.id ? (
                            <div className="px-4 py-2">
                              <p className="text-xs text-white/50 mb-2">Confirm delete?</p>
                              <div className="flex gap-2">
                                <button onClick={() => handleDelete(p.id)} className="flex-1 px-2 py-1 text-xs bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 transition-colors">Delete</button>
                                <button onClick={() => { setDeleteConfirm(null); setOpenMenu(null); }} className="flex-1 px-2 py-1 text-xs text-white/40 hover:text-white transition-colors">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(p.id)}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-400/70 hover:text-red-300 hover:bg-red-500/5 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modals ── */}
      {showForm && (
        <PayableFormModal
          initial={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSave={handleSave}
          onAddPayment={editTarget ? () => {
            const target = editTarget;
            setShowForm(false);
            setEditTarget(null);
            setPaymentTarget(target);
          } : undefined}
        />
      )}
      {reconcileTarget && (
        <ReconcileModal
          payable={reconcileTarget}
          onClose={() => setReconcileTarget(null)}
          onSave={handleReconcile}
        />
      )}
      {historyTarget && (
        <PaymentHistoryModal
          payable={historyTarget}
          onClose={() => setHistoryTarget(null)}
          onAddPayment={() => {
            // Keep a reference before clearing historyTarget
            const target = historyTarget;
            setHistoryTarget(null);
            setPaymentTarget(target);
          }}
        />
      )}
      {paymentTarget && (
        <PartialPaymentModal
          payable={paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onSaved={load}
        />
      )}
      {/* Close dropdown on outside click */}
      {openMenu !== null && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
      )}
    </div>
  );
}
