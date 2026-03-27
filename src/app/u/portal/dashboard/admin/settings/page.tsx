"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, ShieldCheck, UserCircle, Briefcase, Bell, Palette, Lock } from "lucide-react"
import { useAlert } from "@/context/alert-context"
import { gsap } from "gsap";
import { MfaSettings } from "@/components/mfa-settings"
import { SessionManager } from "@/components/session-manager"
import { PushNotificationManager } from "@/components/push-notification-manager"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

const API_BASE_URL = 'https://faculty-credit-system.vercel.app';

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

export default function AdminSettingsPage() {
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
        headers: { "Authorization": `Bearer ${token}` }
      });
      const responseData = await response.json();
      if (responseData.success) {
        const userData = responseData.user;

        const getAvatarUrl = (userPayload: any) => {
            if (userPayload.profileImage) {
                if (userPayload.profileImage.startsWith('http')) {
                    return userPayload.profileImage;
                }
                return `${API_BASE_URL}${userPayload.profileImage.startsWith('/') ? '' : '/'}${userPayload.profileImage}`;
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
          role: userData.role || 'n/a',
          facultyID: userData.facultyID || 'n/a',
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
            { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "power3.out" }
        );
    }
  }, [loading]);

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

    formData.append('name', user.name);
    if(user.prefix) formData.append('prefix', user.prefix);
    if(user.designation) formData.append('designation', user.designation);
    if(user.phone) formData.append('phone', user.phone);
    if (profileImage) {
        formData.append('profileImage', profileImage);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });
        const responseData = await response.json();
        if(responseData.success) {
            toast({ title: "Profile updated", description: "Your profile has been successfully updated." });
            fetchUser();
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
    if (newPassword.length < 8) {
        showAlert("Password too short", "New password must be at least 8 characters long.");
        return;
    }

    setIsChangingPassword(true);
    const token = localStorage.getItem("token");
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/me/password`, {
        method: 'PUT',
        headers: {
            "Authorization": `Bearer ${token}`,
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
          <div className="max-w-7xl mx-auto space-y-8">
              <Skeleton className="h-9 w-48" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1"><Skeleton className="h-64 w-full" /></div>
                  <div className="lg:col-span-2"><Skeleton className="h-96 w-full" /></div>
              </div>
          </div>
      )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8" ref={containerRef}>
        <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Settings</h1>
            <p className="text-muted-foreground">Manage your administrator account, security protocols, and system preferences.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <aside className="lg:col-span-1 space-y-6">
                <Card className="settings-card shadow-sm border-sidebar-border overflow-hidden">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                         <div className="relative group">
                            <Avatar className="h-24 w-24 border-4 border-background ring-1 ring-border shadow-lg">
                                <AvatarImage src={previewImage || user?.avatar} />
                                <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                             <Label htmlFor="profile-image-upload" className="absolute inset-0 bg-black/40 flex items-center justify-center text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Camera className="h-6 w-6" />
                            </Label>
                             <Input id="profile-image-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
                         </div>
                        <h2 className="text-xl font-bold mt-4 text-foreground">{user?.name}</h2>
                        <p className="text-sm text-muted-foreground mb-2 tabular-nums">{user?.email}</p>
                        
                        <Badge className="bg-primary/10 text-primary border-none text-[10px] tracking-widest font-bold px-3 py-1">
                            Administrator
                        </Badge>
                    </CardContent>
                </Card>
                
                <Card className="settings-card shadow-sm border-sidebar-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            System Integrity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-[10px] text-muted-foreground leading-relaxed">Account Protection Level: High</p>
                        <Button variant="outline" className="w-full justify-start text-xs h-8">Audit Logs</Button>
                    </CardContent>
                </Card>
            </aside>

            <main className="lg:col-span-3">
                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="bg-muted/50 p-1 w-full grid grid-cols-2 sm:grid-cols-4 md:flex md:w-max md:justify-start h-auto gap-1">
                        <TabsTrigger value="profile" className="data-[state=active]:bg-background py-2 text-sm font-medium">Account</TabsTrigger>
                        <TabsTrigger value="password" className="data-[state=active]:bg-background py-2 text-sm font-medium">Password</TabsTrigger>
                        <TabsTrigger value="preferences" className="data-[state=active]:bg-background py-2 text-sm font-medium">Preferences</TabsTrigger>
                        <TabsTrigger value="security" className="data-[state=active]:bg-background py-2 text-sm font-medium">Security</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="mt-6 animate-in fade-in duration-300">
                        <form onSubmit={handleUpdateProfile}>
                            <Card className="settings-card shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <UserCircle className="h-5 w-5 text-primary" />
                                        Personal Information
                                    </CardTitle>
                                    <CardDescription>These details are visible to other staff members in the administration.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="prefix">Prefix</Label>
                                            <Select onValueChange={(v) => handleSelectChange('prefix', v)} value={user?.prefix}>
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
                                            <Input id="name" name="name" value={user?.name} onChange={handleInputChange} className="bg-muted/30" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="designation">Admin Designation</Label>
                                            <div className="relative">
                                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input id="designation" name="designation" value={user?.designation} onChange={handleInputChange} placeholder="System Admin" className="pl-10 bg-muted/30" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input id="phone" name="phone" type="tel" value={user?.phone} onChange={handleInputChange} className="bg-muted/30" />
                                        </div>
                                    </div>
                                     <div className="space-y-2">
                                        <Label>Email Address</Label>
                                        <Input value={user?.email} disabled className="bg-muted/50" />
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-6 border-t flex justify-end">
                                    <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Update Account"}</Button>
                                </CardFooter>
                            </Card>
                        </form>
                    </TabsContent>

                    <TabsContent value="password" className="mt-6 animate-in fade-in duration-300">
                         <form onSubmit={handleChangePassword}>
                             <Card className="settings-card shadow-sm border-sidebar-border">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Lock className="h-5 w-5 text-primary" />
                                        Authentication
                                    </CardTitle>
                                    <CardDescription>Rotate your password frequently to keep your account secure.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 max-w-md">
                                    <div className="space-y-2">
                                        <Label htmlFor="current-password">Current Password</Label>
                                        <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="bg-muted/30" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-password">New Password</Label>
                                        <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="bg-muted/30" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                                        <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="bg-muted/30" />
                                    </div>
                                </CardContent>
                                 <CardFooter className="pt-6 border-t flex justify-end">
                                    <Button type="submit" disabled={isChangingPassword}>
                                        {isChangingPassword ? "Updating..." : "Update Password"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </form>
                    </TabsContent>

                    <TabsContent value="preferences" className="mt-6 animate-in fade-in duration-300">
                        <Card className="settings-card shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Palette className="h-5 w-5 text-primary" />
                                    Interface Settings
                                </CardTitle>
                                <CardDescription>Customize how the portal looks and behaves for you.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/10">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Dark Mode</Label>
                                        <p className="text-sm text-muted-foreground">Adjust the portal interface for low-light environments.</p>
                                    </div>
                                    <Switch />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/10">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">System Audit Notifications</Label>
                                        <p className="text-sm text-muted-foreground">Receive real-time alerts for critical system events.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security" className="mt-6 animate-in fade-in duration-300 space-y-6">
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
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    </div>
  )
}
