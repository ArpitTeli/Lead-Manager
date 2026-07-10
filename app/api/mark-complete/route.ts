import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { markSheetComplete } from "@/lib/assignment";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await markSheetComplete(session.userId);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("mark-complete error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to mark complete" },
      { status: 400 }
    );
  }
}
