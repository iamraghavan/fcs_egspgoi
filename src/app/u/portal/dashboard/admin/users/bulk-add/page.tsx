
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { FileUpload } from "@/components/file-upload";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAlert } from "@/context/alert-context";
import { Download, UploadCloud, FileCheck, FileX, CheckCircle, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fcs.egspgroup.in:81';
const TEMPLATE_URL = "/templates/bulk-user-template.xlsx";

type UploadResult = {
  row: number;
  success: boolean;
  id?: string;
  email: string;
  role: string;
  emailQueued: boolean;
  emailSent: boolean;
  emailError: string | null;
  message?: string;
};

type UploadSummary = {
  total: number;
  success: number;
  failed: number;
};


export default function BulkAddUsersPage() {
  const { showAlert } = useAlert();
  const [file, setFile] = useState<File | null>(null);
  const [sendEmails, setSendEmails] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [results, setResults] = useState<UploadResult[] | null>(null);
  const [summary, setSummary] = useState<UploadSummary | null>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    setResults(null);
    setSummary(null);
  };

  const handleUpload = async () => {
    if (!file) {
      showAlert("No File Selected", "Please select a file to upload.");
      return;
    }
    
    setIsLoading(true);
    setUploadProgress(0);

    const token = localStorage.getItem("token");
    if (!token) {
        showAlert("Authentication Error", "Admin token not found.");
        setIsLoading(false);
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    const url = `${API_BASE_URL}/api/v1/users/bulk-upload?sendEmails=${sendEmails}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Bulk upload failed.');
        }

        setSummary(data.summary);
        setResults(data.results);
        showAlert("Upload Complete", `Processed ${data.summary.total} records. ${data.summary.success} succeeded, ${data.summary.failed} failed.`);

    } catch (error: any) {
        showAlert("Upload Failed", error.message);
        setResults(null);
        setSummary(null);
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <div className="mx-auto max-w-4xl space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-foreground">Bulk User Import</h1>
            <p className="mt-1 text-muted-foreground">
                Efficiently create multiple user accounts by uploading an Excel or CSV file.
            </p>
        </header>

        <Card>
            <CardHeader>
                <CardTitle>Step 1: Prepare Your File</CardTitle>
                <CardDescription>
                    Download our template to ensure your data is formatted correctly. The file must include columns for name, email, password, and college.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <a href={TEMPLATE_URL} download="bulk-user-template.xlsx">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Download Template
                    </Button>
                </a>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Step 2: Upload File</CardTitle>
                <CardDescription>
                    Select the completed file from your computer and configure the upload options.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FileUpload onFileSelect={handleFileSelect} disabled={isLoading} />
                <div className="flex items-center space-x-2">
                    <Checkbox id="send-emails" checked={sendEmails} onCheckedChange={(checked) => setSendEmails(checked as boolean)} disabled={isLoading} />
                    <Label htmlFor="send-emails" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Send welcome email to new users
                    </Label>
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleUpload} disabled={isLoading || !file}>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    {isLoading ? "Uploading..." : "Upload & Process File"}
                </Button>
            </CardFooter>
        </Card>
        
        {summary && results && (
            <Card>
                <CardHeader>
                    <CardTitle>Step 3: Review Results</CardTitle>
                    <CardDescription>
                        The upload is complete. Below is a summary of the results.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
                           <FileCheck className="h-8 w-8 text-green-500" />
                           <div>
                               <p className="text-sm text-muted-foreground">Successful</p>
                               <p className="text-2xl font-bold">{summary.success} / {summary.total}</p>
                           </div>
                       </div>
                       <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
                           <FileX className="h-8 w-8 text-red-500" />
                           <div>
                               <p className="text-sm text-muted-foreground">Failed</p>
                               <p className="text-2xl font-bold">{summary.failed} / {summary.total}</p>
                           </div>
                       </div>
                   </div>
                   <div className="overflow-x-auto border rounded-lg">
                       <Table>
                           <TableHeader>
                               <TableRow>
                                   <TableHead className="w-[80px]">Row</TableHead>
                                   <TableHead>Email</TableHead>
                                   <TableHead>Status</TableHead>
                                   <TableHead>Details</TableHead>
                               </TableRow>
                           </TableHeader>
                           <TableBody>
                               {results.map((result) => (
                                   <TableRow key={result.row}>
                                       <TableCell>{result.row}</TableCell>
                                       <TableCell>{result.email}</TableCell>
                                       <TableCell>
                                           {result.success ? (
                                                <span className="flex items-center text-green-600"><CheckCircle className="mr-2 h-4 w-4" />Success</span>
                                           ) : (
                                                <span className="flex items-center text-red-600"><XCircle className="mr-2 h-4 w-4" />Failed</span>
                                           )}
                                       </TableCell>
                                       <TableCell className="text-sm text-muted-foreground">
                                           {result.message || (result.success ? `User ID: ${result.id}` : "Unknown error")}
                                           {result.emailQueued && !result.emailSent && <p>Email sending failed: {result.emailError}</p>}
                                       </TableCell>
                                   </TableRow>
                               ))}
                           </TableBody>
                       </Table>
                   </div>
                </CardContent>
            </Card>
        )}
    </div>
  );
}

