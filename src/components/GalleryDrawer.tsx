import React, { useState } from 'react';
import {
  X,
  Play,
  Download,
  CloudUpload,
  ExternalLink,
  Trash2,
  Film,
  Camera,
  CheckCircle2,
  HardDrive,
  FolderArchive,
  Cloud,
  RefreshCw,
  Edit2,
  Check,
} from 'lucide-react';
import type { CapturedItem, DriveCloudItem, GoogleDriveConfig } from '../types/camera';
import { formatBytes, formatDuration } from '../utils/storage';

interface GalleryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CapturedItem[];
  cloudItems: DriveCloudItem[];
  isLoadingCloud: boolean;
  onRefreshCloud: () => void;
  onSelectItem: (item: CapturedItem) => void;
  onSelectCloudItem: (item: DriveCloudItem) => void;
  onSaveItem: (item: CapturedItem) => void;
  onUploadItem: (item: CapturedItem) => void;
  onDeleteItem: (id: string) => void;
  onDeleteCloudItem: (id: string) => void;
  onRenameCloudItem: (id: string, newName: string) => void;
  onOpenSettings: () => void;
  driveConfig: GoogleDriveConfig;
}

export const GalleryDrawer: React.FC<GalleryDrawerProps> = ({
  isOpen,
  onClose,
  items,
  cloudItems,
  isLoadingCloud,
  onRefreshCloud,
  onSelectItem,
  onSelectCloudItem,
  onSaveItem,
  onUploadItem,
  onDeleteItem,
  onDeleteCloudItem,
  onRenameCloudItem,
  onOpenSettings,
  driveConfig,
}) => {
  const [sourceTab, setSourceTab] = useState<'cloud' | 'local'>('cloud');
  const [filter, setFilter] = useState<'all' | 'video' | 'photo'>('all');
  const [editingCloudId, setEditingCloudId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  if (!isOpen) return null;

  const isConnected = !!driveConfig.accessToken;

  // Filter items
  const filteredLocalItems = items.filter((item) => {
    if (filter === 'video') return item.type === 'video';
    if (filter === 'photo') return item.type === 'photo';
    return true;
  });

  const filteredCloudItems = cloudItems.filter((item) => {
    if (filter === 'video') return item.type === 'video';
    if (filter === 'photo') return item.type === 'photo';
    return true;
  });

  const handleStartRename = (item: DriveCloudItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCloudId(item.id);
    setEditingName(item.name);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingName.trim()) {
      onRenameCloudItem(id, editingName.trim());
    }
    setEditingCloudId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Media Library</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close Gallery"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRIMARY STORAGE TAB: GOOGLE DRIVE CLOUD vs LOCAL */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800">
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setSourceTab('cloud')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                sourceTab === 'cloud'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cloud className="w-4 h-4 text-cyan-400" />
              <span>Google Drive Cloud</span>
              {isConnected && (
                <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
                  {cloudItems.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setSourceTab('local')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                sourceTab === 'local'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HardDrive className="w-4 h-4 text-slate-300" />
              <span>On-Device Local</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300 text-[10px] font-mono">
                {items.length}
              </span>
            </button>
          </div>
        </div>

        {/* SUB FILTER BAR & CLOUD REFRESH */}
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-slate-800/80 bg-slate-950/20">
          <div className="flex items-center gap-1 flex-1">
            {(['all', 'video', 'photo'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                  filter === mode
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode === 'all' ? 'All' : `${mode}s`}
              </button>
            ))}
          </div>

          {sourceTab === 'cloud' && isConnected && (
            <button
              onClick={onRefreshCloud}
              disabled={isLoadingCloud}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Refresh Google Drive files"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCloud ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
        </div>

        {/* ITEMS LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sourceTab === 'cloud' ? (
            /* =================== GOOGLE DRIVE CLOUD VIEW =================== */
            !isConnected ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-16 h-16 rounded-2xl bg-cyan-950/50 border border-cyan-800/40 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-950/50">
                  <Cloud className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Google Drive Not Connected</h3>
                <p className="text-xs text-slate-400 mb-6 max-w-xs leading-relaxed">
                  Connect your Google Drive in Settings to view, play, rename, and manage all your uploaded DriveCam videos and photos directly here.
                </p>
                <button
                  onClick={onOpenSettings}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-lg shadow-cyan-900/30"
                >
                  Connect Google Drive
                </button>
              </div>
            ) : isLoadingCloud && cloudItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 gap-3">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                <p className="text-xs font-medium">Fetching Google Drive videos & photos...</p>
              </div>
            ) : filteredCloudItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Cloud className="w-12 h-12 mb-3 text-slate-700" />
                <p className="text-sm font-semibold text-slate-400">No Cloud Files Found</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Record a video or snap a photo and sync to Google Drive. Uploaded takes will appear here.
                </p>
                <button
                  onClick={onRefreshCloud}
                  className="mt-4 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Check Again</span>
                </button>
              </div>
            ) : (
              filteredCloudItems.map((cItem) => (
                <div
                  key={cItem.id}
                  className="group relative bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-3 flex gap-3 transition-all hover:bg-slate-950 shadow-md"
                >
                  {/* Thumbnail / Play trigger */}
                  <div
                    onClick={() => onSelectCloudItem(cItem)}
                    className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-black shrink-0 cursor-pointer group-hover:ring-1 group-hover:ring-cyan-500 transition-all flex items-center justify-center"
                  >
                    {cItem.thumbnailLink ? (
                      <img
                        src={cItem.thumbnailLink}
                        alt={cItem.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-600">
                        {cItem.type === 'video' ? <Film className="w-8 h-8" /> : <Camera className="w-8 h-8" />}
                      </div>
                    )}

                    {cItem.type === 'video' && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-cyan-600/90 backdrop-blur-xs flex items-center justify-center text-white shadow-lg">
                          <Play className="w-4 h-4 ml-0.5 fill-current" />
                        </div>
                      </div>
                    )}

                    {cItem.type === 'video' && cItem.duration && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/80 font-mono text-[9px] text-white">
                        {formatDuration(cItem.duration)}
                      </span>
                    )}
                  </div>

                  {/* Details & Actions */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      {/* Name or Inline Rename */}
                      {editingCloudId === cItem.id ? (
                        <div className="flex items-center gap-1 mb-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1 px-2 py-0.5 rounded bg-slate-900 border border-cyan-500 text-white font-mono text-xs focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={(e) => handleSaveRename(cItem.id, e)}
                            className="p-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs"
                            title="Save Rename"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCloudId(null);
                            }}
                            className="p-1 rounded bg-slate-800 text-slate-300 text-xs"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {cItem.type === 'video' ? (
                              <Film className="w-3 h-3 text-rose-400 shrink-0" />
                            ) : (
                              <Camera className="w-3 h-3 text-cyan-400 shrink-0" />
                            )}
                            <p
                              onClick={() => onSelectCloudItem(cItem)}
                              className="text-xs font-semibold text-white truncate cursor-pointer hover:text-cyan-300 transition-colors"
                              title={cItem.name}
                            >
                              {cItem.name}
                            </p>
                          </div>
                          <button
                            onClick={(e) => handleStartRename(cItem, e)}
                            className="p-1 rounded text-slate-500 hover:text-cyan-400 transition-colors"
                            title="Rename on Drive"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span>{formatBytes(cItem.size)}</span>
                        <span>•</span>
                        <span>{new Date(cItem.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>

                      <div className="mt-1 flex items-center gap-1 text-[10px] text-cyan-300 font-medium">
                        <Cloud className="w-3 h-3 text-cyan-400" />
                        <span>Google Drive Cloud</span>
                        <a
                          href={cItem.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-cyan-400 hover:text-cyan-300 ml-1 inline-flex items-center gap-0.5"
                          title="Open in Google Drive"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>

                    {/* Card Action Buttons */}
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-800/60">
                      <button
                        onClick={() => onSelectCloudItem(cItem)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-colors"
                        title="Stream & Play"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Play</span>
                      </button>

                      <a
                        href={cItem.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                        title="Open directly in Google Drive"
                      >
                        <ExternalLink className="w-3 h-3 text-cyan-400" />
                        <span>Drive</span>
                      </a>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete "${cItem.name}" from Google Drive?`)) {
                            onDeleteCloudItem(cItem.id);
                          }
                        }}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors ml-auto"
                        title="Delete from Google Drive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            /* =================== ON-DEVICE LOCAL VIEW =================== */
            filteredLocalItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <HardDrive className="w-12 h-12 mb-3 text-slate-700" />
                <p className="text-sm font-semibold text-slate-400">No Local Captures</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Files saved directly to your browser memory will show up here.
                </p>
              </div>
            ) : (
              filteredLocalItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-3 flex gap-3 transition-all hover:bg-slate-950"
                >
                  <div
                    onClick={() => onSelectItem(item)}
                    className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-black shrink-0 cursor-pointer group-hover:ring-1 group-hover:ring-cyan-500 transition-all flex items-center justify-center"
                  >
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    {item.type === 'video' && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-full bg-slate-900/80 backdrop-blur-xs flex items-center justify-center text-white">
                          <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                        </div>
                      </div>
                    )}

                    {item.type === 'video' && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/80 font-mono text-[9px] text-white">
                        {formatDuration(item.duration || 0)}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        {item.type === 'video' ? (
                          <Film className="w-3 h-3 text-rose-400 shrink-0" />
                        ) : (
                          <Camera className="w-3 h-3 text-cyan-400 shrink-0" />
                        )}
                        <p
                          onClick={() => onSelectItem(item)}
                          className="text-xs font-semibold text-white truncate cursor-pointer hover:text-cyan-300 transition-colors"
                          title={item.name}
                        >
                          {item.name}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span>{formatBytes(item.size)}</span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className="mt-1.5">
                        {item.uploadedToDrive ? (
                          <div className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Synced to Drive</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                            <HardDrive className="w-3 h-3 text-slate-500" />
                            <span>Local On-Device</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-800/60">
                      <button
                        onClick={() => onSaveItem(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                        title="Download to device"
                      >
                        <Download className="w-3 h-3 text-cyan-400" />
                        <span>Save</span>
                      </button>

                      <button
                        onClick={() => onUploadItem(item)}
                        disabled={item.isUploading}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-colors disabled:opacity-50"
                        title="Upload to Google Drive"
                      >
                        <CloudUpload className="w-3 h-3" />
                        <span>{item.uploadedToDrive ? 'Re-Sync' : 'Drive'}</span>
                      </button>

                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors ml-auto"
                        title="Delete take"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};
