import { create } from "zustand";

interface FileStoreState {
  files: any[];
  pendingFiles: any[];
  addPendingFile: (file: any) => void;
  removeFile: (fileId: number) => void;
  completeFileUpload: (fileId: number, file: any) => void;
  initializeFiles: (files: any[]) => void;
  addFile: (file: any) => void;
  reset: () => void;
  removePendingFile: (fileId: number) => void;
}

export const useFileStore = create<FileStoreState>((set) => ({
  files: [],
  pendingFiles: [],
  addPendingFile: (file) => {
    set((prev) => {
      const id = Math.max(...prev.files.map((doc) => doc.id), 0) + 1;
      const document = { id, file };
      return { pendingFiles: [...prev.pendingFiles, document] };
    });
  },
  removeFile: (fileId) => {
    set((prev) => {
      const documents = prev.files.filter((doc) => doc.id !== fileId);
      return { files: documents };
    });
  },
  completeFileUpload: (fileId, file) => {
    set((prev) => {
      const newPendingFiles = prev.pendingFiles.filter(
        (pendingFile) => pendingFile.id !== fileId,
      );
      return { files: [...prev.files, file], pendingFiles: newPendingFiles };
    });
  },
  initializeFiles: (files) => {
    set({ files });
  },
  addFile: (file) => {
    set((prev) => {
      return { files: [...prev.files, file] };
    });
  },
  reset: () => set({ files: [], pendingFiles: [] }),
  removePendingFile: (fileId) => {
    set((prev) => {
      const documents = prev.pendingFiles.filter((doc) => doc.id !== fileId);
      return { pendingFiles: documents };
    });
  },
}));
