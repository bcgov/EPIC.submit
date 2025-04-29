import { create } from "zustand";

export type pendingFile = {
  id: number;
  file: File;
  folder?: string;
};

interface FileStoreState {
  files: any[];
  pendingFiles: pendingFile[];
  addPendingFile: (file: File, folder?: string) => void;
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
  addPendingFile: (file, folder) => {
    set((prev) => {
      const id = Math.max(...prev.pendingFiles.map((doc) => doc.id), 0) + 1;
      const document = { id, file, folder };
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
