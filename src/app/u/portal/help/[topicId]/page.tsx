
"use client";

import { useParams } from 'next/navigation';
import { LayoutDashboard, Award, FileText, MessageSquareWarning, ShieldCheck, User, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const helpContent = {
  'dashboard-concepts': {
    icon: LayoutDashboard,
    title: 'Dashboard Concepts',
    description: 'An overview of your performance and credit status.',
    details: (
      <div className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>What is the Dashboard?</AlertTitle>
          <AlertDescription>The main dashboard provides an at-a-glance overview of your performance metrics. It's the first page you see after logging in and is designed to give you a quick summary of your current standing.</AlertDescription>
        </Alert>
        <Card>
          <CardHeader>
            <CardTitle>Key Metrics Explained</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-lg">Net Credit Balance</h4>
              <p className="text-muted-foreground">This is your lifetime credit score within the system. It is the sum of all positive credits you've earned minus any negative credits you've received.</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-lg">Net For Year</h4>
              <p className="text-muted-foreground">This shows the net change in your credit balance for the current academic year only. It helps you track your performance in the current cycle.</p>
            </div>
             <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-lg">Positive & Negative Points (Year)</h4>
              <p className="text-muted-foreground">These cards show a simple breakdown of the total points gained from "Good Works" versus points lost from "Negative Remarks" within the current academic year.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Understanding the Charts</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 <p>The charts provide a visual representation of your credit trends over time, helping you identify patterns in your performance.</p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                    <li><strong>Net Credit Change:</strong> An area chart showing the month-by-month change in your net credit balance.</li>
                    <li><strong>Positive vs. Negative Credits:</strong> A bar chart comparing the total positive points you've earned against the negative points received each month.</li>
                </ul>
            </CardContent>
        </Card>
      </div>
    ),
  },
  'good-works': {
    icon: Award,
    title: 'Good Works',
    description: 'How to view and track your submitted achievements.',
    details: (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>The "Good Works" Page</CardTitle>
                    <CardDescription>This section is your personal log of all positive contributions and achievements you have submitted for credit.</CardDescription>
                </CardHeader>
                <CardContent>
                    <h4 className="font-semibold mb-2">Key Features:</h4>
                    <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                        <li>View a complete history of your submissions.</li>
                        <li>Track the current status of each submission: <Badge variant="secondary">Pending</Badge>, <Badge className="bg-green-100 text-green-800">Approved</Badge>, or <Badge variant="destructive">Rejected</Badge>.</li>
                        <li>See the points awarded for each approved submission.</li>
                        <li>Filter your submissions by academic year or status to easily find what you're looking for.</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
  },
  'submitting-new-work': {
    icon: FileText,
    title: 'Submitting New Work',
    description: 'A step-by-step guide to submitting your achievements for credit.',
    details: (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold">Step-by-Step Guide</h3>
            <ol className="relative border-l border-gray-200 dark:border-gray-700 space-y-8">                  
                <li className="ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900">1</span>
                    <div className="p-4 bg-card border rounded-lg">
                        <h4 className="font-semibold">Navigate and Click</h4>
                        <p className="text-muted-foreground">Go to the "Good Works" page and click the "Submit New Work" button.</p>
                    </div>
                </li>
                <li className="ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900">2</span>
                     <div className="p-4 bg-card border rounded-lg">
                        <h4 className="font-semibold">Select a Category</h4>
                        <p className="text-muted-foreground">Choose the most appropriate category for your achievement from the dropdown menu. The associated points will be automatically displayed.</p>
                    </div>
                </li>
                <li className="ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900">3</span>
                     <div className="p-4 bg-card border rounded-lg">
                        <h4 className="font-semibold">Provide a Title</h4>
                        <p className="text-muted-foreground">Enter a clear and concise title for your achievement (e.g., "Published a paper on AI...").</p>
                    </div>
                </li>
                 <li className="ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900">4</span>
                     <div className="p-4 bg-card border rounded-lg">
                        <h4 className="font-semibold">Attach Proof</h4>
                        <p className="text-muted-foreground">This is a crucial step. Upload a supporting document for verification (e.g., certificate, publication link, photo). PDF, DOCX, JPG formats are accepted.</p>
                    </div>
                </li>
                <li className="ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-green-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900 dark:bg-green-900">
                        <CheckCircle className="w-4 h-4 text-green-700" />
                    </span>
                     <div className="p-4 bg-card border rounded-lg">
                        <h4 className="font-semibold">Submit for Review</h4>
                        <p className="text-muted-foreground">Click the "Submit Achievement" button. Your submission will be sent to an administrator for review.</p>
                    </div>
                </li>
            </ol>
        </div>
    )
  },
  'negative-remarks': {
    icon: MessageSquareWarning,
    title: 'Negative Remarks',
    description: 'Understanding and handling negative remarks.',
    details: (
       <div className="space-y-6">
         <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>What are Negative Remarks?</AlertTitle>
          <AlertDescription>Negative remarks are issued by administrators for actions that deviate from institutional standards. These remarks result in a deduction of credit points from your total balance.</AlertDescription>
        </Alert>
        <Card>
            <CardHeader><CardTitle>How It Works</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <p>When an admin issues a remark, it will appear on your "Negative Remarks" page. This section provides a transparent log of:</p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                    <li>The title and description of the remark.</li>
                    <li>The number of points deducted.</li>
                    <li>The date the remark was issued.</li>
                    <li>Any notes or rationale provided by the administrator.</li>
                </ul>
                 <p className="pt-4">It is your responsibility to review these remarks promptly. If you disagree with a remark, you have a limited time to file an appeal.</p>
            </CardContent>
        </Card>
      </div>
    )
  },
  'filing-an-appeal': {
    icon: ShieldCheck,
    title: 'Filing an Appeal',
    description: 'How to dispute a negative remark you believe is incorrect.',
    details: (
        <div className="space-y-6">
             <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Right to Appeal</AlertTitle>
              <AlertDescription>If you believe a negative remark was issued in error or is unjust, you have the right to appeal the decision. You may only appeal a specific remark once.</AlertDescription>
            </Alert>
             <h3 className="text-2xl font-bold pt-4">How to File an Appeal</h3>
             <ol className="relative border-l border-gray-200 dark:border-gray-700 space-y-8">                  
                <li className="ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900">1</span>
                    <div className="p-4 bg-card border rounded-lg">
                        <h4 className="font-semibold">Locate the Remark</h4>
                        <p className="text-muted-foreground">Navigate to the "Negative Remarks" page and find the specific remark you wish to dispute.</p>
                    </div>
                </li>
                <li className="ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900">2</span>
                     <div className="p-4 bg-card border rounded-lg">
                        <h4 className="font-semibold">Initiate the Appeal</h4>
                        <p className="text-muted-foreground">Click the "Appeal" button next to the remark. This will open the appeal submission form.</p>
                    </div>
                </li>
                <li className="ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900">3</span>
                     <div className="p-4 bg-card border rounded-lg">
                        <h4 className="font-semibold">Write Your Rationale</h4>
                        <p className="text-muted-foreground">In the form, provide a clear, professional, and detailed reason for why you are appealing the decision.</p>
                    </div>
                </li>
                 <li className="ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900">4</span>
                     <div className="p-4 bg-card border rounded-lg">
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle className="font-semibold">Upload New Proof (Mandatory)</AlertTitle>
                            <AlertDescription>You must upload a new proof document to support your appeal. This could be a corrected document, a letter of explanation, or any other relevant evidence. Appeals without proof will not be considered.</AlertDescription>
                        </Alert>
                    </div>
                </li>
                <li className="ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-green-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900 dark:bg-green-900">
                        <CheckCircle className="w-4 h-4 text-green-700" />
                    </span>
                     <div className="p-4 bg-card border rounded-lg">
                        <h4 className="font-semibold">Submit and Track</h4>
                        <p className="text-muted-foreground">Once submitted, your appeal is sent to an administrator. You can track the status of your appeal (Pending, Accepted, Rejected) on the "My Appeals" page.</p>
                    </div>
                </li>
            </ol>
        </div>
    )
  },
  'account-settings': {
    icon: User,
    title: 'Account Settings',
    description: 'Manage your profile, password, and security settings.',
    details: (
        <div className="space-y-6">
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger>Profile Information</AccordionTrigger>
                    <AccordionContent>
                    Update your personal information, such as your name, phone number, and profile picture. Keeping this information current is important for communication.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger>Password Management</AccordionTrigger>
                    <AccordionContent>
                    Change your account password here. For security, it's recommended to use a strong, unique password and update it periodically.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                    <AccordionTrigger>Security (Multi-Factor Authentication)</AccordionTrigger>
                    <AccordionContent>
                    Enhance your account security by enabling Multi-Factor Authentication (MFA). You can choose to receive a verification code via email or use a dedicated authenticator app on your phone.
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
  },
};

export default function HelpTopicPage() {
    const params = useParams();
    const topicId = params.topicId as string;
    const content = helpContent[topicId as keyof typeof helpContent];

    if (!content) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
                <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
                <h1 className="text-3xl font-bold">Topic Not Found</h1>
                <p className="text-muted-foreground mt-2">The help topic you are looking for does not exist.</p>
                <Button asChild className="mt-6">
                    <Link href="/u/portal/help">Return to Help Center</Link>
                </Button>
            </div>
        );
    }

    const Icon = content.icon;

    return (
        <div className="bg-background min-h-screen">
             <div className="container mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8">
                <header className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-6 w-6" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
                            {content.title}
                        </h1>
                    </div>
                    <p className="mt-4 text-lg text-muted-foreground">
                        {content.description}
                    </p>
                </header>
                
                <main>
                    {content.details}
                </main>

                 <div className="mt-12 text-center border-t pt-8">
                    <p className="text-muted-foreground mb-4">Finished reading? You can close this tab.</p>
                    <Button asChild variant="outline">
                        <Link href="/u/portal/help">Back to Help Center</Link>
                    </Button>
                </div>
             </div>
        </div>
    );
}

