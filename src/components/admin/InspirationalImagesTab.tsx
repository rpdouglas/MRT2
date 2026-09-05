// src/components/admin/InspirationalImagesTab.tsx
// PROJ-113 (Daily Inspirational Image), Phase 2. Admin-only upload surface
// for the image library the Phase-1 generateDailyImage Cloud Function
// rotates through — see docs/projects/113_DAILY_INSPIRATIONAL_IMAGE.md §3/§4.
// No React Query here, matching every other admin tab (FriendsDirectory.tsx,
// FeedbackViewer.tsx) — this is a low-frequency admin screen, plain
// useState/async handlers is the established convention.
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import type { ImageLibraryEntry } from '../../lib/db';
import { toast } from 'sonner';
import {
  PhotoIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface SelectedFile {
  localId: string;
  file: File;
  previewUrl: string;
  caption: string;
  attribution: string;
  tags: string;
  status: 'pending' | 'uploading' | 'error';
  error?: string;
}

function extensionFor(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'jpg';
}

export default function InspirationalImagesTab() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFilesRef = useRef<SelectedFile[]>([]);

  const [libraryImages, setLibraryImages] = useState<ImageLibraryEntry[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    selectedFilesRef.current = selectedFiles;
  }, [selectedFiles]);

  // Revoke any remaining local preview URLs on unmount so we don't leak them.
  useEffect(() => {
    return () => {
      selectedFilesRef.current.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
  }, []);

  useEffect(() => {
    if (!db) {
      setLibraryLoading(false);
      return;
    }
    const q = query(collection(db, 'image_library'), orderBy('uploadedAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ImageLibraryEntry);
        setLibraryImages(data);
        setLibraryLoading(false);
      },
      (error) => {
        console.error('Failed to listen to image_library', error);
        setLibraryLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'));
    const newEntries: SelectedFile[] = files.map((file) => ({
      localId: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      caption: '',
      attribution: '',
      tags: '',
      status: 'pending',
    }));
    setSelectedFiles((prev) => [...prev, ...newEntries]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateField = (localId: string, field: 'caption' | 'attribution' | 'tags', value: string) => {
    setSelectedFiles((prev) => prev.map((f) => (f.localId === localId ? { ...f, [field]: value } : f)));
  };

  const removeFile = (localId: string) => {
    setSelectedFiles((prev) => {
      const target = prev.find((f) => f.localId === localId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.localId !== localId);
    });
  };

  const uploadOne = async (entry: SelectedFile): Promise<void> => {
    if (!storage || !db || !user) throw new Error('Not authenticated');
    const ext = extensionFor(entry.file.name);
    const path = `daily-images/${crypto.randomUUID()}.${ext}`;
    const fileRef = storageRef(storage, path);
    await uploadBytes(fileRef, entry.file);
    const downloadUrl = await getDownloadURL(fileRef);
    const tags = entry.tags.split(',').map((t) => t.trim()).filter(Boolean);

    await addDoc(collection(db, 'image_library'), {
      storagePath: path,
      downloadUrl,
      ...(entry.caption.trim() ? { caption: entry.caption.trim() } : {}),
      ...(entry.attribution.trim() ? { attribution: entry.attribution.trim() } : {}),
      ...(tags.length ? { tags } : {}),
      uploadedAt: serverTimestamp(),
      uploadedBy: user.uid,
      // Required sentinel, not omitted — generateDailyImage's
      // orderBy('lastShownDate', 'asc') excludes docs missing this field.
      lastShownDate: '',
    });
  };

  const handleUploadAll = async () => {
    if (!storage || !db || !user) return;
    const toUpload = selectedFiles.filter((f) => f.status !== 'uploading');
    if (toUpload.length === 0) return;

    setIsUploading(true);
    setSelectedFiles((prev) =>
      prev.map((f) => (toUpload.some((u) => u.localId === f.localId) ? { ...f, status: 'uploading', error: undefined } : f)),
    );

    const results = await Promise.allSettled(
      toUpload.map(async (entry) => {
        await uploadOne(entry);
        return entry.localId;
      }),
    );

    const succeededIds = new Set<string>();
    let failedCount = 0;
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        succeededIds.add(result.value);
      } else {
        failedCount++;
        console.error('Failed to upload image', toUpload[i].file.name, result.reason);
      }
    });

    setSelectedFiles((prev) => {
      const remaining: SelectedFile[] = [];
      for (const f of prev) {
        if (succeededIds.has(f.localId)) {
          URL.revokeObjectURL(f.previewUrl);
          continue;
        }
        if (toUpload.some((u) => u.localId === f.localId)) {
          remaining.push({ ...f, status: 'error', error: 'Upload failed — try again.' });
        } else {
          remaining.push(f);
        }
      }
      return remaining;
    });

    setIsUploading(false);

    if (succeededIds.size > 0 && failedCount === 0) {
      toast.success(`Uploaded ${succeededIds.size} image${succeededIds.size === 1 ? '' : 's'}.`);
    } else if (succeededIds.size > 0 && failedCount > 0) {
      toast.error(`Uploaded ${succeededIds.size}, ${failedCount} failed. Retry the failed ones below.`);
    } else if (failedCount > 0) {
      toast.error(`All ${failedCount} upload${failedCount === 1 ? '' : 's'} failed.`);
    }
  };

  const pendingCount = selectedFiles.filter((f) => f.status !== 'uploading').length;

  return (
    <div className="space-y-6">
      {/* ACTION BAR */}
      <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl shadow-lg">
        <div>
          <h3 className="text-white font-bold flex items-center gap-2">
            <PhotoIcon className="w-5 h-5 text-blue-400" />
            Inspirational Images
          </h3>
          <p className="text-xs text-slate-400">Upload the daily-image library — one shared image is rotated in each day.</p>
        </div>
      </div>

      {/* UPLOAD */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <input
          type="file"
          accept="image/*"
          multiple
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors flex flex-col items-center justify-center gap-2"
        >
          <ArrowUpTrayIcon className="h-8 w-8" />
          <span className="font-medium">Click to select image files</span>
        </button>

        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            {selectedFiles.map((f) => (
              <div key={f.localId} className="flex gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <img src={f.previewUrl} alt="" className="h-20 w-20 object-cover rounded-md shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <p className="text-xs font-mono text-gray-500 truncate">{f.file.name}</p>
                  <input
                    type="text"
                    placeholder="Caption (optional)"
                    value={f.caption}
                    onChange={(e) => updateField(f.localId, 'caption', e.target.value)}
                    disabled={f.status === 'uploading'}
                    className="w-full text-sm border border-gray-200 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Attribution (optional)"
                      value={f.attribution}
                      onChange={(e) => updateField(f.localId, 'attribution', e.target.value)}
                      disabled={f.status === 'uploading'}
                      className="flex-1 text-sm border border-gray-200 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                    <input
                      type="text"
                      placeholder="Tags, comma separated"
                      value={f.tags}
                      onChange={(e) => updateField(f.localId, 'tags', e.target.value)}
                      disabled={f.status === 'uploading'}
                      className="flex-1 text-sm border border-gray-200 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  {f.status === 'error' && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <ExclamationTriangleIcon className="h-3.5 w-3.5" /> {f.error}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-center justify-between">
                  {f.status === 'uploading' ? (
                    <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeFile(f.localId)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleUploadAll}
              disabled={isUploading || pendingCount === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isUploading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <ArrowUpTrayIcon className="h-4 w-4" />}
              {isUploading ? 'Uploading...' : `Upload ${pendingCount} Image${pendingCount === 1 ? '' : 's'}`}
            </button>
          </div>
        )}
      </div>

      {/* ALREADY IN LIBRARY */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Already in Library</h2>
          <p className="text-sm text-gray-500">{libraryImages.length} image{libraryImages.length === 1 ? '' : 's'} in rotation.</p>
        </div>

        {libraryLoading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Loading image library...</p>
          </div>
        ) : libraryImages.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm italic">No images yet — upload your first batch above.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-6">
            {libraryImages.map((img) => (
              <div key={img.id} className="space-y-1.5">
                <img src={img.downloadUrl} alt="" className="w-full aspect-square object-cover rounded-lg border border-gray-200" />
                <p className="text-xs font-medium text-gray-800 truncate">{img.caption || 'Untitled'}</p>
                {img.attribution && <p className="text-[11px] text-gray-500 truncate">{img.attribution}</p>}
                <p className="text-[11px] text-gray-400">{img.lastShownDate ? `Shown ${img.lastShownDate}` : 'Never shown'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
