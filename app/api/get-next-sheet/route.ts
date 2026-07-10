import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getNextSheetForUser } from "@/lib/assignment";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { assignment, file } = await getNextSheetForUser(session.userId);
    if (!file) {
      return NextResponse.json({ message: "No files available in queue" }, { status: 200 });
    }
    return NextResponse.json({ assignment, file });
  } catch (err: any) {
    console.error("get-next-sheet error:", err);
    return NextResponse.json({ error: "Failed to get next sheet" }, { status: 500 });
  }
}
