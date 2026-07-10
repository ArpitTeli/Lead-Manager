import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { readTab } from "@/lib/sheets/client";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await readTab("ActivityLog");
  const logs = rows
    .map((r) => ({
      timestamp: r.Timestamp,
      userId: r.UserID,
      action: r.Action,
      details: r.Details,
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return NextResponse.json(logs.slice(0, 500));
}
