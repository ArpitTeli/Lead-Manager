import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import TopBar from "@/components/TopBar";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div>
      <TopBar name={session.name} role={session.role} />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <DashboardClient />
      </main>
    </div>
  );
}
