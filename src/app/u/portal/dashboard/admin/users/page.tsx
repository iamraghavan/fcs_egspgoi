
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fcs.egspgroup.in:81';

type FacultyAccount = {
  _id: string;
  name: string;
  email: string;
  college: string;
  department?: string;
  currentCredit: number;
  isActive: boolean;
};

type Departments = {
    [key: string]: string[];
};


export default function FacultyAccountsPage() {
  const { toast } = useToast();
  const { showAlert } = useAlert();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState<Departments>({});
  const [isLoading, setIsLoading] = useState(false);
  const [facultyAccounts, setFacultyAccounts] = useState<FacultyAccount[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyAccount | null>(null);


  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [filteredDepartments, setFilteredDepartments] = useState<Departments>({});
  
  const tableRef = useRef(null);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    const adminToken = localStorage.getItem("token");
    if (!adminToken) {
      showAlert(
        "Authentication Error",
        "Admin token not found.",
      );
      setIsLoadingUsers(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users`, {
        headers: {
          "Authorization": `Bearer ${adminToken}`,
        },
      });
      const responseData = await response.json();
      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Failed to fetch users.");
      }
      setFacultyAccounts(responseData.items);
    } catch (error: any) {
      showAlert(
        "Failed to Fetch Users",
        error.message,
      );
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  
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
      setDepartmentFilter("all"); 
    } else {
      setFilteredDepartments({});
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

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name,
          email,
          password,
          college,
          department,
          role: "faculty",
        }),
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Failed to create account.");
      }

      toast({
        title: "Account Created",
        description: `Faculty account for ${name} has been successfully created.`,
      });

      // Reset form and refresh user list
      setName("");
      setEmail("");
      setPassword("");
      setCollege("");
      setDepartment("");
      fetchUsers();
    } catch (error: any) {
      showAlert(
        "Creation Failed",
        error.message || "An unexpected error occurred.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAccounts = useMemo(() => {
    return facultyAccounts.filter(account => {
      const matchesSearch = searchTerm.trim() === "" ||
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && account.isActive) ||
        (statusFilter === 'inactive' && !account.isActive);

      const matchesCollege = collegeFilter === 'all' || account.college === collegeFilter;
      
      const matchesDepartment = departmentFilter === 'all' || account.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesCollege && matchesDepartment;
    });
  }, [facultyAccounts, searchTerm, statusFilter, collegeFilter, departmentFilter]);

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
            <Select onValueChange={setDepartmentFilter} value={departmentFilter} disabled={collegeFilter === 'all'}>
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
                  <TableCell colSpan={6} className="text-center">
                    Loading faculty accounts...
                  </TableCell>
                </TableRow>
              ) : filteredAccounts.length > 0 ? (
                filteredAccounts.map((account) => (
                  <TableRow key={account._id}>
                    <TableCell className="font-medium text-foreground">
                      {account.name}
                    </TableCell>
                    <TableCell>{account.email}</TableCell>
                    <TableCell>{account.college}</TableCell>
                    <TableCell className="text-right">{account.currentCredit}</TableCell>
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
                                      <p className="font-medium">{selectedFaculty.college}</p>
                                  </div>
                                  <div>
                                      <p className="text-muted-foreground">Department</p>
                                      <p className="font-medium">{selectedFaculty.department || 'N/A'}</p>
                                  </div>
                                  <div>
                                      <p className="text-muted-foreground">Current Credits</p>
                                      <p className="font-medium">{selectedFaculty.currentCredit}</p>
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
                    <TableCell colSpan={6} className="text-center">
                        No faculty accounts found.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
                  <label
                    className="block text-sm font-medium text-foreground mb-2"
                    htmlFor="name"
                  >
                    Name
                  </label>
                  <Input
                    id="name"
                    placeholder="Enter faculty name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium text-foreground mb-2"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    placeholder="Enter faculty email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
            </div>
            <div>
              <label
                className="block text-sm font-medium text-foreground mb-2"
                htmlFor="password"
              >
                Password
              </label>
              <Input
                id="password"
                placeholder="Enter a temporary password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label
                  className="block text-sm font-medium text-foreground mb-2"
                  htmlFor="college"
                >
                  College
                </label>
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
                <label
                  className="block text-sm font-medium text-foreground mb-2"
                  htmlFor="department"
                >
                  Department
                </label>
                <Select onValueChange={setDepartment} value={department} disabled={!college}>
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
            <div>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
