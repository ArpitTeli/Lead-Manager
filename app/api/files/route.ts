import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getAllFiles } from "@/lib/sheets/files";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const files = await getAllFiles();
  return NextResponse.json(files);
}
