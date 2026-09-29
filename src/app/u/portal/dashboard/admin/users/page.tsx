"use client"

import { API_ORIGIN } from '@/lib/api-url';
import { useState, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"
import { colleges } from "@/lib/colleges";
import { Edit, Eye, ShieldCheck, User, Mail, School, Building2, Phone, MessageSquare, Briefcase, UserCircle, Camera } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAlert } from "@/context/alert-context";
import { useToast } from "@/hooks/use-toast";
import { gsap } from "gsap";
import { Label } from "@/components/ui/label";
import { WhatsAppShareButton } from "@/components/whatsapp-share-button";
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/file-upload";


const API_BASE_URL = API_ORIGIN;

type FacultyAccount = {
  _id: string;
  name: string;
  email: string;
  college: string;
  department?: string;
  currentCredit: number;
  isActive: boolean;
  role: 'faculty' | 'admin' | 'oa' | 'superadmin';
  prefix?: string;
  designation?: string;
  phone?: string;
  whatsappNumber?: string;
  profileImage?: string;
  facultyID?: string;
};

type Departments = {
    [key: string]: string[];
};


export default function FacultyAccountsPage() {
  const { toast } = useToast();
  const { showAlert } = useAlert();
  
  // Create Account Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState<'faculty' | 'oa' | 'admin'>('faculty');
  const [departments, setDepartments] = useState<Departments>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyAccount | null>(null);
  const [editPrefix, setEditPrefix] = useState("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [editCollege, setEditCollege] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editRole, setEditRole] = useState<'faculty' | 'admin' | 'oa' | 'superadmin'>('faculty');
  const [editProfileImage, setEditProfileImage] = useState<File | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [editDepartments, setEditDepartments] = useState<Departments>({});
  
  // Table state
  const [allFaculty, setAllFaculty] = useState<FacultyAccount[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyAccount | null>(null);


  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [filteredDepartments, setFilteredDepartments] = useState<Departments>({});

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  const tableRef = useRef(null);

  const fetchAllUsers = async (signal?: AbortSignal) => {
    setIsLoadingUsers(true);
    const token = localStorage.getItem("token");
    if (!token) {
      showAlert("Authentication Error", "Admin token not found.");
      setIsLoadingUsers(false);
      return;
    }
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (searchTerm.trim()) params.set('q', searchTerm.trim());
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (statusFilter !== 'all') params.set('isActive', String(statusFilter === 'active'));
      if (collegeFilter !== 'all') params.set('college', collegeFilter);
      if (departmentFilter !== 'all') params.set('department', departmentFilter);
      const response = await fetch(`${API_BASE_URL}/api/v1/users?${params.toString()}`, {
        headers: { "Authorization": `Bearer ${token}` }, signal, cache: 'no-store',
      });
      const responseData = await response.json();
      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Failed to fetch users.");
      }
      if (signal?.aborted) return;
      setAllFaculty(responseData.items || []);
      setTotalUsers(responseData.total ?? 0);
      const lastPage = Math.max(1, Math.ceil((responseData.total ?? 0) / limit));
      if (page > lastPage) setPage(lastPage);
    } catch (error: any) {
      if (signal?.aborted || error?.name === 'AbortError') return;
      showAlert("Failed to Fetch Users", error.message);
      setAllFaculty([]);
      setTotalUsers(0);
    } finally {
      if (!signal?.aborted) setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    setIsLoadingUsers(true);
    const timer = window.setTimeout(() => { void fetchAllUsers(controller.signal); }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [page, limit, searchTerm, roleFilter, statusFilter, collegeFilter, departmentFilter]);
  
  useEffect(() => {
    if (!isLoadingUsers && tableRef.current) {
        gsap.fromTo(
            (tableRef.current as any).children,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, stagger: 0.05, duration: 0.4, ease: "power3.out" }
        );
    }
  }, [isLoadingUsers, page]);

  useEffect(() => {
    if (college && colleges[college as keyof typeof colleges]) {
      setDepartments(colleges[college as keyof typeof colleges]);
      setDepartment("");
    } else {
      setDepartments({});
    }
  }, [college]);

  useEffect(() => {
    if (editCollege && colleges[editCollege as keyof typeof colleges]) {
        setEditDepartments(colleges[editCollege as keyof typeof colleges]);
    } else {
        setEditDepartments({});
    }
  }, [editCollege]);

    useEffect(() => {
    if (collegeFilter !== 'all' && colleges[collegeFilter as keyof typeof colleges]) {
      setFilteredDepartments(colleges[collegeFilter as keyof typeof colleges]);
      setDepartmentFilter("all"); 
    } else {
      setFilteredDepartments({});
      setDepartmentFilter("all");
    }
  }, [collegeFilter]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const adminToken = localStorage.getItem("token");
    if (!adminToken) {
      showAlert(
        "Authentication Error",
        "Admin token not found. Please log in again.",
      );
      setIsLoading(false);
      return;
    }

    const payload: any = {
      name,
      email,
      password,
      role,
    };

    if (role === 'faculty') {
        if (!college || !department) {
            showAlert("Incomplete Form", "College and Department are required for faculty accounts.");
            setIsLoading(false);
            return;
        }
        payload.college = college;
        payload.department = department;
    } else if (role === 'oa' || role === 'admin') {
        payload.college = "EGS Pillay Group of Institutions";
        payload.department = "Academics / Administrative";
    }

    try {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => formData.append(key, String(value)));
      const response = await fetch(`${API_BASE_URL}/api/v1/users`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${adminToken}`,
        },
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Failed to create account.");
      }

      toast({
        title: "Account Created",
        description: `Account for ${name} has been successfully created.`,
      });

      setName("");
      setEmail("");
      setPassword("");
      setCollege("");
      setDepartment("");
      setRole("faculty");
      fetchAllUsers();

    } catch (error: any) {
      showAlert(
        "Creation Failed",
        error.message || "An unexpected error occurred.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (account: FacultyAccount) => {
    setEditingFaculty(account);
    setEditPrefix(account.prefix || "");
    setEditName(account.name);
    setEditEmail(account.email);
    setEditPhone(account.phone || "");
    setEditWhatsapp(account.whatsappNumber || "");
    setEditDesignation(account.designation || "");
    setEditCollege(account.college || "");
    setEditDepartment(account.department || "");
    setEditIsActive(account.isActive);
    setEditRole(account.role);
    setEditProfileImage(null);
    setResetPasswordValue('');
    setIsEditDialogOpen(true);
  };

  const handleUpdateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty) return;
    setIsLoading(true);

    const adminToken = localStorage.getItem("token");
    const formData = new FormData();
    
    formData.append('prefix', editPrefix);
    formData.append('name', editName);
    formData.append('email', editEmail);
    formData.append('phone', editPhone);
    formData.append('whatsappNumber', editWhatsapp);
    formData.append('designation', editDesignation);
    formData.append('college', editCollege);
    formData.append('department', editDepartment);
    formData.append('isActive', String(editIsActive));
    formData.append('role', editRole);
    
    if (editProfileImage) {
        formData.append('profileImage', editProfileImage);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/users/${editingFaculty._id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            },
            body: formData
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to update account");
        }

        toast({ title: "Account Updated", description: `Updated details for ${editName}.` });
        setIsEditDialogOpen(false);
        setEditingFaculty(null);
        fetchAllUsers();
    } catch (error: any) {
        showAlert("Update Failed", error.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!editingFaculty || resetPasswordValue.length < 12) {
      showAlert('Password too short', 'Use at least 12 characters for the new password.');
      return;
    }
    setIsResettingPassword(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/${editingFaculty._id}/reset-password`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPasswordValue }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to reset password');
      setResetPasswordValue('');
      toast({ title: 'Password reset', description: 'Existing sessions were revoked.' });
    } catch (error: any) { showAlert('Reset failed', error.message); }
    finally { setIsResettingPassword(false); }
  };

  const paginatedItems = allFaculty;
  const totalPages = Math.max(1, Math.ceil(totalUsers / limit));
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };
  const handleCollegeFilterChange = (value: string) => {
    setCollegeFilter(value);
    setPage(1);
  };
   const handleDepartmentFilterChange = (value: string) => {
    setDepartmentFilter(value);
    setPage(1);
  };
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const getAvatarUrl = (user: FacultyAccount) => {
    if (user.profileImage) {
        if (user.profileImage.startsWith('http')) return user.profileImage;
        return `${API_BASE_URL}${user.profileImage.startsWith('/') ? '' : '/'}${user.profileImage}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
  };

  return (
    <div className="flex-1">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-foreground">
          User Management
        </h2>
        <p className="text-muted-foreground mt-1">
          Create and manage faculty, office assistant, and administrator accounts. Inactive accounts retain all records.
        </p>
      </header>
      <div className="bg-card p-6 rounded-xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="relative lg:col-span-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              search
            </span>
            <Input
              className="w-full pl-10 pr-4 py-2.5 bg-background rounded-lg focus:ring-2 focus:ring-primary transition"
              placeholder="Search by name, email, or faculty ID"
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
            <Select onValueChange={handleCollegeFilterChange} value={collegeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="College" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colleges</SelectItem>
                {Object.keys(colleges).map((col) => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={handleDepartmentFilterChange} value={departmentFilter} disabled={collegeFilter === 'all' || Object.keys(filteredDepartments).length === 0}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {Object.entries(filteredDepartments).map(([group, courses]) => (
                  <SelectGroup key={group}>
                    <SelectLabel>{group}</SelectLabel>
                    {courses.map(course => (
                        <SelectItem key={course} value={course}>{course}</SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={handleStatusFilterChange} value={statusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={value => { setRoleFilter(value); setPage(1); }} value={roleFilter}>
              <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Roles</SelectItem><SelectItem value="faculty">Faculty</SelectItem><SelectItem value="oa">Office Assistant</SelectItem><SelectItem value="admin">Administrator</SelectItem></SelectContent>
            </Select>
        </div>
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>College</TableHead>
                <TableHead className="text-right">Credits</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody ref={tableRef}>
              {isLoadingUsers ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    Loading accounts...
                  </TableCell>
                </TableRow>
              ) : paginatedItems.length > 0 ? (
                paginatedItems.map((account) => (
                  <TableRow key={account._id}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={getAvatarUrl(account)} />
                                <AvatarFallback>{account.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-medium text-foreground">{account.prefix ? `${account.prefix} ` : ''}{account.name}</span>
                                <span className="text-xs text-muted-foreground">{account.facultyID}</span>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>{account.email}</TableCell>
                    <TableCell className="capitalize">{account.role === 'oa' ? 'Office assistant' : account.role}</TableCell>
                    <TableCell>{account.college || 'N/A'}</TableCell>
                    <TableCell className="text-right font-semibold">{account.currentCredit ?? 0}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`px-2 py-1 text-[10px] font-bold tracking-wider rounded-full ${
                          account.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {account.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Dialog>
                            <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedFaculty(account)}>
                                <Eye className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Account Details</DialogTitle>
                                <DialogDescription>
                                Profile and access details for this account.
                                </DialogDescription>
                            </DialogHeader>
                            {selectedFaculty && (
                                <>
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-4">
                                        <Avatar className="h-16 w-16">
                                            <AvatarImage src={getAvatarUrl(selectedFaculty)} />
                                            <AvatarFallback>{selectedFaculty.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-lg font-semibold">{selectedFaculty.prefix ? `${selectedFaculty.prefix} ` : ''}{selectedFaculty.name}</p>
                                            <p className="text-sm text-muted-foreground">{selectedFaculty.designation || 'Faculty'}</p>
                                            <p className="text-xs text-muted-foreground">{selectedFaculty.department || 'N/A'} - {selectedFaculty.college || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm pt-2 border-t">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-muted-foreground font-medium block">Faculty ID</span>
                                                <span>{selectedFaculty.facultyID}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground font-medium block">Current Credits</span>
                                                <span className="font-semibold text-primary">{selectedFaculty.currentCredit ?? 0}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground font-medium block">Email</span>
                                                <span>{selectedFaculty.email}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground font-medium block">Status</span>
                                                <span className={`font-medium ${selectedFaculty.isActive ? 'text-green-600' : 'text-red-600'}`}>{selectedFaculty.isActive ? 'Active' : 'Inactive'}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground font-medium block">Phone</span>
                                                <span>{selectedFaculty.phone || 'Not provided'}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground font-medium block">WhatsApp</span>
                                                <span>{selectedFaculty.whatsappNumber || 'Not provided'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="pt-4 mt-4 border-t">
                                    <WhatsAppShareButton 
                                    facultyName={selectedFaculty.name}
                                    creditScore={selectedFaculty.currentCredit ?? 0}
                                    facultyId={selectedFaculty._id}
                                    />
                                </DialogFooter>
                                </>
                            )}
                            </DialogContent>
                        </Dialog>
                        
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(account)} disabled={account.role === 'superadmin'} aria-label={`Edit ${account.name}`}>
                            <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                        No accounts found.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            {totalUsers} accounts · Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                Next
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Faculty Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Edit Faculty Profile</DialogTitle>
                <DialogDescription>Update the professional profile and account settings for this user.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateFaculty} className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-2">
                                <Label htmlFor="edit-prefix">Prefix</Label>
                                <Select value={editPrefix} onValueChange={setEditPrefix}>
                                    <SelectTrigger id="edit-prefix">
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
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="edit-name">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} className="pl-10" required />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-designation">Designation</Label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="edit-designation" value={editDesignation} onChange={(e) => setEditDesignation(e.target.value)} placeholder="e.g. Assistant Professor" className="pl-10" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Official Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="pl-10" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-phone">Phone Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="edit-phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="pl-10" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-whatsapp">WhatsApp Number</Label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="edit-whatsapp" value={editWhatsapp} onChange={(e) => setEditWhatsapp(e.target.value)} className="pl-10" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Profile Image</Label>
                            <div className="flex items-center gap-4 mb-2">
                                <Avatar className="h-16 w-16 border">
                                    <AvatarImage src={editProfileImage ? URL.createObjectURL(editProfileImage) : (editingFaculty ? getAvatarUrl(editingFaculty) : undefined)} />
                                    <AvatarFallback><Camera className="h-6 w-6 text-muted-foreground" /></AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <FileUpload 
                                        onFileSelect={setEditProfileImage} 
                                        accept="image/*" 
                                        description="JPG, PNG up to 2MB"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-role">System Role</Label>
                                <Select value={editRole} onValueChange={(v: any) => setEditRole(v)}>
                                    <SelectTrigger id="edit-role">
                                        <SelectValue placeholder="Select Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="faculty">Faculty</SelectItem>
                                <SelectItem value="admin">Administrator</SelectItem>
                                        <SelectItem value="oa">Office Assistant</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-2 pt-8">
                                <Switch id="edit-status" checked={editIsActive} onCheckedChange={setEditIsActive} />
                                <Label htmlFor="edit-status">{editIsActive ? "Active" : "Inactive"}</Label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-college">College</Label>
                            <div className="relative">
                                <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                                <Select value={editCollege} onValueChange={setEditCollege}>
                                    <SelectTrigger className="pl-10">
                                        <SelectValue placeholder="Select College" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(colleges).map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-department">Department</Label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                                <Select value={editDepartment} onValueChange={setEditDepartment} disabled={!editCollege}>
                                    <SelectTrigger className="pl-10">
                                        <SelectValue placeholder="Select Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(editDepartments).map(([group, courses]) => (
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
                    </div>
                </div>

                <div className="space-y-2 border-t pt-4">
                    <Label htmlFor="reset-account-password">Reset password</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input id="reset-account-password" type="password" autoComplete="new-password" minLength={12} value={resetPasswordValue} onChange={event => setResetPasswordValue(event.target.value)} placeholder="New password, at least 12 characters" />
                        <Button type="button" variant="outline" onClick={handleResetPassword} disabled={isResettingPassword || resetPasswordValue.length < 12 || editingFaculty?.role === 'superadmin'}>{isResettingPassword ? 'Resetting...' : 'Reset password'}</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">This revokes the account&apos;s active sessions.</p>
                </div>

                <DialogFooter className="pt-4 border-t">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary" className="rounded-none">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Saving Profile..." : "Update Profile"}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      <div className="mt-10">
        <h3 className="text-2xl font-bold text-foreground mb-6">
          Create New Account
        </h3>
        <div className="bg-card p-6 rounded-xl shadow-sm max-w-2xl border">
          <form className="space-y-6" onSubmit={handleCreateAccount}>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Name
                  </Label>
                  <Input id="name" placeholder="Enter full name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </Label>
                  <Input id="email" placeholder="Enter email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">Password</Label>
                    <Input id="password" placeholder="At least 12 characters" type="password" minLength={12} value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div>
                    <Label htmlFor="role" className="block text-sm font-medium text-foreground mb-2">Role</Label>
                    <Select onValueChange={(value) => setRole(value as any)} value={role}>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="faculty">Faculty</SelectItem>
                        <SelectItem value="oa">Office Assistant (OA)</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
            </div>

            {role === 'faculty' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="college" className="block text-sm font-medium text-foreground mb-2">College</Label>
                  <Select onValueChange={setCollege} value={college}>
                    <SelectTrigger id="college">
                      <SelectValue placeholder="Select college" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(colleges).map((collegeName) => (
                        <SelectItem key={collegeName} value={collegeName}>
                          {collegeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department" className="block text-sm font-medium text-foreground mb-2">Department</Label>
                  <Select onValueChange={setDepartment} value={department} disabled={!college || Object.keys(departments).length === 0}>
                    <SelectTrigger id="department">
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
            )}
            
            <div>
              <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
