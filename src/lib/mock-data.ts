export const facultyDashboardData = {
 creditBalance: 125,
 recentActivities: [
 { id: 1, description:"Credit approved for 'Research Paper Publication'", credits: 10, date:"2023-10-26"},
 { id: 2, description:"Submitted 'Workshop Attendance' for review", credits: null, date:"2023-10-25"},
 { id: 3, description:"Remark received for 'Low Student Feedback Score'", credits: -5, date:"2023-10-24"},
 { id: 4, description:"Credit approved for 'Guest Lecture Delivery'", credits: 5, date:"2023-10-22"},
 ],
 creditHistory: [
 { month:"Jan", credits: 20 },
 { month:"Feb", credits: 35 },
 { month:"Mar", credits: 25 },
 { month:"Apr", credits: 40 },
 { month:"May", credits: 30 },
 { month:"Jun", credits: 45 },
 ],
};

export const adminDashboardData = {
 stats: {
 pendingSubmissions: 12,
 activeAppeals: 3,
 totalUsers: 152,
 totalCreditsAwarded: 4520,
 },
 recentActivities: [
 { id: 1, description:"Dr. Smith's submission for 'Research Grant' was approved.", user:"Dr. Smith", date:"2023-10-26"},
 { id: 2, description:"A new appeal was filed by Prof. Jane Doe regarding a performance remark.", user:"Prof. Jane Doe", date:"2023-10-25"},
 { id: 3, description:"Bulk credit import for 'Semester Results' completed successfully.", user:"System", date:"2023-10-24"},
 { id: 4, description:"New user account created for 'Dr. Emily White'.", user:"You", date:"2023-10-23"},
 ],
 creditDistribution: [
 { name:"Research", value: 400, fill:"hsl(var(--chart-1))"},
 { name:"Teaching", value: 300, fill:"hsl(var(--chart-2))"},
 { name:"Admin", value: 300, fill:"hsl(var(--chart-3))"},
 { name:"Student Activities", value: 200, fill:"hsl(var(--chart-4))"},
 { name:"Other", value: 278, fill:"hsl(var(--chart-5))"},
 ],
};
