import { put, del } from "@vercel/blob";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

function isVercel(): boolean {
  return !!process.env.VERCEL || !!process.env.BLOB_READ_WRITE_TOKEN;
}

/**
 * Upload a file. Returns a unique file identifier.
 * - On Vercel: returns the blob URL
 * - On local: returns a unique filename (with nanoid prefix)
 */
export async function uploadFile(
  storageName: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  // Sanitize: prevent path traversal
  if (storageName.includes("..")) {
    throw new Error("Invalid filename");
  }

  if (isVercel()) {
    const blob = await put(storageName, buffer, {
      access: "public",
      contentType: mimeType,
      addRandomSuffix: true,
    });
    return blob.url;
  }

  // Local dev: store on disk
  await mkdir(UPLOADS_DIR, { recursive: true });

  // For folder uploads (path contains "/"), preserve directory structure
  const dir = path.dirname(storageName);
  if (dir !== ".") {
    await mkdir(path.join(UPLOADS_DIR, dir), { recursive: true });
  }

  const uniqueName = dir !== "."
    ? path.join(dir, `${nanoid(12)}-${path.basename(storageName)}`)
    : `${nanoid(12)}-${storageName}`;

  const filePath = path.join(UPLOADS_DIR, uniqueName);
  await writeFile(filePath, buffer);
  return uniqueName;
}

/**
 * Download a file by its identifier.
 * - On Vercel: fileId is a blob URL, fetches it
 * - On local: fileId is a relative path in uploads/
 */
export async function downloadFile(fileId: string): Promise<Buffer> {
  if (isVercel() || fileId.startsWith("http")) {
    const res = await fetch(fileId);
    if (!res.ok) throw new Error("File not found");
    return Buffer.from(await res.arrayBuffer());
  }

  // Local dev: read from disk
  const filePath = path.join(UPLOADS_DIR, fileId);
  return readFile(filePath);
}

export async function deleteFile(fileId: string) {
  if (isVercel()) {
    await del(fileId);
    return;
  }

  // Local dev: delete from disk
  const filePath = path.join(UPLOADS_DIR, fileId);
  await unlink(filePath).catch((err) => console.error("Failed to delete file:", filePath, err));
}

/**
 * Creates local directory structure for folder uploads.
 * No-op on Vercel (blob is flat with prefix-based paths).
 */
export async function ensureFolder(folderPath: string): Promise<void> {
  if (!isVercel()) {
    const dir = path.join(UPLOADS_DIR, folderPath);
    await mkdir(dir, { recursive: true });
  }
}
