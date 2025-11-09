
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { useAlert } from "@/context/alert-context";
import { Loader2 } from "lucide-react";

type MfaSettingsProps = {
  mfaEnabled: {
    email: boolean;
    app: boolean;
  };
  onUpdate: () => void;
};

export function MfaSettings({ mfaEnabled, onUpdate }: MfaSettingsProps) {
  const { showAlert } = useAlert();
  const {
    toggleEmailMfa,
    enableAppMfa,
    verifyAppSetup,
    disableAllMfa,
    isLoading,
    qrCode,
    setQrCode,
  } = useMfaSettings();

  const [verificationCode, setVerificationCode] = useState("");
  const [isAppSetupDialogOpen, setIsAppSetupDialogOpen] = useState(false);

  const handleEmailToggle = async (enabled: boolean) => {
    await toggleEmailMfa(enabled);
    onUpdate();
  };

  const handleEnableApp = async () => {
    const success = await enableAppMfa();
    if (success) {
      setIsAppSetupDialogOpen(true);
    }
  };
  
  const handleVerifyApp = async () => {
    const success = await verifyAppSetup(verificationCode);
    if (success) {
      setIsAppSetupDialogOpen(false);
      setQrCode(null);
      setVerificationCode("");
      onUpdate();
    }
  };

  const handleDisableAll = async () => {
    await disableAllMfa();
    onUpdate();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>Add an extra layer of security to your account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div>
            <Label htmlFor="email-mfa" className="font-medium">Email Authentication</Label>
            <p className="text-sm text-muted-foreground">Receive a code via email to log in.</p>
          </div>
          <Switch
            id="email-mfa"
            checked={mfaEnabled.email}
            onCheckedChange={handleEmailToggle}
            disabled={isLoading}
          />
        </div>
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div>
            <Label className="font-medium">Authenticator App</Label>
            <p className="text-sm text-muted-foreground">Use an app like Google Authenticator.</p>
          </div>
          {mfaEnabled.app ? (
            <p className="text-sm font-medium text-green-600">Enabled</p>
          ) : (
            <Button onClick={handleEnableApp} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Set Up
            </Button>
          )}
        </div>
      </CardContent>
      {(mfaEnabled.email || mfaEnabled.app) && (
        <CardContent className="pt-6 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Disable All MFA</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all two-factor authentication methods from your account, making it less secure.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDisableAll} className="bg-destructive hover:bg-destructive/90">
                  Yes, Disable MFA
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      )}

      <Dialog open={isAppSetupDialogOpen} onOpenChange={setIsAppSetupDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up Authenticator App</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app, then enter the 6-digit code to verify.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex flex-col items-center gap-4">
            {qrCode ? (
              <Image src={qrCode} alt="MFA QR Code" width={200} height={200} />
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100 rounded-md">
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
              <Button type="button" variant="secondary" onClick={() => setQrCode(null)}>
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
    </Card>
  );
}
