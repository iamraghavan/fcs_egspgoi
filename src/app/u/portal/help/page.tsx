
"use client"

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, FileText, MessageSquareWarning, ShieldCheck, User, Lock, Fingerprint, LayoutDashboard } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const sections = [
  { id: 'dashboard', title: 'Dashboard Concepts', icon: LayoutDashboard },
  { id: 'good-works', title: 'Good Works', icon: Award },
  { id: 'submit-work', title: 'Submitting New Work', icon: FileText },
  { id: 'remarks', title: 'Negative Remarks', icon: MessageSquareWarning },
  { id: 'appeals', title: 'Filing an Appeal', icon: ShieldCheck },
  { id: 'settings', title: 'Account Settings', icon: User },
];

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -80% 0px' }
    );

    sections.forEach(section => {
      const el = document.getElementById(section.id);
      if (el) {
        sectionRefs.current[section.id] = el;
        observer.observe(el);
      }
    });

    return () => {
      Object.values(sectionRefs.current).forEach(el => {
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
    setActiveSection(id);
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

      <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-12">
        <aside className="lg:col-span-1 lg:sticky top-20 h-fit mb-8 lg:mb-0">
          <nav>
            <p className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">On this page</p>
            <ul className="space-y-2">
              {sections.map(section => (
                <li key={section.id}>
                  <Button 
                    variant="ghost" 
                    className={cn(
                        "w-full justify-start gap-3 pl-3",
                        activeSection === section.id ? "bg-accent text-accent-foreground" : ""
                    )}
                    onClick={() => scrollToSection(section.id)}
                  >
                    <section.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium text-left">{section.title}</span>
                  </Button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="lg:col-span-3 space-y-12">
          <section id="dashboard" ref={el => sectionRefs.current['dashboard'] = el}>
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <LayoutDashboard className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl">Dashboard Concepts</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none text-foreground prose-headings:font-semibold prose-headings:text-foreground prose-a:text-primary">
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
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Award className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl">Good Works</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none text-foreground prose-headings:font-semibold prose-headings:text-foreground prose-a:text-primary">
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
            <Card className="shadow-sm">
               <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl">Submitting New Work</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none text-foreground prose-headings:font-semibold prose-headings:text-foreground prose-a:text-primary">
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
            <Card className="shadow-sm">
               <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                    <MessageSquareWarning className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl">Negative Remarks</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none text-foreground prose-headings:font-semibold prose-headings:text-foreground prose-a:text-primary">
                <p>If you receive a negative remark from an administrator, it will appear on the "Negative Remarks" page. This section lists all such remarks, the points deducted, the date they were issued, and provides the option to appeal.</p>
              </CardContent>
            </Card>
          </section>
          
          <section id="appeals" ref={el => sectionRefs.current['appeals'] = el}>
             <Card className="shadow-sm">
               <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl">Filing an Appeal</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none text-foreground prose-headings:font-semibold prose-headings:text-foreground prose-a:text-primary">
                  <p>If you believe a negative remark was issued in error, you have the right to appeal. You can only appeal a remark once, and it must be done within the specified time frame.</p>
                  <ol>
                      <li>On the "Negative Remarks" page, click the <strong>"Appeal"</strong> button next to the relevant remark.</li>
                      <li>In the dialog that appears, write a clear, professional, and concise <strong>Reason for Appeal</strong> explaining why you believe the remark is incorrect.</li>
                      <li><strong>You must upload a new proof document</strong> to support your appeal. This is mandatory. Without proof, your appeal will not be considered.</li>
                      <li>Once submitted, your appeal is sent to an administrator. You can track its status (Pending, Accepted, or Rejected) on the <strong>"My Appeals"</strong> page.</li>
                  </ol>
                  <div className="bg-destructive/10 text-destructive p-4 rounded-md mt-4" role="alert">
                     <strong>Important:</strong> If you do not appeal within one week of receiving a remark, it will be finalized and can no longer be appealed.
                  </div>
              </CardContent>
            </Card>
          </section>

          <section id="settings" ref={el => sectionRefs.current['settings'] = el}>
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <User className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl">Account Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none space-y-4 text-foreground prose-headings:font-semibold prose-headings:text-foreground prose-a:text-primary">
                  <div className="flex items-start gap-4">
                    <User className="h-6 w-6 mt-1 text-muted-foreground flex-shrink-0"/>
                    <div>
                      <h4 className="font-semibold">Profile</h4>
                      <p>Update your personal information, such as your name, phone number, and profile picture. Keeping this information current is important for communication.</p>
                    </div>
                  </div>
                   <div className="flex items-start gap-4">
                    <Lock className="h-6 w-6 mt-1 text-muted-foreground flex-shrink-0"/>
                    <div>
                      <h4 className="font-semibold">Password</h4>
                      <p>Change your account password regularly to keep your account secure. It's recommended to use a strong, unique password that you don't use for other services.</p>
                    </div>
                  </div>
                   <div className="flex items-start gap-4">
                    <Fingerprint className="h-6 w-6 mt-1 text-muted-foreground flex-shrink-0"/>
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
