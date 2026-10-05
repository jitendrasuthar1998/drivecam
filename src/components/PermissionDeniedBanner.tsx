import React from 'react';
import { VideoOff, MicOff, RefreshCw, ShieldAlert, Settings2 } from 'lucide-react';

interface PermissionDeniedBannerProps {
  errorType: 'not_allowed' | 'not_found' | 'in_use' | 'generic';
  errorMessage: string;
  onRetry: () => void;
  onOpenSettings?: () => void;
}

export const PermissionDeniedBanner: React.FC<PermissionDeniedBannerProps> = ({
  errorType,
  errorMessage,
  onRetry,
  onOpenSettings,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-700/60 shadow-2xl text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5 shadow-inner">
          {errorType === 'not_allowed' ? (
            <ShieldAlert className="w-8 h-8" />
          ) : errorType === 'not_found' ? (
            <VideoOff className="w-8 h-8" />
          ) : (
            <MicOff className="w-8 h-8" />
          )}
        </div>

        <h3 className="text-xl font-bold text-white tracking-tight mb-2">
          {errorType === 'not_allowed'
            ? 'Camera & Mic Access Blocked'
            : errorType === 'not_found'
            ? 'No Camera Detected'
            : 'Device Unavailable'}
        </h3>

        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          {errorType === 'not_allowed' ? (
            <>
              DriveCam requires access to your camera and microphone for live recording. Please allow camera and mic permissions in your browser URL bar or system settings.
            </>
          ) : (
            errorMessage || 'Could not connect to camera hardware. Please verify your webcam is connected and not in use by another app.'
          )}
        </p>

        <div className="w-full bg-slate-950/60 rounded-xl p-3.5 mb-6 text-left border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Quick Troubleshooting
          </p>
          <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
            <li>Click the lock or camera icon on the left of your browser address bar</li>
            <li>Change Camera & Microphone to <strong>"Allow"</strong></li>
            <li>Ensure Zoom, FaceTime, or Teams isn't holding the camera exclusively</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={onRetry}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-semibold text-sm transition-all shadow-lg shadow-cyan-900/30"
          >
            <RefreshCw className="w-4 h-4 animate-spin-hover" />
            <span>Grant & Retry</span>
          </button>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-medium text-sm border border-slate-700 transition-all"
            >
              <Settings2 className="w-4 h-4" />
              <span>Select Device</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
