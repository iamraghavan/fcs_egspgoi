"use client";

import React, { ReactNode } from 'react';
import { useAppStore } from '@/store/use-app-store';

export function AlertProvider({ children }: { children: ReactNode }) {
 // AlertProvider is now a pass-through since state is managed by Zustand.
 // Kept here to maintain backwards compatibility with RootLayout.
 return <>{children}</>;
}

export function useAlert() {
 const showAlert = useAppStore(state => state.showAlert);
 const closeAlert = useAppStore(state => state.closeAlert);
 const isAlertOpen = useAppStore(state => state.isAlertOpen);
 const alertContent = useAppStore(state => state.alertContent);

 return { showAlert, closeAlert, isAlertOpen, alertContent };
}
