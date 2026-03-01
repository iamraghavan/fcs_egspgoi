
"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { colleges } from "@/lib/colleges";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, ShieldCheck, Star, Briefcase, UserCircle } from "lucide-react"
import { useAlert } from "@/context/alert-context"
import { gsap } from "gsap";
import { MfaSettings } from "@/components/mfa-settings"
import { SessionManager } from "@/components/session-manager"
import { PushNotificationManager } from "@/components/push-notification-manager"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fcs.egspgroup.in';

type UserProfile = {
  name: string;
  email: string;
  phone: string;
  college: string;
  department?: string;
  avatar: string;
  mfaEmailEnabled: boolean;
  mfaAppEnabled: boolean;
  role: string;
  facultyID: string;
  currentCredit: number;
  prefix?: string;
  designation?: string;
};

type Departments = {
    [key:string]: string[];
};

export default function SettingsPage() {
  const { toast } = useToast();
  const { showAlert } = useAlert();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Departments>({});
  const containerRef = useRef(null);

  // State for password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);


  const fetchUser = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      showAlert("Authentication Error", "You are not logged in.");
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
          college: userData.college || "",
          department: userData.department || "",
          avatar: getAvatarUrl(userData),
          mfaEmailEnabled: userData.mfaEmailEnabled || false,
          mfaAppEnabled: userData.mfaAppEnabled || false,
          role: userData.role || 'N/A',
          facultyID: userData.facultyID || 'N/A',
          currentCredit: userData.currentCredit || 0,
          prefix: userData.prefix || "",
          designation: userData.designation || "",
        };
        setUser(userProfile);
        setPreviewImage(userProfile.avatar);

        if (userProfile.college && colleges[userProfile.college as keyof typeof colleges]) {
          setDepartments(colleges[userProfile.college as keyof typeof colleges]);
        }
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
            (containerRef.current as any).children,
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
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            showAlert("Image Too Large", "Profile image must be less than 2MB.");
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
    if(user.department) formData.append('department', user.department);
    
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
            toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
            fetchUser();
        } else {
            throw new Error(responseData.message || "Failed to update profile.");
        }
    } catch (error: any) {
        showAlert("Update Failed", error.message);
    } finally {
        setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
        showAlert("Password Mismatch", "New password and confirmation do not match.");
        return;
    }
    if (newPassword.length < 8) {
        showAlert("Password Too Short", "New password must be at least 8 characters long.");
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
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (error: any) {
        showAlert("Password Change Failed", error.message);
    } finally {
        setIsChangingPassword(false);
    }
  };
  
  if (loading) {
      return (
          <div className="mx-auto max-w-4xl space-y-8">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-4 w-96" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-1">
                      <Skeleton className="h-48 w-full" />
                  </div>
                  <div className="md:col-span-2">
                       <Skeleton className="h-10 w-full mb-4" />
                       <Skeleton className="h-64 w-full" />
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8" ref={containerRef}>
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
            <p className="mt-1 text-muted-foreground">Manage your account settings and preferences.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                <Card className="text-center">
                    <CardContent className="p-6">
                         <div className="relative inline-block group">
                            <Avatar className="h-28 w-28 border-4 border-background shadow-md">
                                <AvatarImage src={previewImage || user?.avatar} />
                                <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                             <Label htmlFor="profile-image-upload" className="absolute inset-0 bg-black/40 flex items-center justify-center text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Camera className="h-6 w-6" />
                            </Label>
                             <Input id="profile-image-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
                         </div>
                        <h2 className="text-xl font-semibold mt-4">{user?.name}</h2>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2">
                <Tabs defaultValue="profile">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="password">Password</TabsTrigger>
                        <TabsTrigger value="security">Security</TabsTrigger>
                    </TabsList>
                    <TabsContent value="profile">
                        <form onSubmit={handleUpdateProfile}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Profile Information</CardTitle>
                                    <CardDescription>Update your professional profile details.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <Label>Role</Label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <ShieldCheck className="w-5 h-5 text-primary" />
                                                <p className="font-medium capitalize">{user?.role}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Faculty ID</Label>
                                            <p className="font-mono text-sm mt-2">{user?.facultyID}</p>
                                        </div>
                                        <div>
                                            <Label>Current Credits</Label>
                                             <div className="flex items-center gap-2 mt-1">
                                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" />
                                                <p className="font-bold text-lg">{user?.currentCredit}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-1">
                                            <Label htmlFor="prefix">Prefix</Label>
                                            <Select onValueChange={(v) => handleSelectChange('prefix', v)} value={user?.prefix}>
                                                <SelectTrigger id="prefix" className="mt-1">
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
                                        <div className="col-span-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <div className="relative mt-1">
                                                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input id="name" name="name" value={user?.name} onChange={handleInputChange} className="pl-10" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="designation">Designation</Label>
                                            <div className="relative mt-1">
                                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input id="designation" name="designation" value={user?.designation} onChange={handleInputChange} placeholder="e.g. Assistant Professor" className="pl-10" />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input id="phone" name="phone" type="tel" value={user?.phone} onChange={handleInputChange} className="mt-1" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label>College</Label>
                                            <Input value={user?.college} disabled className="mt-1 bg-muted/50" />
                                        </div>
                                        <div>
                                            <Label htmlFor="department">Department</Label>
                                            <Select onValueChange={(v) => handleSelectChange('department', v)} value={user?.department}>
                                                <SelectTrigger id="department" className="mt-1">
                                                    <SelectValue placeholder="Select department" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(departments).map(([group, courses]) => (
                                                        <SelectGroup key={group}>
                                                            <SelectLabel>{group}</SelectLabel>
                                                            {courses.map(course => (
                                                                <SelectItem key={course} value={course}>{course}</SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-6 border-t flex justify-end">
                                    <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Update Profile"}</Button>
                                </CardFooter>
                            </Card>
                        </form>
                    </TabsContent>
                    <TabsContent value="password">
                         <form onSubmit={handleChangePassword}>
                             <Card>
                                <CardHeader>
                                    <CardTitle>Change Password</CardTitle>
                                    <CardDescription>Update your login credentials securely.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="current-password">Current Password</Label>
                                        <Input id="current-password" placeholder="Enter current password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                                    </div>
                                    <div>
                                        <Label htmlFor="new-password">New Password</Label>
                                        <Input id="new-password" placeholder="Enter new password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                                    </div>
                                    <div>
                                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                                        <Input id="confirm-password" placeholder="Confirm new password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
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
                     <TabsContent value="security">
                        <MfaSettings
                            mfaEmailEnabled={user?.mfaEmailEnabled || false}
                            mfaAppEnabled={user?.mfaAppEnabled || false}
                            onUpdate={fetchUser}
                        />
                        <SessionManager />
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle>Push Notifications</CardTitle>
                                <CardDescription>Enable push notifications to receive instant updates on your browser.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <PushNotificationManager />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    </div>
  )
}
