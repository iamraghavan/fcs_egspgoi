
"use client";

import { Award, FileText, Fingerprint, LayoutDashboard, Lock, MessageSquareWarning, ShieldCheck, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

const helpTopics = [
    {
        icon: LayoutDashboard,
        title: "Dashboard Concepts",
        slug: "dashboard-concepts",
        description: "Understand your credit balance, yearly net points, and performance trends.",
        isWide: true,
    },
    {
        icon: Award,
        title: "Good Works",
        slug: "good-works",
        description: "View and track the status of all your submitted achievements for positive credits.",
        isWide: false,
    },
    {
        icon: FileText,
        title: "Submitting New Work",
        slug: "submitting-new-work",
        description: "Learn how to submit achievements for review, attach proof, and get credit.",
        isWide: false,
    },
    {
        icon: MessageSquareWarning,
        title: "Negative Remarks",
        slug: "negative-remarks",
        description: "Understand how negative remarks affect your score and what your options are.",
        isWide: true,
    },
    {
        icon: ShieldCheck,
        title: "Filing an Appeal",
        slug: "filing-an-appeal",
        description: "A step-by-step guide on how to appeal a negative remark you believe is incorrect.",
        isWide: true,
    },
    {
        icon: User,
        title: "Account Settings",
        slug: "account-settings",
        description: "Manage your profile, change your password, and enhance security with Multi-Factor Authentication (MFA).",
        isWide: false,
    },
]

function HelpSection() {

  const handleTopicClick = (slug: string) => {
    // Generate a random string for the URL parameter
    const randomParam = Math.random().toString(36).substring(2, 10);
    const url = `/u/portal/help/${slug}?session=${randomParam}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full py-20 lg:py-24">
      <div className="container mx-auto">
        <div className="flex flex-col gap-10">
          <div className="flex gap-4 flex-col items-start">
            <div>
              <Badge>Documentation</Badge>
            </div>
            <div className="flex gap-2 flex-col">
              <h2 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-regular text-left">
                How to Use CreditWise
              </h2>
              <p className="text-lg max-w-xl lg:max-w-lg leading-relaxed tracking-tight text-muted-foreground  text-left">
                Your complete guide to navigating the Faculty Performance System. Click on a topic to open a detailed guide.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {helpTopics.map((topic) => {
                const Icon = topic.icon;
                return (
                    <button
                        onClick={() => handleTopicClick(topic.slug)}
                        key={topic.title}
                        className={`bg-muted rounded-md h-full p-6 aspect-square lg:aspect-auto flex justify-between flex-col transition-all duration-300 hover:bg-primary/10 hover:shadow-lg hover:-translate-y-1 text-left ${topic.isWide ? 'lg:col-span-2' : ''}`}
                    >
                        <Icon className="w-8 h-8 stroke-1" />
                        <div className="flex flex-col">
                            <h3 className="text-xl tracking-tight">{topic.title}</h3>
                            <p className="text-muted-foreground max-w-xs text-base">
                                {topic.description}
                            </p>
                        </div>
                    </button>
                )
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export { HelpSection };
