import React, { useState } from 'react';
import {
  X,
  Download,
  CloudUpload,
  CheckCircle2,
  ExternalLink,
  Edit2,
  Trash2,
  Share2,
  Film,
  Camera,
} from 'lucide-react';
import type { CapturedItem, GoogleDriveConfig } from '../types/camera';
import { formatBytes, formatDuration } from '../utils/storage';

interface PreviewModalProps {
  item: CapturedItem;
  isOpen: boolean;
  onClose: () => void;
  onSaveToDevice: (item: CapturedItem, customName: string) => void;
  onUploadToDrive: (item: CapturedItem, customName: string) => Promise<void>;
  onDeleteItem: (id: string) => void;
  driveConfig: GoogleDriveConfig;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  item,
  isOpen,
  onClose,
  onSaveToDevice,
  onUploadToDrive,
  onDeleteItem,
  driveConfig,
}) => {
  const [fileName, setFileName] = useState(item.name);
  const [isEditingName, setIsEditingName] = useState(false);

  if (!isOpen) return null;

  // Separate name from extension
  const extensionMatch = item.name.match(/\.[^.]+$/);
  const extension = extensionMatch ? extensionMatch[0] : item.type === 'video' ? '.webm' : '.jpg';
  const rawBaseName = fileName.replace(/\.[^.]+$/, '');

  const handleBaseNameChange = (val: string) => {
    // Sanitize filename to avoid slashes and forbidden characters
    const clean = val.replace(/[/\\?%*:|"<>]/g, '_');
    setFileName(clean + extension);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        const file = new File([item.blob], fileName, { type: item.mimeType });
        await navigator.share({
          files: [file],
          title: fileName,
          text: `Captured with DriveCam: ${fileName}`,
        });
      } catch {
        // user cancelled or share failed
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/70 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            {item.type === 'video' ? (
              <Film className="w-4 h-4 text-rose-400" />
            ) : (
              <Camera className="w-4 h-4 text-cyan-400" />
            )}
            <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
              {item.type === 'video' ? 'Recorded Clip' : 'Captured Photo'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MEDIA PREVIEW CANVAS / PLAYER */}
        <div className="relative flex-1 min-h-[240px] max-h-[50vh] bg-black flex items-center justify-center overflow-hidden">
          {item.type === 'video' ? (
            <video
              src={item.previewUrl}
              controls
              playsInline
              className="w-full h-full max-h-[50vh] object-contain"
            />
          ) : (
            <img
              src={item.previewUrl}
              alt="Preview"
              className="w-full h-full max-h-[50vh] object-contain"
            />
          )}

          {/* Uploading overlay indicator */}
          {item.isUploading && (
            <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-6 text-center z-10">
              <div className="w-12 h-12 rounded-full border-3 border-cyan-500/20 border-t-cyan-500 animate-spin" />
              <p className="text-sm font-semibold text-white">
                Uploading to Google Drive... {item.uploadProgress || 0}%
              </p>
              <div className="w-64 max-w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${item.uploadProgress || 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* METADATA & FILENAME EDITOR */}
        <div className="p-5 flex flex-col gap-4 bg-slate-900 overflow-y-auto">
          {/* Filename Bar */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>File Name</span>
              <button
                onClick={() => setIsEditingName(!isEditingName)}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isEditingName ? 'Done' : 'Rename'}</span>
              </button>
            </div>

            {isEditingName ? (
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="text"
                  value={rawBaseName}
                  onChange={(e) => handleBaseNameChange(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/50 text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  autoFocus
                />
                <span className="font-mono text-sm text-slate-400">{extension}</span>
              </div>
            ) : (
              <p className="font-mono text-sm text-white font-medium truncate select-all">
                {fileName}
              </p>
            )}
          </div>

          {/* Quick Info Tags */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Size</p>
              <p className="text-xs font-semibold text-slate-200 mt-0.5">{formatBytes(item.size)}</p>
            </div>
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Format</p>
              <p className="text-xs font-semibold text-slate-200 mt-0.5">
                {extension.toUpperCase().replace('.', '')}
              </p>
            </div>
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                {item.type === 'video' ? 'Duration' : 'Status'}
              </p>
              <p className="text-xs font-semibold text-slate-200 mt-0.5">
                {item.type === 'video'
                  ? formatDuration(item.duration || 0)
                  : item.uploadedToDrive
                  ? 'Synced'
                  : 'Ready'}
              </p>
            </div>
          </div>

          {/* Google Drive Uploaded Success Banner */}
          {item.uploadedToDrive && item.driveViewLink && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-xs font-medium">Uploaded to Google Drive</span>
              </div>
              <a
                href={item.driveViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors"
              >
                <span>Open in Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            {/* Primary Action 1: Save to Device */}
            <button
              onClick={() => onSaveToDevice(item, fileName)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-all active:scale-95 border border-slate-700 shadow-md"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Save to Device</span>
            </button>

            {/* Primary Action 2: Upload to Google Drive */}
            <button
              onClick={() => onUploadToDrive(item, fileName)}
              disabled={item.isUploading}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 shadow-lg ${
                item.uploadedToDrive
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900/80'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/30'
              } disabled:opacity-50 disabled:pointer-events-none`}
            >
              {item.uploadedToDrive ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Re-Upload to Drive</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4" />
                  <span>
                    {driveConfig.accessToken || driveConfig.useSimulatedMode
                      ? 'Upload to Drive'
                      : 'Sync to Drive'}
                  </span>
                </>
              )}
            </button>

            {/* Share action if available */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleShare}
                className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}

            {/* Delete button */}
            <button
              onClick={() => {
                onDeleteItem(item.id);
                onClose();
              }}
              className="p-3 rounded-xl bg-slate-950/60 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/50 transition-colors"
              title="Delete take"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
