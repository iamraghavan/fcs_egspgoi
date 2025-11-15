
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, FileText, MessageSquareWarning, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Help & Documentation - CreditWise',
  description: 'Learn how to use the CreditWise Faculty Performance System.',
};

export default function HelpPage() {
  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8">
        <header className="mb-12 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
                CreditWise Help Center
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
                Your guide to using the Faculty Performance System.
            </p>
        </header>

        <div className="space-y-10">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Award className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl">Submitting a Good Work</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <p>To get credit for your achievements, you need to submit them as "Good Works."</p>
              <ol>
                <li>Navigate to the <strong>Good Works</strong> section from the sidebar.</li>
                <li>Click the <strong>"Submit New Work"</strong> button.</li>
                <li>In the form, select a <strong>Category</strong> for your achievement. The points for that category will be displayed automatically.</li>
                <li>Provide a clear and concise <strong>Achievement Title</strong>.</li>
                <li>Attach a <strong>Proof Document</strong>. This is a mandatory step for verification. Accepted formats include PDF, DOCX, JPG, PNG, etc.</li>
                <li>Click <strong>"Submit Achievement"</strong>. Your submission will be sent to an administrator for review.</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <MessageSquareWarning className="h-8 w-8 text-destructive" />
              <CardTitle className="text-2xl">Handling Negative Remarks</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
                <p>If you receive a negative remark, you can view the details and, if necessary, file an appeal.</p>
                <ol>
                    <li>Go to the <strong>Negative Remarks</strong> page from the sidebar.</li>
                    <li>Here you will see a list of all remarks issued to you.</li>
                    <li>For each remark, you have the option to <strong>"Appeal"</strong>. Note that you can only appeal a remark once, and it must be done within the specified time frame.</li>
                </ol>
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <ShieldCheck className="h-8 w-8 text-blue-600" />
              <CardTitle className="text-2xl">Filing an Appeal</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
                <p>If you believe a negative remark was issued in error, you have the right to appeal.</p>
                <ol>
                    <li>On the "Negative Remarks" page, click the <strong>"Appeal"</strong> button next to the relevant remark.</li>
                    <li>A dialog box will appear. Write a clear and professional <strong>Reason for Appeal</strong>.</li>
                    <li><strong>You must upload a new proof document</strong> to support your appeal. This could be a clarification, a letter, or any other document that contests the remark.</li>
                    <li>Once submitted, your appeal will be sent to an administrator for review. You can track its status on the <strong>"My Appeals"</strong> page.</li>
                </ol>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
            <Button asChild>
                <Link href="/u/portal/dashboard">Back to Dashboard</Link>
            </Button>
        </div>
      </div>
    </div>
  );
}
