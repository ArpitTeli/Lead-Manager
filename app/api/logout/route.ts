import { NextResponse } from "next/server";
import { getSession, destroySession } from "@/lib/auth/session";
import { logActivity } from "@/lib/logger";

export async function POST() {
  const session = await getSession();
  if (session) {
    await logActivity(session.userId, "LOGOUT");
  }
  await destroySession();
  return NextResponse.json({ ok: true });
}
