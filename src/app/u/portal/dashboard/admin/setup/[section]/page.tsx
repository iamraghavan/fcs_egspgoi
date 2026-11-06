import { notFound } from "next/navigation";
import { ApplicationSettingsPanel, type SetupSection } from "@/components/admin/application-settings-panel";

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!["organization", "academic-years", "administration", "history"].includes(section)) notFound();
  return (
    <div className="max-w-6xl">
      <ApplicationSettingsPanel key={section} section={section as SetupSection} />
    </div>
  );
}
