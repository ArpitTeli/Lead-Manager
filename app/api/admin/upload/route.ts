import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { uploadFile } from "@/lib/drive";
import { createFile } from "@/lib/sheets/files";
import { logActivity } from "@/lib/logger";

const EXCEL_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const results = [];
    for (const file of files) {
      if (!EXCEL_MIME_TYPES.includes(file.type) && !file.name.match(/\.xlsx?$/i)) {
        results.push({ filename: file.name, error: "Not an Excel file" });
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const driveFileId = await uploadFile(
        file.name,
        buffer,
        file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      const now = new Date().toISOString();
      await createFile({
        fileId: driveFileId,
        filename: file.name,
        status: "Queue",
        assignedTo: "",
        uploadedAt: now,
        assignedAt: "",
        completedAt: "",
      });

      await logActivity(session.userId, "UPLOADED", `File ${file.name} (${driveFileId})`);
      results.push({ filename: file.name, fileId: driveFileId, status: "Queue" });
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
