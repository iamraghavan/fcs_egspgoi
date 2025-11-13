
"use client"

import { useState } from "react";
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { FileUpload } from "@/components/file-upload";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAlert } from "@/context/alert-context";
import { Download, UploadCloud, FileCheck, FileX, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";


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
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [sendEmails, setSendEmails] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<UploadResult[] | null>(null);
  const [summary, setSummary] = useState<UploadSummary | null>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    setResults(null);
    setSummary(null);
    setPreviewData([]);

    if (selectedFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                setPreviewData(json);
            } catch (error) {
                showAlert("File Read Error", "Could not read or parse the selected file. Please ensure it's a valid Excel or CSV file.");
            }
        };
        reader.onerror = () => {
            showAlert("File Read Error", "There was an error reading the file.");
        };
        reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showAlert("No File Selected", "Please select a file to upload.");
      return;
    }
    
    setIsLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
        showAlert("Authentication Error", "Admin token not found.");
        setIsLoading(false);
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    const url = `${API_BASE_URL}/api/v1/auth/users/bulk-upload?sendEmails=${sendEmails}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Bulk upload failed.';
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorMessage;
            } catch {
                if (errorText.includes("<!DOCTYPE html>")) {
                    errorMessage = "API endpoint not found. Please check the server configuration.";
                } else {
                    errorMessage = errorText;
                }
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
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

  const previewHeaders = previewData.length > 0 ? Object.keys(previewData[0]) : [];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-foreground">Bulk User Import</h1>
            <p className="mt-1 text-muted-foreground">
                Efficiently create multiple user accounts by uploading a spreadsheet file.
            </p>
        </header>

        <Card>
            <CardContent className="p-6 space-y-8">
                 {/* Step 1 */}
                <div>
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                           <span className="font-bold text-lg">1</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Prepare Your File</h3>
                            <p className="text-muted-foreground">
                                <a href={TEMPLATE_URL} download="bulk-user-template.xlsx" className="text-primary hover:underline font-medium">Download our template</a> to ensure your data is formatted correctly.
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Step 2 */}
                <div>
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary text-primary">
                           <span className="font-bold text-lg">2</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Upload & Preview</h3>
                            <p className="text-muted-foreground">Select the completed file to see a preview of the data.</p>
                        </div>
                    </div>
                    <div className="pl-14 pt-6 space-y-4">
                        <FileUpload 
                            onFileSelect={handleFileSelect} 
                            disabled={isLoading}
                            accept=".xlsx, .xls, .csv"
                            description="Excel or CSV files only"
                        />
                        <div className="flex items-center space-x-2">
                            <Checkbox id="send-emails" checked={sendEmails} onCheckedChange={(checked) => setSendEmails(checked as boolean)} disabled={isLoading} />
                            <Label htmlFor="send-emails" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Send welcome email to new users
                            </Label>
                        </div>
                        {previewData.length > 0 && !results && (
                           <div className="space-y-2">
                                <h4 className="font-medium">File Preview (First 10 Rows)</h4>
                                <div className="overflow-x-auto border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                {previewHeaders.map(header => <TableHead key={header}>{header}</TableHead>)}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {previewData.slice(0, 10).map((row, index) => (
                                                <TableRow key={index}>
                                                    {previewHeaders.map(header => <TableCell key={`${index}-${header}`}>{String(row[header])}</TableCell>)}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                 <Separator />

                 {/* Step 3 */}
                 <div>
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary text-primary">
                           <span className="font-bold text-lg">3</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Process File</h3>
                            <p className="text-muted-foreground">Once you're satisfied with the preview, process the file.</p>
                        </div>
                    </div>
                     <div className="pl-14 pt-6">
                        <Button onClick={handleUpload} disabled={isLoading || previewData.length === 0}>
                            {isLoading ? "Processing..." : "Process & Import Users"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {summary && results && (
                    <>
                    <Separator />
                    {/* Step 4 Results */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Import Results</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>
                    </>
                )}

            </CardContent>
        </Card>
    </div>
  );
}
