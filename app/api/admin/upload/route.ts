import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { uploadFile, ensureFolder } from "@/lib/drive";
import { createFile } from "@/lib/sheets/files";
import { logActivity } from "@/lib/logger";

// Increase timeout for larger uploads on Vercel
export const maxDuration = 30;

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
    // Track created subfolders so we don't re-query Drive for every file
    const folderCache = new Map<string, string>();

    for (const file of files) {
      if (!EXCEL_MIME_TYPES.includes(file.type) && !file.name.match(/\.xlsx?$/i)) {
        results.push({ filename: file.name, error: "Not an Excel file" });
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      // Determine folder path from webkitRelativePath (folder upload)
      const relativePath = (file as any).webkitRelativePath || "";
      const pathParts = relativePath.split("/");
      // pathParts = ["topFolder", "subfolder", ..., "file.xlsx"]
      // Last part is the filename; everything before is the folder path
      let folderPath = "";
      let parentFolderId: string | undefined;

      if (pathParts.length > 1) {
        // Extract the folder path (everything except the filename)
        folderPath = pathParts.slice(0, -1).join("/");

        if (!folderCache.has(folderPath)) {
          const folderId = await ensureFolder(folderPath);
          folderCache.set(folderPath, folderId);
        }
        parentFolderId = folderCache.get(folderPath);
      }

      const driveFileId = await uploadFile(
        file.name,
        buffer,
        file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        parentFolderId
      );

      const now = new Date().toISOString();
      await createFile({
        fileId: driveFileId,
        filename: file.name,
        folderPath,
        status: "Queue",
        assignedTo: "",
        uploadedAt: now,
        assignedAt: "",
        completedAt: "",
      });

      await logActivity(session.userId, "UPLOADED", `File ${file.name} (${driveFileId})`);
      results.push({
        filename: file.name,
        folderPath,
        fileId: driveFileId,
        status: "Queue",
      });
    }

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error("upload error:", err);
    const message = err?.message || err?.toString() || "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
