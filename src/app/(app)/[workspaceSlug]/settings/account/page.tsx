import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AccountSettingsForm } from "@/components/workspace/account-settings-form";

export default async function AccountSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-h2 text-on-surface">Account</h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Profile, avatar, password
        </p>
      </div>
      <AccountSettingsForm name={session.user.name} email={session.user.email} />
    </div>
  );
}
