
"use client"

import { useState, useEffect, useMemo, useRef } from "react";
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
import { Edit, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAlert } from "@/context/alert-context";
import { useToast } from "@/hooks/use-toast";
import { gsap } from "gsap";
import { Label } from "@/components/ui/label";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fcs.egspgroup.in:81';

type FacultyAccount = {
  _id: string;
  name: string;
  email: string;
  college: string;
  department?: string;
  currentCredit: number;
  isActive: boolean;
  role: 'faculty' | 'admin' | 'oa';
};

type Departments = {
    [key: string]: string[];
};


export default function FacultyAccountsPage() {
  const { toast } = useToast();
  const { showAlert } = useAlert();
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState<'faculty' | 'oa'>('faculty');
  const [departments, setDepartments] = useState<Departments>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Table state
  const [facultyAccounts, setFacultyAccounts] = useState<FacultyAccount[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyAccount | null>(null);


  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [filteredDepartments, setFilteredDepartments] = useState<Departments>({});

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  
  const tableRef = useRef(null);

  const fetchUsers = async (currentPage: number) => {
    setIsLoadingUsers(true);
    const adminToken = localStorage.getItem("token");
    if (!adminToken) {
      showAlert("Authentication Error", "Admin token not found.");
      setIsLoadingUsers(false);
      return;
    }
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sort: 'name', // Sort alphabetically by name
      });
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('isActive', statusFilter === 'active' ? 'true' : 'false');
      if (collegeFilter !== 'all') params.append('college', collegeFilter);
      if (departmentFilter !== 'all') params.append('department', departmentFilter);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/users?${params.toString()}`, {
        headers: { "Authorization": `Bearer ${adminToken}` },
      });
      const responseData = await response.json();
      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Failed to fetch users.");
      }
      setFacultyAccounts(responseData.items);
      setTotal(responseData.total);
    } catch (error: any) {
      showAlert("Failed to Fetch Users", error.message);
      setFacultyAccounts([]);
      setTotal(0);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchUsers(page);
    }, 500);
    return () => clearTimeout(handler);
  }, [page, searchTerm, statusFilter, collegeFilter, departmentFilter]);

  // Reset to page 1 when filters (except page itself) change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, collegeFilter, departmentFilter]);
  
  useEffect(() => {
    if (!isLoadingUsers && tableRef.current) {
        gsap.fromTo(
            (tableRef.current as any).children,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, stagger: 0.05, duration: 0.4, ease: "power3.out" }
        );
    }
  }, [isLoadingUsers, facultyAccounts]);

  useEffect(() => {
    if (college && colleges[college as keyof typeof colleges]) {
      setDepartments(colleges[college as keyof typeof colleges]);
      setDepartment(""); // Reset department when college changes
    } else {
      setDepartments({});
    }
  }, [college]);

    useEffect(() => {
    if (collegeFilter !== 'all' && colleges[collegeFilter as keyof typeof colleges]) {
      setFilteredDepartments(colleges[collegeFilter as keyof typeof colleges]);
    } else {
      setFilteredDepartments({});
    }
    setDepartmentFilter("all"); // Reset department filter when college changes
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
    } else if (role === 'oa') {
        payload.college = "EGS Pillay Group of Institutions";
        payload.department = "Academics / Admistrative";
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Failed to create account.");
      }

      toast({
        title: "Account Created",
        description: `Account for ${name} has been successfully created.`,
      });

      // Reset form and refresh user list
      setName("");
      setEmail("");
      setPassword("");
      setCollege("");
      setDepartment("");
      setRole("faculty");
      fetchUsers(1);
    } catch (error: any) {
      showAlert(
        "Creation Failed",
        error.message || "An unexpected error occurred.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex-1 p-8">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-foreground">
          Faculty Accounts
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage faculty accounts and their credit balances.
        </p>
      </header>
      <div className="bg-card p-6 rounded-xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="relative lg:col-span-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              search
            </span>
            <Input
              className="w-full pl-10 pr-4 py-2.5 bg-background rounded-lg focus:ring-2 focus:ring-primary transition"
              placeholder="Search by name or email"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
            <Select onValueChange={setCollegeFilter} value={collegeFilter}>
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
            <Select onValueChange={setDepartmentFilter} value={departmentFilter} disabled={collegeFilter === 'all' || Object.keys(filteredDepartments).length === 0}>
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
            <Select onValueChange={setStatusFilter} value={statusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>College</TableHead>
                <TableHead className="text-right">Credits</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody ref={tableRef}>
              {isLoadingUsers ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    Loading faculty accounts...
                  </TableCell>
                </TableRow>
              ) : facultyAccounts.length > 0 ? (
                facultyAccounts.map((account) => (
                  <TableRow key={account._id}>
                    <TableCell className="font-medium text-foreground">
                      {account.name}
                    </TableCell>
                    <TableCell>{account.email}</TableCell>
                    <TableCell>{account.college || 'N/A'}</TableCell>
                    <TableCell className="text-right">{account.currentCredit ?? 0}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          account.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {account.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedFaculty(account)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Faculty Details</DialogTitle>
                            <DialogDescription>
                              Detailed information about the faculty member.
                            </DialogDescription>
                          </DialogHeader>
                          {selectedFaculty && (
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                  <Avatar className="h-16 w-16">
                                      <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedFaculty.name)}&background=random`} />
                                      <AvatarFallback>{selectedFaculty.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                      <p className="text-lg font-semibold">{selectedFaculty.name}</p>
                                      <p className="text-sm text-muted-foreground">{selectedFaculty.email}</p>
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                      <p className="text-muted-foreground">College</p>
                                      <p className="font-medium">{selectedFaculty.college || 'N/A'}</p>
                                  </div>
                                  <div>
                                      <p className="text-muted-foreground">Department</p>
                                      <p className="font-medium">{selectedFaculty.department || 'N/A'}</p>
                                  </div>
                                  <div>
                                      <p className="text-muted-foreground">Current Credits</p>
                                      <p className="font-medium">{selectedFaculty.currentCredit ?? 0}</p>
                                  </div>
                                   <div>
                                      <p className="text-muted-foreground">Status</p>
                                      <p className="font-medium">{selectedFaculty.isActive ? 'Active' : 'Inactive'}</p>
                                  </div>
                                  <div>
                                      <p className="text-muted-foreground">Last Submission Date</p>
                                      <p className="font-medium">N/A</p>
                                  </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                        No faculty accounts found.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages || 1}
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
      <div className="mt-10">
        <h3 className="text-2xl font-bold text-foreground mb-6">
          Create New Account
        </h3>
        <div className="bg-card p-6 rounded-xl shadow-sm max-w-2xl">
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
                    <Input id="password" placeholder="Enter a temporary password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
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

    