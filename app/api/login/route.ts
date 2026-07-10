import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/sheets/users";
import { verifyPassword } from "@/lib/auth/password";

import { createSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const { userId, password } = await req.json();

    if (!userId || !password) {
      return NextResponse.json(
        { error: "User ID and password are required" },
        { status: 400 }
      );
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!user.active) {
      return NextResponse.json({ error: "Account is disabled" }, { status: 403 });
    }

    const valid = verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await createSession({ userId: user.userId, name: user.name, role: user.role });
    await logActivity(user.userId, "LOGIN");

    return NextResponse.json({
      userId: user.userId,
      name: user.name,
      role: user.role,
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
