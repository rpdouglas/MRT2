/**
 * GITHUB COMMENT:
 * [googleDrive.ts]
 * NEW: Lightweight Google Drive REST API wrapper.
 * - Handles file search, creation, and multipart updates.
 * - Uses 'drive.file' scope for least-privilege security.
 */
const GOOGLE_DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const GOOGLE_DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

interface DriveFile {
  id: string;
  name: string;
}

export async function findBackupFile(accessToken: string): Promise<string | null> {
  const query = encodeURIComponent("name = 'mrt_backup.json' and trashed = false");
  const response = await fetch(`${GOOGLE_DRIVE_API_BASE}/files?q=${query}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { files: DriveFile[] };
  return data.files.length > 0 ? data.files[0].id : null;
}

export async function uploadBackupToDrive(accessToken: string, jsonData: string, fileId?: string): Promise<boolean> {
  const metadata = {
    name: 'mrt_backup.json',
    mimeType: 'application/json',
  };

  const boundary = 'mrt_backup_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const body = 
    `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}` +
    `${delimiter}Content-Type: application/json\r\n\r\n${jsonData}${closeDelimiter}`;

  const url = fileId 
    ? `${GOOGLE_DRIVE_UPLOAD_BASE}/files/${fileId}?uploadType=multipart`
    : `${GOOGLE_DRIVE_UPLOAD_BASE}/files?uploadType=multipart`;

  const method = fileId ? 'PATCH' : 'POST';

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  return response.ok;
}