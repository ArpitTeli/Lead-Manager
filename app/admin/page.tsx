import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import TopBar from "@/components/TopBar";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "Admin") redirect("/dashboard");

  return (
    <div>
      <TopBar name={session.name} role={session.role} />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <AdminClient />
      </main>
    </div>
  );
}
