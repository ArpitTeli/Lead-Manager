import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getFileById, deleteFileRecord } from "@/lib/sheets/files";
import { deleteFile } from "@/lib/drive";
import { logActivity } from "@/lib/logger";

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { fileId } = await req.json();
    if (!fileId) {
      return NextResponse.json({ error: "fileId required" }, { status: 400 });
    }

    const file = await getFileById(fileId);
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete from storage
    const storageUrl = file.storageUrl || file.fileId;
    await deleteFile(storageUrl).catch(() => {});

    // Delete from Sheet
    await deleteFileRecord(fileId);

    await logActivity(
      session.userId,
      "FILE_DELETED",
      `File ${file.filename} (${fileId})`
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("delete file error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to delete file" },
      { status: 500 }
    );
  }
}
