
"use client"

import { useState, useEffect } from"react";
import { useSearchParams } from"next/navigation";
import { Button } from"@/components/ui/button"
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from"@/components/ui/dropdown-menu"
import { formatDistanceToNow } from 'date-fns';
import { useAlert } from"@/context/alert-context";

import { API_BASE_URL } from "@/lib/config";
const READ_NOTIFICATIONS_KEY = 'readNotificationIds';

type Credit = {
 _id: string;
 title: string;
 createdAt: string;
 status: 'approved' | 'pending' | 'rejected';
 points: number;
 type: 'positive' | 'negative';
};

type Notification = {
 id: string;
 type: 'negative_remark' | 'approved' | 'pending' | 'rejected';
 title: string;
 message: string;
 time: string;
 read: boolean;
 icon: string;
};

export default function NotificationsPage() {
 const { showAlert } = useAlert();
 const searchParams = useSearchParams();
 const [notifications, setNotifications] = useState<Notification[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [filter, setFilter] = useState<'all' | 'read' | 'unread'>('all');

 useEffect(() => {
 const fetchAndProcessNotifications = async () => {
 setIsLoading(true);
 const token = localStorage.getItem("token");
 const facultyId = searchParams.get('uid');

 if (!token || !facultyId) {
 showAlert(
"Authentication Error",
"Could not retrieve user credentials.",
 );
 setIsLoading(false);
 return;
 }
 
 try {
 const url = `${API_BASE_URL}/credits/credits/faculty/${facultyId}`;
 const response = await fetch(url, { headers: {"Authorization": `Bearer ${token}` } });

 const responseData = await response.json();
 if (!response.ok || !responseData.success) {
 throw new Error(responseData.message ||"Failed to fetch notifications.");
 }
 
 const fetchedCredits: Credit[] = responseData.items;

 const storedReadIds: string[] = JSON.parse(localStorage.getItem(READ_NOTIFICATIONS_KEY) || '[]');
 const readIdsSet = new Set(storedReadIds);
 
 const generatedNotifications: Notification[] = fetchedCredits.map(credit => {
 let notificationType: Notification['type'] = 'pending';
 let title = '';
 let message = '';
 let icon = '';
 
 if (credit.type === 'negative') {
 notificationType = 'negative_remark';
 title = 'Negative Remark Received';
 message = `A negative remark for"${credit.title}"has been issued.`;
 icon = 'report';
 } else {
 switch(credit.status) {
 case 'approved':
 notificationType = 'approved';
 title = 'Submission Approved';
 message = `Your submission for"${credit.title}"has been approved.`;
 icon = 'task_alt';
 break;
 case 'rejected':
 notificationType = 'rejected';
 title = 'Submission Rejected';
 message = `Your submission for"${credit.title}"has been rejected.`;
 icon = 'cancel';
 break;
 default:
 notificationType = 'pending';
 title = 'Submission Pending';
 message = `Your submission for"${credit.title}"is currently under review.`;
 icon = 'hourglass_top';
 break;
 }
 }

 return {
 id: credit._id,
 type: notificationType,
 title,
 message,
 time: formatDistanceToNow(new Date(credit.createdAt), { addSuffix: true }),
 read: readIdsSet.has(credit._id),
 icon,
 };
 });

 // Sort by date after creating all notifications
 generatedNotifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

 setNotifications(generatedNotifications);

 } catch (error: any) {
 showAlert(
"Failed to Fetch Notifications",
 error.message,
 );
 setNotifications([]);
 } finally {
 setIsLoading(false);
 }
 };
 
 const uid = searchParams.get('uid');
 if (uid) {
 fetchAndProcessNotifications();
 }
 }, [searchParams, showAlert]);

 const markAllAsRead = () => {
 const allIds = notifications.map(n => n.id);
 localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(allIds));
 setNotifications(notifications.map(n => ({ ...n, read: true })));
 };

 const markAsRead = (id: string) => {
 const updatedNotifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
 setNotifications(updatedNotifications);
 
 const storedReadIds: string[] = JSON.parse(localStorage.getItem(READ_NOTIFICATIONS_KEY) || '[]');
 const readIdsSet = new Set(storedReadIds);
 readIdsSet.add(id);
 localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(Array.from(readIdsSet)));
 };


 const filteredNotifications = notifications.filter(n => {
 if (filter === 'all') return true;
 if (filter === 'read') return n.read;
 if (filter === 'unread') return !n.read;
 return true;
 });

 return (
 <main className="flex-1 overflow-y-auto">
 <div className="p-8">
 <div className="flex justify-between items-center">
 <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
 <Button variant="outline"onClick={markAllAsRead}>Mark all as read</Button>
 </div>
 <div className="mt-6 flex flex-wrap gap-3">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button>
 {filter.charAt(0).toUpperCase() + filter.slice(1)}
 <span className="material-symbols-outlined ml-2 text-base">expand_more</span>
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent>
 <DropdownMenuItem onClick={() => setFilter('all')}>All</DropdownMenuItem>
 <DropdownMenuItem onClick={() => setFilter('unread')}>Unread</DropdownMenuItem>
 <DropdownMenuItem onClick={() => setFilter('read')}>Read</DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 <div className="mt-6 flex flex-col gap-4">
 {isLoading ? (
 <p>Loading notifications...</p>
 ) : filteredNotifications.length > 0 ? (
 filteredNotifications.map((notification) => (
 <div
 key={notification.id}
 className={`group flex cursor-pointer items-start gap-4 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${notification.read ? 'bg-card' : 'bg-primary/5'}`}
 onClick={() => markAsRead(notification.id)}
 >
 <div
 className={`relative flex shrink-0 items-center justify-center rounded-full size-12 ${
 notification.read ?"bg-muted text-muted-foreground": notification.type === 'negative_remark' ?"bg-red-100 text-red-700":"bg-primary/10 text-primary"
 }`}
 >
 <span className="material-symbols-outlined">{notification.icon}</span>
 {!notification.read && (
 <span className={`absolute top-0 right-0 block h-3 w-3 rounded-full ${notification.type === 'negative_remark' ?"bg-red-500":"bg-primary"} ring-2 ring-card`}></span>
 )}
 </div>
 <div className="flex-1">
 <p className="font-semibold text-foreground">{notification.title}</p>
 <p className="text-sm text-muted-foreground">{notification.message}</p>
 <p className="mt-1 text-xs text-muted-foreground/80">{notification.time}</p>
 </div>
 <Button variant="ghost"size="icon"className="opacity-0 group-hover:opacity-100 transition-opacity">
 <span className="material-symbols-outlined text-base">more_vert</span>
 </Button>
 </div>
 ))
 ) : (
 <div className="text-center py-10">
 <p>No notifications found.</p>
 </div>
 )}
 </div>
 </div>
 </main>
 )
}

 