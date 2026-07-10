"use client";

import { useRouter } from "next/navigation";

export default function TopBar({
  name,
  role,
}: {
  name: string;
  role: string;
}) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-black/10 bg-white px-6 py-4">
      <div>
        <p className="text-sm font-semibold text-ink">Lead Distribution System</p>
        <p className="text-xs text-black/50">
          {name} · {role}
        </p>
      </div>
      <button
        onClick={handleLogout}
        className="rounded-md border border-black/15 px-3 py-1.5 text-xs font-medium text-black/70 hover:bg-black/5"
      >
        Log out
      </button>
    </header>
  );
}
