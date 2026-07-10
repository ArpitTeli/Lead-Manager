import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getFileById, deleteFileRecord } from "@/lib/sheets/files";
import { downloadFile, deleteFile } from "@/lib/drive";
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

  try {
    // storageUrl may be empty for files uploaded before the column was added
    const storageUrl = file.storageUrl || file.fileId;

    // Download the file into memory first
    const buffer = await downloadFile(storageUrl);

    // Delete from blob storage and Sheet immediately (one-time download)
    await deleteFile(storageUrl).catch((e) =>
      console.error("Failed to delete from storage:", e)
    );
    await deleteFileRecord(fileId).catch((e) =>
      console.error("Failed to delete from Sheet:", e)
    );

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
