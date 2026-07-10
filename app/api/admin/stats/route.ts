import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getAllFiles } from "@/lib/sheets/files";
import { getAllUsers } from "@/lib/sheets/users";
import { getAllAssignments } from "@/lib/sheets/assignments";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [files, users, assignments] = await Promise.all([
      getAllFiles(),
      getAllUsers(),
      getAllAssignments(),
    ]);

    const queueCount = files.filter((f) => f.status === "Queue").length;
    const assignedCount = files.filter((f) => f.status === "Assigned").length;
    const completedCount = files.filter((f) => f.status === "Completed").length;

    const perUser = users
      .filter((u) => u.role === "LQ")
      .map((u) => {
        const userAssignments = assignments.filter((a) => a.userId === u.userId);
        return {
          userId: u.userId,
          name: u.name,
          active: u.active,
          totalAssigned: userAssignments.length,
          completed: userAssignments.filter((a) => a.status === "Completed").length,
          activeNow: userAssignments.filter((a) => a.status === "Active").length,
        };
      });

    return NextResponse.json({
      totals: {
        files: files.length,
        queue: queueCount,
        assigned: assignedCount,
        completed: completedCount,
      },
      users: perUser,
      files,
    });
  } catch (err) {
    console.error("stats error:", err);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
