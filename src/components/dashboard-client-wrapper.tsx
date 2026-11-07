"use client";

import { API_ORIGIN, API_V1 } from "@/lib/api-url";
import { apiFetch, ApiError, describeApiError, signOutLocally } from "@/lib/api";
import { AppShell } from "@/components/shell/app-shell";
import { activePanelItem, activeRailItem } from "@/components/shell/nav-config";
import { HOME, ROLE_LABEL, isAllowed, withUid } from "@/components/shell/nav-config";
import React, { useState, useEffect, type ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAlert } from "@/context/alert-context";
import { Skeleton } from "./ui/skeleton";
import dynamic from "next/dynamic";
import { messaging } from "@/lib/firebase";
import { onMessage } from "firebase/messaging";
import { useToast } from "@/hooks/use-toast";

const CookiePreferencesDialog = dynamic(() =>
  import("@/components/cookie-preferences-dialog").then((mod) => mod.CookiePreferencesDialog),
);
const WhatsAppVerificationModal = dynamic(() =>
  import("@/components/whatsapp-verification-modal").then((mod) => mod.WhatsAppVerificationModal),
);

const API_BASE_URL = API_V1;
const ENFORCE_WHATSAPP_VERIFICATION = process.env.NEXT_PUBLIC_ENFORCE_WHATSAPP_VERIFICATION === "true";

type User = {
  id: string;
  name: string;
  email: string;
  role: "faculty" | "admin" | "oa";
  avatar: string;
  whatsappVerified: boolean;
};

const getPageMetadata = (pathname: string, userName: string, role: User["role"]) => {
  const page = activePanelItem(activeRailItem(role, pathname), pathname);
  return { title: `${page?.label ?? "Dashboard"} · ${userName} · CreditWise` };
};

// Mirrors the shell (rail · panel · top bar · workspace) so nothing jumps when it loads.
const LoadingSkeleton = () => (
  <div className="flex h-dvh w-full overflow-hidden bg-background" aria-busy="true" aria-label="Loading">
    <div className="hidden h-full w-[88px] shrink-0 flex-col items-center gap-4 bg-rail-bg py-3 md:flex">
      <div className="h-10 w-10 rounded-lg bg-rail-hover" />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-10 w-11 rounded-full bg-rail-hover" />
      ))}
    </div>
    <div className="hidden h-full w-60 shrink-0 flex-col gap-3 border-r border-panel-border bg-panel-bg p-4 xl:flex">
      <Skeleton className="h-6 w-28" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-72 max-w-[40%]" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </header>
      <main className="flex-1 space-y-6 overflow-auto p-4 md:p-6 lg:p-8">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </main>
    </div>
  </div>
);

export default function DashboardClientWrapper({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showAlert } = useAlert();
  const { toast } = useToast();
  const [isCookiePrefsOpen, setIsCookiePrefsOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [userForVerification, setUserForVerification] = useState<any | null>(null);

  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      router.push("/u/portal/auth?faculty_login");
      return;
    }
    try {
      // apiFetch signs the user out on 401 by itself (see src/lib/api.ts).
      const responseData = await apiFetch("/auth/profile");
      if (!responseData?.success) throw new Error(responseData?.message || "Could not load your profile.");

      const userData = responseData.user || responseData.data;
      const getAvatarUrl = (u: any) => {
        if (u.profileImage) {
          return u.profileImage.startsWith("http")
            ? u.profileImage
            : `${API_ORIGIN}${u.profileImage.startsWith("/") ? "" : "/"}${u.profileImage}`;
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`;
      };

      const userPayload: User = {
        id: userData.id || userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        avatar: getAvatarUrl(userData),
        whatsappVerified: userData.whatsappVerified,
      };

      setUser(userPayload);

      if (
        ENFORCE_WHATSAPP_VERIFICATION &&
        (userData.role === "faculty" || userData.role === "admin") &&
        !userData.whatsappVerified
      ) {
        setUserForVerification(userData);
        setIsVerificationModalOpen(true);
      } else {
        setIsVerificationModalOpen(false);
        const uid = searchParams.get("uid");
        if (userPayload.id !== uid) {
          const params = new URLSearchParams(searchParams.toString());
          params.set("uid", userPayload.id);
          router.replace(`${pathname}?${params.toString()}`);
        }
      }
    } catch (error: any) {
      if (error instanceof ApiError && error.kind === "unauthorized") return; // already going to the login page
      if (error instanceof ApiError && error.kind === "aborted") return; // the user navigated away
      if (error instanceof ApiError && error.kind === "forbidden") {
        // 403 on the profile means the account was deactivated: sign out.
        signOutLocally("unauthorized");
        return;
      }
      // Network hiccups and server errors must NOT sign the user out (F-07).
      showAlert("Connection problem", `${describeApiError(error)} Your session is still active; please try again.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      const { title } = getPageMetadata(pathname, user.name, user.role);
      document.title = title;
    }
  }, [pathname, user]);

  const uidParam = searchParams.get("uid");
  // Re-check the session when the page or account changes (not on every filter change).
  useEffect(() => {
    fetchUser();
  }, [pathname, uidParam]);

  useEffect(() => {
    const refresh = () => {
      void fetchUser();
    };
    window.addEventListener("profile-updated", refresh);
    return () => window.removeEventListener("profile-updated", refresh);
  }, [pathname, uidParam]);

  // Role guard (G11): a page for another role sends you to your own Home with a message,
  // instead of showing that role's frame with data the API will refuse anyway.
  const allowed = !user || isAllowed(user.role, pathname);
  useEffect(() => {
    if (!user || allowed) return;
    toast({
      title: "That page isn't available for your account",
      description: `It's for a different role. You're signed in as ${ROLE_LABEL[user.role].toLowerCase()}, so we took you to your Home.`,
    });
    router.replace(withUid(HOME[user.role], user.id));
  }, [user, allowed, router, toast]);

  useEffect(() => {
    const client = messaging();
    if (!client) return;
    return onMessage(client, (payload) => {
      toast({
        title: payload.notification?.title || "New notification",
        description: payload.notification?.body || "Open your notification inbox for details.",
      });
      window.dispatchEvent(new Event("notifications-updated"));
    });
  }, [toast]);

  if (loading || !user || !allowed) return <LoadingSkeleton />;

  return (
    <>
      <AppShell user={user} onCookiePreferences={() => setIsCookiePrefsOpen(true)}>
        {children}
      </AppShell>
      {isCookiePrefsOpen && <CookiePreferencesDialog open={isCookiePrefsOpen} onOpenChange={setIsCookiePrefsOpen} />}
      {isVerificationModalOpen && (
        <WhatsAppVerificationModal
          isOpen={isVerificationModalOpen}
          user={userForVerification}
          onSuccess={() => {
            setIsVerificationModalOpen(false);
            if (user) setUser({ ...user, whatsappVerified: true });
          }}
        />
      )}
    </>
  );
}
