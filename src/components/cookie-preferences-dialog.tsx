
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const COOKIE_PREFS_KEY = "cookie_preferences";

type CookiePreferences = {
  functional: boolean;
  analytics: boolean;
};

type CookiePreferencesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CookiePreferencesDialog({ open, onOpenChange }: CookiePreferencesDialogProps) {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<CookiePreferences>({
    functional: true,
    analytics: false,
  });

  useEffect(() => {
    if (open) {
      const savedPrefs = localStorage.getItem(COOKIE_PREFS_KEY);
      if (savedPrefs) {
        setPrefs(JSON.parse(savedPrefs));
      }
    }
  }, [open]);

  const handleToggle = (key: keyof CookiePreferences) => {
    setPrefs((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const handleSave = () => {
    localStorage.setItem(COOKIE_PREFS_KEY, JSON.stringify(prefs));
    toast({
      title: "Preferences Saved",
      description: "Your cookie settings have been updated.",
    });
    onOpenChange(false);
  };
  
  const handleAcceptAll = () => {
    const allAccepted = { functional: true, analytics: true };
    setPrefs(allAccepted);
    localStorage.setItem(COOKIE_PREFS_KEY, JSON.stringify(allAccepted));
    toast({
      title: "Preferences Saved",
      description: "You have accepted all cookies.",
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cookie Preferences</DialogTitle>
          <DialogDescription>
            Manage your cookie settings. These preferences will be stored in your browser.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <Label htmlFor="necessary-cookies">Strictly Necessary</Label>
              <p className="text-xs text-muted-foreground">
                These cookies are essential for the site to function and cannot be disabled.
              </p>
            </div>
            <Switch id="necessary-cookies" checked disabled />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <Label htmlFor="functional-cookies">Functional Cookies</Label>
              <p className="text-xs text-muted-foreground">
                Remember your preferences, like sidebar state.
              </p>
            </div>
            <Switch 
                id="functional-cookies" 
                checked={prefs.functional} 
                onCheckedChange={() => handleToggle("functional")}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <Label htmlFor="analytics-cookies">Analytics Cookies</Label>
               <p className="text-xs text-muted-foreground">
                Help us understand how you use the application.
              </p>
            </div>
             <Switch 
                id="analytics-cookies" 
                checked={prefs.analytics}
                onCheckedChange={() => handleToggle("analytics")}
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between gap-2">
            <Button type="button" variant="primary" onClick={handleAcceptAll}>Accept All</Button>
            <Button type="button" onClick={handleSave}>Save Preferences</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
