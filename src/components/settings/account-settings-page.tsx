"use client";

import { API_ORIGIN } from "@/lib/api-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Camera, UserCircle, Briefcase, Palette, Lock, ShieldCheck, ShieldAlert, ArrowRight } from "lucide-react";
import { useAlert } from "@/context/alert-context";
import { gsap } from "gsap";
import { MfaSettings } from "@/components/mfa-settings";
import { SessionManager } from "@/components/session-manager";
import { PushNotificationManager } from "@/components/push-notification-manager";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "next-themes";
import { useAccent } from "@/components/shell/appearance-menu";
import { ACCENTS, type Accent } from "@/lib/accent";

const API_BASE_URL = API_ORIGIN;

type UserProfile = {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  mfaEmailEnabled: boolean;
  mfaAppEnabled: boolean;
  role: string;
  facultyID: string;
  currentCredit: number;
  prefix?: string;
  designation?: string;
};

export type AccountSection = "profile" | "password" | "preferences" | "security";
export function AccountSettingsPage({ section }: { section: AccountSection }) {
  const { theme, setTheme } = useTheme();
  const [accent, setAccent] = useAccent();
  const titles = {
    profile: "My profile",
    password: "Password",
    preferences: "Appearance",
    security: "Security & sessions",
  };
  const { toast } = useToast();
  const { showAlert } = useAlert();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const containerRef = useRef(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fetchUser = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      showAlert("Authentication error", "You are not logged in.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const responseData = await response.json();
      if (responseData.success) {
        const userData = responseData.user;

        const getAvatarUrl = (userPayload: any) => {
          if (userPayload.profileImage) {
            if (userPayload.profileImage.startsWith("http")) {
              return userPayload.profileImage;
            }
            return `${API_BASE_URL}${userPayload.profileImage.startsWith("/") ? "" : "/"}${userPayload.profileImage}`;
          }
          return `https://ui-avatars.com/api/?name=${encodeURIComponent(userPayload.name)}&background=random`;
        };

        const userProfile: UserProfile = {
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          avatar: getAvatarUrl(userData),
          mfaEmailEnabled: userData.mfaEmailEnabled || false,
          mfaAppEnabled: userData.mfaAppEnabled || false,
          role: userData.role || "n/a",
          facultyID: userData.facultyID || "n/a",
          currentCredit: userData.currentCredit || 0,
          prefix: userData.prefix || "",
          designation: userData.designation || "",
        };
        setUser(userProfile);
        setPreviewImage(userProfile.avatar);
      } else {
        throw new Error(responseData.message || "Failed to fetch user data");
      }
    } catch (error: any) {
      showAlert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (!loading && containerRef.current) {
      gsap.fromTo(
        ".settings-card",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "power3.out" },
      );
    }
  }, [loading, section]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    if (!user) return;
    setUser({ ...user, [name]: value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        showAlert("Image too large", "Profile image must be less than 2MB.");
        return;
      }
      setProfileImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);

    const token = localStorage.getItem("token");
    const formData = new FormData();

    formData.append("name", user.name);
    if (user.prefix) formData.append("prefix", user.prefix);
    if (user.phone) formData.append("phone", user.phone);
    if (profileImage) {
      formData.append("profileImage", profileImage);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const responseData = await response.json();
      if (responseData.success) {
        toast({ title: "Profile updated", description: "Your profile has been successfully updated." });
        fetchUser();
        window.dispatchEvent(new Event("profile-updated"));
      } else {
        throw new Error(responseData.message || "Failed to update profile.");
      }
    } catch (error: any) {
      showAlert("Update failed", error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showAlert("Password mismatch", "New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 12) {
      showAlert("Password too short", "New password must be at least 12 characters long.");
      return;
    }

    setIsChangingPassword(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/me/password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const responseData = await response.json();
      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Failed to change password.");
      }

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      showAlert("Password change failed", error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl space-y-8">
        <Skeleton className="h-9 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8" ref={containerRef}>
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{titles[section]}</h1>
        <p className="text-muted-foreground">Manage your personal account. These settings apply only to you.</p>
      </div>

      <div className="space-y-6">
        <div className="min-w-0">
          {section === "profile" && (
            <div className="mt-6 animate-in fade-in duration-300">
              <form onSubmit={handleUpdateProfile}>
                <Card className="settings-card shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCircle className="h-5 w-5 text-primary" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>Keep your contact details and profile photo up to date.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-wrap items-center gap-4 border-b pb-5">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={previewImage || user?.avatar} />
                        <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <Label
                          htmlFor="profile-image-upload"
                          className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
                        >
                          <Camera className="h-4 w-4" />
                          Change photo
                        </Label>
                        <Input
                          id="profile-image-upload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleImageChange}
                        />
                        <p className="text-xs text-muted-foreground">JPG, PNG or WebP, up to 2 MB.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="prefix">Prefix</Label>
                        <Select onValueChange={(v) => handleSelectChange("prefix", v)} value={user?.prefix}>
                          <SelectTrigger id="prefix" className="bg-muted/30">
                            <SelectValue placeholder="Prefix" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mr.">Mr.</SelectItem>
                            <SelectItem value="Ms.">Ms.</SelectItem>
                            <SelectItem value="Dr.">Dr.</SelectItem>
                            <SelectItem value="Prof.">Prof.</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={user?.name}
                          onChange={handleInputChange}
                          className="bg-muted/30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="designation">Designation</Label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="designation"
                            name="designation"
                            value={user?.designation}
                            readOnly
                            aria-describedby="designation-help"
                            className="pl-10 bg-muted/50"
                          />
                        </div>
                        <p id="designation-help" className="text-xs text-muted-foreground">
                          Managed by your administrator.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={user?.phone}
                          onChange={handleInputChange}
                          className="bg-muted/30"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input value={user?.email} disabled className="bg-muted/50" />
                    </div>
                  </CardContent>
                  <CardFooter className="pt-6 border-t flex justify-end">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "Saving..." : "Update Account"}
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </div>
          )}

          {section === "password" && (
            <div className="mt-6 animate-in fade-in duration-300">
              <form onSubmit={handleChangePassword}>
                <Card className="settings-card shadow-sm border-sidebar-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-primary" />
                      Authentication
                    </CardTitle>
                    <CardDescription>Choose a unique password of at least 12 characters.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="bg-muted/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        minLength={12}
                        maxLength={128}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="bg-muted/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        minLength={12}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="bg-muted/30"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="pt-6 border-t flex justify-end">
                    <Button type="submit" disabled={isChangingPassword}>
                      {isChangingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </div>
          )}

          {section === "preferences" && (
            <div className="mt-6 animate-in fade-in duration-300">
              <Card className="settings-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    Interface Settings
                  </CardTitle>
                  <CardDescription>Customize how the portal looks and behaves for you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="account-theme">Color mode</Label>
                    <Select value={theme || "system"} onValueChange={setTheme}>
                      <SelectTrigger id="account-theme">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">Match device</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-accent">Accent color</Label>
                    <Select value={accent} onValueChange={(value) => setAccent(value as Accent)}>
                      <SelectTrigger id="account-accent" className="capitalize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCENTS.map((value) => (
                          <SelectItem key={value} value={value} className="capitalize">
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Appearance preferences are saved automatically on this device.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {section === "security" && (
            <div className="mt-6 animate-in fade-in duration-300 space-y-6">
              <div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      {user?.mfaAppEnabled || user?.mfaEmailEnabled ? (
                        <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                      ) : (
                        <ShieldAlert className="h-6 w-6" aria-hidden="true" />
                      )}
                    </span>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-widest text-primary">Account protection</p>
                      <h2 className="text-xl font-semibold tracking-tight">
                        {user?.mfaAppEnabled || user?.mfaEmailEnabled
                          ? "Two-factor protection is active"
                          : "Add a second sign-in factor"}
                      </h2>
                      <p className="max-w-xl text-sm text-muted-foreground">
                        {user?.mfaAppEnabled || user?.mfaEmailEnabled
                          ? "Review your sign-in methods and active sessions below to keep your account secure."
                          : "Enable an authenticator app or email verification to protect your account if your password is exposed."}
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="shrink-0 bg-card/80">
                    <Link href="/u/portal/dashboard/account/password">
                      Update password <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>
              <MfaSettings
                mfaEmailEnabled={user?.mfaEmailEnabled || false}
                mfaAppEnabled={user?.mfaAppEnabled || false}
                onUpdate={fetchUser}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SessionManager />
                <Card className="settings-card shadow-sm">
                  <CardHeader>
                    <CardTitle>Device Notifications</CardTitle>
                    <CardDescription>Configure real-time push alerts for this browser.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PushNotificationManager />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
