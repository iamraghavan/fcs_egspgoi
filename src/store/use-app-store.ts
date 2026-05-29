import { create } from 'zustand';

type AppState = {
 // Global Alert State
 isAlertOpen: boolean;
 alertContent: { title: string; description: string };
 showAlert: (title: string, description: string) => void;
 closeAlert: () => void;
};

export const useAppStore = create<AppState>((set) => ({
 isAlertOpen: false,
 alertContent: { title: '', description: '' },
 showAlert: (title, description) => set({ isAlertOpen: true, alertContent: { title, description } }),
 closeAlert: () => set({ isAlertOpen: false }),
}));
