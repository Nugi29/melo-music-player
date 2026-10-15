import { isAudioFile, isVideoFile, isMediaFile } from '@/lib/metadata/parser';

export interface ScannedFolderReport {
  files: File[];
  audioFiles: File[];
  videoFiles: File[];
  folderCount: number;
}

/**
 * Recursively scans directory entries in batches to handle browser limit of 100 entries per read
 */
async function readAllDirectoryEntries(dirReader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  const allEntries: FileSystemEntry[] = [];
  while (true) {
    const batch = await new Promise<FileSystemEntry[]>((resolve) => {
      dirReader.readEntries(
        (entries) => resolve(entries || []),
        () => resolve([])
      );
    });
    if (!batch || batch.length === 0) break;
    allEntries.push(...batch);
  }
  return allEntries;
}

/**
 * Recursively traverses file system entries (files and directories)
 */
async function traverseEntry(
  entry: FileSystemEntry,
  filesList: File[],
  onFolderFound: () => void
): Promise<void> {
  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry;
    try {
      const file = await new Promise<File>((resolve, reject) => {
        fileEntry.file(resolve, reject);
      });
      if (file && isMediaFile(file)) {
        filesList.push(file);
      }
    } catch (err) {
      console.warn('Could not read file from entry:', entry.name, err);
    }
  } else if (entry.isDirectory) {
    onFolderFound();
    const dirEntry = entry as FileSystemDirectoryEntry;
    const reader = dirEntry.createReader();
    try {
      const children = await readAllDirectoryEntries(reader);
      for (const child of children) {
        await traverseEntry(child, filesList, onFolderFound);
      }
    } catch (err) {
      console.warn('Could not read directory children:', entry.name, err);
    }
  }
}

/**
 * Extracts all audio and video files from a DragEvent DataTransfer object,
 * navigating recursively into any dropped directories.
 */
export async function extractFilesFromDataTransfer(
  dataTransfer: DataTransfer
): Promise<ScannedFolderReport> {
  const mediaFiles: File[] = [];
  let folderCount = 0;

  const items = dataTransfer.items;
  if (items && items.length > 0) {
    const promises: Promise<void>[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind !== 'file') continue;

      // Check for webkitGetAsEntry (Chromium, Firefox, Safari)
      const entry = typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : null;

      if (entry) {
        promises.push(
          traverseEntry(entry, mediaFiles, () => {
            folderCount++;
          })
        );
      } else {
        const file = item.getAsFile();
        if (file && isMediaFile(file)) {
          mediaFiles.push(file);
        }
      }
    }

    await Promise.all(promises);
  } else if (dataTransfer.files && dataTransfer.files.length > 0) {
    for (let i = 0; i < dataTransfer.files.length; i++) {
      const file = dataTransfer.files[i];
      if (isMediaFile(file)) {
        mediaFiles.push(file);
      }
    }
  }

  const audioFiles = mediaFiles.filter((f) => isAudioFile(f));
  const videoFiles = mediaFiles.filter((f) => isVideoFile(f));

  return {
    files: mediaFiles,
    audioFiles,
    videoFiles,
    folderCount,
  };
}
