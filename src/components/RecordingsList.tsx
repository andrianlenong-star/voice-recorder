import React, { useState } from 'react';
import { 
  Search, 
  Play, 
  Download, 
  Cloud, 
  CheckCircle2, 
  Star, 
  Trash2, 
  Clock, 
  HardDrive, 
  PhoneIncoming, 
  PhoneOutgoing, 
  MapPin, 
  Tag, 
  Bookmark, 
  ChevronDown, 
  ChevronUp, 
  FileAudio, 
  Archive,
  RefreshCw,
  Edit3,
  Check,
  Plus,
  X,
  CheckSquare,
  Square,
  Filter,
  SlidersHorizontal,
  AlertTriangle
} from 'lucide-react';
import { CallRecord, AppSettings, VoipApp } from '../types';
import { formatDuration, formatFileSize, getAppMeta, COMMON_TAGS, QUALITY_PRESETS, formatCloudProviders } from '../utils/callManager';
import { triggerLocalDownload, generateRecordingFilename } from '../utils/audioEncoder';

interface RecordingsListProps {
  recordings: CallRecord[];
  activeRecord: CallRecord | null;
  settings: AppSettings;
  onSelectRecord: (record: CallRecord) => void;
  onToggleStar: (id: string) => void;
  onDeleteRecord: (id: string) => void;
  onDeleteMultipleRecords: (ids: string[]) => void;
  onUpdateRecord: (updated: CallRecord) => void;
  onAssignTagMultiple: (ids: string[], tag: string) => void;
  onSyncSingleRecord: (record: CallRecord) => Promise<void>;
  onExportAllZip: () => void;
  onOpenCallSimulator: () => void;
}

