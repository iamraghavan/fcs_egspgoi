"use client";

import { useEffect, useState } from "react";
import { useRemoteConfig } from "@/hooks/use-remote-config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type UpdateConfig = {
  showUpdateBanner: boolean;
  title: string;
  message: string;
  version: string;
  forceUpdate: boolean;
};

export function SystemUpdateBanner() {
  const configValue = useRemoteConfig("system_update_config");
  const [config, setConfig] = useState<UpdateConfig | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (configValue) {
      try {
        const jsonString = configValue.asString();
        if (jsonString) {
          const parsed = JSON.parse(jsonString) as UpdateConfig;
          setConfig(parsed);
          
          // Check if user dismissed this version already
          const dismissedVersion = localStorage.getItem("dismissed_update_version");
          if (dismissedVersion === parsed.version && !parsed.forceUpdate) {
            setIsVisible(false);
          }
        }
      } catch (error) {
        console.error("Failed to parse system_update_config:", error);
      }
    }
  }, [configValue]);

  const handleDismiss = () => {
    if (config?.version) {
      localStorage.setItem("dismissed_update_version", config.version);
    }
    setIsVisible(false);
  };

  if (!config || !config.showUpdateBanner || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        className="mb-6 overflow-hidden"
      >
        <Alert className="bg-primary/10 border-primary/20 text-primary relative">
          <Info className="h-4 w-4" />
          <AlertTitle className="font-semibold flex items-center gap-2">
            {config.title}
            <span className="text-xs bg-primary/20 px-2 py-0.5 rounded-full">v{config.version}</span>
          </AlertTitle>
          <AlertDescription className="mt-1">
            {config.message}
          </AlertDescription>
          
          {!config.forceUpdate && (
            <button
              onClick={handleDismiss}
              className="absolute right-4 top-4 p-1 hover:bg-primary/20 rounded-full transition-colors"
              aria-label="Dismiss update banner"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
}
