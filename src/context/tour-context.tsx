
"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export type TourStepConfig = {
  id: string;
  title: string;
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
};

type TourContextType = {
  isTourActive: boolean;
  steps: TourStepConfig[];
  currentStep: TourStepConfig | null;
  startTour: (tourSteps: TourStepConfig[]) => void;
  stopTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
};

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: ReactNode }) {
  const [isTourActive, setIsTourActive] = useState(false);
  const [steps, setSteps] = useState<TourStepConfig[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const highlightElement = (stepId: string) => {
    const element = document.getElementById(stepId);
    if (element) {
      element.style.zIndex = '99';
      element.style.position = 'relative';
      element.style.setProperty('--tour-highlight-color', 'hsl(var(--primary))');
      element.classList.add('tour-highlight');
    }
  };

  const removeHighlight = (stepId: string) => {
    const element = document.getElementById(stepId);
    if (element) {
      element.style.zIndex = '';
      element.style.position = '';
      element.classList.remove('tour-highlight');
    }
  };
  
  useEffect(() => {
    // Add CSS for highlighting
    const style = document.createElement('style');
    style.innerHTML = `
      .tour-highlight {
        box-shadow: 0 0 0 4px var(--tour-highlight-color, #007bff), 0 0 0 9999px rgba(0,0,0,0.5);
        border-radius: 8px;
        transition: box-shadow 0.3s ease-in-out;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (isTourActive && steps.length > 0) {
      // Remove highlight from previous step
      if (currentStepIndex > 0) {
        removeHighlight(steps[currentStepIndex - 1].id);
      }
      // Add highlight to current step
      const currentStep = steps[currentStepIndex];
      highlightElement(currentStep.id);
      
      const element = document.getElementById(currentStep.id);
      if(element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

    } else {
      // Cleanup highlights when tour ends
      steps.forEach(step => removeHighlight(step.id));
    }
  }, [isTourActive, currentStepIndex, steps]);

  const startTour = useCallback((tourSteps: TourStepConfig[]) => {
    setSteps(tourSteps);
    setCurrentStepIndex(0);
    setIsTourActive(true);
  }, []);

  const stopTour = useCallback(() => {
    setIsTourActive(false);
    localStorage.setItem('hasViewedDashboardTour', 'true');
    steps.forEach(step => removeHighlight(step.id));
    setSteps([]);
  }, [steps]);

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      stopTour();
    }
  }, [currentStepIndex, steps, stopTour]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const currentStep = isTourActive ? steps[currentStepIndex] : null;

  return (
    <TourContext.Provider value={{ isTourActive, steps, currentStep, startTour, stopTour, nextStep, prevStep }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}
