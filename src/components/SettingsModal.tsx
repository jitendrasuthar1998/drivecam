import React from 'react';
import {
  X,
  Camera,
  Cloud,
  Sliders,
  Volume2,
  Grid,
  ExternalLink,
  RefreshCw,
  LogOut,
  Folder,
  Gauge,
} from 'lucide-react';
import type {
  AspectRatioOption,
  AudioProcessingConfig,
  BitrateOption,
  CameraDeviceInfo,
  GoogleDriveConfig,
  ResolutionSetting,
  VideoBitratePreset,
} from '../types/camera';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoDevices: CameraDeviceInfo[];
  audioDevices: CameraDeviceInfo[];
  selectedCameraId: string;
  onSelectCamera: (deviceId: string) => void;
  selectedAudioId: string;
  onSelectAudio: (deviceId: string) => void;
  onRefreshDevices: () => void;
  driveConfig: GoogleDriveConfig;
  onUpdateDriveConfig: (config: GoogleDriveConfig) => void;
  onConnectDrive: () => void;
  onDisconnectDrive: () => void;
  audioConfig: AudioProcessingConfig;
  onUpdateAudioConfig: (config: AudioProcessingConfig) => void;
  showGrid: boolean;
  onToggleGrid: (show: boolean) => void;
  soundEffectsEnabled: boolean;
  onToggleSoundEffects: (enabled: boolean) => void;
  selectedResolution: string;
  onSelectResolution: (resId: string) => void;
  availableResolutions: ResolutionSetting[];
  aspectRatio: AspectRatioOption;
  onSelectAspectRatio: (ratio: AspectRatioOption) => void;
  selectedBitratePreset: VideoBitratePreset;
  onSelectBitratePreset: (preset: VideoBitratePreset) => void;
  bitratePresets: BitrateOption[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  videoDevices,
  audioDevices,
  selectedCameraId,
  onSelectCamera,
  selectedAudioId,
  onSelectAudio,
  onRefreshDevices,
  driveConfig,
  onUpdateDriveConfig,
  onConnectDrive,
  onDisconnectDrive,
  audioConfig,
  onUpdateAudioConfig,
  showGrid,
  onToggleGrid,
  soundEffectsEnabled,
  onToggleSoundEffects,
  selectedResolution,
  onSelectResolution,
  availableResolutions,
  aspectRatio,
  onSelectAspectRatio,
  selectedBitratePreset,
  onSelectBitratePreset,
  bitratePresets,
}) => {
  if (!isOpen) return null;

  const isConnected = !!driveConfig.accessToken;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/70 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Studio Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT TABS / SCROLLABLE BODY */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* SECTION 1: HARDWARE & CAMERA SWITCHING */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <h3 className="font-semibold text-slate-100">Camera & Lens Selection</h3>
              </div>
              <button
                onClick={onRefreshDevices}
                className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                title="Rescan video and audio hardware"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Rescan</span>
              </button>
            </div>

            {/* Video Input Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Active Video Sensor</label>
              <select
                value={selectedCameraId}
                onChange={(e) => onSelectCamera(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors text-xs sm:text-sm font-medium"
              >
                {videoDevices.map((dev, idx) => (
                  <option key={dev.deviceId || idx} value={dev.deviceId}>
                    {dev.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Audio Input Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Microphone Device</label>
              <select
                value={selectedAudioId}
                onChange={(e) => onSelectAudio(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors text-xs sm:text-sm font-medium"
              >
                {audioDevices.map((dev, idx) => (
                  <option key={dev.deviceId || idx} value={dev.deviceId}>
                    {dev.label || `Microphone ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Resolution Selector */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">
                  Resolution Target
                </label>
                <select
                  value={selectedResolution}
                  onChange={(e) => onSelectResolution(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs font-medium"
                >
                  {availableResolutions.map((res) => (
                    <option key={res.id} value={res.id}>
                      {res.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">
                  Aspect Ratio Framing
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => onSelectAspectRatio(e.target.value as AspectRatioOption)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs font-medium"
                >
                  <option value="16:9">16:9 Widescreen</option>
                  <option value="4:3">4:3 Standard</option>
                  <option value="1:1">1:1 Square</option>
                  <option value="fill">Fill Viewport</option>
                </select>
              </div>
            </div>

            {/* Video Bitrate / Compression Preset */}
            <div className="space-y-2 pt-2 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Video Compression & File Size</span>
                </label>
                <span className="text-[10px] text-cyan-400 font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800/50">
                  {selectedBitratePreset === 'compact'
                    ? '~9 MB / min'
                    : selectedBitratePreset === 'balanced'
                    ? '~18 MB / min'
                    : '~40 MB / min'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {bitratePresets.map((preset) => {
                  const isActive = selectedBitratePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onSelectBitratePreset(preset.id)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        isActive
                          ? 'bg-cyan-950/80 border-cyan-500/60 text-white shadow-sm ring-1 ring-cyan-500/40'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      <span className="text-xs font-semibold">
                        {preset.id === 'compact'
                          ? 'Compact'
                          : preset.id === 'balanced'
                          ? 'Balanced'
                          : 'Studio Pro'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 mt-1">
                        {preset.id === 'compact'
                          ? '1.2 Mbps'
                          : preset.id === 'balanced'
                          ? '2.5 Mbps'
                          : '5.5 Mbps'}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {bitratePresets.find((p) => p.id === selectedBitratePreset)?.description}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800/80" />

          {/* SECTION 2: STUDIO AUDIO PROCESSING */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <h3 className="font-semibold text-slate-100">Studio Audio DSP</h3>
            </div>

            <div className="space-y-2">
              {/* High Pass Filter */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
                <div className="pr-4">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-200 text-xs sm:text-sm">
                      80Hz High-Pass Filter
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800">
                      Studio DSP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Filters low-end wind noise, mic handling rumble, and air conditioning hum.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={audioConfig.highPassFilter}
                  onChange={(e) =>
                    onUpdateAudioConfig({ ...audioConfig, highPassFilter: e.target.checked })
                  }
                  className="w-4 h-4 text-cyan-500 rounded bg-slate-800 border-slate-700 focus:ring-cyan-500"
                />
              </label>

              {/* Echo & Noise Cancellation */}
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 cursor-pointer text-xs">
                  <span className="text-slate-300">Noise Suppression</span>
                  <input
                    type="checkbox"
                    checked={audioConfig.noiseSuppression}
                    onChange={(e) =>
                      onUpdateAudioConfig({ ...audioConfig, noiseSuppression: e.target.checked })
                    }
                    className="w-4 h-4 text-cyan-500 rounded bg-slate-800 border-slate-700"
                  />
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 cursor-pointer text-xs">
                  <span className="text-slate-300">Echo Cancellation</span>
                  <input
                    type="checkbox"
                    checked={audioConfig.echoCancellation}
                    onChange={(e) =>
                      onUpdateAudioConfig({ ...audioConfig, echoCancellation: e.target.checked })
                    }
                    className="w-4 h-4 text-cyan-500 rounded bg-slate-800 border-slate-700"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80" />

          {/* SECTION 3: GOOGLE DRIVE INTEGRATION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-cyan-400" />
                <h3 className="font-semibold text-slate-100">Google Drive Cloud Sync</h3>
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  isConnected
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Connection Status Card */}
            {isConnected ? (
              <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {driveConfig.userPicture ? (
                    <img
                      src={driveConfig.userPicture}
                      alt="Avatar"
                      className="w-9 h-9 rounded-full border border-cyan-500/40"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                      G
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-xs text-white">
                      {driveConfig.userName || 'Google Account'}
                    </p>
                    <p className="text-[11px] text-cyan-300/80 font-mono">
                      {driveConfig.userEmail || 'Active OAuth Session'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onDisconnectDrive}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Google Client ID Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <label>Google OAuth Client ID</label>
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                    >
                      <span>Get Client ID</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 123456789-abcdef.apps.googleusercontent.com"
                    value={driveConfig.clientId}
                    onChange={(e) =>
                      onUpdateDriveConfig({ ...driveConfig, clientId: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Connect Button */}
                <button
                  onClick={onConnectDrive}
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-98 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30 transition-all"
                >
                  <Cloud className="w-4 h-4" />
                  <span>Connect Google Drive</span>
                </button>
              </div>
            )}

            {/* Target Folder ID / Name */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Folder className="w-3.5 h-3.5 text-cyan-400" />
                <span>Destination Folder ID (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Leave blank for My Drive root, or paste Folder ID"
                value={driveConfig.folderId}
                onChange={(e) =>
                  onUpdateDriveConfig({ ...driveConfig, folderId: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[10px] text-slate-500">
                Found in your Google Drive URL: drive.google.com/drive/folders/<strong>[FOLDER_ID]</strong>
              </p>
            </div>

            {/* Auto-upload Toggle */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
              <div>
                <span className="font-medium text-slate-200 text-xs sm:text-sm">
                  Auto-Upload to Drive upon capture
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Automatically syncs videos and photos to Google Drive as soon as recording finishes.
                </p>
              </div>
              <input
                type="checkbox"
                checked={driveConfig.autoUpload}
                onChange={(e) =>
                  onUpdateDriveConfig({ ...driveConfig, autoUpload: e.target.checked })
                }
                className="w-4 h-4 text-cyan-500 rounded bg-slate-800 border-slate-700 focus:ring-cyan-500"
              />
            </label>

            {/* Simulated Cloud Mode Toggle */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-dashed border-cyan-800/40 cursor-pointer hover:border-cyan-700/60 transition-colors">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-slate-200 text-xs">
                    Simulated Cloud Mode (Preview / Test)
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-950 text-purple-300 border border-purple-800">
                    Instant Demo
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Enables upload progress simulator and mock Drive links without needing your own Google OAuth client setup.
                </p>
              </div>
              <input
                type="checkbox"
                checked={driveConfig.useSimulatedMode}
                onChange={(e) =>
                  onUpdateDriveConfig({ ...driveConfig, useSimulatedMode: e.target.checked })
                }
                className="w-4 h-4 text-purple-500 rounded bg-slate-800 border-slate-700 focus:ring-purple-500"
              />
            </label>
          </div>

          <div className="border-t border-slate-800/80" />

          {/* SECTION 4: VIEWFINDER & TACTILE CONTROLS */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-100 flex items-center gap-2">
              <Grid className="w-4 h-4 text-cyan-400" />
              <span>Camera Overlays & Tactile FX</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 cursor-pointer text-xs">
                <span className="text-slate-300">Rule of Thirds Grid</span>
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => onToggleGrid(e.target.checked)}
                  className="w-4 h-4 text-cyan-500 rounded bg-slate-800 border-slate-700"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 cursor-pointer text-xs">
                <span className="text-slate-300">Shutter Audio FX</span>
                <input
                  type="checkbox"
                  checked={soundEffectsEnabled}
                  onChange={(e) => onToggleSoundEffects(e.target.checked)}
                  className="w-4 h-4 text-cyan-500 rounded bg-slate-800 border-slate-700"
                />
              </label>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            DriveCam Studio v1.0 • Client-Side Secure Capture
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
