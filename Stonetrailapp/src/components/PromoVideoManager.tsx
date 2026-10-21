import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Save } from 'lucide-react';
import {
  getPromoVideos,
  savePromoVideos,
  getPromoEnabled,
  savePromoEnabled,
  type PromoVideo,
} from '@/lib/promoVideos';

export default function PromoVideoManager() {
  const [videos, setVideos] = useState<PromoVideo[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setVideos(getPromoVideos());
    setEnabled(getPromoEnabled());
  }, []);

  function addRow() {
    setVideos((prev) => [
      ...prev,
      { id: Date.now().toString(), url: '', label: '' },
    ]);
  }

  function updateRow(id: string, field: keyof PromoVideo, value: string) {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  }

  function removeRow(id: string) {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  }

  function handleSave() {
    const clean = videos.filter((v) => v.url.trim());
    savePromoVideos(clean);
    savePromoEnabled(enabled);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#111E1A] p-6">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white">Promo Popup Videos</h3>
          <p className="mt-0.5 text-xs text-white/45">
            One video is picked at random each time the popup opens. Paste any YouTube URL.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#C8B89A] px-4 py-2 text-sm font-medium text-[#1A2E28] hover:bg-white transition-colors"
        >
          <Save size={14} />
          {saved ? 'Saved!' : 'Save'}
        </button>
      </div>

      {/* Enable / disable toggle */}
      <label className="mb-5 flex cursor-pointer items-center gap-3 w-fit select-none">
        <div
          onClick={() => setEnabled((v) => !v)}
          className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${
            enabled ? 'bg-[#C8B89A]' : 'bg-white/15'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
              enabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </div>
        <span className="text-sm text-white/70">
          {enabled ? 'Popup enabled' : 'Popup disabled'}
        </span>
      </label>

      {/* Table */}
      <div className={`overflow-x-auto transition-opacity duration-200 ${!enabled ? 'opacity-40 pointer-events-none' : ''}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs text-white/40">
              <th className="w-6 pb-2" />
              <th className="pb-2 pr-3 font-medium">#</th>
              <th className="pb-2 pr-3 font-medium">Label</th>
              <th className="pb-2 pr-3 font-medium">YouTube URL</th>
              <th className="w-8 pb-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {videos.map((video, idx) => (
              <tr key={video.id} className="group">
                <td className="py-2 pr-2 text-white/20">
                  <GripVertical size={14} />
                </td>
                <td className="py-2 pr-3 text-white/40">{idx + 1}</td>
                <td className="py-2 pr-3">
                  <input
                    type="text"
                    value={video.label}
                    onChange={(e) => updateRow(video.id, 'label', e.target.value)}
                    placeholder="e.g. Vincy Mas Carnival"
                    className="w-full rounded-md border border-white/15 bg-[#1A2E28] px-2 py-1.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#C8B89A]/60 focus:ring-1 focus:ring-[#C8B89A]/40 transition-colors"
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="url"
                    value={video.url}
                    onChange={(e) => updateRow(video.id, 'url', e.target.value)}
                    placeholder="https://youtu.be/..."
                    className="w-full min-w-[220px] rounded-md border border-white/15 bg-[#1A2E28] px-2 py-1.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#C8B89A]/60 focus:ring-1 focus:ring-[#C8B89A]/40 transition-colors"
                  />
                </td>
                <td className="py-2">
                  <button
                    onClick={() => removeRow(video.id)}
                    className="rounded p-1 text-white/30 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                    aria-label="Remove video"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {videos.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-white/30">
                  No videos added yet. Click "Add video" below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        onClick={addRow}
        disabled={!enabled}
        className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-white/15 px-3 py-2 text-xs text-white/40 hover:border-[#C8B89A]/60 hover:text-[#C8B89A] transition-colors disabled:pointer-events-none disabled:opacity-30"
      >
        <Plus size={13} /> Add video
      </button>
    </div>
  );
}
