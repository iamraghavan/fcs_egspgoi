"use client"

import { useState, useEffect, useMemo } from"react";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from"@/components/ui/table"
import { Button } from"@/components/ui/button"
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from"@/components/ui/select"
import { Textarea } from"@/components/ui/textarea"
import { Input } from"@/components/ui/input"
import { useToast } from"@/hooks/use-toast";
import { Badge } from"@/components/ui/badge";
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
 AlertDialogTrigger,
} from"@/components/ui/alert-dialog"
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
 DialogFooter,
 DialogClose,
} from"@/components/ui/dialog"
import { ArrowUpDown, Edit, Trash2 } from"lucide-react";
import { useAlert } from"@/context/alert-context";
import { cn } from"@/lib/utils";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://faculty-credit-system.vercel.app';

type CreditTitle = {
 _id: string;
 title: string;
 points: number;
 type: 'positive' | 'negative';
 description: string;
 isActive: boolean;
};

export default function ManageCreditTitlesPage() {
 const { toast } = useToast();
 const { showAlert } = useAlert();
 // Form state for creating
 const [title, setTitle] = useState("");
 const [points, setPoints] = useState("");
 const [type, setType] = useState<'positive' | 'negative' | ''>('');
 const [description, setDescription] = useState("");
 const [isLoading, setIsLoading] = useState(false);

 // Table and filter state
 const [creditTitles, setCreditTitles] = useState<CreditTitle[]>([]);
 const [isLoadingTitles, setIsLoadingTitles] = useState(true);
 const [typeFilter, setTypeFilter] = useState<'all' | 'positive' | 'negative'>('all');
 const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');

 // State for editing
 const [editingTitle, setEditingTitle] = useState<CreditTitle | null>(null);
 const [isEditLoading, setIsEditLoading] = useState(false);
 const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);


 const fetchCreditTitles = async () => {
 setIsLoadingTitles(true);
 const adminToken = localStorage.getItem("token");
 if (!adminToken) {
 showAlert("Authentication Error","Admin token not found.");
 setIsLoadingTitles(false);
 return;
 }

 try {
 const response = await fetch(`${API_BASE_URL}/api/v1/admin/credit-title`, {
 headers: { Authorization: `Bearer ${adminToken}` },
 });
 const data = await response.json();
 if (data.success) {
 setCreditTitles(data.items);
 } else {
 throw new Error(data.message ||"Failed to fetch credit titles");
 }
 } catch (error: any) {
 showAlert("Error", error.message);
 setCreditTitles([]);
 } finally {
 setIsLoadingTitles(false);
 }
 };

 useEffect(() => {
 fetchCreditTitles();
 }, []);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!title || !points || !type || !description) {
 showAlert(
"Incomplete Form",
"Please fill out all fields.",
 );
 return;
 }
 setIsLoading(true);

 const adminToken = localStorage.getItem("token");
 if (!adminToken) {
 showAlert("Authentication Error","Admin token not found.");
 setIsLoading(false);
 return;
 }

 try {
 const response = await fetch(`${API_BASE_URL}/api/v1/admin/credit-title`, {
 method:"POST",
 headers: {
"Authorization": `Bearer ${adminToken}`,
"Content-Type":"application/json",
 },
 body: JSON.stringify({
 title,
 points: Number(points),
 type,
 description,
 }),
 });

 const responseData = await response.json();

 if (!response.ok || !responseData.success) {
 throw new Error(responseData.message ||"Failed to create credit title.");
 }

 toast({
 title:"Credit Title Created",
 description:"The new credit title has been successfully added.",
 });
 
 setTitle("");
 setPoints("");
 setType("");
 setDescription("");
 fetchCreditTitles();

 } catch (error: any) {
 showAlert(
"Creation Failed",
 error.message,
 );
 } finally {
 setIsLoading(false);
 }
 };

 const handleEditSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!editingTitle) return;

 setIsEditLoading(true);
 const adminToken = localStorage.getItem("token");
 if (!adminToken) {
 showAlert("Authentication Error","Invalid token");
 setIsEditLoading(false);
 return;
 }

 try {
 const response = await fetch(`${API_BASE_URL}/api/v1/admin/credit-title/${editingTitle._id}`, {
 method:"PUT",
 headers: {
"Authorization": `Bearer ${adminToken}`,
"Content-Type":"application/json",
 },
 body: JSON.stringify({
 title: editingTitle.title,
 points: Number(editingTitle.points),
 type: editingTitle.type,
 description: editingTitle.description,
 }),
 });

 const responseData = await response.json();
 if (!response.ok || !responseData.success) {
 throw new Error(responseData.message ||"Failed to update credit title.");
 }

 toast({ title:"Update Successful", description:"Credit title has been updated."});
 setEditingTitle(null);
 setIsEditDialogOpen(false);
 fetchCreditTitles();
 } catch (error: any) {
 showAlert("Update Failed", error.message);
 } finally {
 setIsEditLoading(false);
 }
 };

 const handleDelete = async (id: string) => {
 const adminToken = localStorage.getItem("token");
 if (!adminToken) {
 showAlert("Authentication Error","Admin token not found.");
 return;
 }

 try {
 const response = await fetch(`${API_BASE_URL}/api/v1/admin/credit-title/${id}`, {
 method:"DELETE",
 headers: {"Authorization": `Bearer ${adminToken}` },
 });

 const responseData = await response.json();
 if (!response.ok || !responseData.success) {
 throw new Error(responseData.message ||"Failed to delete credit title.");
 }

 toast({ title:"Delete Successful", description:"Credit title has been deleted."});
 fetchCreditTitles();
 } catch (error: any) {
 showAlert("Delete Failed", error.message);
 }
 };

 const filteredAndSortedTitles = useMemo(() => {
 let filtered = creditTitles;
 if (typeFilter !== 'all') {
 filtered = filtered.filter(ct => ct.type === typeFilter);
 }

 if (sortOrder !== 'none') {
 filtered.sort((a, b) => {
 if (sortOrder === 'asc') {
 return a.points - b.points;
 } else {
 return b.points - a.points;
 }
 });
 }

 return filtered;
 }, [creditTitles, typeFilter, sortOrder]);

 const handleSortByPoints = () => {
 if (sortOrder === 'none') setSortOrder('asc');
 else if (sortOrder === 'asc') setSortOrder('desc');
 else setSortOrder('none');
 };

 return (
 <div className="mx-auto max-w-7xl">
 <div className="mb-8">
 <h1 className="text-3xl font-bold text-foreground">Manage Credit Titles</h1>
 <p className="mt-1 text-sm text-muted-foreground">
 Create and manage credit types for faculty achievements and remarks.
 </p>
 </div>
 <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
 <div className="space-y-6 rounded-lg bg-card p-6 shadow-sm lg:col-span-1">
 <h2 className="text-xl font-semibold text-foreground">Create New Credit Title</h2>
 <form className="space-y-4"onSubmit={handleSubmit}>
 <div>
 <label className="block text-sm font-medium text-muted-foreground"htmlFor="title">Title</label>
 <Input id="title"placeholder="e.g., 'Research Paper in Q1 Journal'"value={title} onChange={(e) => setTitle(e.target.value)} />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-muted-foreground"htmlFor="points">Points</label>
 <Input id="points"type="number"placeholder="e.g., 10 or -5"value={points} onChange={(e) => setPoints(e.target.value)} />
 </div>
 <div>
 <label className="block text-sm font-medium text-muted-foreground"htmlFor="type">Type</label>
 <Select value={type} onValueChange={(value) => setType(value as any)}>
 <SelectTrigger id="type">
 <SelectValue placeholder="Select Type"/>
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="positive">Positive</SelectItem>
 <SelectItem value="negative">Negative</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-muted-foreground"htmlFor="description">Description</label>
 <Textarea id="description"placeholder="Enter a brief description"rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
 </div>
 <div className="flex justify-end pt-2">
 <Button type="submit"disabled={isLoading}>
 {isLoading ?"Creating...":"Create Credit Title"}
 </Button>
 </div>
 </form>
 </div>
 <div className="space-y-6 rounded-lg bg-card p-6 shadow-sm lg:col-span-2">
 <div className="flex justify-between items-center">
 <h2 className="text-xl font-semibold text-foreground">Existing Credit Titles</h2>
 <div className="btn-filter-wrap">
 {['all', 'positive', 'negative'].map((t) => (
 <Button 
 key={t}
 variant="ghost"
 size="sm"
 className={cn(
"btn-filter",
 typeFilter === t ?"btn-filter-active":"btn-filter-inactive"
 )}
 onClick={() => setTypeFilter(t as any)}
 >
 {t}
 </Button>
 ))}
 </div>
 </div>
 <div className="overflow-x-auto border rounded-lg">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Title</TableHead>
 <TableHead>
 <Button variant="ghost"onClick={handleSortByPoints}>
 Points
 <ArrowUpDown className="ml-2 h-4 w-4"/>
 </Button>
 </TableHead>
 <TableHead>Type</TableHead>
 <TableHead>Description</TableHead>
 <TableHead>Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {isLoadingTitles ? (
 <TableRow>
 <TableCell colSpan={5} className="text-center">Loading credit titles...</TableCell>
 </TableRow>
 ) : filteredAndSortedTitles.length > 0 ? (
 filteredAndSortedTitles.map((ct) => (
 <TableRow key={ct._id}>
 <TableCell className="font-medium text-foreground">{ct.title}</TableCell>
 <TableCell className={`font-semibold ${ct.points < 0 ? 'text-red-600' : ''}`}>{ct.points}</TableCell>
 <TableCell>
 <Badge variant={ct.type === 'positive' ? 'default' : 'destructive'} className={ct.type === 'positive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
 {ct.type}
 </Badge>
 </TableCell>
 <TableCell className="text-muted-foreground">{ct.description}</TableCell>
 <TableCell>
 <div className="flex items-center gap-2">
 <Dialog open={isEditDialogOpen && editingTitle?._id === ct._id} onOpenChange={(isOpen) => {
 if (isOpen) {
 setEditingTitle(ct);
 setIsEditDialogOpen(true);
 } else {
 setEditingTitle(null);
 setIsEditDialogOpen(false);
 }
 }}>
 <DialogTrigger asChild>
 <Button variant="ghost"size="icon"onClick={() => {
 setEditingTitle(ct);
 setIsEditDialogOpen(true);
 }}>
 <Edit className="h-4 w-4"/>
 </Button>
 </DialogTrigger>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Edit Credit Title</DialogTitle>
 </DialogHeader>
 {editingTitle && (
 <form onSubmit={handleEditSubmit} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-muted-foreground"htmlFor="edit-title">Title</label>
 <Input id="edit-title"value={editingTitle.title} onChange={(e) => setEditingTitle({...editingTitle, title: e.target.value})} />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-muted-foreground"htmlFor="edit-points">Points</label>
 <Input id="edit-points"type="number"value={editingTitle.points} onChange={(e) => setEditingTitle({...editingTitle, points: Number(e.target.value)})} />
 </div>
 <div>
 <label className="block text-sm font-medium text-muted-foreground"htmlFor="edit-type">Type</label>
 <Select value={editingTitle.type} onValueChange={(value) => setEditingTitle({...editingTitle, type: value as any})}>
 <SelectTrigger id="edit-type">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="positive">Positive</SelectItem>
 <SelectItem value="negative">Negative</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-muted-foreground"htmlFor="edit-description">Description</label>
 <Textarea id="edit-description"value={editingTitle.description} onChange={(e) => setEditingTitle({...editingTitle, description: e.target.value})} rows={3} />
 </div>
 <DialogFooter>
 <DialogClose asChild>
 <Button type="button"variant="secondary">Cancel</Button>
 </DialogClose>
 <Button type="submit"disabled={isEditLoading}>
 {isEditLoading ?"Saving...":"Save Changes"}
 </Button>
 </DialogFooter>
 </form>
 )}
 </DialogContent>
 </Dialog>
 <AlertDialog>
 <AlertDialogTrigger asChild>
 <Button variant="ghost"size="icon"className="text-destructive hover:text-destructive">
 <Trash2 className="h-4 w-4"/>
 </Button>
 </AlertDialogTrigger>
 <AlertDialogContent>
 <AlertDialogHeader>
 <AlertDialogTitle>Are you sure?</AlertDialogTitle>
 <AlertDialogDescription>
 This action cannot be undone. This will permanently delete the credit title.
 </AlertDialogDescription>
 </AlertDialogHeader>
 <AlertDialogFooter>
 <AlertDialogCancel>Cancel</AlertDialogCancel>
 <AlertDialogAction onClick={() => handleDelete(ct._id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 </div>
 </TableCell>
 </TableRow>
 ))
 ) : (
 <TableRow>
 <TableCell colSpan={5} className="text-center">No credit titles found for the selected filter.</TableCell>
 </TableRow>
 )}
 </TableBody>
 </Table>
 </div>
 </div>
 </div>
 </div>
 )
}