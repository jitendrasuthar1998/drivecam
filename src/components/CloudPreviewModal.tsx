import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  ExternalLink,
  Edit2,
  Trash2,
  Film,
  Camera,
  Cloud,
  Check,
  RefreshCw,
} from 'lucide-react';
import type { DriveCloudItem, GoogleDriveConfig } from '../types/camera';
import { formatBytes, formatDuration, triggerBlobDownload } from '../utils/storage';
import { fetchDriveMediaBlob, renameDriveFile, deleteDriveFile } from '../utils/googleDrive';

interface CloudPreviewModalProps {
  item: DriveCloudItem | null;
  isOpen: boolean;
  onClose: () => void;
  driveConfig: GoogleDriveConfig;
  onFileRenamed: (id: string, newName: string) => void;
  onFileDeleted: (id: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const CloudPreviewModal: React.FC<CloudPreviewModalProps> = ({
  item,
  isOpen,
  onClose,
  driveConfig,
  onFileRenamed,
  onFileDeleted,
  onShowToast,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [useIframeFallback, setUseIframeFallback] = useState(false);

  useEffect(() => {
    if (item && isOpen) {
      setFileName(item.name);
      setIsEditingName(false);
      setUseIframeFallback(false);

      // Fetch media blob for native HTML5 video/photo playback
      let isSubscribed = true;
      setIsLoadingMedia(true);
      setBlobUrl(null);

      fetchDriveMediaBlob(item.id, driveConfig)
        .then((blob) => {
          if (isSubscribed) {
            const url = URL.createObjectURL(blob);
            setBlobUrl(url);
            setIsLoadingMedia(false);
          }
        })
        .catch((err) => {
          console.warn('Native stream fetch error, falling back to Google Drive embed:', err);
          if (isSubscribed) {
            setUseIframeFallback(true);
            setIsLoadingMedia(false);
          }
        });

      return () => {
        isSubscribed = false;
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }
      };
    } else {
      setBlobUrl(null);
    }
  }, [item?.id, isOpen]);

  if (!isOpen || !item) return null;

  const handleRename = async () => {
    if (!fileName.trim() || fileName === item.name) {
      setIsEditingName(false);
      return;
    }

    try {
      setIsRenaming(true);
      await renameDriveFile(item.id, fileName.trim(), driveConfig);
      onFileRenamed(item.id, fileName.trim());
      setIsEditingName(false);
      onShowToast('success', 'File Renamed', `File renamed to "${fileName.trim()}" on Google Drive.`);
    } catch (err: unknown) {
      const error = err as Error;
      onShowToast('error', 'Rename Failed', error.message || 'Could not rename file on Google Drive.');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}" from Google Drive?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteDriveFile(item.id, driveConfig);
      onFileDeleted(item.id);
      onClose();
      onShowToast('info', 'File Deleted', `Deleted "${item.name}" from Google Drive.`);
    } catch (err: unknown) {
      const error = err as Error;
      onShowToast('error', 'Delete Failed', error.message || 'Could not delete file from Google Drive.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async () => {
    try {
      if (blobUrl) {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = item.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const blob = await fetchDriveMediaBlob(item.id, driveConfig);
        triggerBlobDownload(blob, item.name);
      }
      onShowToast('success', 'Download Started', `Downloading "${item.name}" to your device.`);
    } catch (err: unknown) {
      const error = err as Error;
      onShowToast('error', 'Download Error', error.message || 'Failed to download file.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/70 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold tracking-wider text-cyan-300 uppercase">
              Google Drive Cloud Media
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

        {/* MEDIA PREVIEW CANVAS / EMBED PLAYER */}
        <div className="relative flex-1 min-h-[260px] max-h-[50vh] bg-black flex items-center justify-center overflow-hidden">
          {isLoadingMedia ? (
            <div className="flex flex-col items-center justify-center gap-3 p-6 text-slate-400">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-xs font-medium">Streaming from Google Drive...</p>
            </div>
          ) : useIframeFallback ? (
            <iframe
              src={`https://drive.google.com/file/d/${item.id}/preview`}
              className="w-full h-full min-h-[300px] border-0"
              allow="autoplay"
              title={item.name}
            />
          ) : item.type === 'video' ? (
            <video
              src={blobUrl || undefined}
              controls
              autoPlay
              playsInline
              className="w-full h-full max-h-[50vh] object-contain"
            />
          ) : (
            <img
              src={blobUrl || item.thumbnailLink || undefined}
              alt={item.name}
              className="w-full h-full max-h-[50vh] object-contain"
            />
          )}
        </div>

        {/* METADATA & ACTIONS */}
        <div className="p-5 flex flex-col gap-4 bg-slate-900 overflow-y-auto">
          {/* Filename Bar with Inline Rename */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                {item.type === 'video' ? (
                  <Film className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>Cloud File Name</span>
              </span>

              {!isEditingName ? (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors text-xs"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Rename on Drive</span>
                </button>
              ) : null}
            </div>

            {isEditingName ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/50 text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  autoFocus
                />
                <button
                  onClick={handleRename}
                  disabled={isRenaming}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1"
                >
                  {isRenaming ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  <span>Save</span>
                </button>
                <button
                  onClick={() => {
                    setFileName(item.name);
                    setIsEditingName(false);
                  }}
                  className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <p className="font-mono text-sm text-white font-medium truncate select-all">
                {item.name}
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
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Cloud Storage</p>
              <p className="text-xs font-semibold text-cyan-300 mt-0.5">Google Drive</p>
            </div>
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                {item.type === 'video' ? 'Duration' : 'Uploaded'}
              </p>
              <p className="text-xs font-semibold text-slate-200 mt-0.5">
                {item.type === 'video' && item.duration
                  ? formatDuration(item.duration)
                  : new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            {/* Download */}
            <button
              onClick={handleDownload}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-all active:scale-95 border border-slate-700 shadow-md"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Download File</span>
            </button>

            {/* Open in Google Drive */}
            <a
              href={item.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-all active:scale-95 shadow-lg shadow-cyan-900/30"
            >
              <span>Open in Drive</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Delete button */}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-3 rounded-xl bg-slate-950/60 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/50 transition-colors disabled:opacity-50"
              title="Delete from Google Drive"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
