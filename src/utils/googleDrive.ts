import type { GoogleDriveConfig } from '../types/camera';

// Global declaration for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              expires_in?: number;
            }) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
          revoke: (token: string, done?: () => void) => void;
        };
      };
    };
  }
}

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
const STORAGE_KEY = 'drivecam_gdrive_config';

export const getDefaultDriveConfig = (): GoogleDriveConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check if token has expired
      if (parsed.tokenExpiresAt && Date.now() > parsed.tokenExpiresAt) {
        parsed.accessToken = null;
      }
      return parsed;
    }
  } catch {
    // fallback
  }

  return {
    clientId: '',
    folderId: '',
    autoUpload: false,
    accessToken: null,
    tokenExpiresAt: null,
    useSimulatedMode: false,
  };
};

export const saveDriveConfig = (config: GoogleDriveConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
};

/**
 * Fetch Google User Info to display avatar and email in UI
 */
export const fetchGoogleUserInfo = async (accessToken: string) => {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      return {
        email: data.email as string,
        name: data.name as string,
        picture: data.picture as string,
      };
    }
  } catch (err) {
    console.warn('Failed to fetch Google user info:', err);
  }
  return null;
};

/**
 * Request Google Drive OAuth2 Access Token via Google Identity Services
 */
export const requestGoogleDriveToken = (
  clientId: string,
  onSuccess: (token: string, expiresIn: number) => void,
  onError: (error: string) => void
): void => {
  if (!window.google?.accounts?.oauth2) {
    onError('Google Identity Services SDK is still loading. Please check your internet connection or try again in a few seconds.');
    return;
  }

  if (!clientId || clientId.trim() === '') {
    onError('Please enter your Google Cloud OAuth Client ID in Settings first.');
    return;
  }

  try {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId.trim(),
      scope: DRIVE_SCOPE,
      callback: (response) => {
        if (response.error) {
          onError(`Google Authentication failed: ${response.error}`);
          return;
        }
        if (response.access_token) {
          const expiresIn = response.expires_in || 3600;
          onSuccess(response.access_token, expiresIn);
        } else {
          onError('No access token received from Google.');
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: 'consent' });
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Failed to launch Google Sign-In.');
  }
};

/**
 * Upload a media Blob directly to Google Drive via multipart upload
 * Supports genuine upload progress tracking via XMLHttpRequest
 */
export const uploadBlobToDrive = (
  blob: Blob,
  filename: string,
  config: GoogleDriveConfig,
  onProgress?: (percent: number) => void
): Promise<{ fileId: string; viewLink: string }> => {
  return new Promise((resolve, reject) => {
    // If user has simulated mode turned on or no token but requested simulated upload
    if (config.useSimulatedMode || (!config.accessToken && !config.clientId)) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 20) + 10;
        if (progress > 100) progress = 100;
        onProgress?.(progress);

        if (progress >= 100) {
          clearInterval(interval);
          const fakeId = 'sim_' + Math.random().toString(36).substring(2, 12);
          resolve({
            fileId: fakeId,
            viewLink: `https://drive.google.com/file/d/${fakeId}/view?usp=sharing`,
          });
        }
      }, 250);
      return;
    }

    if (!config.accessToken) {
      reject(new Error('Google Drive is not connected. Please connect in Settings or enable Demo Mode.'));
      return;
    }

    // Prepare metadata
    const metadata: { name: string; mimeType: string; parents?: string[] } = {
      name: filename,
      mimeType: blob.type || 'video/webm',
    };

    if (config.folderId && config.folderId.trim() !== '') {
      metadata.parents = [config.folderId.trim()];
    }

    const boundary = '-------DriveCamBoundary' + Math.random().toString(36).substring(2);
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const uint8 = new Uint8Array(arrayBuffer);

      // Build multipart request body as Uint8Array
      const metaHeader = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n${delimiter}Content-Type: ${blob.type || 'application/octet-stream'}\r\n\r\n`;
      const metaBytes = new TextEncoder().encode(metaHeader);
      const closeBytes = new TextEncoder().encode(closeDelimiter);

      const totalLength = metaBytes.length + uint8.length + closeBytes.length;
      const combinedBody = new Uint8Array(totalLength);
      combinedBody.set(metaBytes, 0);
      combinedBody.set(uint8, metaBytes.length);
      combinedBody.set(closeBytes, metaBytes.length + uint8.length);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink', true);
      xhr.setRequestHeader('Authorization', `Bearer ${config.accessToken}`);
      xhr.setRequestHeader('Content-Type', `multipart/related; boundary=${boundary}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            const fileId = data.id;
            const viewLink = data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
            resolve({ fileId, viewLink });
          } catch (e) {
            reject(new Error('Invalid response from Google Drive: ' + String(e)));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            const errMsg = err?.error?.message || xhr.statusText || 'Upload failed';
            reject(new Error(`Drive error (${xhr.status}): ${errMsg}`));
          } catch {
            reject(new Error(`Upload failed with HTTP status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error occurred during Google Drive upload.'));
      };

      xhr.send(combinedBody);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file buffer for upload.'));
    };

    reader.readAsArrayBuffer(blob);
  });
};
