import { SettingsForm } from "@/components/settings-form";
import { getShopSettings } from "@/lib/settings";

export default async function AdminSettingsPage() {
  const settings = await getShopSettings();
  return <SettingsForm initialSettings={settings} />;
}
