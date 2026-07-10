import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { list } from "@vercel/blob";
import { getAllFiles, createFile } from "@/lib/sheets/files";
import { nanoid } from "nanoid";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // List all blobs in the store
    let cursor: string | undefined;
    const blobs: { pathname: string; url: string }[] = [];
    do {
      const result = await list({ cursor, limit: 200 });
      cursor = result.cursor;
      for (const b of result.blobs) {
        // Skip directory markers (keys ending with /)
        if (!b.pathname.endsWith("/")) {
          blobs.push({ pathname: b.pathname, url: b.url });
        }
      }
    } while (cursor);

    // Get existing files from Sheet
    const existing = await getAllFiles();
    const existingUrls = new Set(existing.map((f) => f.storageUrl));

    // Find blobs not yet tracked in the Sheet
    const missing = blobs.filter((b) => !existingUrls.has(b.url));

    // Add missing files to Sheet
    const added = [];
    for (const blob of missing) {
      const pathname = blob.pathname;
      const parts = pathname.split("/");
      const filename = parts.pop() || pathname;
      const folderPath = parts.join("/");

      // Remove nanoid prefix (12 chars + dash) if present
      const cleanName = filename.replace(/^[A-Za-z0-9_-]{12}-/, "");

      const now = new Date().toISOString();
      const fileId = nanoid(12);
      await createFile({
        fileId,
        filename: cleanName || filename,
        folderPath,
        storageUrl: blob.url,
        status: "Queue",
        assignedTo: "",
        uploadedAt: now,
        assignedAt: "",
        completedAt: "",
      });
      added.push({ filename: cleanName || filename, folderPath, fileId });
    }

    // Also detect blobs that are in Sheet but no longer in storage (stale records)
    const blobUrls = new Set(blobs.map((b) => b.url));
    const stale = existing.filter((f) => f.storageUrl && !blobUrls.has(f.storageUrl));

    return NextResponse.json({
      totalBlobs: blobs.length,
      filesInSheet: existing.length,
      synced: added.length,
      stale: stale.length,
      added,
    });
  } catch (err: any) {
    console.error("Sync error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
