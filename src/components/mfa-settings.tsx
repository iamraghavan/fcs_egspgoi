"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import Image from "next/image";
import { useMfaSettings } from "@/hooks/use-mfa-settings";
import { Loader2, ShieldCheck, Mail } from "lucide-react";

type MfaSettingsProps = {
  mfaEmailEnabled: boolean;
  mfaAppEnabled: boolean;
  onUpdate: () => void;
};

export function MfaSettings({ mfaEmailEnabled, mfaAppEnabled, onUpdate }: MfaSettingsProps) {
  const { setupAppMfa, setupEmailMfa, enableMfa, disableMfa, isLoading, qrCode, setQrCode } = useMfaSettings();

  const [verificationCode, setVerificationCode] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isAppSetupDialogOpen, setIsAppSetupDialogOpen] = useState(false);
  const [isEmailSetupDialogOpen, setIsEmailSetupDialogOpen] = useState(false);
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);

  const handleEmailToggle = async (enabled: boolean) => {
    if (enabled) {
      if (await setupEmailMfa()) setIsEmailSetupDialogOpen(true);
    } else {
      setIsDisableDialogOpen(true);
    }
  };

  const handleSetupApp = async () => {
    const success = await setupAppMfa();
    if (success) {
      setIsAppSetupDialogOpen(true);
    }
  };

  const handleVerifyApp = async () => {
    const success = await enableMfa("app", verificationCode);
    if (success) {
      setIsAppSetupDialogOpen(false);
      setQrCode(null);
      setVerificationCode("");
      onUpdate();
    }
  };

  const handleVerifyEmail = async () => {
    const success = await enableMfa("email", verificationCode);
    if (success) {
      setIsEmailSetupDialogOpen(false);
      setVerificationCode("");
      onUpdate();
    }
  };

  const handleDisableMfa = async () => {
    const success = await disableMfa(verificationCode, currentPassword);
    if (success) {
      setIsDisableDialogOpen(false);
      setVerificationCode("");
      setCurrentPassword("");
      onUpdate();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>Add an extra layer of security to your account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Label htmlFor="email-mfa" className="font-medium">
                Email Authentication
              </Label>
              <p className="text-xs text-muted-foreground">Receive a code via email to log in.</p>
            </div>
          </div>
          <Switch id="email-mfa" checked={mfaEmailEnabled} onCheckedChange={handleEmailToggle} disabled={isLoading} />
        </div>
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Label className="font-medium">Authenticator App</Label>
              <p className="text-xs text-muted-foreground">Use an app like Google Authenticator.</p>
            </div>
          </div>
          {mfaAppEnabled ? (
            <Button variant="outline" size="sm" onClick={() => setIsDisableDialogOpen(true)} disabled={isLoading}>
              Disable
            </Button>
          ) : (
            <Button size="sm" onClick={handleSetupApp} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Set Up
            </Button>
          )}
        </div>
      </CardContent>

      {/* App Setup Dialog */}
      <Dialog
        open={isAppSetupDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setQrCode(null);
            setVerificationCode("");
          }
          setIsAppSetupDialogOpen(isOpen);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up Authenticator App</DialogTitle>
            <DialogDescription>Scan the QR code with your app, then enter the 6-digit code.</DialogDescription>
          </DialogHeader>
          <div className="py-4 flex flex-col items-center gap-4">
            {qrCode ? (
              <Image
                src={qrCode}
                alt="MFA QR Code"
                width={200}
                height={200}
                className="rounded-lg border p-2 bg-white"
              />
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center bg-muted rounded-md">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            <div className="w-full">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="mt-1 text-center tracking-[0.3em]"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleVerifyApp} disabled={isLoading || verificationCode.length < 6}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Verify & Enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Setup Dialog */}
      <Dialog
        open={isEmailSetupDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) setVerificationCode("");
          setIsEmailSetupDialogOpen(isOpen);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enable Email MFA</DialogTitle>
            <DialogDescription>Enter the verification code sent to your registered email address.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="email-verification-code">Verification Code</Label>
            <Input
              id="email-verification-code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="mt-1 text-center tracking-[0.3em]"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleVerifyEmail} disabled={isLoading || verificationCode.length < 6}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enable Email MFA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable MFA Dialog */}
      <Dialog
        open={isDisableDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setVerificationCode("");
            setCurrentPassword("");
          }
          setIsDisableDialogOpen(isOpen);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Disable MFA</DialogTitle>
            <DialogDescription>
              Confirm your current password{mfaAppEnabled ? " and authenticator code" : ""} to turn off two-factor
              authentication.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="disable-current-password">Current password</Label>
              <Input
                id="disable-current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            {mfaAppEnabled && (
              <div className="space-y-2">
                <Label htmlFor="disable-verification-code">Authenticator code</Label>
                <Input
                  id="disable-verification-code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="text-center tracking-[0.3em]"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDisableMfa}
              disabled={isLoading || !currentPassword || (mfaAppEnabled && verificationCode.length < 6)}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm & Disable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
