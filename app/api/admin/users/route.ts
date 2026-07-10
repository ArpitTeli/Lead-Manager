import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  getAllUsers,
  createUser,
  setUserPassword,
  setUserActive,
  getUserById,
} from "@/lib/sheets/users";
import { logActivity } from "@/lib/logger";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const users = await getAllUsers();
  return NextResponse.json(
    users.map((u) => ({
      userId: u.userId,
      name: u.name,
      role: u.role,
      active: u.active,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, name, role, password } = await req.json();
  if (!userId || !name || !role || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existing = await getUserById(userId);
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }

  await createUser({ userId, name, role, password, active: true });
  await logActivity(session.userId, "USER_CREATED", `New user ${userId}`);

  return NextResponse.json({ userId, name, role, active: true });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, newPassword, active } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  if (newPassword) {
    await setUserPassword(userId, newPassword);
    await logActivity(session.userId, "PASSWORD_RESET", `User ${userId}`);
  }

  if (typeof active === "boolean") {
    await setUserActive(userId, active);
    await logActivity(session.userId, "USER_ACTIVE_TOGGLED", `User ${userId} -> ${active}`);
  }

  return NextResponse.json({ ok: true });
}
