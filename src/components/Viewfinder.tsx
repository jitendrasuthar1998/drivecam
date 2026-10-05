import React from 'react';
import {
  SwitchCamera,
  Mic,
  MicOff,
  Cloud,
  CloudCheck,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { AspectRatioOption, CaptureMode } from '../types/camera';
import { formatDuration } from '../utils/storage';

interface ViewfinderProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  mode: CaptureMode;
  isRecording: boolean;
  recordingDuration: number;
  audioLevel: number;
  isMuted: boolean;
  onToggleMute: () => void;
  showGrid: boolean;
  isFlashActive: boolean;
  isDriveConnected: boolean;
  isDriveAutoUpload: boolean;
  onFlipCamera: () => void;
  hasMultipleCameras: boolean;
  currentCameraLabel?: string;
  activeResolutionLabel: string;
  isAudioFiltered: boolean;
  aspectRatio: AspectRatioOption;
  isMobile: boolean;
  videoLoaded: boolean;
}

export const Viewfinder: React.FC<ViewfinderProps> = ({
  videoRef,
  mode,
  isRecording,
  recordingDuration,
  audioLevel,
  isMuted,
  onToggleMute,
  showGrid,
  isFlashActive,
  isDriveConnected,
  isDriveAutoUpload,
  onFlipCamera,
  hasMultipleCameras,
  currentCameraLabel,
  activeResolutionLabel,
  isAudioFiltered,
  aspectRatio,
  isMobile,
  videoLoaded,
}) => {
  // Determine aspect ratio container styling for desktop
  const getAspectRatioClasses = () => {
    if (isMobile) return 'w-full h-full';
    switch (aspectRatio) {
      case '16:9':
        return 'aspect-video max-w-5xl max-h-[76vh] w-full';
      case '4:3':
        return 'aspect-4/3 max-w-4xl max-h-[76vh] w-full';
      case '1:1':
        return 'aspect-square max-w-2xl max-h-[76vh] w-full';
      case 'fill':
      default:
        return 'w-full h-full max-h-[82vh]';
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black select-none">
      {/* Viewfinder Framer Container */}
      <div
        className={`relative flex items-center justify-center overflow-hidden rounded-none md:rounded-3xl border-0 md:border md:border-slate-800/80 shadow-2xl transition-all duration-300 ${getAspectRatioClasses()}`}
      >
        {/* Active Camera Video Track */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            videoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Loading Spinner when camera starts */}
        {!videoLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 text-slate-400">
            <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
            <p className="text-xs font-medium tracking-wider text-slate-400">INITIALIZING SENSOR...</p>
          </div>
        )}

        {/* Shutter Flash Animation overlay */}
        {isFlashActive && (
          <div className="absolute inset-0 bg-white pointer-events-none animate-shutter-flash z-30" />
        )}

        {/* Rule of Thirds Grid Lines */}
        {showGrid && (
          <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-3 grid-rows-3">
            <div className="border-r border-b border-white/15" />
            <div className="border-r border-b border-white/15" />
            <div className="border-b border-white/15" />
            <div className="border-r border-b border-white/15" />
            <div className="border-r border-b border-white/15" />
            <div className="border-b border-white/15" />
            <div className="border-r border-white/15" />
            <div className="border-r border-white/15" />
            <div />
          </div>
        )}

        {/* Center Target Reticle */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 opacity-30">
          <div className="w-12 h-12 border border-white/40 rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-white rounded-full" />
          </div>
        </div>

        {/* TOP FLOATING OVERLAYS */}
        <div className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 z-20 flex items-center justify-between gap-2 pointer-events-none">
          {/* Left Top: Recording indicator OR Mode badge */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {isRecording ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-950/80 border border-rose-500/50 backdrop-blur-md shadow-lg shadow-rose-950/50">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-record-pulse" />
                <span className="font-mono text-xs font-semibold text-rose-100 tracking-wider">
                  REC {formatDuration(recordingDuration)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/70 border border-white/10 backdrop-blur-md text-xs text-slate-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="uppercase tracking-wider font-semibold text-[11px] text-white">
                  {mode}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-[11px] text-slate-300">{activeResolutionLabel}</span>
              </div>
            )}

            {/* Studio Audio Filter Badge */}
            {isAudioFiltered && (
              <div
                title="Studio 80Hz High-Pass Filter active (reduces wind & rumble)"
                className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-cyan-950/70 border border-cyan-500/30 backdrop-blur-md text-[10px] text-cyan-300 font-mono font-medium"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>80Hz HPF</span>
              </div>
            )}
          </div>

          {/* Right Top: Cloud status + Audio VU meter */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Real-time Audio Level VU Meter */}
            {!isMuted && mode === 'video' && (
              <div
                title={`Mic input level: ${audioLevel}%`}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/70 border border-white/10 backdrop-blur-md"
              >
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                {/* 5-bar dynamic VU meter */}
                <div className="flex items-end gap-0.5 h-3.5 w-7">
                  {[20, 40, 60, 80, 95].map((threshold, idx) => {
                    const active = audioLevel >= threshold;
                    let color = 'bg-emerald-400';
                    if (idx >= 3) color = 'bg-amber-400';
                    if (idx === 4) color = 'bg-rose-500';

                    return (
                      <div
                        key={idx}
                        className={`w-1 rounded-xs transition-all duration-75 ${
                          active ? color : 'bg-slate-700/60'
                        }`}
                        style={{ height: `${(idx + 1) * 20}%` }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mic Toggle Button */}
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              className={`p-2 rounded-full backdrop-blur-md transition-all ${
                isMuted
                  ? 'bg-rose-950/80 text-rose-400 border border-rose-500/40 hover:bg-rose-900/90'
                  : 'bg-slate-900/70 text-slate-200 border border-white/10 hover:bg-slate-800/90'
              }`}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            {/* Google Drive Status Indicator */}
            <div
              title={
                isDriveConnected
                  ? `Google Drive synced${isDriveAutoUpload ? ' (Auto-upload active)' : ''}`
                  : 'Google Drive not connected (Saving to Device)'
              }
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md text-[11px] font-medium border ${
                isDriveConnected
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30'
                  : 'bg-slate-900/70 text-slate-400 border-white/10'
              }`}
            >
              {isDriveConnected ? (
                <>
                  <CloudCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Drive {isDriveAutoUpload ? 'Auto' : 'Sync'}</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Local</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM VIEWPORT OVERLAYS */}
        <div className="absolute bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-4 z-20 flex items-center justify-between pointer-events-none">
          {/* Active Lens / Camera Name Pill */}
          {currentCameraLabel && (
            <div className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/60 border border-white/10 backdrop-blur-md text-[10px] text-slate-300 max-w-[200px] sm:max-w-xs truncate">
              <Layers className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">{currentCameraLabel}</span>
            </div>
          )}

          {/* Quick Flip Floating Button (Especially visible & ergonomic on mobile) */}
          {hasMultipleCameras && (
            <button
              onClick={onFlipCamera}
              className="pointer-events-auto flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-900/80 hover:bg-slate-800 active:scale-90 border border-white/15 text-white backdrop-blur-md shadow-lg transition-transform ml-auto"
              title="Flip to next camera lens"
              aria-label="Flip Camera"
            >
              <SwitchCamera className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold">Flip</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
