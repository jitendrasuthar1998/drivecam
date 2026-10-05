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
} from 'lucide-react';
import type { CapturedItem, GoogleDriveConfig } from '../types/camera';
import { formatBytes, formatDuration } from '../utils/storage';

interface GalleryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CapturedItem[];
  onSelectItem: (item: CapturedItem) => void;
  onSaveItem: (item: CapturedItem) => void;
  onUploadItem: (item: CapturedItem) => void;
  onDeleteItem: (id: string) => void;
  driveConfig: GoogleDriveConfig;
}

export const GalleryDrawer: React.FC<GalleryDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onSelectItem,
  onSaveItem,
  onUploadItem,
  onDeleteItem,
  driveConfig,
}) => {
  const [filter, setFilter] = useState<'all' | 'video' | 'photo'>('all');

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    if (filter === 'video') return item.type === 'video';
    if (filter === 'photo') return item.type === 'photo';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Media Library</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {items.length}
            </span>
            {driveConfig.accessToken && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-medium">
                Cloud
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close Gallery"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FILTER BAR */}
        <div className="flex items-center gap-1 px-4 py-2.5 border-b border-slate-800/80 bg-slate-950/20">
          {(['all', 'video', 'photo'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === mode
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode === 'all' ? 'All Takes' : `${mode}s`}
            </button>
          ))}
        </div>

        {/* ITEMS LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Camera className="w-12 h-12 mb-3 text-slate-700" />
              <p className="text-sm font-semibold text-slate-400">No Captures Yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Photos and video clips captured in DriveCam will appear here with instant local and Drive sync options.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="group relative bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-3 flex gap-3 transition-all hover:bg-slate-950"
              >
                {/* Thumbnail with Click to preview */}
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

                  {/* Duration badge for video */}
                  {item.type === 'video' && (
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/80 font-mono text-[9px] text-white">
                      {formatDuration(item.duration || 0)}
                    </span>
                  )}
                </div>

                {/* Details & Actions */}
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

                    {/* Google Drive Status */}
                    <div className="mt-1.5">
                      {item.uploadedToDrive ? (
                        <div className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Synced to Drive</span>
                          {item.driveViewLink && (
                            <a
                              href={item.driveViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 ml-1"
                              title="Open in Google Drive"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                          <HardDrive className="w-3 h-3 text-slate-500" />
                          <span>Local On-Device</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action Buttons */}
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
          )}
        </div>
      </div>
    </div>
  );
};
