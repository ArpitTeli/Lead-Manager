import { NextResponse } from "next/server";
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
    // List all blobs
    let allBlobs: { url: string; pathname: string }[] = [];
    let cursor: string | undefined;
    do {
      const result = await list({ cursor, limit: 100 });
      allBlobs = allBlobs.concat(result.blobs.map((b: any) => ({ url: b.url, pathname: b.pathname })));
      cursor = result.cursor;
    } while (cursor);

    // Get existing storage URLs from Sheet
    const existingFiles = await getAllFiles();
    const existingUrls = new Set(existingFiles.map((f: any) => f.storageUrl).filter(Boolean));

    const added: string[] = [];
    const skipped: string[] = [];

    for (const blob of allBlobs) {
      if (existingUrls.has(blob.url)) {
        skipped.push(blob.pathname);
        continue;
      }

      // Parse pathname to get filename and folder
      const pathname = blob.pathname || "";
      let folderPath = "";
      let cleanName = pathname;

      // Remove nanoid prefix (12 chars + dash) if present
      const nameMatch = pathname.match(/^(.+\/)?[a-zA-Z0-9_-]{12}-(.+)$/);
      if (nameMatch) {
        folderPath = (nameMatch[1] || "").replace(/\/$/, "");
        cleanName = nameMatch[2];
      } else {
        const lastSlash = pathname.lastIndexOf("/");
        if (lastSlash > 0) {
          folderPath = pathname.substring(0, lastSlash);
          cleanName = pathname.substring(lastSlash + 1);
        }
      }

      await createFile({
        fileId: nanoid(12),
        filename: cleanName,
        folderPath,
        storageUrl: blob.url,
        status: "Queue",
        assignedTo: "",
        uploadedAt: new Date().toISOString(),
        assignedAt: "",
        completedAt: "",
      });

      added.push(`${cleanName} -> ${folderPath || "(root)"}`);
    }

    return NextResponse.json({
      total: allBlobs.length,
      added: added.length,
      skipped: skipped.length,
      details: added,
    });
  } catch (err: any) {
    console.error("sync error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
