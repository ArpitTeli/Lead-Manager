import { put, del } from "@vercel/blob";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

function isVercel(): boolean {
  return !!process.env.VERCEL || !!process.env.BLOB_READ_WRITE_TOKEN;
}

/**
 * Upload a file. Returns { fileId, storageUrl }.
 * - fileId: a short unique ID used in the Sheet and download URLs
 * - storageUrl: the actual storage path (blob URL on Vercel, local path on dev)
 */
export async function uploadFile(
  storageName: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ fileId: string; storageUrl: string }> {
  // Sanitize: prevent path traversal
  if (storageName.includes("..")) {
    throw new Error("Invalid filename");
  }

  if (isVercel()) {
    const localId = nanoid(12);
    const blobName = `${localId}-${storageName}`;
    const blob = await put(blobName, buffer, {
      access: "public",
      contentType: mimeType,
      addRandomSuffix: false,
    });
    return { fileId: localId, storageUrl: blob.url };
  }

  // Local dev: store on disk
  await mkdir(UPLOADS_DIR, { recursive: true });

  // For folder uploads (path contains "/"), preserve directory structure
  const dir = path.dirname(storageName);
  if (dir !== ".") {
    await mkdir(path.join(UPLOADS_DIR, dir), { recursive: true });
  }

  const localId = nanoid(12);
  const uniqueName = dir !== "."
    ? path.join(dir, `${localId}-${path.basename(storageName)}`)
    : `${localId}-${storageName}`;

  const filePath = path.join(UPLOADS_DIR, uniqueName);
  await writeFile(filePath, buffer);
  return { fileId: localId, storageUrl: uniqueName };
}

/**
 * Download a file by its storage URL.
 */
export async function downloadFile(storageUrl: string): Promise<Buffer> {
  if (isVercel() || storageUrl.startsWith("http")) {
    const res = await fetch(storageUrl);
    if (!res.ok) throw new Error("File not found");
    return Buffer.from(await res.arrayBuffer());
  }

  // Local dev: read from disk
  const filePath = path.join(UPLOADS_DIR, storageUrl);
  return readFile(filePath);
}

export async function deleteFile(storageUrl: string) {
  if (isVercel()) {
    await del(storageUrl);
    return;
  }

  // Local dev: delete from disk
  const filePath = path.join(UPLOADS_DIR, storageUrl);
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