export const RecordingsList: React.FC<RecordingsListProps> = ({
  recordings,
  activeRecord,
  settings,
  onSelectRecord,
  onToggleStar,
  onDeleteRecord,
  onDeleteMultipleRecords,
  onUpdateRecord,
  onAssignTagMultiple,
  onSyncSingleRecord,
  onExportAllZip,
  onOpenCallSimulator,
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'duration_desc' | 'size_desc'>('date_desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Bulk selection mode
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Delete confirmation modal
  const [itemToDelete, setItemToDelete] = useState<{ id: string; title: string } | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Tag creation / popover on card
  const [activeTagCardId, setActiveTagCardId] = useState<string | null>(null);
  const [newCustomTag, setNewCustomTag] = useState('');

  const isId = settings.language === 'id';

  // Collect all unique tags from current recordings + default presets
  const availableTags = Array.from(
    new Set([
      'Work',
      'Personal',
      'Important',
      'Meeting',
      ...recordings.flatMap((r) => r.tags || []),
    ])
  );

  // Filter and sort recordings
  const filtered = recordings
    .filter((rec) => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = rec.title.toLowerCase().includes(q);
        const matchCaller = rec.callerName.toLowerCase().includes(q);
        const matchPhone = rec.phoneNumber.toLowerCase().includes(q);
        const matchNotes = rec.notes ? rec.notes.toLowerCase().includes(q) : false;
        const matchTags = rec.tags ? rec.tags.some((t) => t.toLowerCase().includes(q)) : false;
        if (!matchTitle && !matchCaller && !matchPhone && !matchNotes && !matchTags) {
          return false;
        }
      }

      // App category tab filter
      if (activeTab === 'starred') {
        if (!rec.isStarred) return false;
      } else if (activeTab === 'synced') {
        if (rec.cloudSync.status !== 'synced') return false;
      } else if (activeTab === 'pending') {
        if (rec.cloudSync.status === 'synced') return false;
      } else if (activeTab !== 'all') {
        if (rec.voipApp !== activeTab) return false;
      }

      // Tag filter
      if (selectedTag !== 'all') {
        if (!rec.tags || !rec.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase())) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return a.timestamp - b.timestamp;
        case 'duration_desc':
          return b.duration - a.duration;
        case 'size_desc':
          return b.fileSize - a.fileSize;
        case 'date_desc':
        default:
          return b.timestamp - a.timestamp;
      }
    });

  const toggleSelectId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((r) => r.id)));
    }
  };

  const handleDownloadMp3 = (rec: CallRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    if (rec.mp3Blob) {
      const filename = generateRecordingFilename(rec.voipApp, rec.callerName, rec.timestamp);
      triggerLocalDownload(rec.mp3Blob, filename);
    } else if (rec.mp3Url) {
      const a = document.createElement('a');
      a.href = rec.mp3Url;
      a.download = generateRecordingFilename(rec.voipApp, rec.callerName, rec.timestamp);
      a.click();
    }
  };

  const handleSyncClick = async (rec: CallRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    if (rec.cloudSync.status === 'synced') return;
    setSyncingId(rec.id);
    await onSyncSingleRecord(rec);
    setSyncingId(null);
  };

  const handleSaveNote = (rec: CallRecord) => {
    onUpdateRecord({
      ...rec,
      notes: tempNote,
    });
    setEditingNoteId(null);
  };

  // Add tag to recording
  const handleAddTagToRecord = (rec: CallRecord, tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    const currentTags = rec.tags || [];
    if (!currentTags.includes(trimmed)) {
      onUpdateRecord({
        ...rec,
        tags: [...currentTags, trimmed],
      });
    }
    setNewCustomTag('');
  };

  // Remove tag from recording
  const handleRemoveTagFromRecord = (rec: CallRecord, tagToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentTags = rec.tags || [];
    onUpdateRecord({
      ...rec,
      tags: currentTags.filter((t) => t !== tagToRemove),
    });
  };

  const confirmSingleDelete = () => {
    if (itemToDelete) {
      onDeleteRecord(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const confirmBulkDelete = () => {
    onDeleteMultipleRecords(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsBulkMode(false);
    setShowBulkDeleteConfirm(false);
  };

  const formatDateDisplay = (timestamp: number) => {
    const d = new Date(timestamp);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return `${isId ? 'Hari ini' : 'Today'}, ${timeStr}`;
    }
    return `${d.toLocaleDateString([], { day: 'numeric', month: 'short' })}, ${timeStr}`;
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3.5">
        {/* Row 1: Search & Bulk Action Toggles */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isId ? 'Cari nama penelepon, nomor, catatan, atau tag...' : 'Search caller, number, notes, or tags...'}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            {/* Bulk Selection Toggle */}
            <button
              onClick={() => {
                setIsBulkMode(!isBulkMode);
                setSelectedIds(new Set());
              }}
              className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                isBulkMode
                  ? 'bg-rose-600/20 text-rose-300 border-rose-500/50'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
              title={isId ? 'Mode Pilih Banyak untuk hapus atau beri tag serentak' : 'Multi-select mode'}
            >
              {isBulkMode ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
              <span>{isId ? 'Pilih Banyak' : 'Bulk Select'}</span>
            </button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as unknown as typeof sortBy)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="date_desc">{isId ? 'Terbaru' : 'Newest'}</option>
              <option value="date_asc">{isId ? 'Terlama' : 'Oldest'}</option>
              <option value="duration_desc">{isId ? 'Durasi Terpanjang' : 'Longest Duration'}</option>
              <option value="size_desc">{isId ? 'Ukuran Berkas' : 'File Size'}</option>
            </select>

            {/* ZIP Export */}
            <button
              onClick={onExportAllZip}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
              title={isId ? 'Ekspor Semua MP3 sebagai Arsip ZIP' : 'Export All MP3s as ZIP'}
            >
              <Archive className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">{isId ? 'Unduh ZIP' : 'ZIP'}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Bulk Action Bar (when bulk mode active) */}
        {isBulkMode && (
          <div className="bg-slate-800/90 border border-rose-500/40 p-3 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSelectAll}
                className="font-bold text-rose-300 hover:text-white cursor-pointer"
              >
                {selectedIds.size === filtered.length
                  ? (isId ? 'Batal Pilih Semua' : 'Deselect All')
                  : (isId ? `Pilih Semua (${filtered.length})` : `Select All (${filtered.length})`)}
              </button>
              <span className="text-slate-400">
                {selectedIds.size} {isId ? 'rekaman dipilih' : 'selected'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Assign Tag to Selected */}
              <div className="flex items-center space-x-1">
                <span className="text-slate-400 hidden sm:inline">{isId ? 'Beri Tag:' : 'Add Tag:'}</span>
                {['Work', 'Personal', 'Important'].map((presetTag) => (
                  <button
                    key={presetTag}
                    disabled={selectedIds.size === 0}
                    onClick={() => onAssignTagMultiple(Array.from(selectedIds), presetTag)}
                    className="px-2 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-[11px] font-semibold text-slate-200 rounded-md transition cursor-pointer"
                  >
                    +{presetTag}
                  </button>
                ))}
              </div>

              {/* Bulk Delete Button */}
              <button
                disabled={selectedIds.size === 0}
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="flex items-center space-x-1 px-3 py-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold rounded-lg transition cursor-pointer shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isId ? `Hapus (${selectedIds.size})` : `Delete (${selectedIds.size})`}</span>
              </button>
            </div>
          </div>
        )}

        {/* Row 3: App Category Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs font-medium no-scrollbar border-b border-slate-800/60">
          {[
            { id: 'all', label: isId ? 'Semua Rekaman' : 'All Recordings' },
            { id: 'whatsapp', label: 'WhatsApp' },
            { id: 'telegram', label: 'Telegram' },
            { id: 'zoom', label: 'Zoom Meeting' },
            { id: 'starred', label: isId ? '⭐ Berbintang' : '⭐ Starred' },
            { id: 'synced', label: isId ? '☁️ Tersinkron' : '☁️ Synced' },
            { id: 'pending', label: isId ? '⏳ Menunggu Sync' : '⏳ Pending' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-rose-600 text-white font-bold shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Row 4: Tag Filter Chips Bar */}
        <div className="flex items-center space-x-2 overflow-x-auto pt-0.5 text-xs">
          <div className="flex items-center text-slate-400 space-x-1 shrink-0 font-medium text-[11px]">
            <Tag className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isId ? 'Filter Tag:' : 'Tags:'}</span>
          </div>

          <button
            onClick={() => setSelectedTag('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
              selectedTag === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isId ? 'Semua Tag' : 'All'}
          </button>

          {availableTags.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTag(t)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition cursor-pointer border ${
                selectedTag.toLowerCase() === t.toLowerCase()
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500 font-bold'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              #{t}
            </button>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-white">
                {isId ? 'Hapus Rekaman Ini?' : 'Delete This Recording?'}
              </h4>
              <p className="text-xs text-slate-400">
                "{itemToDelete.title}" {isId ? 'akan dihapus secara permanen dari perangkat lokal.' : 'will be permanently deleted.'}
              </p>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
              >
                {isId ? 'Batal' : 'Cancel'}
              </button>
              <button
                onClick={confirmSingleDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md"
              >
                {isId ? 'Ya, Hapus' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-white">
                {isId ? `Hapus ${selectedIds.size} Rekaman Terpilih?` : `Delete ${selectedIds.size} Recordings?`}
              </h4>
              <p className="text-xs text-slate-400">
                {isId
                  ? 'Semua berkas MP3 yang dipilih akan dihapus secara permanen dari penyimpanan lokal.'
                  : 'Selected recordings will be permanently removed from device storage.'}
              </p>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
              >
                {isId ? 'Batal' : 'Cancel'}
              </button>
              <button
                onClick={confirmBulkDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md"
              >
                {isId ? 'Hapus Semua Terpilih' : 'Delete All Selected'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recordings Cards List */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
              <FileAudio className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200 text-base">
                {isId ? 'Tidak Ada Rekaman yang Sesuai' : 'No Recordings Found'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                {isId
                  ? 'Belum ada panggilan yang cocok dengan kriteria filter atau tag saat ini.'
                  : 'No recordings match the active filters or tag criteria.'}
              </p>
            </div>
            <button
              onClick={onOpenCallSimulator}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
            >
              <span>{isId ? 'Mulai Simulator Panggilan' : 'Launch Call Simulator'}</span>
            </button>
          </div>
        ) : (
          filtered.map((rec) => {
            const isCurrentPlaying = activeRecord?.id === rec.id;
            const isExpanded = expandedId === rec.id;
            const isSelected = selectedIds.has(rec.id);
            const appMeta = getAppMeta(rec.voipApp);

            // Determine quality badge
            const presetBadge = rec.qualityPreset ? QUALITY_PRESETS[rec.qualityPreset]?.tag : `MP3 ${rec.bitrate}k`;

            return (
              <div
                key={rec.id}
                onClick={() => {
                  if (isBulkMode) {
                    const next = new Set(selectedIds);
                    if (next.has(rec.id)) next.delete(rec.id);
                    else next.add(rec.id);
                    setSelectedIds(next);
                  } else {
                    onSelectRecord(rec);
                  }
                }}
                className={`bg-slate-900 border rounded-2xl transition-all cursor-pointer overflow-hidden relative ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-950/20 shadow-md'
                    : isCurrentPlaying
                    ? 'border-rose-500/80 ring-2 ring-rose-500/20 shadow-lg shadow-rose-950/40 bg-slate-850'
                    : 'border-slate-800/80 hover:border-slate-700 hover:bg-slate-850/60 shadow-sm'
                }`}
              >
                {/* Main Card Content */}
                <div className="p-4 flex items-center justify-between gap-3">
                  {/* Left: Bulk Checkbox (if bulk active) + Avatar / Caller details */}
                  <div className="flex items-center space-x-3 min-w-0">
                    {/* Checkbox for Bulk Mode */}
                    {isBulkMode && (
                      <div
                        onClick={(e) => toggleSelectId(rec.id, e)}
                        className="p-1 text-slate-400 hover:text-white cursor-pointer shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-indigo-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                    )}

                    {/* Caller Avatar / Play indicator */}
                    <div
                      className={`relative flex items-center justify-center w-11 h-11 rounded-xl shrink-0 font-bold text-sm transition-transform ${
                        isCurrentPlaying
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {isCurrentPlaying ? (
                        <div className="flex items-center space-x-0.5">
                          <span className="w-1 h-3 bg-white rounded-full animate-bounce" />
                          <span className="w-1 h-4 bg-white rounded-full animate-bounce [animation-delay:0.15s]" />
                          <span className="w-1 h-2 bg-white rounded-full animate-bounce [animation-delay:0.3s]" />
                        </div>
                      ) : (
                        <span>{rec.callerName.charAt(0)}</span>
                      )}

                      {/* Direction Icon Badge */}
                      <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-slate-900 border border-slate-700">
                        {rec.direction === 'incoming' ? (
                          <PhoneIncoming className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <PhoneOutgoing className="w-3 h-3 text-blue-400" />
                        )}
                      </span>
                    </div>

                    {/* Caller Name & Tag Chips */}
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-100 truncate">
                          {rec.callerName}
                        </h4>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${appMeta.badgeBg}`}>
                          {appMeta.name}
                        </span>

                        {/* Quality Preset Badge */}
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {presetBadge}
                        </span>

                        {rec.isStarred && (
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                        )}
                      </div>

                      {/* Assigned Tags Chips Inline */}
                      <div className="flex items-center space-x-1.5 mt-1 flex-wrap gap-y-1">
                        {rec.tags?.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center text-[10px] px-1.5 py-0.2 bg-slate-800 border border-slate-700/80 text-indigo-300 rounded-md font-medium"
                          >
                            #{t}
                            <button
                              onClick={(e) => handleRemoveTagFromRecord(rec, t, e)}
                              className="ml-1 text-slate-400 hover:text-rose-400"
                              title={`Hapus tag #${t}`}
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}

                        {/* Quick Tag Adder button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTagCardId(activeTagCardId === rec.id ? null : rec.id);
                          }}
                          className="inline-flex items-center text-[10px] px-1.5 py-0.2 bg-slate-800/60 hover:bg-slate-750 text-slate-400 hover:text-slate-200 rounded-md border border-dashed border-slate-700 transition"
                          title="Tambah tag ke rekaman ini"
                        >
                          <Plus className="w-2.5 h-2.5 mr-0.5" />
                          Tag
                        </button>
                      </div>

                      {/* Subtitle details: Number, duration, file size */}
                      <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                        <span className="truncate">{rec.phoneNumber}</span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-slate-500" />
                          {formatDuration(rec.duration)}
                        </span>
                        <span>•</span>
                        <span>{formatFileSize(rec.fileSize)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions & Multi-Cloud Status */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {/* Timestamp & Multi-cloud Badges */}
                    <div className="text-right hidden sm:block">
                      <p className="text-[11px] text-slate-400">
                        {formatDateDisplay(rec.timestamp)}
                      </p>
                      <div className="flex items-center justify-end space-x-1 mt-0.5">
                        {rec.cloudSync.status === 'synced' ? (
                          <span className="inline-flex items-center text-[10px] text-emerald-400 font-medium bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {rec.cloudSync.syncedProviders && rec.cloudSync.syncedProviders.length > 0
                              ? rec.cloudSync.syncedProviders.join(' & ')
                              : rec.cloudSync.provider || 'Cloud'}
                          </span>
                        ) : (
                          <button
                            onClick={(e) => handleSyncClick(rec, e)}
                            className="inline-flex items-center text-[10px] text-amber-400 hover:text-amber-300 font-medium bg-amber-950/40 hover:bg-amber-900/40 px-2 py-0.5 rounded-md border border-amber-500/30 transition cursor-pointer"
                            title="Unggah ke cloud sekarang"
                          >
                            {syncingId === rec.id ? (
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Cloud className="w-3 h-3 mr-1" />
                            )}
                            {isId ? 'Sinkron' : 'Sync'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick Play Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRecord(rec);
                      }}
                      className={`p-2 rounded-xl border transition cursor-pointer ${
                        isCurrentPlaying
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border-slate-700'
                      }`}
                      title={isCurrentPlaying ? 'Sedang Diputar' : 'Putar Rekaman Ini'}
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>

                    {/* Download MP3 Button */}
                    <button
                      onClick={(e) => handleDownloadMp3(rec, e)}
                      className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition cursor-pointer"
                      title={isId ? 'Unduh Berkas MP3 ke Perangkat' : 'Download MP3 to device'}
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {/* Star Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar(rec.id);
                      }}
                      className="p-2 text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition cursor-pointer"
                      title={rec.isStarred ? 'Hapus bintang' : 'Tandai bintang'}
                    >
                      <Star className={`w-4 h-4 ${rec.isStarred ? 'text-amber-400 fill-amber-400' : ''}`} />
                    </button>

                    {/* Single Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemToDelete({ id: rec.id, title: rec.title });
                      }}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition cursor-pointer"
                      title={isId ? 'Hapus rekaman ini' : 'Delete recording'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Expand Details Arrow */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(isExpanded ? null : rec.id);
                      }}
                      className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Inline Quick Tag Adder Popover */}
                {activeTagCardId === rec.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="px-4 py-2.5 bg-slate-800/95 border-t border-slate-700/80 flex flex-wrap items-center gap-2 text-xs"
                  >
                    <span className="text-slate-400 font-medium">
                      {isId ? 'Pilih atau ketik tag:' : 'Select or type tag:'}
                    </span>

                    {/* Preset tags quick pills */}
                    {['Work', 'Personal', 'Important', 'Meeting', 'Family', 'VIP'].map((preset) => {
                      const hasIt = rec.tags?.includes(preset);
                      return (
                        <button
                          key={preset}
                          onClick={() => {
                            if (hasIt) {
                              onUpdateRecord({
                                ...rec,
                                tags: rec.tags.filter((t) => t !== preset),
                              });
                            } else {
                              handleAddTagToRecord(rec, preset);
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition cursor-pointer ${
                            hasIt
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'bg-slate-700/80 border-slate-600 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {hasIt ? `✓ #${preset}` : `+#${preset}`}
                        </button>
                      );
                    })}

                    {/* Custom tag input */}
                    <div className="flex items-center space-x-1.5 ml-auto">
                      <input
                        type="text"
                        value={newCustomTag}
                        onChange={(e) => setNewCustomTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddTagToRecord(rec, newCustomTag);
                        }}
                        placeholder={isId ? 'Tag baru...' : 'New tag...'}
                        className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-indigo-500 w-28"
                      />
                      <button
                        onClick={() => handleAddTagToRecord(rec, newCustomTag)}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-md text-xs cursor-pointer"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => setActiveTagCardId(null)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="px-4 pb-4 pt-2 border-t border-slate-800/80 bg-slate-950/40 text-xs space-y-3"
                  >
                    {/* Location & Tags */}
                    <div className="flex flex-wrap items-center gap-2">
                      {rec.locationTag && (
                        <span className="flex items-center text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                          <MapPin className="w-3 h-3 mr-1 text-rose-400" />
                          {rec.locationTag}
                        </span>
                      )}

                      {rec.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md"
                        >
                          <Tag className="w-3 h-3 mr-1 text-indigo-400" />
                          #{tag}
                        </span>
                      ))}

                      {rec.bookmarks?.length > 0 && (
                        <span className="flex items-center text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-md">
                          <Bookmark className="w-3 h-3 mr-1 text-amber-400" />
                          {rec.bookmarks.length} {isId ? 'Bookmark waktu' : 'Bookmarks'}
                        </span>
                      )}
                    </div>

                    {/* Bookmarks Timeline if any */}
                    {rec.bookmarks && rec.bookmarks.length > 0 && (
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                        <p className="font-semibold text-slate-300">
                          {isId ? 'Titik Penanda Waktu (Bookmarks):' : 'Time Bookmarks:'}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {rec.bookmarks.map((bm) => (
                            <div
                              key={bm.id}
                              className="flex items-center justify-between bg-slate-800/80 px-2 py-1 rounded-md text-[11px]"
                            >
                              <span className="text-slate-300 truncate">{bm.label}</span>
                              <span className="font-mono text-amber-400 ml-2">
                                {formatDuration(bm.time)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes area */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-300">
                          {isId ? 'Catatan Rekaman:' : 'Call Notes:'}
                        </span>
                        {editingNoteId !== rec.id && (
                          <button
                            onClick={() => {
                              setEditingNoteId(rec.id);
                              setTempNote(rec.notes || '');
                            }}
                            className="flex items-center text-indigo-400 hover:text-indigo-300 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            {isId ? 'Edit Catatan' : 'Edit'}
                          </button>
                        )}
                      </div>

                      {editingNoteId === rec.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={tempNote}
                            onChange={(e) => setTempNote(e.target.value)}
                            rows={2}
                            className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                            placeholder={isId ? 'Tulis catatan tentang percakapan ini...' : 'Write notes about this conversation...'}
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="px-2.5 py-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                            >
                              {isId ? 'Batal' : 'Cancel'}
                            </button>
                            <button
                              onClick={() => handleSaveNote(rec)}
                              className="flex items-center px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold cursor-pointer"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              {isId ? 'Simpan' : 'Save'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-300 italic">
                          {rec.notes || (isId ? 'Belum ada catatan untuk rekaman ini.' : 'No notes added yet.')}
                        </p>
                      )}
                    </div>

                    {/* Bottom Action bar */}
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[11px] text-slate-500">
                        Preset: {rec.qualityPreset || 'Standar'} • Bitrate: {rec.bitrate} kbps • Sample: {rec.sampleRate} Hz
                      </span>

                      <button
                        onClick={() => setItemToDelete({ id: rec.id, title: rec.title })}
                        className="flex items-center space-x-1 text-rose-400 hover:text-rose-300 text-xs px-2.5 py-1 rounded-lg hover:bg-rose-950/40 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isId ? 'Hapus Rekaman' : 'Delete'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
