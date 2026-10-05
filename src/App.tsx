import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  Sliders,
  Cloud,
} from 'lucide-react';
import type {
  AspectRatioOption,
  AudioProcessingConfig,
  BitrateOption,
  CameraDeviceInfo,
  CapturedItem,
  CaptureMode,
  GoogleDriveConfig,
  ResolutionSetting,
  ToastMessage,
  VideoBitratePreset,
} from './types/camera';
import { StudioAudioProcessor } from './utils/audioProcessor';
import {
  getDefaultDriveConfig,
  saveDriveConfig,
  requestGoogleDriveToken,
  uploadBlobToDrive,
  fetchGoogleUserInfo,
} from './utils/googleDrive';
import {
  saveCaptureToDB,
  loadAllCapturesFromDB,
  updateCaptureInDB,
  deleteCaptureFromDB,
  generateTimestampFilename,
  triggerBlobDownload,
} from './utils/storage';
import { Viewfinder } from './components/Viewfinder';
import { ControlDock } from './components/ControlDock';
import { PreviewModal } from './components/PreviewModal';
import { SettingsModal } from './components/SettingsModal';
import { GalleryDrawer } from './components/GalleryDrawer';
import { PermissionDeniedBanner } from './components/PermissionDeniedBanner';
import { ToastContainer } from './components/Toast';

// Available Target Resolutions with 30fps default for optimal file sizes
const RESOLUTIONS: ResolutionSetting[] = [
  { id: '1080p', label: '1080p Full HD (30 FPS) [Standard]', width: 1920, height: 1080, fps: 30 },
  { id: '1080p60', label: '1080p High-Rate (60 FPS)', width: 1920, height: 1080, fps: 60 },
  { id: '720p', label: '720p HD (30 FPS) [Compact]', width: 1280, height: 720, fps: 30 },
  { id: '4k', label: '4K Ultra HD (3840×2160)', width: 3840, height: 2160, fps: 30 },
  { id: '480p', label: '480p Standard (854×480)', width: 854, height: 480, fps: 30 },
];

// Video Bitrate & Compression Presets (Directly controls output file size)
const BITRATE_PRESETS: BitrateOption[] = [
  {
    id: 'compact',
    label: 'Compact (1.2 Mbps)',
    description: 'Smallest file size (~9 MB/min). Ideal for rapid cloud sync and low bandwidth.',
    bitrate: 1200000,
  },
  {
    id: 'balanced',
    label: 'Balanced (2.5 Mbps)',
    description: 'Crisp 1080p clarity with balanced file size (~18 MB/min). Highly recommended.',
    bitrate: 2500000,
  },
  {
    id: 'studio',
    label: 'Studio Pro (5.5 Mbps)',
    description: 'High-bitrate master quality (~40 MB/min) for professional archiving.',
    bitrate: 5500000,
  },
];

