import {create} from 'zustand'
import { User } from "@/models/User";
import { Plan } from '@/models/Plan';


// Define the ModalData type
export type ModalData = {
  user?: User
  plan?: Plan
}

// Define the store state and actions
interface ModalStore {
  data: ModalData
  isOpen: boolean
  modalContent: React.ReactNode | null
  setOpen: (modal: React.ReactNode, fetchData?: () => Promise<ModalData>) => Promise<void>
  setClose: () => void
}

// Create the Zustand store
export const useModal = create<ModalStore>((set) => ({
  data: {},
  isOpen: false,
  modalContent: null,

  setOpen: async (modal, fetchData) => {
    if (modal) {
      const fetchedData = fetchData ? await fetchData() : {}
      set((state) => ({
        data: { ...state.data, ...fetchedData },
        modalContent: modal,
        isOpen: true,
      }))
    }
  },

  setClose: () => {
    set({
      isOpen: false,
      data: {},
      modalContent: null,
    })
  },
}))