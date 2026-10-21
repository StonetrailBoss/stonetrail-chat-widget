import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { useNavigate } from "react-router";
import { useSession } from '@/lib/auth/auth-client';
import { Plus, Pencil, Trash2, AlertTriangle, Download, ClipboardList, Package, Search, X, ChevronDown, ChevronUp, Upload, ChevronRight, CheckSquare, Square, Minus } from 'lucide-react';
import StaffHeader from '@/components/StaffHeader';
import JsBarcode from 'jsbarcode';

// ─── Barcode component ────────────────────────────────────────────────────────
function Barcode({
  value
}: {
  value: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width: 1.4,
          height: 32,
          displayValue: true,
          fontSize: 8,
          margin: 2,
          background: 'transparent',
          lineColor: '#1B2A4A',
          fontOptions: 'bold',
          textMargin: 1
        });
      } catch {
        // invalid value — leave blank
      }
    }
  }, [value]);
  return <svg ref={svgRef} className="max-w-[110px]" />;
}

// ─── Inline image upload cell ─────────────────────────────────────────────────
function ImageUploadCell({
  item,
  onUploaded
}: {
  item: InventoryItem;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const res = await fetch(`/api/inventory/${item.id}/image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            filename: file.name,
            data: base64,
            mimeType: file.type
          })
        });
        if (res.ok) {
          const {
            imageUrl
          } = await res.json();
          onUploaded(imageUrl);
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
    // reset so same file can be re-uploaded
    e.target.value = '';
  }
  return <div className="flex items-center gap-2">
      {item.imageUrl ? <button onClick={() => inputRef.current?.click()} className="relative group shrink-0" title="Click to replace photo">
          <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover border border-gray-200 group-hover:opacity-70 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
            <Upload size={10} className="text-white" />
          </div>
        </button> : <button onClick={() => inputRef.current?.click()} disabled={uploading} className="w-10 h-10 border border-dashed border-gray-300 flex items-center justify-center text-gray-300 hover:border-[#C9A96E] hover:text-[#C9A96E] transition-colors shrink-0" title="Upload photo">
          {uploading ? <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" /> : <Upload size={12} />}
        </button>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFile} />
    </div>;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface InventoryItem {
  id: number;
  qcid: string | null;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  description: string | null;
  notes: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
interface AuditEntry {
  id: number;
  userId: string;
  action: string;
  itemId: number | null;
  details: string | null;
  createdAt: string;
}
const CATEGORIES = ['Linens & Towels', 'Toiletries', 'Kitchen & Bar', 'Cleaning Supplies', 'Maintenance', 'Guest Amenities', 'Food & Beverage', 'Other'];
const CATEGORY_ICONS: Record<string, string> = {
  'Linens & Towels': '🛏',
  'Toiletries': '🧴',
  'Kitchen & Bar': '🍽',
  'Cleaning Supplies': '🧹',
  'Maintenance': '🔧',
  'Guest Amenities': '🎁',
  'Food & Beverage': '🥤',
  'Other': '📦'
};
const emptyForm = {
  name: '',
  category: CATEGORIES[0],
  quantity: 0,
  unit: 'units',
  lowStockThreshold: 5,
  description: '',
  notes: ''
};

// ─── CSV export ───────────────────────────────────────────────────────────────
function exportCSV(items: InventoryItem[]) {
  const headers = ['ID', 'Name', 'Category', 'Quantity', 'Unit', 'Low Stock Threshold', 'Status', 'Notes'];
  const rows = items.map(i => [i.id, i.name, i.category, i.quantity, i.unit, i.lowStockThreshold, i.quantity <= i.lowStockThreshold ? 'LOW STOCK' : 'OK', i.notes || '']);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], {
    type: 'text/csv'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `stonetrail-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── CSV Import modal ─────────────────────────────────────────────────────────
function ImportModal({
  onClose,
  onImported
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'importing' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<{
    inserted: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  function parseCSV(text: string): Record<string, string>[] {
    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.replace(/^"|"$/g, '').trim());
      return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
    });
  }
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('parsing');
    const reader = new FileReader();
    reader.onload = ev => {
      const rows = parseCSV(ev.target?.result as string);
      setPreview(rows);
      setStatus('idle');
    };
    reader.readAsText(file);
  }
  async function handleImport() {
    if (!preview.length) return;
    setStatus('importing');
    try {
      const items = preview.map(row => ({
        name: row.name || row.Name || '',
        category: row.category || row.Category || '',
        quantity: Number(row.quantity || row.Quantity) || 0,
        unit: row.unit || row.Unit || 'units',
        lowStockThreshold: Number(row.lowStockThreshold || row['Low Stock Threshold']) || 5,
        notes: row.notes || row.Notes || ''
      }));
      const res = await fetch('/api/inventory/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items
        })
      });
      const data = await res.json();
      setResult(data);
      setStatus('done');
      onImported();
    } catch (err) {
      setErrorMsg(String(err));
      setStatus('error');
    }
  }
  function downloadTemplate() {
    window.open('/inventory-import-template.csv', '_blank');
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-heading text-xl text-[#1B2A4A]">Bulk Import Inventory</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {status !== 'done' && <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Upload a CSV file to import multiple items at once.</p>
                <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-[#2C4A3E] hover:text-[#C9A96E] transition-colors">
                  <Download size={12} /> Download Template
                </button>
              </div>

              <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-200 hover:border-[#C9A96E] transition-colors rounded p-8 text-center cursor-pointer">
                <Upload size={24} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">Click to select a CSV file</p>
                <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
              </div>

              {preview.length > 0 && <div>
                  <p className="text-[10px] tracking-widest uppercase text-[#1B2A4A]/50 mb-2">{preview.length} rows ready to import</p>
                  <div className="overflow-x-auto border border-gray-100 max-h-48">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>{Object.keys(preview[0]).map(h => <th key={h} className="px-3 py-2 text-left text-[10px] tracking-widest uppercase text-gray-400 font-medium whitespace-nowrap">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {preview.slice(0, 5).map((row, i) => <tr key={i} className="border-t border-gray-50">
                            {Object.values(row).map((v, j) => <td key={j} className="px-3 py-2 text-gray-600 whitespace-nowrap">{v}</td>)}
                          </tr>)}
                        {preview.length > 5 && <tr className="border-t border-gray-50">
                            <td colSpan={Object.keys(preview[0]).length} className="px-3 py-2 text-gray-400 text-center">
                              +{preview.length - 5} more rows…
                            </td>
                          </tr>}
                      </tbody>
                    </table>
                  </div>
                </div>}

              {status === 'error' && <p className="text-sm text-red-500">{errorMsg}</p>}
            </>}

          {status === 'done' && result && <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <Package size={20} className="text-green-500" />
              </div>
              <p className="text-lg font-heading text-[#1B2A4A]">Import Complete</p>
              <p className="text-sm text-gray-500">
                <span className="text-green-600 font-medium">{result.inserted} items imported</span>
                {result.skipped > 0 && <span className="text-amber-500 ml-2">{result.skipped} skipped</span>}
              </p>
              {result.errors.length > 0 && <ul className="text-xs text-red-400 text-left space-y-1 max-h-24 overflow-y-auto">
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>}
            </div>}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-[10px] tracking-widest uppercase text-gray-400 hover:text-gray-600 transition-colors">
            {status === 'done' ? 'Close' : 'Cancel'}
          </button>
          {status !== 'done' && <button onClick={handleImport} disabled={!preview.length || status === 'importing'} className="px-6 py-2.5 text-[10px] tracking-widest uppercase font-medium bg-[#2C4A3E] text-white hover:bg-[#1A2E28] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {status === 'importing' ? 'Importing…' : `Import ${preview.length} Items`}
            </button>}
        </div>
      </div>
    </div>;
}

// ─── Item form modal ──────────────────────────────────────────────────────────
function ItemModal({
  item,
  onSave,
  onClose,
  onImageUploaded
}: {
  item: Partial<InventoryItem> | null;
  onSave: (data: typeof emptyForm) => Promise<void>;
  onClose: () => void;
  onImageUploaded?: (id: number, url: string) => void;
}) {
  const [form, setForm] = useState(item ? {
    name: item.name || '',
    category: item.category || CATEGORIES[0],
    quantity: item.quantity ?? 0,
    unit: item.unit || 'units',
    lowStockThreshold: item.lowStockThreshold ?? 5,
    description: item.description || '',
    notes: item.notes || ''
  } : {
    ...emptyForm
  });
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(item?.imageUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  async function handlePhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !item?.id) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const res = await fetch(`/api/inventory/${item.id}/image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          filename: file.name,
          data: base64,
          mimeType: file.type
        })
      });
      if (res.ok) {
        const {
          imageUrl
        } = await res.json();
        setPreviewUrl(imageUrl);
        onImageUploaded?.(item.id!, imageUrl);
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-heading text-xl text-[#1B2A4A]">{item?.id ? 'Edit Item' : 'Add Item'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Photo section — only shown when editing an existing item */}
          {item?.id && <div className="col-span-2">
              <label className="block text-[10px] tracking-widest uppercase text-[#1B2A4A]/50 mb-2">Item Photo</label>
              <div className="flex items-center gap-4">
                {previewUrl ? <img src={previewUrl} alt={form.name} className="w-20 h-20 object-cover border border-gray-200 shrink-0" /> : <div className="w-20 h-20 border-2 border-dashed border-gray-200 flex items-center justify-center shrink-0">
                    <Package size={24} className="text-gray-300" />
                  </div>}
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={() => photoRef.current?.click()} disabled={uploading} className="flex items-center gap-2 px-4 py-2 text-xs border border-gray-200 text-gray-600 hover:border-[#C9A96E] hover:text-[#C9A96E] transition-colors disabled:opacity-50">
                    {uploading ? <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" /> : <Upload size={12} />}
                    {uploading ? 'Uploading…' : previewUrl ? 'Replace Photo' : 'Upload Photo'}
                  </button>
                  <p className="text-[10px] text-gray-400">JPEG, PNG, WebP or GIF</p>
                </div>
              </div>
              <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handlePhotoFile} />
            </div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] tracking-widest uppercase text-[#1B2A4A]/50 mb-1.5">Item Name *</label>
              <input required value={form.name} onChange={e => setForm({
              ...form,
              name: e.target.value
            })} className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-[#C9A96E]" />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] tracking-widest uppercase text-[#1B2A4A]/50 mb-1.5">Category *</label>
              <select value={form.category} onChange={e => setForm({
              ...form,
              category: e.target.value
            })} className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-[#C9A96E] bg-white">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] tracking-widest uppercase text-[#1B2A4A]/50 mb-1.5">Quantity *</label>
              <input type="number" min={0} required value={form.quantity} onChange={e => setForm({
              ...form,
              quantity: Number(e.target.value)
            })} className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-[#C9A96E]" />
            </div>
            <div>
              <label className="block text-[10px] tracking-widest uppercase text-[#1B2A4A]/50 mb-1.5">Unit</label>
              <input value={form.unit} onChange={e => setForm({
              ...form,
              unit: e.target.value
            })} className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-[#C9A96E]" placeholder="units, kg, bottles…" />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] tracking-widest uppercase text-[#1B2A4A]/50 mb-1.5">Low Stock Alert Threshold</label>
              <input type="number" min={0} value={form.lowStockThreshold} onChange={e => setForm({
              ...form,
              lowStockThreshold: Number(e.target.value)
            })} className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-[#C9A96E]" />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] tracking-widest uppercase text-[#1B2A4A]/50 mb-1.5">Description</label>
              <textarea rows={2} value={form.description} onChange={e => setForm({
              ...form,
              description: e.target.value
            })} className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-[#C9A96E] resize-none" placeholder="Optional item description…" />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] tracking-widest uppercase text-[#1B2A4A]/50 mb-1.5">Notes</label>
              <textarea rows={2} value={form.notes} onChange={e => setForm({
              ...form,
              notes: e.target.value
            })} className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-[#C9A96E] resize-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#1B2A4A] text-white text-sm hover:bg-[#C9A96E] transition-colors disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>;
}

// ─── Bulk edit modal ──────────────────────────────────────────────────────────
function BulkEditModal({
  count,
  onSave,
  onClose
}: {
  count: number;
  onSave: (patch: {
    category?: string;
    unit?: string;
    quantity?: number;
    lowStockThreshold?: number;
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [fields, setFields] = useState({
    category: '',
    unit: '',
    quantity: '',
    lowStockThreshold: ''
  });
  const [saving, setSaving] = useState(false);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const patch: Record<string, string | number> = {};
    if (fields.category.trim()) patch.category = fields.category.trim();
    if (fields.unit.trim()) patch.unit = fields.unit.trim();
    if (fields.quantity !== '') patch.quantity = Number(fields.quantity);
    if (fields.lowStockThreshold !== '') patch.lowStockThreshold = Number(fields.lowStockThreshold);
    if (Object.keys(patch).length === 0) return;
    setSaving(true);
    await onSave(patch);
    setSaving(false);
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-heading text-xl text-[#1B2A4A]">Bulk Edit</h2>
            <p className="text-xs text-gray-400 mt-0.5">Editing {count} selected item{count !== 1 ? 's' : ''}. Leave a field blank to keep existing values.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-[#1B2A4A]/50 mb-1.5">Category</label>
            <select value={fields.category} onChange={e => setFields({
            ...fields,
            category: e.target.value
          })} className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-[#C9A96E] bg-white">
              <option value="">— keep existing —</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-[#1B2A4A]/50 mb-1.5">Unit</label>
            <input value={fields.unit} onChange={e => setFields({
            ...fields,
            unit: e.target.value
          })} placeholder="— keep existing —" className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-[#C9A96E]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] tracking-widest uppercase text-[#1B2A4A]/50 mb-1.5">Set Quantity</label>
              <input type="number" min={0} value={fields.quantity} onChange={e => setFields({
              ...fields,
              quantity: e.target.value
            })} placeholder="— keep —" className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-[#C9A96E]" />
            </div>
            <div>
              <label className="block text-[10px] tracking-widest uppercase text-[#1B2A4A]/50 mb-1.5">Low Stock Threshold</label>
              <input type="number" min={0} value={fields.lowStockThreshold} onChange={e => setFields({
              ...fields,
              lowStockThreshold: e.target.value
            })} placeholder="— keep —" className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-[#C9A96E]" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#1B2A4A] text-white text-sm hover:bg-[#C9A96E] transition-colors disabled:opacity-60">
              {saving ? 'Saving…' : `Apply to ${count} Item${count !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>;
}

// ─── Category section ─────────────────────────────────────────────────────────
function CategorySection({
  category,
  items,
  sortField,
  sortDir,
  toggleSort,
  deleteConfirm,
  setDeleteConfirm,
  handleDelete,
  setModal,
  selected,
  onToggleItem,
  onToggleAll,
  onItemImageUploaded
}: {
  category: string;
  items: InventoryItem[];
  sortField: keyof InventoryItem;
  sortDir: 'asc' | 'desc';
  toggleSort: (f: keyof InventoryItem) => void;
  deleteConfirm: number | null;
  setDeleteConfirm: (id: number | null) => void;
  handleDelete: (id: number) => void;
  setModal: (v: {
    open: boolean;
    item: Partial<InventoryItem> | null;
  }) => void;
  selected: Set<number>;
  onToggleItem: (id: number) => void;
  onToggleAll: (ids: number[], checked: boolean) => void;
  onItemImageUploaded: (id: number, url: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const lowCount = items.filter(i => i.quantity <= i.lowStockThreshold).length;
  const icon = CATEGORY_ICONS[category] ?? '📦';
  const allChecked = items.length > 0 && items.every(i => selected.has(i.id));
  const someChecked = items.some(i => selected.has(i.id)) && !allChecked;
  return <div className="bg-white border border-gray-100 overflow-hidden">
      {/* Category header */}
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/60 transition-colors text-left">
        <div className="flex items-center gap-3">
          <span className="text-lg leading-none">{icon}</span>
          <span className="font-medium text-[#1B2A4A] text-sm">{category}</span>
          <span className="text-[10px] tracking-widest uppercase text-gray-400 bg-gray-100 px-2 py-0.5">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
          {lowCount > 0 && <span className="flex items-center gap-1 text-[10px] tracking-widest uppercase bg-amber-100 text-amber-700 px-2 py-0.5">
              <AlertTriangle size={9} /> {lowCount} low
            </span>}
          {items.some(i => selected.has(i.id)) && <span className="text-[10px] tracking-widest uppercase bg-[#1B2A4A]/10 text-[#1B2A4A] px-2 py-0.5">
              {items.filter(i => selected.has(i.id)).length} selected
            </span>}
        </div>
        <ChevronRight size={16} className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
      </button>

      {/* Items table */}
      {open && <div className="border-t border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/70">
                {/* Select-all checkbox for this category */}
                <th className="px-4 py-2.5 w-10">
                  <button onClick={() => onToggleAll(items.map(i => i.id), !allChecked)} className="flex items-center justify-center text-gray-400 hover:text-[#1B2A4A] transition-colors" title={allChecked ? 'Deselect all in category' : 'Select all in category'}>
                    {allChecked ? <CheckSquare size={15} className="text-[#1B2A4A]" /> : someChecked ? <Minus size={15} className="text-[#C9A96E]" /> : <Square size={15} />}
                  </button>
                </th>
                <th className="text-left px-4 py-2.5 text-[10px] tracking-widest uppercase text-gray-400 whitespace-nowrap">QCID / Barcode</th>
                <th className="text-left px-4 py-2.5 text-[10px] tracking-widest uppercase text-gray-400 whitespace-nowrap">Photo</th>
                {[{
              key: 'name',
              label: 'Item'
            }, {
              key: 'quantity',
              label: 'Qty'
            }, {
              key: 'unit',
              label: 'Unit'
            }, {
              key: 'lowStockThreshold',
              label: 'Threshold'
            }, {
              key: 'description',
              label: 'Description'
            }].map(({
              key,
              label
            }) => <th key={key} onClick={() => toggleSort(key as keyof InventoryItem)} className="text-left px-4 py-2.5 text-[10px] tracking-widest uppercase text-gray-400 cursor-pointer hover:text-gray-600 select-none">
                    <span className="flex items-center gap-1">
                      {label}
                      {sortField === key && (sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                    </span>
                  </th>)}
                <th className="text-left px-4 py-2.5 text-[10px] tracking-widest uppercase text-gray-400">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
            const isLow = item.quantity <= item.lowStockThreshold;
            const isSelected = selected.has(item.id);
            return <tr key={item.id} className={`border-t border-gray-50 transition-colors ${isSelected ? 'bg-[#1B2A4A]/5' : isLow ? 'bg-amber-50/20' : 'hover:bg-gray-50/50'}`}>
                    {/* Row checkbox */}
                    <td className="px-4 py-3">
                      <button onClick={() => onToggleItem(item.id)} className="flex items-center justify-center text-gray-400 hover:text-[#1B2A4A] transition-colors">
                        {isSelected ? <CheckSquare size={15} className="text-[#1B2A4A]" /> : <Square size={15} />}
                      </button>
                    </td>
                    {/* QCID + barcode */}
                    <td className="px-4 py-2">
                      {item.qcid ? <Barcode value={item.qcid} /> : <span className="text-xs text-gray-300 italic">—</span>}
                    </td>
                    {/* Inline photo */}
                    <td className="px-4 py-2">
                      <ImageUploadCell item={item} onUploaded={url => onItemImageUploaded(item.id, url)} />
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1B2A4A]">
                      {item.name}
                      {item.notes && <p className="text-xs text-gray-400 font-normal mt-0.5 truncate max-w-[220px]">{item.notes}</p>}
                    </td>
                    <td className={`px-4 py-3 font-medium tabular-nums ${isLow ? 'text-amber-600' : 'text-[#1B2A4A]'}`}>{item.quantity}</td>
                    <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                    <td className="px-4 py-3 text-gray-500 tabular-nums">{item.lowStockThreshold}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px]">
                      {item.description ? <span className="truncate block">{item.description}</span> : <span className="text-gray-300 italic text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {isLow ? <span className="inline-flex items-center gap-1 text-[10px] tracking-wide uppercase bg-amber-100 text-amber-700 px-2 py-1">
                          <AlertTriangle size={10} /> Low
                        </span> : <span className="text-[10px] tracking-wide uppercase text-green-600 bg-green-50 px-2 py-1">OK</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => setModal({
                    open: true,
                    item
                  })} className="p-1.5 text-gray-400 hover:text-[#1B2A4A] transition-colors" title="Edit">
                          <Pencil size={14} />
                        </button>
                        {deleteConfirm === item.id ? <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(item.id)} className="text-[10px] text-red-600 hover:underline">Confirm</button>
                            <button onClick={() => setDeleteConfirm(null)} className="text-[10px] text-gray-400 hover:underline">Cancel</button>
                          </div> : <button onClick={() => setDeleteConfirm(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                            <Trash2 size={14} />
                          </button>}
                      </div>
                    </td>
                  </tr>;
          })}
            </tbody>
          </table>
        </div>}
    </div>;
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const {
    user,
    isPending,
    isAuthenticated
  } = useSession();
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [modal, setModal] = useState<{
    open: boolean;
    item: Partial<InventoryItem> | null;
  }>({
    open: false,
    item: null
  });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'audit'>('inventory');
  const [sortField, setSortField] = useState<keyof InventoryItem>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showImport, setShowImport] = useState(false);

  // ── Selection state ──────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  function toggleItem(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAll(ids: number[], checked: boolean) {
    setSelected(prev => {
      const next = new Set(prev);
      ids.forEach(id => checked ? next.add(id) : next.delete(id));
      return next;
    });
  }
  function clearSelection() {
    setSelected(new Set());
  }
  const fetchItems = useCallback(async () => {
    const res = await fetch('/api/inventory');
    if (res.ok) setItems(await res.json());
  }, []);
  const fetchAudit = useCallback(async () => {
    const res = await fetch('/api/inventory/audit');
    if (res.ok) setAuditLogs(await res.json());
  }, []);
  useEffect(() => {
    if (!isPending && !isAuthenticated) {
      navigate('/staff/login', {
        state: {
          from: {
            pathname: '/staff/inventory'
          }
        }
      });
      return;
    }
    if (isAuthenticated) {
      Promise.all([fetchItems(), fetchAudit()]).finally(() => setLoading(false));
    }
  }, [isPending, isAuthenticated, navigate, fetchItems, fetchAudit]);
  async function handleSave(data: typeof emptyForm) {
    if (modal.item?.id) {
      await fetch(`/api/inventory/${modal.item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    } else {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    }
    await fetchItems();
    await fetchAudit();
    setModal({
      open: false,
      item: null
    });
  }
  async function handleDelete(id: number) {
    await fetch(`/api/inventory/${id}`, {
      method: 'DELETE'
    });
    await fetchItems();
    await fetchAudit();
    setDeleteConfirm(null);
    setSelected(prev => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  }
  function handleItemImageUploaded(id: number, url: string) {
    // Optimistic update — no need to refetch the whole list
    setItems(prev => prev.map(i => i.id === id ? {
      ...i,
      imageUrl: url
    } : i));
  }
  async function handleBulkDelete() {
    const ids = Array.from(selected);
    await fetch('/api/inventory/bulk-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ids
      })
    });
    await fetchItems();
    await fetchAudit();
    clearSelection();
    setBulkDeleteConfirm(false);
  }
  async function handleBulkEdit(patch: Record<string, unknown>) {
    const ids = Array.from(selected);
    await fetch('/api/inventory/bulk-edit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ids,
        patch
      })
    });
    await fetchItems();
    await fetchAudit();
    clearSelection();
    setShowBulkEdit(false);
  }
  function toggleSort(field: keyof InventoryItem) {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');else {
      setSortField(field);
      setSortDir('asc');
    }
  }
  const lowStockCount = items.filter(i => i.quantity <= i.lowStockThreshold).length;
  const filtered = items.filter(i => {
    if (showLowStock && i.quantity > i.lowStockThreshold) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !i.category.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const allCategories = [...CATEGORIES.filter(c => filtered.some(i => i.category === c)), ...Array.from(new Set(filtered.map(i => i.category).filter(c => !CATEGORIES.includes(c))))];
  const sortedFiltered = [...filtered].sort((a, b) => {
    const av = a[sortField] ?? '';
    const bv = b[sortField] ?? '';
    const cmp = String(av).localeCompare(String(bv), undefined, {
      numeric: true
    });
    return sortDir === 'asc' ? cmp : -cmp;
  });
  const allFilteredIds = sortedFiltered.map(i => i.id);
  const allFilteredSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selected.has(id));
  const someFilteredSelected = allFilteredIds.some(id => selected.has(id)) && !allFilteredSelected;
  if (isPending || loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#1B2A4A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      </div>;
  }
  return <>
      <Helmet>
        <title>Inventory — Stonetrail Villas Staff</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-gray-50">
        <StaffHeader userName={user?.name || user?.email} userRole={user?.role} />

        {/* Stats bar */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 pt-[96px]">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-6">
            <div>
              <p className="text-[10px] tracking-widest uppercase text-gray-400 mb-0.5">Total Items</p>
              <p className="text-2xl font-heading text-[#1B2A4A]">{items.length}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-widest uppercase text-gray-400 mb-0.5">Categories</p>
              <p className="text-2xl font-heading text-[#1B2A4A]">{new Set(items.map(i => i.category)).size}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-widest uppercase text-gray-400 mb-0.5">Low Stock Alerts</p>
              <p className={`text-2xl font-heading ${lowStockCount > 0 ? 'text-amber-600' : 'text-[#1B2A4A]'}`}>{lowStockCount}</p>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-gray-200">
            {(['inventory', 'audit'] as const).map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${activeTab === tab ? 'border-[#C9A96E] text-[#1B2A4A]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                {tab === 'audit' ? 'Audit Log' : 'Inventory'}
              </button>)}
          </div>

          {activeTab === 'inventory' && <>
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items or categories…" className="w-full pl-9 pr-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#C9A96E] bg-white" />
                </div>
                <button onClick={() => setShowLowStock(!showLowStock)} className={`flex items-center gap-2 px-4 py-2.5 text-sm border transition-colors ${showLowStock ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  <AlertTriangle size={14} />
                  Low Stock {lowStockCount > 0 && `(${lowStockCount})`}
                </button>
                <button onClick={() => exportCSV(filtered)} className="flex items-center gap-2 px-4 py-2.5 text-sm border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors">
                  <Download size={14} />
                  Export CSV
                </button>
                <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-4 py-2.5 text-sm border border-[#2C4A3E] text-[#2C4A3E] hover:bg-[#2C4A3E] hover:text-white transition-colors">
                  <Upload size={14} />
                  Import CSV
                </button>
                <button onClick={() => setModal({
              open: true,
              item: null
            })} className="flex items-center gap-2 px-4 py-2.5 text-sm bg-[#1B2A4A] text-white hover:bg-[#C9A96E] transition-colors">
                  <Plus size={14} />
                  Add Item
                </button>
              </div>

              {/* Global select-all + bulk action bar */}
              <div className={`flex items-center gap-3 mb-4 px-4 py-2.5 border transition-all ${selected.size > 0 ? 'bg-[#1B2A4A] border-[#1B2A4A]' : 'bg-white border-gray-200'}`}>
                <button onClick={() => toggleAll(allFilteredIds, !allFilteredSelected)} className={`flex items-center gap-2 text-sm transition-colors ${selected.size > 0 ? 'text-white' : 'text-gray-500 hover:text-[#1B2A4A]'}`}>
                  {allFilteredSelected ? <CheckSquare size={15} /> : someFilteredSelected ? <Minus size={15} /> : <Square size={15} />}
                  <span className="text-[11px] tracking-widest uppercase">
                    {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
                  </span>
                </button>

                {selected.size > 0 && <>
                    <div className="h-4 w-px bg-white/30" />
                    <button onClick={() => setShowBulkEdit(true)} className="flex items-center gap-1.5 text-[11px] tracking-widest uppercase text-white/80 hover:text-white transition-colors">
                      <Pencil size={13} /> Edit Selected
                    </button>
                    <div className="h-4 w-px bg-white/30" />
                    {bulkDeleteConfirm ? <div className="flex items-center gap-2">
                        <span className="text-[11px] text-white/70">Delete {selected.size} item{selected.size !== 1 ? 's' : ''}?</span>
                        <button onClick={handleBulkDelete} className="text-[11px] tracking-widest uppercase text-red-300 hover:text-red-200 font-medium">Confirm</button>
                        <button onClick={() => setBulkDeleteConfirm(false)} className="text-[11px] tracking-widest uppercase text-white/50 hover:text-white/80">Cancel</button>
                      </div> : <button onClick={() => setBulkDeleteConfirm(true)} className="flex items-center gap-1.5 text-[11px] tracking-widest uppercase text-red-300 hover:text-red-200 transition-colors">
                        <Trash2 size={13} /> Delete Selected
                      </button>}
                    <div className="ml-auto">
                      <button onClick={clearSelection} className="text-[11px] tracking-widest uppercase text-white/50 hover:text-white/80 transition-colors">
                        Clear
                      </button>
                    </div>
                  </>}
              </div>

              {/* Category groups */}
              {filtered.length === 0 ? <div className="bg-white border border-gray-100 py-16 text-center text-gray-400 text-sm">
                  {items.length === 0 ? 'No items yet. Add your first inventory item.' : 'No items match your filters.'}
                </div> : <div className="flex flex-col gap-3">
                  {allCategories.map(cat => <CategorySection key={cat} category={cat} items={sortedFiltered.filter(i => i.category === cat)} sortField={sortField} sortDir={sortDir} toggleSort={toggleSort} deleteConfirm={deleteConfirm} setDeleteConfirm={setDeleteConfirm} handleDelete={handleDelete} setModal={setModal} selected={selected} onToggleItem={toggleItem} onToggleAll={toggleAll} onItemImageUploaded={handleItemImageUploaded} />)}
                </div>}

              <p className="text-xs text-gray-400 mt-3">{filtered.length} of {items.length} items across {allCategories.length} {allCategories.length === 1 ? 'category' : 'categories'}</p>
            </>}

          {activeTab === 'audit' && <div className="bg-white border border-gray-100">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                <ClipboardList size={16} className="text-[#C9A96E]" />
                <h2 className="font-medium text-[#1B2A4A] text-sm">Recent Activity</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-5 py-3 text-[10px] tracking-widest uppercase text-gray-400">Time</th>
                      <th className="text-left px-5 py-3 text-[10px] tracking-widest uppercase text-gray-400">Action</th>
                      <th className="text-left px-5 py-3 text-[10px] tracking-widest uppercase text-gray-400">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 && <tr><td colSpan={3} className="text-center py-10 text-gray-400 text-sm">No activity recorded yet.</td></tr>}
                    {auditLogs.map(log => <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-5 py-3 text-gray-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] tracking-wide uppercase px-2 py-1 ${log.action === 'CREATE' ? 'bg-green-50 text-green-700' : log.action === 'UPDATE' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-600">{log.details}</td>
                      </tr>)}
                  </tbody>
                </table>
              </div>
            </div>}
        </div>
      </div>

      {modal.open && <ItemModal item={modal.item} onSave={handleSave} onClose={() => setModal({
      open: false,
      item: null
    })} onImageUploaded={handleItemImageUploaded} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={() => {
      fetchItems();
      fetchAudit();
    }} />}
      {showBulkEdit && <BulkEditModal count={selected.size} onSave={handleBulkEdit} onClose={() => setShowBulkEdit(false)} />}
    </>;
}