export const App: React.FC = () => {
  // --- CAMERA & MEDIA STREAM STATE ---
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rawStreamRef = useRef<MediaStream | null>(null);
  const processedStreamRef = useRef<MediaStream | null>(null);
  const audioProcessorRef = useRef<StudioAudioProcessor | null>(null);

  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoDevices, setVideoDevices] = useState<CameraDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<CameraDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [selectedAudioId, setSelectedAudioId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const [permissionError, setPermissionError] = useState<{
    type: 'not_allowed' | 'not_found' | 'in_use' | 'generic';
    message: string;
  } | null>(null);

  // --- AUDIO PROCESSING & VU METER ---
  const [audioConfig, setAudioConfig] = useState<AudioProcessingConfig>({
    highPassFilter: true,
    filterFrequency: 80,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  });
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioLevelIntervalRef = useRef<number | null>(null);

  // --- CAPTURE & RECORDING STATE ---
  const [mode, setMode] = useState<CaptureMode>('video');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  // --- VIEWPORT & DESIGN CONTROLS ---
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('16:9');
  const [selectedResolution, setSelectedResolution] = useState<string>('1080p');
  const [selectedBitratePreset, setSelectedBitratePreset] = useState<VideoBitratePreset>('balanced');
  const [showGrid, setShowGrid] = useState(false);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // --- STORAGE & GALLERY ---
  const [captures, setCaptures] = useState<CapturedItem[]>([]);
  const [previewItem, setPreviewItem] = useState<CapturedItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // --- GOOGLE DRIVE INTEGRATION ---
  const [driveConfig, setDriveConfig] = useState<GoogleDriveConfig>(getDefaultDriveConfig());

  // --- TOAST NOTIFICATIONS ---
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration || 5000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Check mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || window.innerHeight < 600);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize audio processor
  useEffect(() => {
    audioProcessorRef.current = new StudioAudioProcessor();
    return () => {
      if (audioProcessorRef.current) {
        audioProcessorRef.current.destroy();
      }
    };
  }, []);

  // Load captures from IndexedDB
  useEffect(() => {
    loadAllCapturesFromDB().then((items) => {
      setCaptures(items);
    });
  }, []);

  // Enumerate hardware devices
  const updateDeviceList = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();

      const videoDevs: CameraDeviceInfo[] = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => {
          let facing: 'user' | 'environment' | 'unknown' = 'unknown';
          const labelLower = d.label.toLowerCase();
          if (labelLower.includes('front') || labelLower.includes('user') || labelLower.includes('facetime')) {
            facing = 'user';
          } else if (labelLower.includes('back') || labelLower.includes('environment') || labelLower.includes('rear')) {
            facing = 'environment';
          }
          return {
            deviceId: d.deviceId,
            label: d.label || `Camera ${index + 1}`,
            kind: 'videoinput',
            facing,
          };
        });

      const audioDevs: CameraDeviceInfo[] = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${index + 1}`,
          kind: 'audioinput',
        }));

      setVideoDevices(videoDevs);
      setAudioDevices(audioDevs);

      // Default select first available if not set
      if (videoDevs.length > 0 && !selectedCameraId) {
        setSelectedCameraId(videoDevs[0].deviceId);
      }
      if (audioDevs.length > 0 && !selectedAudioId) {
        setSelectedAudioId(audioDevs[0].deviceId);
      }
    } catch (err) {
      console.warn('Failed to enumerate devices:', err);
    }
  }, [selectedCameraId, selectedAudioId]);

  // Clean up active streams and release hardware
  const stopActiveStreams = useCallback(() => {
    if (audioLevelIntervalRef.current) {
      window.clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }

    if (rawStreamRef.current) {
      rawStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      rawStreamRef.current = null;
    }

    if (processedStreamRef.current) {
      processedStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      processedStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setVideoLoaded(false);
  }, []);

  // START CAMERA STREAM
  const startCameraStream = useCallback(async () => {
    stopActiveStreams();
    setPermissionError(null);

    const targetRes = RESOLUTIONS.find((r) => r.id === selectedResolution) || RESOLUTIONS[0];

    const videoConstraints: MediaTrackConstraints = {
      width: { ideal: targetRes.width },
      height: { ideal: targetRes.height },
      frameRate: { ideal: targetRes.fps },
    };

    if (selectedCameraId) {
      videoConstraints.deviceId = { exact: selectedCameraId };
    } else {
      videoConstraints.facingMode = { ideal: facingMode };
    }

    const audioConstraints: MediaTrackConstraints = {
      echoCancellation: audioConfig.echoCancellation,
      noiseSuppression: audioConfig.noiseSuppression,
      autoGainControl: audioConfig.autoGainControl,
    };

    if (selectedAudioId) {
      audioConstraints.deviceId = { exact: selectedAudioId };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: audioConstraints,
      });

      rawStreamRef.current = stream;

      // Bind to video element for preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
          setVideoLoaded(true);
        };
      }

      // Route audio track through Studio 80Hz Biquad high-pass filter
      if (audioProcessorRef.current && stream.getAudioTracks().length > 0) {
        const { processedStream, getAudioLevel } = await audioProcessorRef.current.processStream(
          stream,
          audioConfig.highPassFilter,
          audioConfig.filterFrequency
        );

        // Combine video track + processed audio track for recording
        const combinedStream = new MediaStream([
          ...stream.getVideoTracks(),
          ...processedStream.getAudioTracks(),
        ]);
        processedStreamRef.current = combinedStream;

        // Start VU meter polling
        if (audioLevelIntervalRef.current) {
          window.clearInterval(audioLevelIntervalRef.current);
        }
        audioLevelIntervalRef.current = window.setInterval(() => {
          if (!isMuted) {
            setAudioLevel(getAudioLevel());
          } else {
            setAudioLevel(0);
          }
        }, 80);
      } else {
        processedStreamRef.current = stream;
      }

      // Refresh device labels now that permission is granted
      updateDeviceList();
    } catch (err: unknown) {
      console.error('Camera/Mic access error:', err);
      const error = err as { name?: string; message?: string };
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionError({
          type: 'not_allowed',
          message: 'Camera and microphone permissions were denied. Please grant permission in your browser settings.',
        });
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setPermissionError({
          type: 'not_found',
          message: 'No camera or microphone device was found on this system.',
        });
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setPermissionError({
          type: 'in_use',
          message: 'Camera is currently in use by another application. Please close other camera apps and retry.',
        });
      } else {
        setPermissionError({
          type: 'generic',
          message: error.message || 'Failed to initialize camera.',
        });
      }
    }
  }, [
    stopActiveStreams,
    selectedResolution,
    selectedCameraId,
    facingMode,
    audioConfig,
    selectedAudioId,
    updateDeviceList,
    isMuted,
  ]);

  // Restart camera when device, resolution or filter changes
  useEffect(() => {
    startCameraStream();
    return () => {
      stopActiveStreams();
    };
  }, [selectedCameraId, selectedAudioId, selectedResolution, audioConfig.highPassFilter]);

  // Hardware change listener
  useEffect(() => {
    const handleDeviceChange = () => {
      updateDeviceList();
    };
    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [updateDeviceList]);

  // FLIP CAMERA FUNCTION
  const handleFlipCamera = useCallback(() => {
    if (videoDevices.length > 1) {
      const currentIndex = videoDevices.findIndex((d) => d.deviceId === selectedCameraId);
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      setSelectedCameraId(videoDevices[nextIndex].deviceId);
    } else {
      const nextFacing = facingMode === 'user' ? 'environment' : 'user';
      setFacingMode(nextFacing);
      // clear exact id so facingMode takes precedence
      setSelectedCameraId('');
      startCameraStream();
    }
  }, [videoDevices, selectedCameraId, facingMode, startCameraStream]);

  // TOGGLE MIC MUTE
  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (rawStreamRef.current) {
        rawStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !next;
        });
      }
      return next;
    });
  }, []);

  // TAKE PHOTO ACTION
  const handleCapturePhoto = useCallback(async () => {
    if (!videoRef.current || !rawStreamRef.current) return;

    if (soundEffectsEnabled && audioProcessorRef.current) {
      audioProcessorRef.current.playShutterSound();
    }

    // Trigger visual screen flash
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 350);

    // Haptic feedback on mobile if supported
    if (navigator.vibrate) {
      navigator.vibrate([40]);
    }

    const videoEl = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth || 1920;
    canvas.height = videoEl.videoHeight || 1080;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally if front-facing for natural mirror photo
    const currentDev = videoDevices.find((d) => d.deviceId === selectedCameraId);
    const isFront = currentDev?.facing === 'user' || facingMode === 'user';
    if (isFront) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;

        const filename = generateTimestampFilename('jpg');
        const previewUrl = URL.createObjectURL(blob);

        const newItem: CapturedItem = {
          id: Math.random().toString(36).substring(2, 11),
          name: filename,
          type: 'photo',
          blob,
          previewUrl,
          size: blob.size,
          createdAt: Date.now(),
          mimeType: 'image/jpeg',
          uploadedToDrive: false,
        };

        await saveCaptureToDB(newItem);
        setCaptures((prev) => [newItem, ...prev]);

        // Auto-upload if configured
        if (driveConfig.autoUpload && (driveConfig.accessToken || driveConfig.useSimulatedMode)) {
          triggerDriveUpload(newItem, filename);
        } else {
          setPreviewItem(newItem);
        }
      },
      'image/jpeg',
      0.95
    );
  }, [
    soundEffectsEnabled,
    videoDevices,
    selectedCameraId,
    facingMode,
    driveConfig.autoUpload,
    driveConfig.accessToken,
    driveConfig.useSimulatedMode,
  ]);

  // START VIDEO RECORDING
  const handleStartRecording = useCallback(() => {
    const streamToRecord = processedStreamRef.current || rawStreamRef.current;
    if (!streamToRecord) return;

    recordedChunksRef.current = [];

    // Find best supported MIME type
    const candidateMimes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];
    let selectedMime = 'video/webm';
    for (const mime of candidateMimes) {
      if (MediaRecorder.isTypeSupported(mime)) {
        selectedMime = mime;
        break;
      }
    }

    const activeBitrate =
      BITRATE_PRESETS.find((p) => p.id === selectedBitratePreset)?.bitrate || 2500000;

    try {
      const recorder = new MediaRecorder(streamToRecord, {
        mimeType: selectedMime,
        videoBitsPerSecond: activeBitrate,
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const extension = selectedMime.includes('mp4') ? 'mp4' : 'webm';
        const finalBlob = new Blob(recordedChunksRef.current, { type: selectedMime });
        const filename = generateTimestampFilename(extension);
        const previewUrl = URL.createObjectURL(finalBlob);

        const durationSeconds = Math.round(
          (Date.now() - recordingStartTimeRef.current) / 1000
        );

        const newItem: CapturedItem = {
          id: Math.random().toString(36).substring(2, 11),
          name: filename,
          type: 'video',
          blob: finalBlob,
          previewUrl,
          size: finalBlob.size,
          createdAt: Date.now(),
          duration: durationSeconds,
          mimeType: selectedMime,
          uploadedToDrive: false,
        };

        await saveCaptureToDB(newItem);
        setCaptures((prev) => [newItem, ...prev]);

        // Auto upload if enabled
        if (driveConfig.autoUpload && (driveConfig.accessToken || driveConfig.useSimulatedMode)) {
          triggerDriveUpload(newItem, filename);
        } else {
          setPreviewItem(newItem);
        }
      };

      recorder.start(1000); // 1s timeslices
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      recordingStartTimeRef.current = Date.now();
      setRecordingDuration(0);

      if (soundEffectsEnabled && audioProcessorRef.current) {
        audioProcessorRef.current.playBeep(true);
      }

      // Start elapsed timer
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
      }
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration(
          Math.floor((Date.now() - recordingStartTimeRef.current) / 1000)
        );
      }, 500);
    } catch (err) {
      console.error('Failed to start MediaRecorder:', err);
      addToast({
        type: 'error',
        title: 'Recording Error',
        message: 'Could not start video recorder on this browser.',
      });
    }
  }, [soundEffectsEnabled, driveConfig, addToast, selectedBitratePreset]);

  // STOP VIDEO RECORDING
  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setIsRecording(false);

    if (soundEffectsEnabled && audioProcessorRef.current) {
      audioProcessorRef.current.playBeep(false);
    }
  }, [soundEffectsEnabled]);

  // GOOGLE DRIVE OAUTH CONNECT
  const handleConnectDrive = useCallback(() => {
    if (!driveConfig.clientId && !driveConfig.useSimulatedMode) {
      addToast({
        type: 'warning',
        title: 'Google Client ID Required',
        message: 'Please paste your Google Cloud OAuth Client ID in Settings first, or enable Simulated Demo Mode.',
      });
      return;
    }

    if (driveConfig.useSimulatedMode) {
      const mockConfig: GoogleDriveConfig = {
        ...driveConfig,
        accessToken: 'simulated_token_' + Date.now(),
        tokenExpiresAt: Date.now() + 3600 * 1000,
        userName: 'Demo Creator',
        userEmail: 'creator@drivecam.studio',
      };
      setDriveConfig(mockConfig);
      saveDriveConfig(mockConfig);
      addToast({
        type: 'success',
        title: 'Demo Cloud Connected',
        message: 'DriveCam is now in Simulated Cloud Sync mode.',
      });
      return;
    }

    requestGoogleDriveToken(
      driveConfig.clientId,
      async (token, expiresIn) => {
        const userInfo = await fetchGoogleUserInfo(token);
        const updatedConfig: GoogleDriveConfig = {
          ...driveConfig,
          accessToken: token,
          tokenExpiresAt: Date.now() + expiresIn * 1000,
          userName: userInfo?.name,
          userEmail: userInfo?.email,
          userPicture: userInfo?.picture,
        };
        setDriveConfig(updatedConfig);
        saveDriveConfig(updatedConfig);

        addToast({
          type: 'success',
          title: 'Google Drive Connected',
          message: `Connected as ${userInfo?.email || 'Google User'}. Files can now sync directly to your Drive.`,
        });
      },
      (error) => {
        addToast({
          type: 'error',
          title: 'Google Auth Error',
          message: error,
        });
      }
    );
  }, [driveConfig, addToast]);

  // DISCONNECT DRIVE
  const handleDisconnectDrive = useCallback(() => {
    const cleared: GoogleDriveConfig = {
      ...driveConfig,
      accessToken: null,
      tokenExpiresAt: null,
      userName: undefined,
      userEmail: undefined,
      userPicture: undefined,
    };
    setDriveConfig(cleared);
    saveDriveConfig(cleared);
    addToast({
      type: 'info',
      title: 'Google Drive Disconnected',
      message: 'Captures will now save locally to your device.',
    });
  }, [driveConfig, addToast]);

  // TRIGGER DRIVE UPLOAD
  const triggerDriveUpload = useCallback(
    async (item: CapturedItem, customName?: string) => {
      const filename = customName || item.name;

      // Update item upload state
      const updateUploading = (progress: number) => {
        setCaptures((prev) =>
          prev.map((c) =>
            c.id === item.id ? { ...c, isUploading: true, uploadProgress: progress } : c
          )
        );
        if (previewItem?.id === item.id) {
          setPreviewItem((prev) =>
            prev ? { ...prev, isUploading: true, uploadProgress: progress } : null
          );
        }
      };

      updateUploading(5);

      try {
        const result = await uploadBlobToDrive(item.blob, filename, driveConfig, (percent) => {
          updateUploading(percent);
        });

        const updatedItem: CapturedItem = {
          ...item,
          name: filename,
          isUploading: false,
          uploadProgress: 100,
          uploadedToDrive: true,
          driveFileId: result.fileId,
          driveViewLink: result.viewLink,
        };

        await updateCaptureInDB(updatedItem);

        setCaptures((prev) => prev.map((c) => (c.id === item.id ? updatedItem : c)));
        if (previewItem?.id === item.id) {
          setPreviewItem(updatedItem);
        }

        addToast({
          type: 'success',
          title: 'Uploaded to Google Drive',
          message: `"${filename}" saved successfully to your cloud storage.`,
          action: {
            label: 'Open in Drive',
            url: result.viewLink,
          },
          duration: 7000,
        });
      } catch (err: unknown) {
        const error = err as Error;
        const failedItem: CapturedItem = {
          ...item,
          isUploading: false,
          uploadError: error.message,
        };
        setCaptures((prev) => prev.map((c) => (c.id === item.id ? failedItem : c)));
        if (previewItem?.id === item.id) {
          setPreviewItem(failedItem);
        }

        addToast({
          type: 'error',
          title: 'Upload Failed',
          message: error.message || 'Could not upload file to Google Drive.',
        });
      }
    },
    [driveConfig, previewItem, addToast]
  );

  // SAVE DIRECTLY TO DEVICE (DOWNLOAD)
  const handleSaveToDevice = useCallback(
    (item: CapturedItem, customName?: string) => {
      const filename = customName || item.name;
      triggerBlobDownload(item.blob, filename);
      addToast({
        type: 'success',
        title: 'Saved to Device',
        message: `Saved "${filename}" to your browser downloads folder.`,
        duration: 3500,
      });
    },
    [addToast]
  );

  // DELETE CAPTURE
  const handleDeleteCapture = useCallback(
    async (id: string) => {
      await deleteCaptureFromDB(id);
      setCaptures((prev) => prev.filter((c) => c.id !== id));
      if (previewItem?.id === id) {
        setPreviewItem(null);
      }
      addToast({
        type: 'info',
        title: 'Capture Deleted',
        message: 'Item removed from local library.',
        duration: 2500,
      });
    },
    [previewItem, addToast]
  );

  // KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (mode === 'photo') {
          handleCapturePhoto();
        } else {
          if (isRecording) {
            handleStopRecording();
          } else {
            handleStartRecording();
          }
        }
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        handleFlipCamera();
      } else if (e.key === 's' || e.key === 'S') {
        setIsSettingsOpen((prev) => !prev);
      } else if (e.key === 'g' || e.key === 'G') {
        setIsGalleryOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setPreviewItem(null);
        setIsSettingsOpen(false);
        setIsGalleryOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    mode,
    isRecording,
    handleCapturePhoto,
    handleStartRecording,
    handleStopRecording,
    handleToggleMute,
    handleFlipCamera,
  ]);

  const currentCam = videoDevices.find((d) => d.deviceId === selectedCameraId);
  const activeResObj = RESOLUTIONS.find((r) => r.id === selectedResolution);
  const activeResolutionLabel = activeResObj
    ? `${activeResObj.id.toUpperCase()} • ${selectedBitratePreset.toUpperCase()}`
    : `1080P • ${selectedBitratePreset.toUpperCase()}`;

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">
      {/* GLOBAL TOAST NOTIFICATIONS */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* HEADER / BRAND BAR */}
      <header className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-xl flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center shadow-lg shadow-cyan-900/30 text-slate-950 font-black">
            <Camera className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">DriveCam</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                STUDIO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
              Web Audio 80Hz DSP • Direct Cloud Sync
            </p>
          </div>
        </div>

        {/* Quick Header Badges / Status */}
        <div className="flex items-center gap-2">
          {/* Cloud Status Pill */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              driveConfig.accessToken
                ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/80'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {driveConfig.accessToken ? driveConfig.userEmail || 'Drive Linked' : 'Connect Drive'}
            </span>
          </button>

          {/* Quick Settings Icon */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Settings (S)"
            aria-label="Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN CAMERA VIEWFINDER AREA */}
      <main className="relative flex-1 w-full h-full min-h-0 flex items-center justify-center p-0 md:p-4 overflow-hidden">
        {/* Permission Denied Overlay */}
        {permissionError && (
          <PermissionDeniedBanner
            errorType={permissionError.type}
            errorMessage={permissionError.message}
            onRetry={startCameraStream}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        <Viewfinder
          videoRef={videoRef}
          mode={mode}
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          audioLevel={audioLevel}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          showGrid={showGrid}
          isFlashActive={isFlashActive}
          isDriveConnected={!!driveConfig.accessToken}
          isDriveAutoUpload={driveConfig.autoUpload}
          onFlipCamera={handleFlipCamera}
          hasMultipleCameras={videoDevices.length > 1}
          currentCameraLabel={currentCam?.label}
          activeResolutionLabel={activeResolutionLabel}
          isAudioFiltered={audioConfig.highPassFilter}
          aspectRatio={aspectRatio}
          isMobile={isMobile}
          videoLoaded={videoLoaded}
        />
      </main>

      {/* BOTTOM CONTROL DOCK */}
      <ControlDock
        mode={mode}
        onSetMode={setMode}
        isRecording={isRecording}
        onCapturePhoto={handleCapturePhoto}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGallery={() => setIsGalleryOpen(true)}
        lastCapture={captures[0] || null}
        totalCapturesCount={captures.length}
      />

      {/* PREVIEW & INSPECTION MODAL */}
      {previewItem && (
        <PreviewModal
          item={previewItem}
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          onSaveToDevice={handleSaveToDevice}
          onUploadToDrive={triggerDriveUpload}
          onDeleteItem={handleDeleteCapture}
          driveConfig={driveConfig}
        />
      )}

      {/* SETTINGS DRAWER / MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        videoDevices={videoDevices}
        audioDevices={audioDevices}
        selectedCameraId={selectedCameraId}
        onSelectCamera={setSelectedCameraId}
        selectedAudioId={selectedAudioId}
        onSelectAudio={setSelectedAudioId}
        onRefreshDevices={updateDeviceList}
        driveConfig={driveConfig}
        onUpdateDriveConfig={(updated) => {
          setDriveConfig(updated);
          saveDriveConfig(updated);
        }}
        onConnectDrive={handleConnectDrive}
        onDisconnectDrive={handleDisconnectDrive}
        audioConfig={audioConfig}
        onUpdateAudioConfig={setAudioConfig}
        showGrid={showGrid}
        onToggleGrid={setShowGrid}
        soundEffectsEnabled={soundEffectsEnabled}
        onToggleSoundEffects={setSoundEffectsEnabled}
        selectedResolution={selectedResolution}
        onSelectResolution={setSelectedResolution}
        availableResolutions={RESOLUTIONS}
        aspectRatio={aspectRatio}
        onSelectAspectRatio={setAspectRatio}
        selectedBitratePreset={selectedBitratePreset}
        onSelectBitratePreset={setSelectedBitratePreset}
        bitratePresets={BITRATE_PRESETS}
      />

      {/* GALLERY / MEDIA LIBRARY DRAWER */}
      <GalleryDrawer
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        items={captures}
        onSelectItem={(item) => setPreviewItem(item)}
        onSaveItem={handleSaveToDevice}
        onUploadItem={triggerDriveUpload}
        onDeleteItem={handleDeleteCapture}
        driveConfig={driveConfig}
      />
    </div>
  );
};

export default App;
