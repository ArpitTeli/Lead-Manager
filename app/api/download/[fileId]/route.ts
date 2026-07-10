import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getFileById } from "@/lib/sheets/files";
import { downloadFile } from "@/lib/drive";
import { logActivity } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileId } = await params;
  const file = await getFileById(fileId);

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // LQs may only download files currently assigned to them; Admins may download any.
  if (session.role !== "Admin" && file.assignedTo !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const buffer = await downloadFile(fileId);
    await logActivity(session.userId, "DOWNLOADED", `File ${file.filename} (${fileId})`);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${file.filename}"`,
      },
    });
  } catch (err) {
    console.error("download error:", err);
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}
