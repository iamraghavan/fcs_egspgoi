
"use client"

import { useState, useEffect, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/file-upload";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { useAlert } from "@/context/alert-context";
import { Combobox } from "@/components/ui/combobox";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fcs.egspgroup.in:81';

type User = {
  _id: string;
  name: string;
};

type CreditTitle = {
  _id: string;
  title: string;
  points: number;
  type: 'positive' | 'negative';
};

const getCurrentAcademicYear = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    if (currentMonth >= 5) { // June or later
      return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
    }
    return `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
};

const generateYearOptions = () => {
    const currentYearString = getCurrentAcademicYear();
    const [startCurrentYear] = currentYearString.split('-').map(Number);
    
    const years = [];
    for (let i = 0; i < 5; i++) {
        const startYear = startCurrentYear - i;
        const endYear = (startYear + 1).toString().slice(-2);
        years.push(`${startYear}-${endYear}`);
    }
    return years;
};

export default function OADashboardPage() {
  const { toast } = useToast();
  const { showAlert } = useAlert();

  // Form state
  const [facultyId, setFacultyId] = useState("");
  const [creditTitleId, setCreditTitleId] = useState("");
  const [points, setPoints] = useState<number | string>("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Data for dropdowns
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [creditTitles, setCreditTitles] = useState<CreditTitle[]>([]);

  const adminToken = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

  const fetchDropdownData = async () => {
    if (!adminToken) {
      showAlert("Authentication Error", "Admin token not found.");
      return;
    }
    try {
      const [facultyResponse, creditTitlesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/users?limit=1000`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
        fetch(`${API_BASE_URL}/api/v1/admin/credit-title`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        })
      ]);

      const facultyData = await facultyResponse.json();
      if (facultyData.success) {
        setFacultyList(facultyData.items);
      } else {
        throw new Error(facultyData.message || "Failed to fetch faculty");
      }

      const creditTitlesData = await creditTitlesResponse.json();
      if (creditTitlesData.success) {
        setCreditTitles(creditTitlesData.items.filter((ct: CreditTitle) => ct.type === 'negative'));
      } else {
        throw new Error(creditTitlesData.message || "Failed to fetch credit titles");
      }
    } catch (error: any) {
      showAlert("Error fetching initial data", error.message);
    }
  };


  useEffect(() => {
    if (adminToken) {
      fetchDropdownData();
    }
  }, [adminToken]);

  
  useEffect(() => {
    const selectedTitle = creditTitles.find(ct => ct._id === creditTitleId);
    if (selectedTitle) {
      setTitle(selectedTitle.title);
      setPoints(selectedTitle.points);
    } else {
      setTitle("");
      setPoints("");
    }
  }, [creditTitleId, creditTitles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facultyId || !points || !title) {
      showAlert("Incomplete Form", "Please fill out all required fields.");
      return;
    }
    setIsLoading(true);

    if (!adminToken) {
      showAlert("Authentication Error", "Admin token not found.");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("facultyId", facultyId);
    formData.append("points", points.toString());
    formData.append("academicYear", getCurrentAcademicYear());
    formData.append("title", title);
    if (creditTitleId) formData.append("creditTitleId", creditTitleId);
    if (notes) formData.append("notes", notes);
    if (proof) formData.append("proof", proof);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/credits/negative`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${adminToken}` },
        body: formData,
      });

      const responseData = await response.json();
      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Failed to issue remark.");
      }

      toast({
        title: "Remark Issued",
        description: "The negative remark has been successfully recorded.",
      });

      // Reset form
      setFacultyId("");
      setCreditTitleId("");
      setTitle("");
      setPoints("");
      setNotes("");
      setProof(null);

      // Fire-and-forget the email notification
      fetch(`${API_BASE_URL}/api/v1/notifications/remark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          facultyId: facultyId,
          remark: {
            title: title,
            message: notes,
          },
        }),
      }).then(async (emailResponse) => {
          if (!emailResponse.ok) {
            const errorData = await emailResponse.json();
            showAlert(
              "Email Notification Failed",
              errorData.message || "The remark was saved, but the email notification could not be sent."
            );
          }
      }).catch((emailError: any) => {
          showAlert(
            "Email Sending Error",
            emailError.message || "An error occurred while trying to send the email."
          );
      });

    } catch (error: any) {
      showAlert("Submission Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const facultyOptions = useMemo(() => 
    facultyList
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(f => ({ value: f._id, label: f.name })),
    [facultyList]
  );
  
  const creditTitleOptions = useMemo(() =>
    creditTitles
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title))
      .map(ct => ({ value: ct.id, label: `${ct.title} (${ct.points} pts)` })),
    [creditTitles]
  );
  

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            OA Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Issue negative credit adjustments for faculty members.
          </p>
        </div>
      </header>
        
      <Card>
        <CardHeader>
            <CardTitle>Issue New Remark</CardTitle>
            <CardDescription>Fill out the details below to issue a negative credit to a faculty member.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="faculty">Faculty Member</label>
              <Combobox
                  options={facultyOptions}
                  value={facultyId}
                  onValueChange={setFacultyId}
                  placeholder="Select faculty member..."
                  searchPlaceholder="Search faculty..."
                  emptyPlaceholder="No faculty found."
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="creditTitle">Remark Template (Optional)</label>
                <Combobox
                    options={creditTitleOptions}
                    value={creditTitleId}
                    onValueChange={setCreditTitleId}
                    placeholder="Select a template..."
                    searchPlaceholder="Search templates..."
                    emptyPlaceholder="No templates found."
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-muted-foreground" htmlFor="title">Title</label>
                <Input id="title" placeholder="e.g., 'Missed department meeting'" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-muted-foreground" htmlFor="points">Points</label>
                    <Input id="points" type="number" placeholder="e.g., -5" value={points} onChange={(e) => setPoints(Number(e.target.value))} required />
                </div>
                <div>
                <label className="block text-sm font-medium text-muted-foreground" htmlFor="academicYear">Academic Year</label>
                <Select value={getCurrentAcademicYear()} disabled>
                    <SelectTrigger id="academicYear"><SelectValue placeholder="Select Year" /></SelectTrigger>
                    <SelectContent>{generateYearOptions().map(year => (<SelectItem key={year} value={year}>{year}</SelectItem>))}</SelectContent>
                </Select>
                </div>
            </div>
            <div>
            <label className="block text-sm font-medium text-muted-foreground" htmlFor="notes">Notes / Rationale</label>
            <Textarea id="notes" placeholder="Enter detailed notes about the incident" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Upload Proof (Optional)</label>
            <FileUpload onFileSelect={setProof} />
            </div>
            
        </CardContent>
        <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {isLoading ? "Submitting..." : "Issue Remark"}
            </Button>
        </CardFooter>
        </form>
      </Card>
    </div>
  )
}

    