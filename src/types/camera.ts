export type CaptureMode = 'photo' | 'video';

export type AspectRatioOption = '16:9' | '4:3' | '1:1' | 'fill';

export type VideoBitratePreset = 'compact' | 'balanced' | 'studio';

export interface BitrateOption {
  id: VideoBitratePreset;
  label: string;
  description: string;
  bitrate: number; // in bps
}

export interface ResolutionSetting {
  id: string;
  label: string;
  width: number;
  height: number;
  fps: number;
}

export interface CapturedItem {
  id: string;
  name: string;
  type: 'photo' | 'video';
  blob: Blob;
  previewUrl: string;
  size: number;
  createdAt: number;
  duration?: number; // seconds
  mimeType: string;
  uploadedToDrive?: boolean;
  driveFileId?: string;
  driveViewLink?: string;
  isUploading?: boolean;
  uploadProgress?: number;
  uploadError?: string;
}

export interface GoogleDriveConfig {
  clientId: string;
  folderId: string;
  autoUpload: boolean;
  accessToken: string | null;
  tokenExpiresAt: number | null;
  userEmail?: string;
  userName?: string;
  userPicture?: string;
  useSimulatedMode?: boolean;
}

export interface AudioProcessingConfig {
  highPassFilter: boolean; // ~80Hz high-pass filter
  filterFrequency: number; // default 80Hz
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
  kind: 'videoinput' | 'audioinput';
  facing?: 'user' | 'environment' | 'unknown';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  action?: {
    label: string;
    url?: string;
    onClick?: () => void;
  };
  duration?: number;
}
