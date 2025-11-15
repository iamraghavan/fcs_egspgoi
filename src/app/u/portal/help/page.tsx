
"use client"

import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, FileText, MessageSquareWarning, ShieldCheck, User, Lock, Fingerprint, LayoutDashboard } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

const sections = [
  { id: 'dashboard', title: 'Dashboard Concepts', icon: LayoutDashboard },
  { id: 'good-works', title: 'Good Works', icon: Award },
  { id: 'submit-work', title: 'Submitting New Work', icon: FileText },
  { id: 'remarks', title: 'Negative Remarks', icon: MessageSquareWarning },
  { id: 'appeals', title: 'Filing an Appeal', icon: ShieldCheck },
  { id: 'settings', title: 'Settings', icon: User },
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
          <section id="dashboard">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <LayoutDashboard className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">Dashboard Concepts</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none">
                <p>The main dashboard provides an at-a-glance overview of your performance and credit status. It includes key metrics like:</p>
                <ul>
                  <li><strong>Net Credit Balance:</strong> Your all-time total credit score.</li>
                  <li><strong>Net For Year:</strong> The sum of positive and negative credits for the current academic year.</li>
                  <li><strong>Positive & Negative Points:</strong> A breakdown of points gained and lost within the current year.</li>
                  <li><strong>Charts:</strong> Visual representations of your credit trends over time.</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section id="good-works">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Award className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">Good Works</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none">
                <p>The "Good Works" section is where you can view all your submitted achievements. You can track their status (Pending, Approved, or Rejected) and see the points awarded for each approved submission.</p>
              </CardContent>
            </Card>
          </section>

          <section id="submit-work">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <FileText className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">Submitting New Work</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none">
                <p>To get credit for your achievements, you need to submit them for review.</p>
                <ol>
                  <li>Navigate to the <strong>Good Works</strong> section and click the <strong>"Submit New Work"</strong> button.</li>
                  <li>Select a <strong>Category</strong> for your achievement. The points will be automatically populated.</li>
                  <li>Provide a clear <strong>Achievement Title</strong>.</li>
                  <li>Attach a mandatory <strong>Proof Document</strong> for verification (PDF, DOCX, JPG, etc.).</li>
                  <li>Click <strong>"Submit Achievement"</strong>. It will then be sent to an administrator for review.</li>
                </ol>
              </CardContent>
            </Card>
          </section>

          <section id="remarks">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <MessageSquareWarning className="h-8 w-8 text-destructive" />
                <CardTitle className="text-2xl">Negative Remarks</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none">
                <p>If you receive a negative remark from an administrator, it will appear on the "Negative Remarks" page. This section lists all such remarks, the points deducted, and the date they were issued.</p>
              </CardContent>
            </Card>
          </section>
          
          <section id="appeals">
             <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <ShieldCheck className="h-8 w-8 text-blue-600" />
                <CardTitle className="text-2xl">Filing an Appeal</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none">
                  <p>If you believe a negative remark was issued in error, you have the right to appeal. You can only appeal a remark once.</p>
                  <ol>
                      <li>On the "Negative Remarks" page, click the <strong>"Appeal"</strong> button next to the relevant remark.</li>
                      <li>In the dialog, write a clear and professional <strong>Reason for Appeal</strong>.</li>
                      <li><strong>You must upload a new proof document</strong> to support your appeal. This is mandatory.</li>
                      <li>Once submitted, your appeal is sent to an administrator. You can track its status on the <strong>"My Appeals"</strong> page.</li>
                  </ol>
              </CardContent>
            </Card>
          </section>

          <section id="settings">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <User className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">Settings</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none space-y-4">
                  <div className="flex items-start gap-4">
                    <User className="h-6 w-6 mt-1 text-muted-foreground"/>
                    <div>
                      <h4 className="font-semibold">Profile</h4>
                      <p>Update your personal information, such as your name, phone number, and profile picture.</p>
                    </div>
                  </div>
                   <div className="flex items-start gap-4">
                    <Lock className="h-6 w-6 mt-1 text-muted-foreground"/>
                    <div>
                      <h4 className="font-semibold">Password</h4>
                      <p>Change your account password. It's recommended to use a strong, unique password.</p>
                    </div>
                  </div>
                   <div className="flex items-start gap-4">
                    <Fingerprint className="h-6 w-6 mt-1 text-muted-foreground"/>
                    <div>
                      <h4 className="font-semibold">Security (MFA)</h4>
                      <p>Enhance your account security by enabling Multi-Factor Authentication (MFA) via email or an authenticator app.</p>
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
