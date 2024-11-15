import { create } from "zustand";

export type UploadObject = {
  id: number;
  file: File;
  folder?: string;
  pending?: boolean;
  submissionId?: number;
};

interface UploadObjectState {
  handleAddObjects: (_files: File, folder?: string) => void;
  uploadObjects: UploadObject[];
  removeObject: (id: number) => void;
  reset: () => void;
  triggerPending: (id: number) => void;
  completeObject: (id: number, submissionId: number) => void;
}

const initialState = {
  uploadObjects: [],
};

export const useObjectUploadStore = create<UploadObjectState>((set) => ({
  uploadObjects: [],
  handleAddObjects: (file: File, folder?: string) => {
    // Add file processing logic here
    if (!file) return;

    set((prev) => {
      const id = Math.max(...prev.uploadObjects.map((doc) => doc.id), 0) + 1;
      const document = { id, file, folder, pending: false };
      return { uploadObjects: [...prev.uploadObjects, document] };
    });
  },
  removeObject: (id: number) => {
    set((prev) => {
      const documents = prev.uploadObjects.filter((doc) => doc.id !== id);
      return { uploadObjects: documents };
    });
  },
  completeObject: (id: number, submissionId: number) => {
    set((prev) => {
      const documents = prev.uploadObjects.map((doc) =>
        doc.id === id ? { ...doc, submissionId } : doc,
      );
      return { uploadObjects: documents };
    });
  },
  reset: () => set(initialState),
  triggerPending: (id: number) => {
    set((prev) => {
      const documents = prev.uploadObjects.map((doc) =>
        doc.id === id ? { ...doc, pending: true } : doc,
      );
      return { uploadObjects: documents };
    });
  },
}));
