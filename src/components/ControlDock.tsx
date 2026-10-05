import React from 'react';
import { Settings, Image as ImageIcon, Camera, Video } from 'lucide-react';
import type { CaptureMode, CapturedItem } from '../types/camera';

interface ControlDockProps {
  mode: CaptureMode;
  onSetMode: (mode: CaptureMode) => void;
  isRecording: boolean;
  onCapturePhoto: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onOpenSettings: () => void;
  onOpenGallery: () => void;
  lastCapture: CapturedItem | null;
  totalCapturesCount: number;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  mode,
  onSetMode,
  isRecording,
  onCapturePhoto,
  onStartRecording,
  onStopRecording,
  onOpenSettings,
  onOpenGallery,
  lastCapture,
  totalCapturesCount,
}) => {
  const handleShutterClick = () => {
    if (mode === 'photo') {
      onCapturePhoto();
    } else {
      if (isRecording) {
        onStopRecording();
      } else {
        onStartRecording();
      }
    }
  };

  return (
    <div className="w-full bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-xl px-4 py-3 sm:py-4 flex flex-col items-center gap-3 shrink-0 z-30 select-none pb-[calc(1rem+env(safe-area-inset-bottom))]">
      {/* MODE SWITCHER: PHOTO / VIDEO */}
      {!isRecording && (
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-full border border-slate-800 shadow-inner">
          <button
            onClick={() => onSetMode('photo')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all ${
              mode === 'photo'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>PHOTO</span>
          </button>
          <button
            onClick={() => onSetMode('video')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all ${
              mode === 'video'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>VIDEO</span>
          </button>
        </div>
      )}

      {/* MAIN CONTROL BAR */}
      <div className="w-full max-w-md flex items-center justify-between px-2 sm:px-6">
        {/* LEFT: Recent Gallery Thumbnail */}
        <button
          onClick={onOpenGallery}
          className="relative group p-1 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all active:scale-95 flex items-center justify-center w-12 h-12 overflow-hidden shadow-md"
          title="Open Media Gallery"
          aria-label="Recent Captures"
        >
          {lastCapture ? (
            <img
              src={lastCapture.previewUrl}
              alt="Recent thumbnail"
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
          )}

          {totalCapturesCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950 shadow-sm border border-slate-950">
              {totalCapturesCount}
            </span>
          )}
        </button>

        {/* CENTER: Main Shutter / Record Trigger Button */}
        <div className="flex items-center justify-center">
          {mode === 'photo' ? (
            /* PHOTO SHUTTER BUTTON */
            <button
              onClick={handleShutterClick}
              className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full border-4 border-white/80 p-1 flex items-center justify-center group active:scale-95 transition-transform"
              title="Take Photo (Spacebar)"
              aria-label="Capture Photo"
            >
              <div className="w-full h-full rounded-full bg-white group-hover:bg-slate-200 group-active:scale-90 transition-all shadow-lg" />
            </button>
          ) : (
            /* VIDEO RECORD / STOP BUTTON */
            <button
              onClick={handleShutterClick}
              className={`relative w-18 h-18 sm:w-20 sm:h-20 rounded-full border-4 p-1 flex items-center justify-center group active:scale-95 transition-all ${
                isRecording
                  ? 'border-rose-500/80 bg-rose-500/10'
                  : 'border-white/80'
              }`}
              title={isRecording ? 'Stop Recording' : 'Start Recording (Spacebar)'}
              aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
            >
              {isRecording ? (
                /* Recording Stop Square */
                <div className="w-7 h-7 rounded-md bg-rose-500 group-hover:bg-rose-400 shadow-lg shadow-rose-950 animate-pulse" />
              ) : (
                /* Idle Record Red Circle */
                <div className="w-full h-full rounded-full bg-rose-500 group-hover:bg-rose-400 group-active:scale-90 transition-all shadow-lg" />
              )}
            </button>
          )}
        </div>

        {/* RIGHT: Settings Drawer Toggle */}
        <button
          onClick={onOpenSettings}
          className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all active:scale-95 flex items-center justify-center w-12 h-12 shadow-md"
          title="Camera & Google Drive Settings"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
