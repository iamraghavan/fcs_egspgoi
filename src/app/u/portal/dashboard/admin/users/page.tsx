"use client";

import { API_ORIGIN } from "@/lib/api-url";
import { useState, useEffect, useRef, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { managedColleges, useApplicationSettings } from "@/lib/application-settings";
import { UserTransfer } from "@/components/admin/user-transfer";
import { UserBulkActions } from "@/components/admin/user-bulk-actions";
import Link from "next/link";
import {
  Edit,
  Eye,
  ShieldCheck,
  User,
  Mail,
  School,
  Building2,
  Phone,
  MessageSquare,
  Briefcase,
  UserCircle,
  Camera,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
  role: "faculty" | "admin" | "oa" | "superadmin";
  prefix?: string;
  designation?: string;
  phone?: string;
  whatsappNumber?: string;
  profileImage?: string;
  facultyID?: string;
  updatedAt?: string;
};

type Departments = {
  [key: string]: string[];
};

export default function FacultyAccountsPage() {
  const { settings, error: settingsError } = useApplicationSettings();
  const [canManage, setCanManage] = useState(false);
  const colleges = useMemo(() => (settings ? managedColleges(settings) : {}), [settings]);
  const [institutionFilter, setInstitutionFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { toast } = useToast();
  const { showAlert } = useAlert();

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
  const [editRole, setEditRole] = useState<"faculty" | "admin" | "oa" | "superadmin">("faculty");
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

  useEffect(() => {
    setCanManage(["admin", "superadmin"].includes(localStorage.getItem("userRole") || ""));
  }, []);

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
      if (searchTerm.trim()) params.set("q", searchTerm.trim());
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("isActive", String(statusFilter === "active"));
      if (collegeFilter !== "all") params.set("college", collegeFilter);
      if (departmentFilter !== "all") params.set("department", departmentFilter);
      if (institutionFilter !== "all") params.set("institutionId", institutionFilter);
      const response = await fetch(`${API_BASE_URL}/api/v1/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
        cache: "no-store",
      });
      const responseData = await response.json();
      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Failed to fetch users.");
      }
      if (signal?.aborted) return;
      setAllFaculty(responseData.items || []);
      setSelectedIds([]);
      setTotalUsers(responseData.total ?? 0);
      const lastPage = Math.max(1, Math.ceil((responseData.total ?? 0) / limit));
      if (page > lastPage) setPage(lastPage);
    } catch (error: any) {
      if (signal?.aborted || error?.name === "AbortError") return;
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
    const timer = window.setTimeout(() => {
      void fetchAllUsers(controller.signal);
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [page, limit, searchTerm, roleFilter, statusFilter, collegeFilter, departmentFilter, institutionFilter]);

  useEffect(() => {
    if (!isLoadingUsers && tableRef.current) {
      gsap.fromTo(
        (tableRef.current as any).children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.05, duration: 0.4, ease: "power3.out" },
      );
    }
  }, [isLoadingUsers, page]);

  useEffect(() => {
    if (editCollege && colleges[editCollege as keyof typeof colleges]) {
      setEditDepartments(colleges[editCollege as keyof typeof colleges]);
    } else {
      setEditDepartments({});
    }
  }, [editCollege, colleges]);

  useEffect(() => {
    if (collegeFilter !== "all" && colleges[collegeFilter as keyof typeof colleges]) {
      setFilteredDepartments(colleges[collegeFilter as keyof typeof colleges]);
      setDepartmentFilter("all");
    } else {
      setFilteredDepartments({});
      setDepartmentFilter("all");
    }
  }, [collegeFilter, colleges]);

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
    setResetPasswordValue("");
    setIsEditDialogOpen(true);
  };

  const handleUpdateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty) return;
    setIsLoading(true);

    const adminToken = localStorage.getItem("token");
    const formData = new FormData();

    formData.append("prefix", editPrefix);
    formData.append("name", editName);
    formData.append("email", editEmail);
    formData.append("phone", editPhone);
    formData.append("whatsappNumber", editWhatsapp);
    formData.append("designation", editDesignation);
    formData.append("college", editCollege);
    formData.append("department", editDepartment);
    formData.append("isActive", String(editIsActive));
    formData.append("role", editRole);

    if (editProfileImage) {
      formData.append("profileImage", editProfileImage);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/${editingFaculty._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        body: formData,
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
    if (!editingFaculty || resetPasswordValue.length < (settings?.passwordMinLength || 12)) {
      showAlert(
        "Password too short",
        `Use at least ${settings?.passwordMinLength || 12} characters for the new password.`,
      );
      return;
    }
    setIsResettingPassword(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/${editingFaculty._id}/reset-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPasswordValue }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to reset password");
      setResetPasswordValue("");
      toast({ title: "Password reset", description: "Existing sessions were revoked." });
    } catch (error: any) {
      showAlert("Reset failed", error.message);
    } finally {
      setIsResettingPassword(false);
    }
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
      if (user.profileImage.startsWith("http")) return user.profileImage;
      return `${API_BASE_URL}${user.profileImage.startsWith("/") ? "" : "/"}${user.profileImage}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
  };

  return (
    <div className="flex-1">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-foreground">User Management</h2>
        <p className="text-muted-foreground mt-1">
          {canManage
            ? "Create and manage faculty, office assistant, and administrator accounts. Inactive accounts retain all records."
            : "Search the faculty directory and view account details."}
        </p>
      </header>
      {settingsError && (
        <p role="alert" className="mb-4 text-destructive">
          {settingsError}
        </p>
      )}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 rounded-xl border bg-card p-4">
        <div className="min-w-64 space-y-2">
          <Label htmlFor="user-institution-filter">Institution</Label>
          <select
            id="user-institution-filter"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={institutionFilter}
            onChange={(event) => {
              setInstitutionFilter(event.target.value);
              setCollegeFilter("all");
              setDepartmentFilter("all");
              setPage(1);
            }}
          >
            <option value="all">All institutions</option>
            {settings?.institutions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {!item.active ? " (archived)" : ""}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-muted-foreground">
          {totalUsers} matching users · {settings?.institutions.length ?? 0} institutions ·{" "}
          {settings?.colleges.length ?? 0} colleges
        </p>
        {canManage && (
          <>
            <Button variant="outline" asChild>
              <Link href="/u/portal/dashboard/admin/setup/organization">Manage institutions and settings</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/u/portal/dashboard/admin/users/bulk-add">Import users from spreadsheet</Link>
            </Button>
            <Button asChild>
              <Link href="/u/portal/dashboard/admin/users/new">Add single user</Link>
            </Button>
          </>
        )}
      </div>
      <div className="bg-card p-6 rounded-xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="relative lg:col-span-1">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              className="w-full pl-10 pr-4 py-2.5 bg-background rounded-lg focus:ring-2 focus:ring-primary transition"
              placeholder="Search by name, email, or faculty ID"
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <Select onValueChange={handleCollegeFilterChange} value={collegeFilter}>
            <SelectTrigger aria-label="Filter by college">
              <SelectValue placeholder="College" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Colleges</SelectItem>
              {Object.keys(colleges)
                .filter(
                  (col) =>
                    institutionFilter === "all" ||
                    settings?.colleges.some((item) => item.name === col && item.institutionId === institutionFilter),
                )
                .map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={handleDepartmentFilterChange}
            value={departmentFilter}
            disabled={collegeFilter === "all" || Object.keys(filteredDepartments).length === 0}
          >
            <SelectTrigger aria-label="Filter by department">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {Object.entries(filteredDepartments).map(([group, courses]) => (
                <SelectGroup key={group}>
                  <SelectLabel>{group}</SelectLabel>
                  {courses.map((course) => (
                    <SelectItem key={course} value={course}>
                      {course}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={handleStatusFilterChange} value={statusFilter}>
            <SelectTrigger aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value) => {
              setRoleFilter(value);
              setPage(1);
            }}
            value={roleFilter}
          >
            <SelectTrigger aria-label="Filter by role">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="faculty">Faculty</SelectItem>
              <SelectItem value="oa">Office Assistant</SelectItem>
              <SelectItem value="admin">Administrator</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {canManage && (
          <UserBulkActions
            users={allFaculty.filter((user) => selectedIds.includes(user._id))}
            onComplete={() => void fetchAllUsers()}
          />
        )}
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {canManage && (
                  <TableHead>
                    <input
                      type="checkbox"
                      aria-label="Select all accounts on this page"
                      checked={
                        allFaculty.some((user) => user.role !== "superadmin") &&
                        allFaculty
                          .filter((user) => user.role !== "superadmin")
                          .every((user) => selectedIds.includes(user._id))
                      }
                      onChange={(event) =>
                        setSelectedIds(
                          event.target.checked
                            ? allFaculty.filter((user) => user.role !== "superadmin").map((user) => user._id)
                            : [],
                        )
                      }
                    />
                  </TableHead>
                )}
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
                  <TableCell colSpan={canManage ? 8 : 7} className="text-center h-24">
                    Loading accounts...
                  </TableCell>
                </TableRow>
              ) : paginatedItems.length > 0 ? (
                paginatedItems.map((account) => (
                  <TableRow key={account._id}>
                    {canManage && (
                      <TableCell>
                        <input
                          type="checkbox"
                          aria-label={`Select ${account.name}`}
                          disabled={account.role === "superadmin"}
                          checked={selectedIds.includes(account._id)}
                          onChange={(event) =>
                            setSelectedIds((ids) =>
                              event.target.checked ? [...ids, account._id] : ids.filter((id) => id !== account._id),
                            )
                          }
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={getAvatarUrl(account)} />
                          <AvatarFallback>{account.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {account.prefix ? `${account.prefix} ` : ""}
                            {account.name}
                          </span>
                          <span className="text-xs text-muted-foreground">{account.facultyID}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{account.email}</TableCell>
                    <TableCell className="capitalize">
                      {account.role === "oa" ? "Office assistant" : account.role}
                    </TableCell>
                    <TableCell>
                      <p>{account.college || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">{account.department || "No department"}</p>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{account.currentCredit ?? 0}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`px-2 py-1 text-caption font-bold tracking-wider rounded-full ${
                          account.isActive ? "bg-success-bg text-success-text" : "bg-danger-bg text-danger-text"
                        }`}
                      >
                        {account.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {canManage && (
                          <UserTransfer user={account} settings={settings} onTransferred={() => void fetchAllUsers()} />
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setSelectedFaculty(account)}
                              aria-label={`View details of ${account.name}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Account Details</DialogTitle>
                              <DialogDescription>Profile and access details for this account.</DialogDescription>
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
                                      <p className="text-lg font-semibold">
                                        {selectedFaculty.prefix ? `${selectedFaculty.prefix} ` : ""}
                                        {selectedFaculty.name}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {selectedFaculty.designation || "Faculty"}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {selectedFaculty.department || "N/A"} - {selectedFaculty.college || "N/A"}
                                      </p>
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
                                        <span className="font-semibold text-primary">
                                          {selectedFaculty.currentCredit ?? 0}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground font-medium block">Email</span>
                                        <span>{selectedFaculty.email}</span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground font-medium block">Status</span>
                                        <span
                                          className={`font-medium ${selectedFaculty.isActive ? "text-success-text" : "text-danger-text"}`}
                                        >
                                          {selectedFaculty.isActive ? "Active" : "Inactive"}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground font-medium block">Phone</span>
                                        <span>{selectedFaculty.phone || "Not provided"}</span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground font-medium block">WhatsApp</span>
                                        <span>{selectedFaculty.whatsappNumber || "Not provided"}</span>
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

                        {canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditClick(account)}
                            disabled={account.role === "superadmin"}
                            aria-label={`Edit ${account.name}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={canManage ? 8 : 7} className="text-center h-24">
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
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
            <DialogDescription>
              Update the profile, role, and account status. Use the transfer action in the user list to change college
              or department.
            </DialogDescription>
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
                      <Input
                        id="edit-name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-designation">Designation</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="edit-designation"
                      value={editDesignation}
                      onChange={(e) => setEditDesignation(e.target.value)}
                      placeholder="e.g. Assistant Professor"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email">Official Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="edit-email"
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="edit-phone"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-whatsapp">WhatsApp Number</Label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="edit-whatsapp"
                        value={editWhatsapp}
                        onChange={(e) => setEditWhatsapp(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Profile Image</Label>
                  <div className="flex items-center gap-4 mb-2">
                    <Avatar className="h-16 w-16 border">
                      <AvatarImage
                        src={
                          editProfileImage
                            ? URL.createObjectURL(editProfileImage)
                            : editingFaculty
                              ? getAvatarUrl(editingFaculty)
                              : undefined
                        }
                      />
                      <AvatarFallback>
                        <Camera className="h-6 w-6 text-muted-foreground" />
                      </AvatarFallback>
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
                    <Select value={editCollege} onValueChange={setEditCollege} disabled>
                      <SelectTrigger aria-label="College" className="pl-10">
                        <SelectValue placeholder="Select College" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(colleges).map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Select value={editDepartment} onValueChange={setEditDepartment} disabled>
                      <SelectTrigger aria-label="Department" className="pl-10">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(editDepartments).map(([group, courses]) => (
                          <SelectGroup key={group}>
                            <SelectLabel>{group}</SelectLabel>
                            {courses.map((course) => (
                              <SelectItem key={course} value={course}>
                                {course}
                              </SelectItem>
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
                <Input
                  id="reset-account-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={settings?.passwordMinLength || 12}
                  value={resetPasswordValue}
                  onChange={(event) => setResetPasswordValue(event.target.value)}
                  placeholder={`New password, at least ${settings?.passwordMinLength || 12} characters`}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetPassword}
                  disabled={
                    isResettingPassword ||
                    resetPasswordValue.length < (settings?.passwordMinLength || 12) ||
                    editingFaculty?.role === "superadmin"
                  }
                >
                  {isResettingPassword ? "Resetting..." : "Reset password"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">This revokes the account&apos;s active sessions.</p>
            </div>

            <DialogFooter className="pt-4 border-t">
              <DialogClose asChild>
                <Button type="button" variant="secondary" className="">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving Profile..." : "Update Profile"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
