import { notFound } from "next/navigation";
import { AccountSettingsPage, type AccountSection } from "@/components/settings/account-settings-page";

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!["profile", "password", "preferences", "security"].includes(section)) notFound();
  return <AccountSettingsPage key={section} section={section as AccountSection} />;
}
