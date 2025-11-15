
"use client"

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, FileText, MessageSquareWarning, ShieldCheck, User, Lock, Fingerprint, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useRef } from 'react';

const sections = [
  { id: 'dashboard', title: 'Dashboard Concepts', icon: LayoutDashboard },
  { id: 'good-works', title: 'Good Works', icon: Award },
  { id: 'submit-work', title: 'Submitting New Work', icon: FileText },
  { id: 'remarks', title: 'Negative Remarks', icon: MessageSquareWarning },
  { id: 'appeals', title: 'Filing an Appeal', icon: ShieldCheck },
  { id: 'settings', title: 'Account Settings', icon: User },
];

export default function HelpPage() {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    sections.forEach(section => {
      sectionRefs.current[section.id] = document.getElementById(section.id);
    });
  }, []);

  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  
  return (
    <div className="min-h-screen">
        <header className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Help & Documentation
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
                Your complete guide to using the CreditWise Faculty Performance System.
            </p>
        </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1 md:sticky top-20 h-fit">
          <nav>
            <p className="mb-2 text-sm font-semibold text-muted-foreground">On this page</p>
            <ul className="space-y-2">
              {sections.map(section => (
                <li key={section.id}>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-2"
                    onClick={() => scrollToSection(section.id)}
                  >
                    <section.icon className="h-4 w-4" />
                    {section.title}
                  </Button>
                </li>
              ))}
            </ul>
             <div className="mt-8 text-center">
                <Button asChild>
                    <Link href="/u/portal/dashboard">Back to Dashboard</Link>
                </Button>
            </div>
          </nav>
        </aside>

        <main className="md:col-span-3 space-y-10">
          <section id="dashboard" ref={el => sectionRefs.current['dashboard'] = el}>
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <LayoutDashboard className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">Dashboard Concepts</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none text-foreground">
                <p>The main dashboard provides an at-a-glance overview of your performance and credit status. It includes key metrics like:</p>
                <ul>
                  <li><strong>Net Credit Balance:</strong> Your all-time total credit score, reflecting the sum of all positive and negative points you have ever received.</li>
                  <li><strong>Net For Year:</strong> The sum of positive and negative credits for the current academic year only. This helps you track your performance in the current cycle.</li>
                  <li><strong>Positive & Negative Points:</strong> A breakdown of points gained from approved "Good Works" versus points lost from "Negative Remarks" within the current academic year.</li>
                  <li><strong>Charts:</strong> Visual representations of your credit trends over time, allowing you to see your progress month by month.</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section id="good-works" ref={el => sectionRefs.current['good-works'] = el}>
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Award className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">Good Works</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none text-foreground">
                <p>The "Good Works" section is where you can view all your submitted achievements for positive credits. You can track their status and see the points awarded for each approved submission.</p>
                 <ul>
                    <li><strong>Pending:</strong> Your submission is awaiting review by an administrator.</li>
                    <li><strong>Approved:</strong> Your submission has been approved, and the points have been added to your balance.</li>
                    <li><strong>Rejected:</strong> Your submission was not approved. No points have been awarded.</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section id="submit-work" ref={el => sectionRefs.current['submit-work'] = el}>
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <FileText className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">Submitting New Work</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none text-foreground">
                <p>To get credit for your achievements, you need to submit them for review. Follow these steps:</p>
                <ol>
                  <li>Navigate to the <strong>"Good Works"</strong> page from the sidebar and click the <strong>"Submit New Work"</strong> button.</li>
                  <li>In the form, select a <strong>Category</strong> for your achievement (e.g., "Research Paper in Q1 Journal"). The points associated with that category will be automatically populated.</li>
                  <li>Provide a clear and concise <strong>Achievement Title</strong>.</li>
                  <li>Select the correct <strong>Academic Year</strong> for the achievement.</li>
                  <li><strong>Attach a mandatory Proof Document</strong> for verification. This can be a PDF, Word document, image, or even a video. If you have multiple files, please combine them into a single `.zip` file.</li>
                  <li>Click <strong>"Submit Achievement"</strong>. Your submission will be sent to an administrator for review, and its status will be "Pending".</li>
                </ol>
              </CardContent>
            </Card>
          </section>

          <section id="remarks" ref={el => sectionRefs.current['remarks'] = el}>
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <MessageSquareWarning className="h-8 w-8 text-destructive" />
                <CardTitle className="text-2xl">Negative Remarks</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none text-foreground">
                <p>If you receive a negative remark from an administrator, it will appear on the "Negative Remarks" page. This section lists all such remarks, the points deducted, the date they were issued, and provides the option to appeal.</p>
              </CardContent>
            </Card>
          </section>
          
          <section id="appeals" ref={el => sectionRefs.current['appeals'] = el}>
             <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <ShieldCheck className="h-8 w-8 text-blue-600" />
                <CardTitle className="text-2xl">Filing an Appeal</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none text-foreground">
                  <p>If you believe a negative remark was issued in error, you have the right to appeal. You can only appeal a remark once, and it must be done within the specified time frame.</p>
                  <ol>
                      <li>On the "Negative Remarks" page, click the <strong>"Appeal"</strong> button next to the relevant remark.</li>
                      <li>In the dialog that appears, write a clear, professional, and concise <strong>Reason for Appeal</strong> explaining why you believe the remark is incorrect.</li>
                      <li><strong>You must upload a new proof document</strong> to support your appeal. This is mandatory. Without proof, your appeal will not be considered.</li>
                      <li>Once submitted, your appeal is sent to an administrator. You can track its status (Pending, Accepted, or Rejected) on the <strong>"My Appeals"</strong> page.</li>
                  </ol>
                  <div className="bg-destructive/10 text-destructive p-4 rounded-md mt-4">
                     <strong>Important:</strong> If you do not appeal within one week of receiving a remark, it will be finalized and can no longer be appealed.
                  </div>
              </CardContent>
            </Card>
          </section>

          <section id="settings" ref={el => sectionRefs.current['settings'] = el}>
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <User className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none space-y-4 text-foreground">
                  <div className="flex items-start gap-4">
                    <User className="h-6 w-6 mt-1 text-muted-foreground"/>
                    <div>
                      <h4 className="font-semibold">Profile</h4>
                      <p>Update your personal information, such as your name, phone number, and profile picture. Keeping this information current is important for communication.</p>
                    </div>
                  </div>
                   <div className="flex items-start gap-4">
                    <Lock className="h-6 w-6 mt-1 text-muted-foreground"/>
                    <div>
                      <h4 className="font-semibold">Password</h4>
                      <p>Change your account password regularly to keep your account secure. It's recommended to use a strong, unique password that you don't use for other services.</p>
                    </div>
                  </div>
                   <div className="flex items-start gap-4">
                    <Fingerprint className="h-6 w-6 mt-1 text-muted-foreground"/>
                    <div>
                      <h4 className="font-semibold">Security (MFA)</h4>
                      <p>Enhance your account security by enabling Multi-Factor Authentication (MFA). You can choose to receive a login code via email or use a dedicated authenticator app on your phone. This adds an extra layer of protection to your account.</p>
                    </div>
                  </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}
